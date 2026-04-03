import { NextResponse } from "next/server";
import User from "@/models/user";
import DBConnect from "../../../../lib/DB_Connect";

export async function GET() {
    try {
        await DBConnect();

        // 1. Fetch all users from the User model
        // Sort alphabetically by username
        const users = await User.find({ role: { $in: ['sales', 'marketing', 'manager'] } })
            .select("username email role")
            .sort({ username: 1 })
            .lean();

        return NextResponse.json(
            { success: true, count: users.length, data: users },
            { status: 200 }
        );

    } catch (error: any) {
        console.error("Users GET Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
