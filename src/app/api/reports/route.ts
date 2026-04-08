import { NextResponse } from "next/server";
import User from "@/models/user";
import TimeEntry from "@/models/time_entry";
import CommonUser from "@/models/common_user";
import TeamLeader from "@/models/team_leader";
import Manager from "@/models/manager";
import DBConnect from "../../../../lib/DB_Connect";
import { getSession } from "../../../../lib/session";

export async function GET(request: Request) {
    try {
        await DBConnect();
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const actor = await User.findById(session.userId).select("role").lean();
        if (!actor) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const search = (searchParams.get("search") || "").trim();
        const role = searchParams.get("role");
        const userIdFilter = searchParams.get("userId");

        const userFilter: any = { role: { $in: ['common', 'team_leader'] } };
        if (role && ['common', 'team_leader'].includes(role)) {
            userFilter.role = role;
        }
        if (search) {
            userFilter.$or = [
                { username: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ];
        }

        if (actor.role === "common" || actor.role === "team_leader") {
            userFilter._id = actor._id;
        } else if (actor.role === "manager") {
            const mgr = await Manager.findOne({ userId: actor._id }).lean();
            const deptIds = (mgr?.managedDepartments || []).map((id: any) => id.toString());
            const locIds = (mgr?.managedLocations || []).map((id: any) => id.toString());
            const or: any[] = [];
            if (deptIds.length) or.push({ departmentId: { $in: deptIds } });
            if (locIds.length) or.push({ locationId: { $in: locIds } });
            let allowedIds: string[] = [];
            if (or.length) {
                const [c, t] = await Promise.all([
                    CommonUser.find({ $or: or }).select("userId").lean(),
                    TeamLeader.find({ $or: or }).select("userId").lean(),
                ]);
                allowedIds = [...new Set([...c, ...t].map((p: any) => p.userId.toString()))];
            }
            if (allowedIds.length === 0) {
                return NextResponse.json({ success: true, count: 0, data: [] }, { status: 200 });
            }
            userFilter._id = { $in: allowedIds };
        }

        if (userIdFilter && (actor.role === "admin" || actor.role === "manager")) {
            if (actor.role === "manager") {
                const allowed = (userFilter._id?.$in || []).map((id: any) => id.toString());
                if (!allowed.includes(userIdFilter)) {
                    return NextResponse.json({ success: true, count: 0, data: [] }, { status: 200 });
                }
            }
            userFilter._id = userIdFilter;
        }

        // 1. Fetch non-admin users
        const users = await User.find(userFilter).lean();
        const userIds = users.map((u: any) => u._id);

        const timeEntryFilter: any = {};
        if (userIds.length > 0) {
            timeEntryFilter.userId = { $in: userIds };
        } else {
            return NextResponse.json({ success: true, count: 0, data: [] }, { status: 200 });
        }

        // 2. Fetch time entries across full history unless date filters are provided
        if (startDate || endDate) {
            timeEntryFilter.date = {};
            if (startDate) {
                timeEntryFilter.date.$gte = new Date(`${startDate}T00:00:00.000Z`);
            }
            if (endDate) {
                timeEntryFilter.date.$lte = new Date(`${endDate}T23:59:59.999Z`);
            }
        }

        const timeEntries = await TimeEntry.find(timeEntryFilter).lean();

        // 3. Fetch role profiles for status
        const commonUserProfiles = await CommonUser.find().lean();
        const teamLeaderProfiles = await TeamLeader.find().lean();

        // Aggregate entries by user to support full-history reporting
        const timeByUser = new Map<string, { tracked: number; productive: number; unproductive: number }>();
        timeEntries.forEach((te: any) => {
            const key = te.userId.toString();
            const existing = timeByUser.get(key) || { tracked: 0, productive: 0, unproductive: 0 };
            existing.tracked += Number(te.totalTrackedSeconds || 0);
            existing.productive += Number(te.productiveSeconds || 0);
            existing.unproductive += Number(te.unproductiveSeconds || 0);
            timeByUser.set(key, existing);
        });

        // Combine data
        const reports = users.map(user => {
            const totals = timeByUser.get(user._id.toString()) || { tracked: 0, productive: 0, unproductive: 0 };
            let profile;

            if (user.role === 'common') {
                profile = commonUserProfiles.find(sp => sp.userId.toString() === user._id.toString());
            } else if (user.role === 'team_leader') {
                profile = teamLeaderProfiles.find(mp => mp.userId.toString() === user._id.toString());
            }

            return {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                trackedTimeSeconds: totals.tracked,
                productiveSeconds: totals.productive,
                unproductiveSeconds: totals.unproductive,
                active: profile ? profile.active : false,
                lastLogin: profile ? profile.lastLogin : null,
                departmentId: profile ? profile.departmentId : null,
                locationId: profile ? profile.locationId : null,
                managerId: profile ? profile.managerId : null,
            };
        });

        return NextResponse.json({ success: true, count: reports.length, data: reports }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
