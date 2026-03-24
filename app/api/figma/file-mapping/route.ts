import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth } from "@/lib/auth";
import { randomUUID } from "crypto";

// GET /api/figma/file-mapping?fileId=xxx
export const GET = withAuth(async (req, _context, _auth) => {
  const fileId = req.nextUrl.searchParams.get("fileId");
  if (!fileId?.trim()) {
    return NextResponse.json({ message: "fileId is required." }, { status: 400 });
  }

  const { data: mapping } = await db
    .schema("apps_lokalit")
    .from("figma_file_mappings")
    .select("file_id, project_slug")
    .eq("file_id", fileId.trim())
    .maybeSingle();

  if (!mapping) {
    return NextResponse.json({ linked: false });
  }

  return NextResponse.json({
    linked: true,
    fileId: mapping.file_id,
    projectSlug: mapping.project_slug,
  });
});

// POST /api/figma/file-mapping — create or update (relink)
export const POST = withAuth(async (req, _context, auth) => {
  const { fileId, projectSlug } = await req.json();

  if (!projectSlug || typeof projectSlug !== "string" || !projectSlug.trim()) {
    return NextResponse.json({ message: "projectSlug is required." }, { status: 400 });
  }

  const finalFileId =
    fileId && typeof fileId === "string" && fileId.trim() ? fileId.trim() : randomUUID();

  const { data: project } = await db
    .schema("apps_lokalit")
    .from("projects")
    .select("slug")
    .eq("slug", projectSlug.trim())
    .maybeSingle();

  if (!project) {
    return NextResponse.json({ message: "Project not found." }, { status: 404 });
  }

  const { data: mapping, error } = await db
    .schema("apps_lokalit")
    .from("figma_file_mappings")
    .upsert(
      {
        file_id: finalFileId,
        project_slug: project.slug,
        created_by: auth.userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "file_id" }
    )
    .select("file_id, project_slug")
    .single();

  if (error) throw error;

  return NextResponse.json({
    linked: true,
    fileId: mapping.file_id,
    projectSlug: mapping.project_slug,
  });
});

// DELETE /api/figma/file-mapping?fileId=xxx
export const DELETE = withAuth(async (req, _context, _auth) => {
  const fileId = req.nextUrl.searchParams.get("fileId");
  if (!fileId?.trim()) {
    return NextResponse.json({ message: "fileId is required." }, { status: 400 });
  }

  await db
    .schema("apps_lokalit")
    .from("figma_file_mappings")
    .delete()
    .eq("file_id", fileId.trim());

  return NextResponse.json({ message: "File unlinked." });
});
