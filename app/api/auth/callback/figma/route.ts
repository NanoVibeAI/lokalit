import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function getFormString(formData: FormData | null, key: string): string | null {
  if (!formData) return null;
  const value = formData.get(key);
  return typeof value === "string" ? value : null;
}

async function handleCallback(req: NextRequest) {
  let code: string | null;
  let state: string | null;
  let error: string | null;

  if (req.method === "POST") {
    const body = await req.formData().catch(() => null);
    code = getFormString(body, "code");
    state = getFormString(body, "state");
    error = getFormString(body, "error");

    if (!code && !state) {
      const json = await req.json().catch(() => null) as Record<string, string> | null;
      code = json?.code ?? null;
      state = json?.state ?? null;
      error = json?.error ?? null;
    }

    if (!code || !state) {
      const { searchParams } = req.nextUrl;
      code = code ?? searchParams.get("code");
      state = state ?? searchParams.get("state");
      error = error ?? searchParams.get("error");
    }
  } else {
    const { searchParams } = req.nextUrl;
    code = searchParams.get("code");
    state = searchParams.get("state");
    error = searchParams.get("error");
  }

  if (error) {
    return NextResponse.redirect(new URL("/auth/figma/error", req.url), 303);
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/auth/figma/error", req.url), 303);
  }

  try {
    await db
      .schema("apps_lokalit")
      .from("oauth_integrations")
      .insert({ key: "figma", request_id: state, code });
  } catch {
    // Duplicate request_id — ignore, the plugin will pick up the first one
  }

  return NextResponse.redirect(new URL("/auth/figma/success", req.url), 303);
}

export const GET = handleCallback;
export const POST = handleCallback;
