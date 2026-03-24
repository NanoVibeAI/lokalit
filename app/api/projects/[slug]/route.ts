import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { withAuth } from "@/lib/auth";
import Project from "@/models/Project";

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

    await connectDB();

    const project = await Project.findOne({ slug: currentSlug });
    if (!project) {
      return NextResponse.json({ message: "Project not found." }, { status: 404 });
    }

    // Check slug uniqueness only if it changed
    if (newSlug !== currentSlug) {
      const conflict = await Project.findOne({ slug: newSlug });
      if (conflict) {
        return NextResponse.json(
          { message: `A project with the slug "${newSlug}" already exists.` },
          { status: 409 }
        );
      }
    }

    const updated = await Project.findByIdAndUpdate(
      project._id,
      { $set: { name: name.trim(), slug: newSlug, defaultLanguage, otherLanguages: cleanedOtherLanguages } },
      { new: true, runValidators: true }
    );

    return NextResponse.json({ message: "Project updated.", slug: updated!.slug });
  } catch {
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
});
