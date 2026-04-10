import { NextResponse } from "next/server";
import CommonUser from "@/models/common_user";
import TeamLeader from "@/models/team_leader";
import TimeEntry from "@/models/time_entry";
import DBConnect from "../../../../../lib/DB_Connect";

const INACTIVITY_WINDOW_MS = 4 * 60 * 1000;

type ActiveProfile = {
    userId: { toString: () => string };
};

export async function POST() {
    try {
        await DBConnect();

        const activeCommonProfiles = (await CommonUser.find({ active: true })
            .select("userId")
            .lean()) as ActiveProfile[];
        const activeTeamLeaderProfiles = (await TeamLeader.find({ active: true })
            .select("userId")
            .lean()) as ActiveProfile[];

        const activeUserIdStrings = [
            ...activeCommonProfiles.map((p) => p.userId.toString()),
            ...activeTeamLeaderProfiles.map((p) => p.userId.toString()),
        ];

        if (activeUserIdStrings.length === 0) {
            return NextResponse.json({ success: true, checked: 0, deactivated: 0 }, { status: 200 });
        }

        const dateStr = new Date().toISOString().split('T')[0];
        const dayStart = new Date(dateStr + "T00:00:00.000Z");

        // Look for any active user's time entry that exists for today
        const recentlyActiveEntries = (await TimeEntry.find({
            userId: { $in: activeUserIdStrings },
            date: dayStart
        })
            .select("userId")
            .lean()) as Array<{ userId: { toString: () => string } }>;

        const recentlyActiveUserIds = new Set(
            recentlyActiveEntries.map((entry) => entry.userId.toString())
        );

        const staleUserIds = activeUserIdStrings.filter((id) => !recentlyActiveUserIds.has(id));
        if (staleUserIds.length === 0) {
            return NextResponse.json({
                success: true,
                checked: activeUserIdStrings.length,
                deactivated: 0,
            }, { status: 200 });
        }

        const [commonRes, teamLeaderRes] = await Promise.all([
            CommonUser.updateMany(
                { userId: { $in: staleUserIds }, active: true },
                { $set: { active: false } }
            ),
            TeamLeader.updateMany(
                { userId: { $in: staleUserIds }, active: true },
                { $set: { active: false } }
            ),
        ]);

        const deactivatedCount = (commonRes.modifiedCount ?? 0) + (teamLeaderRes.modifiedCount ?? 0);

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
