import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/session";
import User from "@/models/User";
import Account from "@/models/Account";

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replaceAll(/[^a-z0-9\s-]/g, "")
    .replaceAll(/\s+/g, "-")
    .replaceAll(/-+/g, "-");
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

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

    await connectDB();

    const existing = await Account.findOne({ account_id: slug });
    if (existing) {
      return NextResponse.json(
        { message: "That organization name is already taken. Please choose another." },
        { status: 409 }
      );
    }

    const account = await Account.create({
      account_id: slug,
      name: accountName.trim(),
      ownerId: session.userId,
    });

    await User.findByIdAndUpdate(session.userId, { accountId: account._id });

    session.accountId = account._id.toString();
    session.accountSlug = slug;
    await session.save();

    return NextResponse.json(
      { message: "Organization created.", accountSlug: slug },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
}
