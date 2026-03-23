import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import crypto from "node:crypto";

function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString("base64url");
}

function generateCodeChallenge(verifier: string): string {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

export async function GET() {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state = crypto.randomBytes(16).toString("hex");

  // Store PKCE values in the session so they survive the Supabase redirect
  const session = await getSession();
  session.pkceState = state;
  session.pkceVerifier = codeVerifier;
  await session.save();

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.OIDC_CLIENT_ID ?? "",
    redirect_uri: process.env.OIDC_REDIRECT_URI ?? "",
    scope: "openid email",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  const authUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/oauth/authorize?${params.toString()}`;

  return NextResponse.redirect(authUrl);
}
