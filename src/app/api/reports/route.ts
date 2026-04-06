import { NextResponse } from "next/server";
import User from "@/models/user";
import TimeEntry from "@/models/time_entry";
import SalesUser from "@/models/sales_user";
import MarketingUser from "@/models/marketing_user";
import DBConnect from "../../../../lib/DB_Connect";

export async function GET(request: Request) {
    try {
        await DBConnect();
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const search = (searchParams.get("search") || "").trim();
        const role = searchParams.get("role");
        const userIdFilter = searchParams.get("userId");

        const userFilter: any = { role: { $in: ['sales', 'marketing'] } };
        if (role && ['sales', 'marketing'].includes(role)) {
            userFilter.role = role;
        }
        if (search) {
            userFilter.$or = [
                { username: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ];
        }
        if (userIdFilter) {
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
        const salesProfiles = await SalesUser.find().lean();
        const marketingProfiles = await MarketingUser.find().lean();

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

            if (user.role === 'sales') {
                profile = salesProfiles.find(sp => sp.userId.toString() === user._id.toString());
            } else if (user.role === 'marketing') {
                profile = marketingProfiles.find(mp => mp.userId.toString() === user._id.toString());
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
