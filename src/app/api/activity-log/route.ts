// src/app/api/activity-log/route.ts

import { NextRequest, NextResponse } from "next/server";
import ActivityLog from "@/models/activity_log";
import User from "@/models/user";
import Manager from "@/models/manager";
import CommonUser from "@/models/common_user";
import TeamLeader from "@/models/team_leader";
import { getUserNameFromId } from "../../../../lib/user_utils";
import DBConnect from "../../../../lib/DB_Connect";
import { getSession } from "../../../../lib/session";

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

        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const actor = await User.findById(session.userId).select("role email").lean();
        if (!actor) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

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
        
        // Authorization & Filtering Logic
        if (actor.role === "admin") {
            if (filterUserId) {
                const user = await ((filterUserId.length === 24)
                    ? User.findById(filterUserId)
                    : User.findOne({ username: filterUserId }));
                if (user) filter.userId = { $in: [user._id.toString(), user.username] };
                else filter.userId = filterUserId;
            }
        } else if (actor.role === "manager") {
            const mgr = await Manager.findOne({ userId: actor._id }).lean();
            const deptIds = (mgr?.managedDepartments || []).map((id: any) => id.toString());
            
            if (!deptIds.length) {
                return NextResponse.json({ success: true, count: 0, total: 0, page, limit, data: [] }, { status: 200 });
            }

            const [c, t] = await Promise.all([
                CommonUser.find({ departmentId: { $in: deptIds } }).select("userId").lean(),
                TeamLeader.find({ departmentId: { $in: deptIds } }).select("userId").lean()
            ]);
            const allowedUserIds = [...new Set([...c, ...t].map((p: any) => p.userId.toString()))];

            if (filterUserId) {
                const user = await ((filterUserId.length === 24)
                    ? User.findById(filterUserId)
                    : User.findOne({ username: filterUserId }));
                
                if (!user || !allowedUserIds.includes(user._id.toString())) {
                    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
                }
                filter.userId = { $in: [user._id.toString(), user.username] };
            } else {
                // If no userId, show logs for all allowed members (excluding the manager themselves)
                filter.userId = { $in: allowedUserIds };
            }
        } else if (actor.role === "team_leader") {
            const escapedEmail = (actor.email || "").replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const members = await CommonUser.find({
                teamLeaderEmail: { $regex: `^${escapedEmail}$`, $options: "i" }
            }).select("userId").lean();
            const allowedUserIds = members.map(m => m.userId.toString());

            if (filterUserId) {
                const user = await ((filterUserId.length === 24)
                    ? User.findById(filterUserId)
                    : User.findOne({ username: filterUserId }));
                
                if (!user || (!allowedUserIds.includes(user._id.toString()) && user._id.toString() !== actor._id.toString())) {
                    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
                }
                filter.userId = { $in: [user._id.toString(), user.username] };
            } else {
                filter.userId = { $in: [...allowedUserIds, actor._id.toString()] };
            }
        } else {
            // Common user can only see their own logs
            filter.userId = { $in: [actor._id.toString(), (actor as any).username] };
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
