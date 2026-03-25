import { createRemoteJWKSet, jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "./session";

export interface AuthContext {
  userId: string;
  email?: string;
}

async function fromSession(): Promise<AuthContext | null> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId) return null;
  return {
    userId: session.userId,
    email: session.email,
  };
}

// Cache the JWKS instance so it isn't re-created on every request.
// jose handles key caching internally once instantiated.
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
function getJWKS() {
  if (!jwks) {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/.well-known/jwks.json`;
    jwks = createRemoteJWKSet(new URL(url));
  }
  return jwks;
}

async function fromBearerToken(req: NextRequest): Promise<AuthContext | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);

  const allowedAudiences = (process.env.ODIC_CLIENT_IDS_WHITELIST ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (allowedAudiences.length === 0) return null;
  try {
    const { payload } = await jwtVerify(token, getJWKS(), {
      issuer: process.env.OIDC_ISSUER_URL,
    });

    // validate the audiences
    if (!allowedAudiences.includes(payload.client_id as string)) return null;
    if (!payload.sub) return null;

    return {
      userId: payload.sub,
      email: typeof payload.email === "string" ? payload.email : undefined,
    };
  } catch (error) {
    console.error("Error verifying token:", error);
    return null;
  }
}

/**
 * Resolves the caller's identity from either an iron-session cookie (web)
 * or an `Authorization: Bearer <jwt>` header (Figma plugin / API clients).
 * Returns null if neither is present or valid.
 */
export async function authenticate(
  req: NextRequest,
): Promise<AuthContext | null> {
  return (await fromSession()) ?? (await fromBearerToken(req));
}

/**
 * Higher-order function that wraps a route handler with authentication.
 * Eliminates the repeated auth check boilerplate — the handler receives a
 * guaranteed-non-null AuthContext as its third argument.
 *
 * Usage (no params):  export const POST = withAuth(async (req, _context, auth) => { ... });
 * Usage (with params): export const GET = withAuth<{ params: Promise<{ slug: string }> }>(async (req, { params }, auth) => { ... });
 */
export function withAuth<C extends object = Record<never, never>>(
  handler: (
    req: NextRequest,
    context: C,
    auth: AuthContext,
  ) => Promise<NextResponse>,
) {
  return async (req: NextRequest, context: C): Promise<NextResponse> => {
    const auth = await authenticate(req);
    if (!auth) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }
    return handler(req, context, auth);
  };
}
