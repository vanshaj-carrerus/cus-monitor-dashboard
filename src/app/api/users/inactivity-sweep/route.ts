import { NextResponse } from "next/server";
import SalesUser from "@/models/sales_user";
import MarketingUser from "@/models/marketing_user";
import TimeEntry from "@/models/time_entry";
import DBConnect from "../../../../../lib/DB_Connect";

const INACTIVITY_WINDOW_MS = 4 * 60 * 1000;

type ActiveProfile = {
    userId: { toString: () => string };
};

type TimeEntryLite = {
    userId: { toString: () => string };
    sessions?: Array<{ lastHeartbeat?: Date | string | null }>;
};

export async function POST() {
    try {
        await DBConnect();

        const activeSalesProfiles = (await SalesUser.find({ active: true })
            .select("userId")
            .lean()) as ActiveProfile[];
        const activeMarketingProfiles = (await MarketingUser.find({ active: true })
            .select("userId")
            .lean()) as ActiveProfile[];

        const activeUserIdStrings = [
            ...activeSalesProfiles.map((p) => p.userId.toString()),
            ...activeMarketingProfiles.map((p) => p.userId.toString()),
        ];

        if (activeUserIdStrings.length === 0) {
            return NextResponse.json({ success: true, checked: 0, deactivated: 0 }, { status: 200 });
        }

        const now = new Date();
        const cutoff = new Date(now.getTime() - INACTIVITY_WINDOW_MS);
        const dateStr = now.toISOString().split("T")[0];
        const dayStart = new Date(`${dateStr}T00:00:00.000Z`);

        const todayEntries = (await TimeEntry.find({
            userId: { $in: activeUserIdStrings },
            date: dayStart,
        })
            .select("userId sessions.lastHeartbeat")
            .lean()) as TimeEntryLite[];

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
        if (staleUserIds.length === 0) {
            return NextResponse.json({
                success: true,
                checked: activeUserIdStrings.length,
                deactivated: 0,
            }, { status: 200 });
        }

        const [salesRes, marketingRes] = await Promise.all([
            SalesUser.updateMany(
                { userId: { $in: staleUserIds }, active: true },
                { $set: { active: false } }
            ),
            MarketingUser.updateMany(
                { userId: { $in: staleUserIds }, active: true },
                { $set: { active: false } }
            ),
        ]);

        const deactivatedCount = (salesRes.modifiedCount ?? 0) + (marketingRes.modifiedCount ?? 0);

        return NextResponse.json({
            success: true,
            checked: activeUserIdStrings.length,
            deactivated: deactivatedCount,
        }, { status: 200 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        console.error("Inactivity sweep error:", error);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
