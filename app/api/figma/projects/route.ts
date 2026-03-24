import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { withAuth } from "@/lib/auth";
import ProjectMembership from "@/models/ProjectMembership";
import Project from "@/models/Project";

// GET /api/figma/projects
// Returns all projects the authenticated user is a member of.
export const GET = withAuth(async (_req, _context, auth) => {
  await connectDB();

  const memberships = await ProjectMembership.find({ userSub: auth.userId }).lean();
  if (memberships.length === 0) {
    return NextResponse.json({ projects: [] });
  }

  const projectIds = memberships.map((m) => m.projectId);
  const projects = await Project.find({ _id: { $in: projectIds } })
    .select("_id name slug defaultLanguage otherLanguages")
    .sort({ name: 1 })
    .lean();

  return NextResponse.json({ projects });
});
