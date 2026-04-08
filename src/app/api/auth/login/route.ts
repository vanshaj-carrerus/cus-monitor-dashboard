import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import User from "@/models/user";
import bcrypt from "bcryptjs";
import DBConnect from "../../../../../lib/DB_Connect";
import { SESSION_COOKIE, createSessionToken } from "../../../../../lib/session";

export async function POST(request: Request) {
    try {
        await DBConnect();
        const payload = await request.json();
        const email = (payload.email || payload.username)?.toLowerCase().trim();
        const password = payload.password;

        if (!email || !password) {
            return NextResponse.json({ success: false, error: "Email and password are required." }, { status: 400 });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json({ success: false, error: "Account not found." }, { status: 401 });
        }

        // Migrate old roles to new roles
        if (user.role === 'sales' || user.role === 'marketing') {
            user.role = 'common';
            await user.save();
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return NextResponse.json({ success: false, error: "Invalid credentials." }, { status: 401 });
        }

        const userData = user.toObject();
        delete userData.password;

        const token = createSessionToken(user._id.toString(), user.role);
        const cookieStore = await cookies();
        cookieStore.set(SESSION_COOKIE, token, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 7 * 24 * 60 * 60,
        });

        return NextResponse.json({ success: true, user: userData }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
