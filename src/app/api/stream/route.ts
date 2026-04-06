import { NextRequest, NextResponse } from "next/server";
import Stream from "@/models/stream";
import User from "@/models/user";
import DBConnect from "../../../../lib/DB_Connect";

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
            const u = user as any;
            if (u._id) ids.push(u._id.toString());
            if (u.username) ids.push(u.username);
        }
    } catch {
        // If lookup fails, we still have the original userId
    }

    // Return unique values
    return [...new Set(ids)];
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
            console.log(`[Stream Status Check] User: ${userId}, Resolved: [${possibleIds}], isActive: ${stream ? stream.isActive : false}`);
            return NextResponse.json(
                { success: true, isActive: stream ? stream.isActive : false },
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
    } catch (error: any) {
        console.error("Stream GET Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await DBConnect();

        const url = new URL(req.url);
        const action = url.searchParams.get("action");
        const body = await req.json();

        // 1. Dashboard requests to toggle stream
        if (action === "toggle") {
            const { userId, isActive } = body;
            if (!userId || isActive === undefined) {
                return NextResponse.json({ error: "Missing userId or isActive" }, { status: 400 });
            }

            // First check if a stream doc already exists under any alias
            const possibleIds = await resolveUserIds(userId);
            let stream = await Stream.findOne({ userId: { $in: possibleIds } });

            if (stream) {
                stream.isActive = isActive;
                stream.updatedAt = new Date();
                await stream.save();
                console.log(`[Stream Toggle] Updated Stream doc for user: ${userId}, isActive: ${isActive}`);
            } else {
                // Create new — use the userId as-is (usually the username from the dashboard)
                stream = await Stream.create({
                    userId,
                    isActive,
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

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error: any) {
        console.error("Stream POST Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
