import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/session";
import User from "@/models/User";
import Account from "@/models/Account";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        { message: "Please verify your email before logging in.", code: "EMAIL_NOT_VERIFIED" },
        { status: 403 }
      );
    }

    const account = user.accountId
      ? await Account.findById(user.accountId)
      : null;

    const session = await getSession();
    session.userId = user._id.toString();
    session.email = user.email;
    session.accountId = account?._id.toString();
    session.accountSlug = account?.account_id;
    session.isLoggedIn = true;
    await session.save();

    const redirect = account ? "/home" : "/onboarding";
    return NextResponse.json({ message: "Logged in successfully.", redirect }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
}
