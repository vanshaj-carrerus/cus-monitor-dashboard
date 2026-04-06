import { NextResponse } from "next/server";
import User from "@/models/user";
import SalesUser from "@/models/sales_user";
import MarketingUser from "@/models/marketing_user";
import DBConnect from "../../../../lib/DB_Connect";

type LeanUser = {
    _id: { toString: () => string };
    username: string;
    email: string;
    role: "sales" | "marketing" | "manager";
};

type LeanRoleProfile = {
    userId: { toString: () => string };
    active: boolean;
};

export async function GET() {
    try {
        await DBConnect();

        // 1. Fetch all users from the User model
        // Sort alphabetically by username
        const users = await User.find({ role: { $in: ['sales', 'marketing', 'manager'] } })
            .select("username email role")
            .sort({ username: 1 })
            .lean();

        const typedUsers = users as LeanUser[];
        const ids = typedUsers.map((u) => u._id);
        const salesProfiles = (await SalesUser.find({ userId: { $in: ids } }).select("userId active").lean()) as LeanRoleProfile[];
        const marketingProfiles = (await MarketingUser.find({ userId: { $in: ids } }).select("userId active").lean()) as LeanRoleProfile[];

        const salesMap = new Map(salesProfiles.map((p) => [p.userId.toString(), Boolean(p.active)]));
        const marketingMap = new Map(marketingProfiles.map((p) => [p.userId.toString(), Boolean(p.active)]));

        const usersWithStatus = typedUsers.map((u) => {
            const key = u._id.toString();
            const role = u.role;
            const active = role === "sales"
                ? (salesMap.get(key) ?? false)
                : role === "marketing"
                    ? (marketingMap.get(key) ?? false)
                    : true;
            return {
                username: u.username,
                email: u.email,
                role: u.role,
                active,
            };
        });

        return NextResponse.json(
            { success: true, count: usersWithStatus.length, data: usersWithStatus },
            { status: 200 }
        );

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        console.error("Users GET Error:", error);
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}
