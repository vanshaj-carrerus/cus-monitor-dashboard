import { NextResponse } from "next/server";
import User from "@/models/user";
import SalesUser from "@/models/sales_user";
import MarketingUser from "@/models/marketing_user";
import bcrypt from "bcryptjs";
import DBConnect from "../../../../../lib/DB_Connect";

export async function POST(request: Request) {
    try {
        await DBConnect();
        const body = await request.json();

        // Ensure graceful handling if structure doesn't match perfectly
        const userData = body.userData || body;
        const roleData = body.roleData || {};

        const { username, email, password, role } = userData;

        if (!username || !email || !password || !role) {
            return NextResponse.json({ success: false, error: "Missing required userData fields." }, { status: 400 });
        }

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return NextResponse.json({ success: false, error: "User with this email or username already exists." }, { status: 400 });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            role,
        });
        await newUser.save();

        const roleEntry = { userId: newUser._id, active: true, ...roleData };

        if (role === 'sales') {
            await new SalesUser(roleEntry).save();
        } else if (role === 'marketing') {
            await new MarketingUser(roleEntry).save();
        }

        const userResponse = newUser.toObject();
        delete userResponse.password;

        return NextResponse.json({ success: true, user: userResponse }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
