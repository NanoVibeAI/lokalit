import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { withAuth } from "@/lib/auth";
import Project from "@/models/Project";
import LocalizationKey from "@/models/LocalizationKey";

export const PATCH = withAuth<{ params: Promise<{ slug: string; keyId: string }> }>(async (req, { params }, _auth) => {
  try {
    const { slug, keyId } = await params;

    if (!mongoose.Types.ObjectId.isValid(keyId)) {
      return NextResponse.json({ message: "Invalid key ID." }, { status: 400 });
    }

    const body = await req.json();
    await connectDB();

    const project = await Project.findOne({ slug }).lean();
    if (!project) {
      return NextResponse.json({ message: "Project not found." }, { status: 404 });
    }

    const locKey = await LocalizationKey.findOne({ _id: keyId, projectId: project._id });
    if (!locKey) {
      return NextResponse.json({ message: "Key not found." }, { status: 404 });
    }

    // Bulk replace entire values object
    if (body.values !== undefined) {
      if (typeof body.values !== "object" || Array.isArray(body.values) || body.values === null) {
        return NextResponse.json({ message: "values must be an object." }, { status: 400 });
      }
      const cleaned: Record<string, string> = {};
      for (const [k, v] of Object.entries(body.values as Record<string, unknown>)) {
        cleaned[String(k).trim()] = String(v ?? "");
      }
      locKey.values = cleaned;
      locKey.markModified("values");
    }

    // Set or clear a single language value
    if (body.lang !== undefined) {
      const lang = String(body.lang).trim();
      if (!lang) {
        return NextResponse.json({ message: "Language is required." }, { status: 400 });
      }
      if (body.remove === true) {
        const updated = { ...locKey.values };
        delete updated[lang];
        locKey.values = updated;
      } else {
        locKey.values = { ...locKey.values, [lang]: String(body.value ?? "") };
      }
      locKey.markModified("values");
    }

    // Rename key
    if (body.key !== undefined) {
      const newKey = String(body.key).trim();
      if (!newKey) {
        return NextResponse.json({ message: "Key name is required." }, { status: 400 });
      }
      const conflict = await LocalizationKey.findOne({
        projectId: project._id,
        key: newKey,
        _id: { $ne: keyId },
      });
      if (conflict) {
        return NextResponse.json({ message: `Key "${newKey}" already exists.` }, { status: 409 });
      }
      locKey.key = newKey;
    }

    // Update description
    if (body.description !== undefined) {
      locKey.description = String(body.description).trim();
    }

    await locKey.save();
    return NextResponse.json({ key: locKey });
  } catch {
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
});

export const DELETE = withAuth<{ params: Promise<{ slug: string; keyId: string }> }>(async (req, { params }, _auth) => {
  try {
    const { slug, keyId } = await params;

    if (!mongoose.Types.ObjectId.isValid(keyId)) {
      return NextResponse.json({ message: "Invalid key ID." }, { status: 400 });
    }

    await connectDB();

    const project = await Project.findOne({ slug }).lean();
    if (!project) {
      return NextResponse.json({ message: "Project not found." }, { status: 404 });
    }

    const result = await LocalizationKey.deleteOne({ _id: keyId, projectId: project._id });
    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Key not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Key deleted." });
  } catch {
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
});
