import { NextResponse } from "next/server";
import crypto from "crypto";
import nodemailer from "nodemailer";
import DBConnect from "../../../../../lib/DB_Connect";
import User from "@/models/user";
import PasswordReset from "@/models/password_reset";

export async function POST(request: Request) {
  try {
    await DBConnect();
    const { email } = await request.json();
    const normalized = (email || "").toLowerCase().trim();

    if (!normalized) {
      return NextResponse.json({ success: false, error: "Email is required." }, { status: 400 });
    }

    const user = await User.findOne({ email: normalized });
    /* Always respond generically to avoid account enumeration */
    const okResponse = () =>
      NextResponse.json({
        success: true,
        message: "If an account exists for that email, reset instructions have been sent.",
      });

    if (!user) {
      return okResponse();
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await PasswordReset.deleteMany({ email: normalized });
    await PasswordReset.create({ email: normalized, token, expiresAt });

    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.headers.get("origin") || "http://localhost:3000";
    const resetLink = `${baseUrl}/reset-password/${token}`;

    if (emailUser && emailPass) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: emailUser, pass: emailPass },
      });
      await transporter.sendMail({
        from: "MeraMonitor <noreply@meramonitor.local>",
        to: normalized,
        subject: "Reset your MeraMonitor password",
        html: `
          <p>You requested a password reset.</p>
          <p><a href="${resetLink}">Click here to set a new password</a> (expires in 1 hour).</p>
          <p>If you did not request this, you can ignore this email.</p>
        `,
      });
    } else {
      console.warn("[forgot-password] EMAIL_USER/EMAIL_PASS not set; reset link:", resetLink);
    }

    return okResponse();
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
