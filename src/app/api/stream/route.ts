import { NextRequest, NextResponse } from "next/server";
import Stream from "@/models/stream";
import User from "@/models/user";
import DBConnect from "../../../../lib/DB_Connect";
import TimeEntry from "@/models/time_entry";
import ActivityLog from "@/models/activity_log";
import CommonUser from "@/models/common_user";
import { getSession } from "../../../../lib/session";

type UserLookupDoc = {
    _id?: { toString: () => string };
    username?: string;
    role?: string;
};

type StreamToggleBody = {
    userId?: string;
    isActive?: boolean;
    frame?: string;
    controlEnabled?: boolean;
    controllerId?: string;
    reasonStopped?: string;
};

/**
 * Resolves a userId input (could be username, ObjectId string, or OS username)
 * into a consistent identifier used for Stream documents.
 * Returns an array of possible userId values to match against.
 */
async function resolveUserIds(userId: string): Promise<string[]> {
    const ids = [userId];

    try {
        // Try to find in User collection by _id or username
        const user = (userId.length === 24)
            ? await User.findById(userId).select("username").lean()
            : await User.findOne({ username: userId }).select("_id username").lean();

        if (user) {
            const u = user as UserLookupDoc;
            if (u._id) ids.push(u._id.toString());
            if (u.username) ids.push(u.username);
        }
    } catch {
        // If lookup fails, we still have the original userId
    }

    // Return unique values
    return [...new Set(ids)];
}

function getActorRole(req: NextRequest): string {
    return (req.headers.get("x-actor-role") || "").trim().toLowerCase();
}

function isPrivilegedRole(role: string): boolean {
    return role === "admin" || role === "manager" || role === "team_leader";
}

function isAgentRequest(req: NextRequest): boolean {
    return (req.headers.get("x-client-type") || "").trim().toLowerCase() === "agent";
}

async function getPcActiveStatus(userId: string): Promise<boolean> {
    // "PC active" means we have received a recent activity log from the agent app.
    // This ensures the dashboard correctly reflects real-time presence.
    const userQuery: Array<Record<string, string>> = [{ username: userId }];
    if (userId.length === 24) userQuery.push({ _id: userId });
    const user = await User.findOne({ $or: userQuery }).select("_id").lean() as UserLookupDoc | null;
    if (!user?._id) return false;

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const log = await ActivityLog.findOne({
        userId: user._id.toString(),
        createdAt: { $gte: fiveMinutesAgo }
    })
        .select("_id")
        .lean();

    return Boolean(log);
}

async function isAllowedToView(req: NextRequest, targetUserId: string): Promise<boolean> {
    let role = getActorRole(req);
    let actorEmail = "";

    const session = await getSession();
    if (session?.userId) {
        const actor = await User.findById(session.userId).select("role email").lean();
        if (actor) {
            role = actor.role || role;
            actorEmail = actor.email || "";
        }
    }

    if (role === "admin") return true;
    if (isAgentRequest(req)) return true; // Agent can view its own (or if it's the target)

    // Resolve target to see their role to enforce admin-only restrictions
    const possibleIds = await resolveUserIds(targetUserId);
    const targetOid = possibleIds.find(id => id.length === 24);

    let targetUser = null;
    if (targetOid) {
        targetUser = await User.findById(targetOid).select("role").lean();
    } else {
        targetUser = await User.findOne({ username: targetUserId }).select("role").lean();
    }

    if (targetUser && (targetUser.role === 'admin' || targetUser.role === 'manager') && role !== 'admin') {
        return false;
    }

    if (role === "manager") return true;

    if (role === "team_leader") {
        if (!actorEmail) return false;

        // Resolve target to an ObjectId if possible
        const possibleIds = await resolveUserIds(targetUserId);
        const targetOid = possibleIds.find(id => id.length === 24);

        if (!targetOid) return false;

        const escapedEmail = actorEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Check if target is in team
        const member = await CommonUser.findOne({
            userId: targetOid,
            teamLeaderEmail: { $regex: `^${escapedEmail}$`, $options: "i" }
        }).select("_id").lean();

        return Boolean(member);
    }

    return false;
}

