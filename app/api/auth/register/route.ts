import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";
import User from "@/models/User";
import crypto from "node:crypto";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 400 }
      );
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { message: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    await connectDB();

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });

    // Return the same message whether email exists or not (prevents enumeration)
    const okMessage = "Check your inbox — we sent you a verification link.";

    if (existingUser) {
      return NextResponse.json({ message: okMessage }, { status: 200 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    await User.create({
      email: email.toLowerCase().trim(),
      password: passwordHash,
      emailVerified: false,
      verificationToken,
      verificationTokenExpiry,
    });

    await sendVerificationEmail(email, verificationToken);

    return NextResponse.json({ message: okMessage }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
}
