// src/app/api/track/upload-screenshot/route.ts

import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import DBConnect from "../../../../../lib/DB_Connect";
import Screenshot from "@/models/screenshot"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

function getCorsHeaders(origin: string | null) {
    const allowedOrigins = [
        "https://cus-spy-admin-dashboard.vercel.app", // Added your dashboard URL
        "tauri://localhost", // For production Tauri apps
    ];
    const currentOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
    return {
        "Access-Control-Allow-Origin": currentOrigin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };
}

export async function OPTIONS(req: NextRequest) {
    return NextResponse.json({}, { headers: getCorsHeaders(req.headers.get("origin")) });
}

export async function POST(req: NextRequest) {
    const origin = req.headers.get("origin");
    try {
        await DBConnect();

        const body = await req.json().catch(() => null);
        if (!body) {
            return NextResponse.json(
                { error: "Invalid JSON payload" },
                { status: 400, headers: getCorsHeaders(origin) }
            );
        }

        const { userId, sessionId, image, timestamp } = body;

        // Validation
        if (!image || !userId) {
            return NextResponse.json(
                { error: "Missing required fields: image or userId" },
                { status: 400, headers: getCorsHeaders(origin) }
            );
        }

        // Fetch user to get email for tags/storage
        const User = (await import("@/models/user")).default;
        const user = await User.findById(userId);
        const email = user?.email || "unknown";

        // Convert base64 to Buffer
        let base64Data = image;
        if (image.startsWith("data:image")) {
            base64Data = image.split(",")[1];
        }
        const buffer = Buffer.from(base64Data, "base64");

        // Upload to Cloudinary using a stream
        const result = await new Promise<UploadApiResponse>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: `cus_spy_monitor/${userId}`, // Organizes screenshots by user
                    resource_type: "image",
                    tags: ["monitoring", email]
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result as UploadApiResponse);
                }
            );
            uploadStream.end(buffer);
        });

        // Save to MongoDB
        const screenshotData: any = {
            userId,
            sessionId,
            email,
            imageUrl: result.secure_url,
        };
        if (timestamp) {
            screenshotData.createdAt = new Date(timestamp);
        }

        const newScreenshot = await Screenshot.create(screenshotData);

        return NextResponse.json(
            {
                success: true,
                url: result.secure_url,
                dbId: newScreenshot._id
            },
            { headers: getCorsHeaders(origin) }
        );

    } catch (error: any) {
        console.error("Upload Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500, headers: getCorsHeaders(origin) }
        );
    }
}