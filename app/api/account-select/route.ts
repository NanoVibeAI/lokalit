import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { withAuth } from "@/lib/auth";
import { getSession } from "@/lib/session";
import Account from "@/models/Account";
import AccountMembership from "@/models/AccountMembership";
import UserPreference from "@/models/UserPreference";

export const POST = withAuth(async (req, _context, auth) => {
  try {
    const { accountId, setAsDefault } = await req.json();

    if (!accountId || typeof accountId !== "string") {
      return NextResponse.json({ message: "accountId is required." }, { status: 400 });
    }

    await connectDB();

    // Verify the user actually has access to this account
    const membership = await AccountMembership.findOne({
      userSub: auth.userId,
      accountId,
    });

    if (!membership) {
      return NextResponse.json({ message: "Access denied." }, { status: 403 });
    }

    const account = await Account.findById(accountId);

    if (!account) {
      return NextResponse.json({ message: "Account not found." }, { status: 404 });
    }

    if (setAsDefault) {
      await UserPreference.updateOne(
        { userSub: auth.userId },
        { $set: { userSub: auth.userId, defaultAccountId: account._id } },
        { upsert: true }
      );
    }

    // Persist to session for web clients
    const session = await getSession();
    session.accountId = account._id.toString();
    session.accountSlug = account.account_id;
    await session.save();

    return NextResponse.json({ accountSlug: account.account_id }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
});
