// src/app/api/track/heartbeat/route.ts

import { NextResponse } from "next/server";
import TimeEntry from "@/models/time_entry";
import DBConnect from "../../../../../lib/DB_Connect";

export async function POST(request: Request) {
    try {
        await DBConnect();
        const { userId, timestamp, sessionId, productiveSeconds, unproductiveSeconds } = await request.json();

        if (!userId || !sessionId) {
            return NextResponse.json({ success: false, error: "Missing userId or sessionId." }, { status: 400 });
        }

        // Parse timestamp locally or fallback to current execution time
        const dateObj = timestamp ? new Date(timestamp) : new Date();
        const dateStr = dateObj.toISOString().split('T')[0];
        const dayStart = new Date(dateStr + "T00:00:00.000Z");
        const now = new Date();

        let entry = await TimeEntry.findOne({ userId, date: dayStart });

        if (!entry) {
            entry = new TimeEntry({
                userId,
                date: dayStart,
                sessions: [{
                    sessionId,
                    startTime: now,
                    lastHeartbeat: now,
                    isActive: true
                }],
                totalTrackedSeconds: 0,
                productiveSeconds: Number(productiveSeconds ?? 0),
                unproductiveSeconds: Number(unproductiveSeconds ?? 0),
            });
        } else {
            const sessionIndex = entry.sessions.findIndex((s: any) => s.sessionId === sessionId);

            if (sessionIndex > -1) {
                entry.sessions[sessionIndex].lastHeartbeat = now;
                entry.sessions[sessionIndex].isActive = true;
            } else {
                entry.sessions.push({
                    sessionId,
                    startTime: now,
                    lastHeartbeat: now,
                    isActive: true
                });
            }

            const STALE_THRESHOLD_MS = 3 * 60 * 1000;
            let totalTracked = 0;

            entry.sessions.forEach((session: any) => {
                const timeDiff = now.getTime() - new Date(session.lastHeartbeat).getTime();
                if (timeDiff > STALE_THRESHOLD_MS) {
                    session.isActive = false;
                }

                const durationSeconds = Math.floor((new Date(session.lastHeartbeat).getTime() - new Date(session.startTime).getTime()) / 1000);
                // ensure we don't subtract if for some reason last is before start
                totalTracked += Math.max(0, durationSeconds);
            });

            entry.totalTrackedSeconds = totalTracked;
            entry.productiveSeconds = (entry.productiveSeconds ?? 0) + Number(productiveSeconds ?? 0);
            entry.unproductiveSeconds = (entry.unproductiveSeconds ?? 0) + Number(unproductiveSeconds ?? 0);
        }

        await entry.save();

        return NextResponse.json({ success: true, message: "Heartbeat updated and session tracked" }, { status: 200 });
    } catch (error: any) {
        console.error("Heartbeat API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
