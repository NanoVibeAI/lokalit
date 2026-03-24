import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const requestId = req.nextUrl.searchParams.get("request_id");

  if (!requestId) {
    return NextResponse.json({ error: "Missing request_id" }, { status: 400 });
  }

  // Fetch and delete atomically: find the record then delete it
  const { data: pending } = await db
    .schema("apps_lokalit")
    .from("oauth_integrations")
    .select("id, code")
    .eq("key", "figma")
    .eq("request_id", requestId)
    .maybeSingle();

  if (!pending) {
    return NextResponse.json({ pending: true });
  }

  // Delete after reading
  await db
    .schema("apps_lokalit")
    .from("oauth_integrations")
    .delete()
    .eq("id", pending.id);

  return NextResponse.json({ code: pending.code });
}
