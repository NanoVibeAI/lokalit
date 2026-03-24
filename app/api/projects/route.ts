import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth } from "@/lib/auth";

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replaceAll(/[^a-z0-9\s-]/g, "")
    .replaceAll(/\s+/g, "-")
    .replaceAll(/-+/g, "-");
}

export const POST = withAuth(async (req, _context, auth) => {
  try {
    const { name, slug: rawSlug, defaultLanguage, otherLanguages } = await req.json();

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ message: "Project name is required." }, { status: 400 });
    }

    if (!defaultLanguage || typeof defaultLanguage !== "string") {
      return NextResponse.json({ message: "Default language is required." }, { status: 400 });
    }

    const slug = rawSlug ? toSlug(String(rawSlug).trim()) : toSlug(name.trim());
    const cleanedOtherLanguages = Array.isArray(otherLanguages)
      ? otherLanguages.filter((l): l is string => typeof l === "string" && l.trim() !== "")
      : [];

    if (!slug) {
      return NextResponse.json(
        { message: "Project name must contain at least one letter or number." },
        { status: 400 }
      );
    }

    const { data: existing } = await db
      .schema("apps_lokalit")
      .from("projects")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { message: `A project with the slug "${slug}" already exists.` },
        { status: 409 }
      );
    }

    const { data: project, error } = await db
      .schema("apps_lokalit")
      .from("projects")
      .insert({
        name: name.trim(),
        slug,
        default_language: defaultLanguage,
        other_languages: cleanedOtherLanguages,
      })
      .select()
      .single();

    if (error || !project) throw error;

    await db
      .schema("apps_lokalit")
      .from("project_memberships")
      .insert({ project_id: project.id, user_sub: auth.userId, role: "OWNER" });

    return NextResponse.json({ message: "Project created.", project }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
});

export const GET = withAuth(async (req, _context, _auth) => {
  try {
    const slug = req.nextUrl.searchParams.get("slug");
    if (!slug?.trim()) {
      return NextResponse.json({ message: "Slug is required." }, { status: 400 });
    }

    const { data: existing } = await db
      .schema("apps_lokalit")
      .from("projects")
      .select("id")
      .eq("slug", slug.trim())
      .maybeSingle();

    return NextResponse.json({ available: !existing });
  } catch {
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
});
