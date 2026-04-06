import { NextResponse } from "next/server";
import User from "@/models/user";
import SalesUser from "@/models/sales_user";
import MarketingUser from "@/models/marketing_user";
import TimeEntry from "@/models/time_entry";
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

const INACTIVITY_WINDOW_MS = 4 * 60 * 1000;

async function markUsersInactiveWithoutRecentTimeEntries(): Promise<void> {
    const activeSalesProfiles = (await SalesUser.find({ active: true })
        .select("userId")
        .lean()) as Array<{ userId: { toString: () => string } }>;
    const activeMarketingProfiles = (await MarketingUser.find({ active: true })
        .select("userId")
        .lean()) as Array<{ userId: { toString: () => string } }>;

    const activeUserIdStrings = [
        ...activeSalesProfiles.map((p) => p.userId.toString()),
        ...activeMarketingProfiles.map((p) => p.userId.toString()),
    ];

    if (activeUserIdStrings.length === 0) return;

    const now = new Date();
    const cutoff = new Date(now.getTime() - INACTIVITY_WINDOW_MS);
    const dateStr = now.toISOString().split("T")[0];
    const dayStart = new Date(`${dateStr}T00:00:00.000Z`);

    const todayEntries = (await TimeEntry.find({
        userId: { $in: activeUserIdStrings },
        date: dayStart,
    })
        .select("userId sessions.lastHeartbeat")
        .lean()) as Array<{
            userId: { toString: () => string };
            sessions?: Array<{ lastHeartbeat?: Date | string | null }>;
        }>;

    const recentlyActiveUserIds = new Set<string>();
    for (const entry of todayEntries) {
        const userKey = entry.userId.toString();
        for (const session of entry.sessions ?? []) {
            if (!session?.lastHeartbeat) continue;
            const lastBeat = new Date(session.lastHeartbeat);
            if (!Number.isNaN(lastBeat.getTime()) && lastBeat >= cutoff) {
                recentlyActiveUserIds.add(userKey);
                break;
            }
        }
    }

    const staleUserIds = activeUserIdStrings.filter((id) => !recentlyActiveUserIds.has(id));
    if (staleUserIds.length === 0) return;

    await Promise.all([
        SalesUser.updateMany(
            { userId: { $in: staleUserIds }, active: true },
            { $set: { active: false } }
        ),
        MarketingUser.updateMany(
            { userId: { $in: staleUserIds }, active: true },
            { $set: { active: false } }
        ),
    ]);
}

export async function GET() {
    try {
        await DBConnect();
        await markUsersInactiveWithoutRecentTimeEntries();

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
