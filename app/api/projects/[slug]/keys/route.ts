import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { withAuth } from "@/lib/auth";
import Project from "@/models/Project";
import LocalizationKey from "@/models/LocalizationKey";

export const GET = withAuth<{ params: Promise<{ slug: string }> }>(
  async (req, { params }, _auth) => {
    try {
      const { slug } = await params;
      await connectDB();

      const project = await Project.findOne({ slug }).lean();
      if (!project) {
        return NextResponse.json(
          { message: "Project not found." },
          { status: 404 },
        );
      }

      const keys = await LocalizationKey.find({ projectId: project._id })
        .sort({ key: 1 })
        .lean();

      return NextResponse.json({ keys });
    } catch {
      return NextResponse.json(
        { message: "Internal server error." },
        { status: 500 },
      );
    }
  },
);

export const POST = withAuth<{ params: Promise<{ slug: string }> }>(
  async (req, { params }, _auth) => {
    try {
      const { slug } = await params;
      const { key, description } = await req.json();

      if (!key || typeof key !== "string" || !key.trim()) {
        return NextResponse.json(
          { message: "Key name is required." },
          { status: 400 },
        );
      }

      await connectDB();

      const project = await Project.findOne({ slug }).lean();
      if (!project) {
        return NextResponse.json(
          { message: "Project not found." },
          { status: 404 },
        );
      }

      const existing = await LocalizationKey.findOne({
        projectId: project._id,
        key: key.trim(),
      });
      if (existing) {
        return NextResponse.json(
          { message: `Key "${key.trim()}" already exists.` },
          { status: 409 },
        );
      }

      const locKey = await LocalizationKey.create({
        projectId: project._id,
        key: key.trim(),
        description: typeof description === "string" ? description.trim() : "",
        values: {},
      });

      return NextResponse.json({ key: locKey }, { status: 201 });
    } catch {
      return NextResponse.json(
        { message: "Internal server error." },
        { status: 500 },
      );
    }
  },
);
