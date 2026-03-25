import { NextResponse } from "next/server";
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

export const PATCH = withAuth<{ params: Promise<{ slug: string }> }>(async (req, { params }, _auth) => {
  try {
    const { slug: currentSlug } = await params;
    const { name, slug: rawSlug, defaultLanguage, otherLanguages } = await req.json();

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ message: "Project name is required." }, { status: 400 });
    }

    if (!defaultLanguage || typeof defaultLanguage !== "string") {
      return NextResponse.json({ message: "Default language is required." }, { status: 400 });
    }

    const cleanedOtherLanguages = Array.isArray(otherLanguages)
      ? otherLanguages.filter((l): l is string => typeof l === "string" && l.trim() !== "")
      : [];

    const newSlug = rawSlug ? toSlug(rawSlug.trim()) : toSlug(name.trim());

    if (!newSlug) {
      return NextResponse.json(
        { message: "Slug must contain at least one letter or number." },
        { status: 400 }
      );
    }

    const { data: project } = await db
      .schema("apps_lokalit")
      .from("projects")
      .select("id")
      .eq("slug", currentSlug)
      .maybeSingle();

    if (!project) {
      return NextResponse.json({ message: "Project not found." }, { status: 404 });
    }

    // Check slug uniqueness only if it changed
    if (newSlug !== currentSlug) {
      const { data: conflict } = await db
        .schema("apps_lokalit")
        .from("projects")
        .select("id")
        .eq("slug", newSlug)
        .maybeSingle();

      if (conflict) {
        return NextResponse.json(
          { message: `A project with the slug "${newSlug}" already exists.` },
          { status: 409 }
        );
      }
    }

    const { data: updated, error } = await db
      .schema("apps_lokalit")
      .from("projects")
      .update({
        name: name.trim(),
        slug: newSlug,
        default_language: defaultLanguage,
        other_languages: cleanedOtherLanguages,
        updated_at: new Date().toISOString(),
      })
      .eq("id", project.id)
      .select("slug")
      .single();

    if (error) throw error;

    return NextResponse.json({ message: "Project updated.", slug: updated.slug });
  } catch {
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
});
