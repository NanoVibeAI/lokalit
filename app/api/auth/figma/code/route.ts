import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import OAuthIntegration from "@/models/OAuthIntegration";

export async function GET(req: NextRequest) {
  const requestId = req.nextUrl.searchParams.get("request_id");

  if (!requestId) {
    return NextResponse.json({ error: "Missing request_id" }, { status: 400 });
  }

  await connectDB();

  const pending = await OAuthIntegration.findOneAndDelete({ key: "figma", requestId });

  if (!pending) {
    return NextResponse.json({ pending: true });
  }

  return NextResponse.json({ code: pending.code });
}
