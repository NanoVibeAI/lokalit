import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { withAuth } from "@/lib/auth";
import FigmaFileMapping from "@/models/FigmaFileMapping";
import Project from "@/models/Project";
import { randomUUID } from "crypto";

// GET /api/figma/file-mapping?fileId=xxx
export const GET = withAuth(async (req, _context, _auth) => {
  const fileId = req.nextUrl.searchParams.get("fileId");
  if (!fileId?.trim()) {
    return NextResponse.json({ message: "fileId is required." }, { status: 400 });
  }

  await connectDB();

  const mapping = await FigmaFileMapping.findOne({ fileId: fileId.trim() }).lean();
  if (!mapping) {
    return NextResponse.json({ linked: false });
  }

  return NextResponse.json({
    linked: true,
    fileId: mapping.fileId,
    projectSlug: mapping.projectSlug,
  });
});

// POST /api/figma/file-mapping — create or update (relink)
// Body: { fileId?, projectSlug }
export const POST = withAuth(async (req, _context, auth) => {
  const { fileId, projectSlug } = await req.json();

  if (!projectSlug || typeof projectSlug !== "string" || !projectSlug.trim()) {
    return NextResponse.json({ message: "projectSlug is required." }, { status: 400 });
  }

  const finalFileId = fileId && typeof fileId === "string" && fileId.trim() ? fileId.trim() : randomUUID();

  await connectDB();

  const project = await Project.findOne({ slug: projectSlug.trim() }).lean();
  if (!project) {
    return NextResponse.json({ message: "Project not found." }, { status: 404 });
  }

  const mapping = await FigmaFileMapping.findOneAndUpdate(
    { fileId: finalFileId },
    {
      $set: {
        projectSlug: project.slug,
        createdBy: auth.userId,
      },
    },
    { upsert: true, new: true }
  );

  return NextResponse.json({
    linked: true,
    fileId: mapping.fileId,
    projectSlug: mapping.projectSlug,
  });
});

// DELETE /api/figma/file-mapping?fileId=xxx
export const DELETE = withAuth(async (req, _context, _auth) => {
  const fileId = req.nextUrl.searchParams.get("fileId");
  if (!fileId?.trim()) {
    return NextResponse.json({ message: "fileId is required." }, { status: 400 });
  }

  await connectDB();

  await FigmaFileMapping.deleteOne({ fileId: fileId.trim() });

  return NextResponse.json({ message: "File unlinked." });
});
