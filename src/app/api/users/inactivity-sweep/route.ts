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

        const cutoff = new Date(Date.now() - INACTIVITY_WINDOW_MS);

        // Look for any active user's time entry that has at least one recent heartbeat,
        // regardless of day bucket, to avoid timezone/date-boundary mismatches.
        const recentlyActiveEntries = (await TimeEntry.find({
            userId: { $in: activeUserIdStrings },
            sessions: { $elemMatch: { lastHeartbeat: { $gte: cutoff } } },
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
