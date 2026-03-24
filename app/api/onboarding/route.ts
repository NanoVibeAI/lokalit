import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth } from "@/lib/auth";
import { getSession } from "@/lib/session";

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replaceAll(/[^a-z0-9\s-]/g, "")
    .replaceAll(/\s+/g, "-")
    .replaceAll(/-+/g, "-");
}

export const POST = withAuth(async (req, _context, auth) => {
  try {
    const { accountName } = await req.json();

    if (!accountName || typeof accountName !== "string" || !accountName.trim()) {
      return NextResponse.json({ message: "Organization name is required." }, { status: 400 });
    }

    const slug = toSlug(accountName.trim());

    if (!slug) {
      return NextResponse.json(
        { message: "Organization name must contain at least one letter or number." },
        { status: 400 }
      );
    }

    // Check uniqueness
    const { data: existing } = await db
      .schema("apps_lokalit")
      .from("accounts")
      .select("id")
      .eq("account_id", slug)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { message: "That organization name is already taken. Please choose another." },
        { status: 409 }
      );
    }

    // Create account
    const { data: account, error: accountError } = await db
      .schema("apps_lokalit")
      .from("accounts")
      .insert({ account_id: slug, name: accountName.trim() })
      .select()
      .single();

    if (accountError || !account) {
      throw accountError;
    }

    // Create OWNER membership
    await db
      .schema("apps_lokalit")
      .from("account_memberships")
      .insert({ account_id: account.id, user_sub: auth.userId, role: "OWNER" });

    // Set as default account if user has no preference yet
    await db
      .schema("apps_lokalit")
      .from("user_preferences")
      .upsert(
        { user_sub: auth.userId, default_account_id: account.id },
        { onConflict: "user_sub", ignoreDuplicates: true }
      );

    // Persist to session for web clients
    const session = await getSession();
    session.accountId = account.id;
    session.accountSlug = slug;
    await session.save();

    return NextResponse.json(
      { message: "Organization created.", accountSlug: slug },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
});
