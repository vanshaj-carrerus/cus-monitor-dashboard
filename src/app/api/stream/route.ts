import { NextRequest, NextResponse } from "next/server";
import Stream from "@/models/stream";
import DBConnect from "../../../../lib/DB_Connect";

export async function GET(req: NextRequest) {
    try {
        await DBConnect();

        const url = new URL(req.url);
        const userId = url.searchParams.get("userId");
        const action = url.searchParams.get("action");

        if (!userId || !action) {
            return NextResponse.json({ error: "Missing userId or action" }, { status: 400 });
        }

        const stream = await Stream.findOne({ userId });

        if (action === "status") {
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

            const stream = await Stream.findOneAndUpdate(
                { userId },
                { $set: { isActive, updatedAt: new Date() } },
                { new: true, upsert: true }
            );

            return NextResponse.json({ success: true, stream }, { status: 200 });
        }

        // 2. Tauri App uploads frame
        if (action === "upload") {
            const { userId, frame } = body;
            if (!userId || !frame) {
                return NextResponse.json({ error: "Missing userId or frame" }, { status: 400 });
            }

            // Only update if they exist and are active (or just create them if they somehow got orphaned)
            await Stream.findOneAndUpdate(
                { userId },
                { $set: { latestFrame: frame, updatedAt: new Date() } },
                { upsert: true } // Upsert is fine just in case
            );

            return NextResponse.json({ success: true }, { status: 200 });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error: any) {
        console.error("Stream POST Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
