import { NextRequest, NextResponse } from "next/server";
import Stream from "@/models/stream";
import User from "@/models/user";
import SalesUser from "@/models/sales_user";
import MarketingUser from "@/models/marketing_user";
import DBConnect from "../../../../lib/DB_Connect";

type UserLookupDoc = {
    _id?: { toString: () => string };
    username?: string;
    role?: string;
};

type ActivityProfileDoc = {
    active?: boolean;
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
    return role === "admin" || role === "manager";
}

function isAgentRequest(req: NextRequest): boolean {
    return (req.headers.get("x-client-type") || "").trim().toLowerCase() === "agent";
}

async function getUserActiveStatus(userId: string): Promise<boolean> {
    const userQuery: Array<Record<string, string>> = [{ username: userId }];
    if (userId.length === 24) userQuery.push({ _id: userId });
    const user = await User.findOne({ $or: userQuery }).lean() as UserLookupDoc | null;

    if (!user) return false;
    if (user.role === "manager") return true;

    if (user.role === "sales") {
        const profile = await SalesUser.findOne({ userId: user._id }).select("active").lean() as ActivityProfileDoc | null;
        return Boolean(profile?.active);
    }

    if (user.role === "marketing") {
        const profile = await MarketingUser.findOne({ userId: user._id }).select("active").lean() as ActivityProfileDoc | null;
        return Boolean(profile?.active);
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

        // Resolve all possible userId representations
        const possibleIds = await resolveUserIds(userId);
        const stream = await Stream.findOne({ userId: { $in: possibleIds } });

        if (action === "status") {
            const activeUser = await getUserActiveStatus(userId);
            console.log(`[Stream Status Check] User: ${userId}, Resolved: [${possibleIds}], isActive: ${stream ? stream.isActive : false}`);
            return NextResponse.json(
                {
                    success: true,
                    isActive: stream ? stream.isActive : false,
                    isUserActive: activeUser,
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
            const role = getActorRole(req);
            if (!isPrivilegedRole(role) && !isAgentRequest(req)) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }

            const { userId, isActive } = body;
            if (!userId || isActive === undefined) {
                return NextResponse.json({ error: "Missing userId or isActive" }, { status: 400 });
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
            const role = getActorRole(req);
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
