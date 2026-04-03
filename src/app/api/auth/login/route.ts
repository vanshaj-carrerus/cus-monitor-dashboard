import { NextResponse } from "next/server";
import User from "@/models/user";
import bcrypt from "bcryptjs";
import DBConnect from "../../../../../lib/DB_Connect";

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
            return NextResponse.json({ success: false, error: `Account not found.${email} ` }, { status: 401 });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return NextResponse.json({ success: false, error: "Invalid credentials." }, { status: 401 });
        }

        const userData = user.toObject();
        delete userData.password;

        return NextResponse.json({ success: true, user: userData }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
