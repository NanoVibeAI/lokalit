import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { withAuth } from "@/lib/auth";
import Project from "@/models/Project";
import LocalizationKey from "@/models/LocalizationKey";

export const POST = withAuth<{ params: Promise<{ slug: string }> }>(async (req, { params }, _auth) => {
  try {
    const { slug } = await params;
    const { keys } = await req.json(); // Array of { key: string, values: Record<string, string> }

    if (!Array.isArray(keys)) {
      return NextResponse.json({ message: "Invalid payload: keys must be an array." }, { status: 400 });
    }

    await connectDB();

    const project = await Project.findOne({ slug }).lean();
    if (!project) {
      return NextResponse.json({ message: "Project not found." }, { status: 404 });
    }

    const results = [];
    for (const item of keys) {
      if (!item.key || typeof item.key !== "string") continue;

      // Upsert: Find by projectId and key, update specific nested values
      const updateData: Record<string, string> = {};
      if (item.values) {
        Object.entries(item.values).forEach(([lang, val]) => {
          updateData[`values.${lang}`] = val as string;
        });
      }

      const locKey = await LocalizationKey.findOneAndUpdate(
        { projectId: project._id, key: item.key.trim() },
        { 
          $set: updateData
        },
        { upsert: true, new: true, runValidators: true }
      );
      results.push(locKey);
    }

    return NextResponse.json({ 
      message: `Successfully synced ${results.length} keys.`,
      keys: results 
    });
  } catch (err) {
    console.error("[Bulk Sync Error]:", err);
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
});
