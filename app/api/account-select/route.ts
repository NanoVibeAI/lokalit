import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth } from "@/lib/auth";
import { getSession } from "@/lib/session";

export const POST = withAuth(async (req, _context, auth) => {
  try {
    const { accountId, setAsDefault } = await req.json();

    if (!accountId || typeof accountId !== "string") {
      return NextResponse.json({ message: "accountId is required." }, { status: 400 });
    }

    // Verify the user actually has access to this account
    const { data: membership } = await db
      .schema("apps_lokalit")
      .from("account_memberships")
      .select("id")
      .eq("user_sub", auth.userId)
      .eq("account_id", accountId)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ message: "Access denied." }, { status: 403 });
    }

    const { data: account } = await db
      .schema("apps_lokalit")
      .from("accounts")
      .select("id, account_id")
      .eq("id", accountId)
      .maybeSingle();

    if (!account) {
      return NextResponse.json({ message: "Account not found." }, { status: 404 });
    }

    if (setAsDefault) {
      await db
        .schema("apps_lokalit")
        .from("user_preferences")
        .upsert(
          { user_sub: auth.userId, default_account_id: account.id },
          { onConflict: "user_sub" }
        );
    }

    // Persist to session for web clients
    const session = await getSession();
    session.accountId = account.id;
    session.accountSlug = account.account_id;
    await session.save();

    return NextResponse.json({ accountSlug: account.account_id }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
});
