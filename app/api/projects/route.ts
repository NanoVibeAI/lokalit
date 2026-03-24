import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { withAuth } from "@/lib/auth";
import Project from "@/models/Project";
import ProjectMembership from "@/models/ProjectMembership";

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

    await connectDB();

    const existing = await Project.findOne({ slug });
    if (existing) {
      return NextResponse.json(
        { message: `A project with the slug "${slug}" already exists.` },
        { status: 409 }
      );
    }

    const project = await Project.create({ name: name.trim(), slug, defaultLanguage, otherLanguages: cleanedOtherLanguages });

    await ProjectMembership.create({
      projectId: project._id,
      userSub: auth.userId,
      role: "OWNER",
    });

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

    await connectDB();

    const existing = await Project.findOne({ slug: slug.trim() });
    return NextResponse.json({ available: !existing });
  } catch {
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
});