export async function GET(req: NextRequest) {
    try {
        await DBConnect();

        const url = new URL(req.url);
        const userId = url.searchParams.get("userId");
        const action = url.searchParams.get("action");

        if (!userId || !action) {
            return NextResponse.json({ error: "Missing userId or action" }, { status: 400 });
        }

        // Authorization check
        if (!(await isAllowedToView(req, userId))) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Resolve all possible userId representations
        const possibleIds = await resolveUserIds(userId);
        const stream = await Stream.findOne({ userId: { $in: possibleIds } });

        if (action === "status") {
            const pcActive = await getPcActiveStatus(userId);
            console.log(`[Stream Status Check] User: ${userId}, Resolved: [${possibleIds}], isActive: ${stream ? stream.isActive : false}`);
            return NextResponse.json(
                {
                    success: true,
                    isActive: stream ? stream.isActive : false,
                    isUserActive: pcActive,
                    reasonStopped: stream?.reasonStopped || "",
                    controlEnabled: stream?.controlEnabled || false,
                    controllerId: stream?.controllerId || "",
                },
                { status: 200 }
            );
        }

        if (action === "frame") {
            if (!stream) {
                return NextResponse.json({ success: true, frame: null, isActive: false }, { status: 200 });
            }
            return NextResponse.json(
                { success: true, frame: stream.latestFrame, isActive: stream.isActive },
                { status: 200 }
            );
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        console.error("Stream GET Error:", error);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await DBConnect();

        const url = new URL(req.url);
        const action = url.searchParams.get("action");
        const body = await req.json() as StreamToggleBody;

        // 1. Dashboard requests to toggle stream
        if (action === "toggle") {
            let role = getActorRole(req);
            const session = await getSession();
            if (session?.userId) {
                const actor = await User.findById(session.userId).select("role").lean();
                if (actor) role = actor.role || role;
            }

            if (!isPrivilegedRole(role) && !isAgentRequest(req)) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }

            const { userId, isActive } = body;
            if (!userId || isActive === undefined) {
                return NextResponse.json({ error: "Missing userId or isActive" }, { status: 400 });
            }

            // Authorization check for toggle
            if (!(await isAllowedToView(req, userId))) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }

            const {
                controlEnabled = false,
                controllerId = "",
                reasonStopped = "",
            } = body;

            // First check if a stream doc already exists under any alias
            const possibleIds = await resolveUserIds(userId);
            let stream = await Stream.findOne({ userId: { $in: possibleIds } });

            if (stream) {
                stream.isActive = isActive;
                stream.controlEnabled = Boolean(isActive && controlEnabled);
                stream.controllerId = isActive ? String(controllerId || "") : "";
                stream.lastControlAt = isActive && controlEnabled ? new Date() : stream.lastControlAt;
                stream.reasonStopped = isActive ? "" : String(reasonStopped || "");
                stream.updatedAt = new Date();
                await stream.save();
                console.log(`[Stream Toggle] Updated Stream doc for user: ${userId}, isActive: ${isActive}`);
            } else {
                // Create new — use the userId as-is (usually the username from the dashboard)
                stream = await Stream.create({
                    userId,
                    isActive,
                    controlEnabled: Boolean(isActive && controlEnabled),
                    controllerId: isActive ? String(controllerId || "") : "",
                    lastControlAt: isActive && controlEnabled ? new Date() : null,
                    reasonStopped: isActive ? "" : String(reasonStopped || ""),
                    updatedAt: new Date()
                });
                console.log(`[Stream Toggle] Created NEW Stream doc for user: ${userId}, isActive: ${isActive}`);
            }

            return NextResponse.json({ success: true, stream }, { status: 200 });
        }

        // 2. Tauri App uploads frame
        if (action === "upload") {
            const { userId, frame } = body;
            if (!userId || !frame) {
                return NextResponse.json({ error: "Missing userId or frame" }, { status: 400 });
            }

            // Find existing stream doc using all possible userId aliases
            const possibleIds = await resolveUserIds(userId);
            const result = await Stream.findOneAndUpdate(
                { userId: { $in: possibleIds } },
                { $set: { latestFrame: frame, updatedAt: new Date() } },
                { upsert: false } // Don't upsert — only update if toggled on by admin
            );

            if (!result) {
                // If no stream doc exists yet, create one (edge case)
                await Stream.create({ userId, latestFrame: frame, isActive: true, updatedAt: new Date() });
            }

            return NextResponse.json({ success: true }, { status: 200 });
        }

        if (action === "control-heartbeat") {
            let role = getActorRole(req);
            const session = await getSession();
            if (session?.userId) {
                const actor = await User.findById(session.userId).select("role").lean();
                if (actor) role = actor.role || role;
            }

            if (!isPrivilegedRole(role)) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
            const { userId } = body;
            if (!userId) {
                return NextResponse.json({ error: "Missing userId" }, { status: 400 });
            }
            const possibleIds = await resolveUserIds(userId);
            const stream = await Stream.findOne({ userId: { $in: possibleIds } });
            if (!stream) {
                return NextResponse.json({ error: "Stream not found" }, { status: 404 });
            }
            stream.lastControlAt = new Date();
            stream.updatedAt = new Date();
            await stream.save();
            return NextResponse.json({ success: true }, { status: 200 });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        console.error("Stream POST Error:", error);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
