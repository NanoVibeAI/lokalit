import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth } from "@/lib/auth";

export const GET = withAuth<{ params: Promise<{ slug: string }> }>(
  async (req, { params }, _auth) => {
    try {
      const { slug } = await params;

      const { data: project } = await db
        .schema("apps_lokalit")
        .from("projects")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (!project) {
        return NextResponse.json({ message: "Project not found." }, { status: 404 });
      }

      const { data: keys, error } = await db
        .schema("apps_lokalit")
        .from("localization_keys")
        .select("*")
        .eq("project_id", project.id)
        .order("key", { ascending: true });

      if (error) throw error;

      return NextResponse.json({ keys: keys ?? [] });
    } catch {
      return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
  },
);

export const POST = withAuth<{ params: Promise<{ slug: string }> }>(
  async (req, { params }, _auth) => {
    try {
      const { slug } = await params;
      const { key, description } = await req.json();

      if (!key || typeof key !== "string" || !key.trim()) {
        return NextResponse.json({ message: "Key name is required." }, { status: 400 });
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

      const { data: existing } = await db
        .schema("apps_lokalit")
        .from("localization_keys")
        .select("id")
        .eq("project_id", project.id)
        .eq("key", key.trim())
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          { message: `Key "${key.trim()}" already exists.` },
          { status: 409 }
        );
      }

      const { data: locKey, error } = await db
        .schema("apps_lokalit")
        .from("localization_keys")
        .insert({
          project_id: project.id,
          key: key.trim(),
          description: typeof description === "string" ? description.trim() : "",
          values: {},
        })
        .select()
        .single();

      if (error || !locKey) throw error;

      return NextResponse.json({ key: locKey }, { status: 201 });
    } catch {
      return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
  },
);
