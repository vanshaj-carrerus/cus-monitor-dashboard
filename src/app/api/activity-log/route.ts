// src/app/api/activity-log/route.ts

import { NextRequest, NextResponse } from "next/server";
import ActivityLog from "@/models/activity_log";
import { getUserNameFromId } from "../../../../lib/user_utils";
import DBConnect from "../../../../lib/DB_Connect";

// Browser suffixes to strip from window titles
const BROWSER_SUFFIXES = [" - Google Chrome", " - Microsoft Edge", " - Mozilla Firefox"];

function extractSite(title: string): string {
    let clean = title;
    for (const suffix of BROWSER_SUFFIXES) {
        if (clean.endsWith(suffix)) {
            clean = clean.slice(0, -suffix.length).trim();
            break;
        }
    }
    // If title had " - BrowserName" anywhere else, strip from last separator
    if (clean.includes(" - ")) {
        clean = clean.split(" - ").slice(0, -1).join(" - ").trim();
    }
    return clean || title.trim();
}

export async function POST(req: NextRequest) {
    try {
        await DBConnect();

        const body = await req.json();
        const { userId, title, app_name, start_time, duration_seconds } = body;

        // Validation
        if (!userId || !title || !app_name || !start_time || duration_seconds === undefined) {
            return NextResponse.json(
                { error: "Missing required fields: userId, title, app_name, start_time, or duration_seconds" },
                { status: 400 }
            );
        }

        // 1. Ignore short-lived events (accidental clicks / rapid Alt-Tab)
        if (Number(duration_seconds) < 5) {
            return NextResponse.json(
                { message: "Log ignored: duration too short", ignored: true },
                { status: 200 }
            );
        }

        // 2. Extract website name for browser apps
        let site: string | null = null;
        const lowerApp = app_name.toLowerCase();
        if (lowerApp.includes("chrome") || lowerApp.includes("edge") || lowerApp.includes("firefox")) {
            site = extractSite(title);
        }

        // 3. Normalize userId (convert username to ObjectId string if needed)
        // This ensures referential integrity in the database
        let resolvedUserId = userId;
        const user = await ((userId.length === 24)
            ? ActivityLog.db.model('User').findById(userId)
            : ActivityLog.db.model('User').findOne({ username: userId }));

        if (user) {
            resolvedUserId = user._id.toString();
        }

        // 4. Save the log
        const newLog = await ActivityLog.create({
            userId: resolvedUserId,
            title,
            app_name,
            start_time: new Date(start_time),
            duration_seconds: Number(duration_seconds),
            site,
        });

        return NextResponse.json(
            { success: true, message: "Activity log recorded", id: newLog._id },
            { status: 201 }
        );

    } catch (error: any) {
        console.error("Activity Log Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    try {
        await DBConnect();

        // Get userId from query params if available
        const url = new URL(req.url);
        const filterUserId = url.searchParams.get("userId");

        let filter: any = {};
        if (filterUserId) {
            // Bridge old (username) and new (ObjectId) data
            // 1. Resolve everything we know about this user
            const user = await ((filterUserId.length === 24)
                ? ActivityLog.db.model('User').findById(filterUserId)
                : ActivityLog.db.model('User').findOne({ username: filterUserId }));

            if (user) {
                // Return items matching either their ID string OR their username string
                filter = {
                    userId: { $in: [user._id.toString(), user.username] }
                };
            } else {
                // Fallback to literal search if user record doesn't exist
                filter = { userId: filterUserId };
            }
        }

        // Fetch logs (limit search to last 100 for performance)
        const logs = await ActivityLog.find(filter).sort({ start_time: -1 }).limit(100).lean();

        // Resolve user names for each item
        const data = await Promise.all(logs.map(async (log: any) => {
            const userName = await getUserNameFromId(log.userId);
            return {
                ...log,
                userName,
            };
        }));

        return NextResponse.json(
            { success: true, count: data.length, data },
            { status: 200 }
        );

    } catch (error: any) {
        console.error("Activity Log GET Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
