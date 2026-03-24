import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth } from "@/lib/auth";

// GET /api/figma/projects
// Returns all projects the authenticated user is a member of.
export const GET = withAuth(async (_req, _context, auth) => {
  const { data: memberships } = await db
    .schema("apps_lokalit")
    .from("project_memberships")
    .select("project_id")
    .eq("user_sub", auth.userId);

  if (!memberships || memberships.length === 0) {
    return NextResponse.json({ projects: [] });
  }

  const projectIds = memberships.map((m) => m.project_id);

  const { data: projects } = await db
    .schema("apps_lokalit")
    .from("projects")
    .select("id, name, slug, default_language, other_languages")
    .in("id", projectIds)
    .order("name", { ascending: true });

  return NextResponse.json({ projects: projects ?? [] });
});
