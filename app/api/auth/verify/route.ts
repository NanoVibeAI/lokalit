import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/session";
import User from "@/models/User";
import Account from "@/models/Account";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=invalid-token", req.url));
  }

  await connectDB();

  const user = await User.findOne({
    verificationToken: token,
    verificationTokenExpiry: { $gt: new Date() },
  });

  if (!user) {
    return NextResponse.redirect(new URL("/login?error=expired-token", req.url));
  }

  user.emailVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpiry = undefined;
  await user.save();

  const account = user.accountId ? await Account.findById(user.accountId) : null;

  const session = await getSession();
  session.userId = user._id.toString();
  session.email = user.email;
  session.accountId = account?._id.toString();
  session.accountSlug = account?.account_id;
  session.isLoggedIn = true;
  await session.save();

  const destination = account ? "/home" : "/onboarding";
  return NextResponse.redirect(new URL(destination, req.url));
}
