import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import DBConnect from "../../../../../lib/DB_Connect";
import User from "@/models/user";
import PasswordReset from "@/models/password_reset";

export async function POST(request: Request) {
  try {
    await DBConnect();
    const { token, password } = await request.json();

    if (!token || !password || String(password).length < 6) {
      return NextResponse.json(
        { success: false, error: "Valid token and password (min 6 characters) are required." },
        { status: 400 }
      );
    }

    const record = await PasswordReset.findOne({ token });
    if (!record || new Date(record.expiresAt) < new Date()) {
      return NextResponse.json({ success: false, error: "Invalid or expired reset link." }, { status: 400 });
    }

    const user = await User.findOne({ email: record.email });
    if (!user) {
      await PasswordReset.deleteOne({ _id: record._id });
      return NextResponse.json({ success: false, error: "Account not found." }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();
    await PasswordReset.deleteMany({ email: record.email });

    return NextResponse.json({ success: true, message: "Password updated. You can sign in." });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
