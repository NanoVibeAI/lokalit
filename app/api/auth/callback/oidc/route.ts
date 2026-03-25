import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  id_token?: string;
}

interface OIDCClaims {
  sub: string;
  email?: string;
}

function getFormValue(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" ? value : null;
}

function decodeJWTPayload(token: string): OIDCClaims {
  const payload = token.split(".")[1];
  return JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
}

async function handleCallback(req: NextRequest) {
  let code: string | null;
  let state: string | null;
  let error: string | null;

  if (req.method === "POST") {
    const body = await req.formData().catch(() => null);
    code = getFormValue(body?.get("code") ?? null);
    state = getFormValue(body?.get("state") ?? null);
    error = getFormValue(body?.get("error") ?? null);
  } else {
    const { searchParams } = req.nextUrl;
    code = searchParams.get("code");
    state = searchParams.get("state");
    error = searchParams.get("error");
  }

  const loginUrl = new URL("/api/auth/login", req.url);

  if (error || !code || !state) {
    return NextResponse.redirect(loginUrl, 303);
  }

  const session = await getSession();
  const codeVerifier = session.pkceVerifier ?? "";

  console.log("[oidc callback] pkceVerifier present:", !!session.pkceVerifier, "pkceState:", session.pkceState, "incoming state:", state);

  session.pkceState = undefined;
  session.pkceVerifier = undefined;
  await session.save();

  // Exchange authorization code for tokens
  const tokenEndpoint = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/oauth/token`;
  const basicAuth = Buffer.from(
    `${process.env.OIDC_CLIENT_ID ?? ""}:${process.env.OIDC_CLIENT_SECRET ?? ""}`
  ).toString("base64");

  const tokenRes = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.OIDC_REDIRECT_URI ?? "",
      code_verifier: codeVerifier,
    }).toString(),
  });

  if (!tokenRes.ok) {
    const errBody = await tokenRes.text();
    console.error("[oidc callback] token exchange failed:", tokenRes.status, errBody);
    return NextResponse.redirect(loginUrl, 303);
  }

  const tokens: TokenResponse = await tokenRes.json();

  const jwtToDecode = tokens.id_token ?? tokens.access_token;
  if (!jwtToDecode) {
    console.error("[oidc callback] no token to decode in response:", JSON.stringify(tokens));
    return NextResponse.redirect(loginUrl, 303);
  }

  const claims = decodeJWTPayload(jwtToDecode);
  const { sub, email } = claims;

  if (!sub) {
    return NextResponse.redirect(loginUrl, 303);
  }

  session.userId = sub;
  session.email = email ?? "";
  session.accessToken = tokens.access_token;
  session.isLoggedIn = true;
  await session.save();

  return NextResponse.redirect(new URL("/home", req.url), 303);
}

export const GET = handleCallback;
export const POST = handleCallback;
