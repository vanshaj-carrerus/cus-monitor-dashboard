import { NextResponse } from "next/server";
import User from "@/models/user";
import TimeEntry from "@/models/time_entry";
import SalesUser from "@/models/sales_user";
import MarketingUser from "@/models/marketing_user";
import DBConnect from "../../../../lib/DB_Connect";

export async function GET(request: Request) {
    try {
        await DBConnect();

        // 1. Fetch non-admin users
        const users = await User.find({ role: { $in: ['sales', 'marketing'] } }).lean();

        // 2. Fetch today's time entries
        const dateStr = new Date().toISOString().split('T')[0];
        const dayStart = new Date(dateStr + "T00:00:00.000Z");

        const timeEntries = await TimeEntry.find({ date: dayStart }).lean();

        // 3. Fetch role profiles for status
        const salesProfiles = await SalesUser.find().lean();
        const marketingProfiles = await MarketingUser.find().lean();

        // Combine data
        const reports = users.map(user => {
            const timeEntry = timeEntries.find(te => te.userId.toString() === user._id.toString());
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
                trackedTimeSeconds: timeEntry ? timeEntry.totalTrackedSeconds : 0,
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
