// src/app/api/activity-log/route.ts

import { NextRequest, NextResponse } from "next/server";
import ActivityLog from "@/models/activity_log";
import { getUserNameFromId } from "../../../../lib/user_utils";
import DBConnect from "../../../../lib/DB_Connect";

// Browser suffixes to strip from window titles
const BROWSER_SUFFIXES = [" - Google Chrome", " - Microsoft Edge", " - Mozilla Firefox", " - Brave", " - Opera"];

/**
 * Extracts a cleaner website/page name from a browser window title.
 * e.g., "ChatGPT - OpenAI - Google Chrome" -> "ChatGPT - OpenAI"
 */
function extractSite(title: string): string {
    let clean = title.trim();

    // 1. Strip common browser suffixes
    for (const suffix of BROWSER_SUFFIXES) {
        if (clean.toLowerCase().endsWith(suffix.toLowerCase())) {
            clean = clean.slice(0, -suffix.length).trim();
            break;
        }
    }

    // 2. If it still looks like "Page Title - Site Name", try to be smart.
    // We only strip the last part if there are multiple parts.
    // e.g. "Inbox (1) - Gmail" -> "Inbox (1)"
    if (clean.includes(" - ")) {
        const parts = clean.split(" - ");
        if (parts.length > 1) {
            // Only strip if the last part is a known generic site name or just a single word
            const lastPart = parts[parts.length - 1].toLowerCase();
            const commonSites = ["gmail", "facebook", "youtube", "linkedin", "github", "stack overflow"];
            if (commonSites.includes(lastPart) || parts.length > 2) {
                clean = parts.slice(0, -1).join(" - ").trim();
            }
        }
    }

    return clean || title.trim();
}

/**
 * List of titles that should be ignored as they represent system overlays, not work.
 */
const NOISE_TITLES = ["Task Switching", "Task View", "Windows Input Experience", "Program Manager", "Start", "Search"];

export async function POST(req: NextRequest) {
    try {
        await DBConnect();

        const body = await req.json();
        let { userId, title, app_name, start_time, duration_seconds } = body;

        // Validation
        if (!userId || !title || !app_name || !start_time || duration_seconds === undefined) {
            return NextResponse.json(
                { error: "Missing required fields: userId, title, app_name, start_time, or duration_seconds" },
                { status: 400 }
            );
        }

        // 0. Ignore noise titles
        if (NOISE_TITLES.includes(title)) {
            return NextResponse.json({ message: "Log ignored: noise title", ignored: true }, { status: 200 });
        }

        // 1. Ignore short-lived events (accidental clicks / rapid Alt-Tab)
        if (Number(duration_seconds) < 2) { // Lowered to 2s to capture more real movement while still blocking flickers
            return NextResponse.json(
                { message: "Log ignored: duration too short", ignored: true },
                { status: 200 }
            );
        }

        // 2. Extract website name for browser apps
        let site: string | null = null;
        const lowerApp = app_name.toLowerCase();
        if (lowerApp.includes("chrome") || lowerApp.includes("edge") || lowerApp.includes("firefox") || lowerApp.includes("brave") || lowerApp.includes("browser")) {
            site = extractSite(title);
        }

        // 3. Normalize userId (convert username to ObjectId string if needed)
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
        const startDate = url.searchParams.get("startDate");
        const endDate = url.searchParams.get("endDate");
        const search = (url.searchParams.get("search") || "").trim();
        const appName = (url.searchParams.get("app") || "").trim();
        const page = Math.max(1, Number(url.searchParams.get("page") || 1));
        const limit = Math.min(500, Math.max(1, Number(url.searchParams.get("limit") || 200)));

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

        if (startDate || endDate) {
            filter.start_time = {};
            if (startDate) {
                filter.start_time.$gte = new Date(`${startDate}T00:00:00.000Z`);
            }
            if (endDate) {
                filter.start_time.$lte = new Date(`${endDate}T23:59:59.999Z`);
            }
        }

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: "i" } },
                { site: { $regex: search, $options: "i" } },
                { app_name: { $regex: search, $options: "i" } },
            ];
        }

        if (appName) {
            filter.app_name = { $regex: appName, $options: "i" };
        }

        const skip = (page - 1) * limit;
        const total = await ActivityLog.countDocuments(filter);
        const logs = await ActivityLog.find(filter).sort({ start_time: -1 }).skip(skip).limit(limit).lean();

        // Resolve user names for each item
        const data = await Promise.all(logs.map(async (log: any) => {
            const userName = await getUserNameFromId(log.userId);
            return {
                ...log,
                userName,
            };
        }));

        return NextResponse.json(
            { success: true, count: data.length, total, page, limit, data },
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
