import { NextResponse } from "next/server";
import crypto from "crypto";
import DBConnect from "../../../../../../lib/DB_Connect";
import { getSession } from "../../../../../../lib/session";
import User from "@/models/user";
import UninstallOtp from "@/models/uninstall_otp";

const OTP_LENGTH = 8;
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

function isAdminRole(role: string) {
  return role === "admin" || role === "admin_compliance";
}

/** 8 chars: upper + lower + digit guaranteed. */
function generateUninstallOtp(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const all = upper + lower + digits;

  const pick = (alphabet: string) => alphabet[crypto.randomInt(0, alphabet.length)];

  const chars = [pick(upper), pick(lower), pick(digits)];
  while (chars.length < OTP_LENGTH) {
    chars.push(pick(all));
  }

  // Fisher–Yates shuffle
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

export async function POST() {
  try {
    await DBConnect();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const actor = await User.findById(session.userId).select("role username").lean();
    if (!actor || !isAdminRole(actor.role)) {
      return NextResponse.json({ success: false, error: "Only admins can generate uninstall OTPs." }, { status: 403 });
    }

    // Invalidate unused OTPs from this admin (keep audit of used ones)
    await UninstallOtp.deleteMany({
      createdBy: actor._id,
      usedAt: null,
      expiresAt: { $gt: new Date() },
    });

    let code = generateUninstallOtp();
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const doc = await UninstallOtp.create({
          code,
          createdBy: actor._id,
          expiresAt: new Date(Date.now() + OTP_TTL_MS),
        });
        return NextResponse.json({
          success: true,
          otp: doc.code,
          expiresAt: doc.expiresAt.toISOString(),
          expiresInSeconds: Math.floor(OTP_TTL_MS / 1000),
        });
      } catch (err: any) {
        if (err?.code === 11000) {
          code = generateUninstallOtp();
          continue;
        }
        throw err;
      }
    }

    return NextResponse.json({ success: false, error: "Failed to generate unique OTP." }, { status: 500 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
