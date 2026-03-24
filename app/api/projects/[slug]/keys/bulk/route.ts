import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth } from "@/lib/auth";

export const POST = withAuth<{ params: Promise<{ slug: string }> }>(async (req, { params }, _auth) => {
  try {
    const { slug } = await params;
    const { keys } = await req.json(); // Array of { key: string, values: Record<string, string> }

    if (!Array.isArray(keys)) {
      return NextResponse.json({ message: "Invalid payload: keys must be an array." }, { status: 400 });
    }

    const { data: project } = await db
      .schema("apps_lokalit")
      .from("projects")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (!project) {
      return NextResponse.json({ message: "Project not found." }, { status: 404 });
    }

    const results = [];

    for (const item of keys) {
      if (!item.key || typeof item.key !== "string") continue;

      const keyName = item.key.trim();
      const incomingValues: Record<string, string> = {};
      if (item.values && typeof item.values === "object") {
        for (const [lang, val] of Object.entries(item.values)) {
          incomingValues[lang] = String(val);
        }
      }

      // Fetch existing to merge JSONB values (equivalent to MongoDB $set dot-notation)
      const { data: existing } = await db
        .schema("apps_lokalit")
        .from("localization_keys")
        .select("id, values")
        .eq("project_id", project.id)
        .eq("key", keyName)
        .maybeSingle();

      let upserted;
      if (existing) {
        const mergedValues = { ...(existing.values as Record<string, string>), ...incomingValues };
        const { data } = await db
          .schema("apps_lokalit")
          .from("localization_keys")
          .update({ values: mergedValues, updated_at: new Date().toISOString() })
          .eq("id", existing.id)
          .select()
          .single();
        upserted = data;
      } else {
        const { data } = await db
          .schema("apps_lokalit")
          .from("localization_keys")
          .insert({ project_id: project.id, key: keyName, description: "", values: incomingValues })
          .select()
          .single();
        upserted = data;
      }

      if (upserted) results.push(upserted);
    }

    return NextResponse.json({
      message: `Successfully synced ${results.length} keys.`,
      keys: results,
    });
  } catch (err) {
    console.error("[Bulk Sync Error]:", err);
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
});
