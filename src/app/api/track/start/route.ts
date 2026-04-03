//src/app/api/track/start/route.ts

import { NextResponse } from "next/server";
import User from "@/models/user";
import SalesUser from "@/models/sales_user";
import MarketingUser from "@/models/marketing_user";
import TimeEntry from "@/models/time_entry";
import DBConnect from "../../../../../lib/DB_Connect";

export async function POST(request: Request) {
    try {
        await DBConnect();
        const { userId, timestamp } = await request.json();

        if (!userId) {
            return NextResponse.json({ success: false, error: "Missing userId." }, { status: 400 });
        }

        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
        }

        if (user.role === 'admin' || user.role === 'manager') {
            return NextResponse.json({
                ignored: true,
                message: "Ignored tracking for admins."
            }, { status: 200 });
        } else {
            // Activate the corresponding role profile
            const updatePayload = { active: true, lastLogin: new Date() };

            if (user.role === 'sales') {
                await SalesUser.findOneAndUpdate({ userId }, updatePayload, { upsert: true, new: true });
            } else if (user.role === 'marketing') {
                await MarketingUser.findOneAndUpdate({ userId }, updatePayload, { upsert: true, new: true });
            }

            // Initialize or find the daily time entry
            const dateObj = timestamp ? new Date(timestamp) : new Date();
            const dateStr = dateObj.toISOString().split('T')[0];
            const dayStart = new Date(dateStr + "T00:00:00.000Z");

            await TimeEntry.findOneAndUpdate(
                { userId, date: dayStart },
                { $setOnInsert: { totalTrackedSeconds: 0 } },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            return NextResponse.json({
                success: true,
                userId: user._id,
                message: "Tracking started, user activated, and time entry initialized."
            }, { status: 200 });
        }
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
