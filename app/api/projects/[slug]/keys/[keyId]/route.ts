import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth } from "@/lib/auth";

export const PATCH = withAuth<{ params: Promise<{ slug: string; keyId: string }> }>(async (req, { params }, _auth) => {
  try {
    const { slug, keyId } = await params;
    const body = await req.json();

    const { data: project } = await db
      .schema("apps_lokalit")
      .from("projects")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (!project) {
      return NextResponse.json({ message: "Project not found." }, { status: 404 });
    }

    const { data: locKey } = await db
      .schema("apps_lokalit")
      .from("localization_keys")
      .select("*")
      .eq("id", keyId)
      .eq("project_id", project.id)
      .maybeSingle();

    if (!locKey) {
      return NextResponse.json({ message: "Key not found." }, { status: 404 });
    }

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

    // Bulk replace entire values object
    if (body.values !== undefined) {
      if (typeof body.values !== "object" || Array.isArray(body.values) || body.values === null) {
        return NextResponse.json({ message: "values must be an object." }, { status: 400 });
      }
      const cleaned: Record<string, string> = {};
      for (const [k, v] of Object.entries(body.values as Record<string, unknown>)) {
        cleaned[String(k).trim()] = String(v ?? "");
      }
      patch.values = cleaned;
    }

    // Set or remove a single language value  (uses jsonb_set via object spread)
    if (body.lang !== undefined) {
      const lang = String(body.lang).trim();
      if (!lang) {
        return NextResponse.json({ message: "Language is required." }, { status: 400 });
      }
      const currentValues = { ...(locKey.values as Record<string, string>) };
      if (body.remove === true) {
        delete currentValues[lang];
      } else {
        currentValues[lang] = String(body.value ?? "");
      }
      patch.values = currentValues;
    }

    // Rename key
    if (body.key !== undefined) {
      const newKey = String(body.key).trim();
      if (!newKey) {
        return NextResponse.json({ message: "Key name is required." }, { status: 400 });
      }
      const { data: conflict } = await db
        .schema("apps_lokalit")
        .from("localization_keys")
        .select("id")
        .eq("project_id", project.id)
        .eq("key", newKey)
        .neq("id", keyId)
        .maybeSingle();

      if (conflict) {
        return NextResponse.json({ message: `Key "${newKey}" already exists.` }, { status: 409 });
      }
      patch.key = newKey;
    }

    // Update description
    if (body.description !== undefined) {
      patch.description = String(body.description).trim();
    }

    const { data: updated, error } = await db
      .schema("apps_lokalit")
      .from("localization_keys")
      .update(patch)
      .eq("id", keyId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ key: updated });
  } catch {
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
});

export const DELETE = withAuth<{ params: Promise<{ slug: string; keyId: string }> }>(async (req, { params }, _auth) => {
  try {
    const { slug, keyId } = await params;

    const { data: project } = await db
      .schema("apps_lokalit")
      .from("projects")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (!project) {
      return NextResponse.json({ message: "Project not found." }, { status: 404 });
    }

    const { error, count } = await db
      .schema("apps_lokalit")
      .from("localization_keys")
      .delete({ count: "exact" })
      .eq("id", keyId)
      .eq("project_id", project.id);

    if (error) throw error;

    if (!count || count === 0) {
      return NextResponse.json({ message: "Key not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Key deleted." });
  } catch {
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
});
