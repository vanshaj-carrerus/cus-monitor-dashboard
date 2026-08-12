import { NextResponse } from "next/server";
import DBConnect from "../../../../../../lib/DB_Connect";
import UninstallOtp from "@/models/uninstall_otp";

const COMPANY_PASSWORD = "CUS@878806";

export async function POST(request: Request) {
  try {
    await DBConnect();
    const body = await request.json().catch(() => ({}));
    const password = typeof body.password === "string" ? body.password.trim() : "";
    const otp = typeof body.otp === "string" ? body.otp.trim() : "";

    if (!password || password !== COMPANY_PASSWORD) {
      return NextResponse.json(
        { success: false, error: "Incorrect company password." },
        { status: 401 }
      );
    }

    if (!otp || otp.length !== 8) {
      return NextResponse.json(
        { success: false, error: "Invalid OTP format." },
        { status: 400 }
      );
    }

    const record = await UninstallOtp.findOne({ code: otp });
    if (!record) {
      return NextResponse.json(
        { success: false, error: "Invalid OTP." },
        { status: 401 }
      );
    }

    if (record.usedAt) {
      return NextResponse.json(
        { success: false, error: "OTP already used." },
        { status: 401 }
      );
    }

    if (new Date(record.expiresAt).getTime() < Date.now()) {
      return NextResponse.json(
        { success: false, error: "OTP expired." },
        { status: 401 }
      );
    }

    record.usedAt = new Date();
    await record.save();

    return NextResponse.json({
      success: true,
      message: "OTP verified.",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
