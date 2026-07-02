// src/app/api/track/upload-screenshot/route.ts

import { NextRequest, NextResponse } from "next/server";
import DBConnect from "../../../../../lib/DB_Connect";
import Screenshot from "@/models/screenshot";
import { cloudinary, ensureCloudinaryConfigured, getCloudinaryUploadErrorMessage } from "../../../../../lib/cloudinary";
import { uploadScreenshotToImageKit } from "../../../../../lib/imagekit";

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

        // Normalize base64 payload (strip data URI prefix if present)
        let base64Data = image;
        if (image.startsWith("data:image")) {
            base64Data = image.split(",")[1];
        }
        let imageUrl: string;
        try {
            imageUrl = await uploadScreenshotToImageKit(base64Data, userId, email);
        } catch (imageKitError) {
            console.warn("ImageKit upload failed, falling back to Cloudinary:", imageKitError);
            ensureCloudinaryConfigured();
            const result = await cloudinary.uploader.upload(
                `data:image/png;base64,${base64Data}`,
                {
                    folder: `cus_spy_monitor/${userId}`,
                    resource_type: "image",
                    tags: ["monitoring", email],
                }
            );
            imageUrl = result.secure_url;
        }

        // Save to MongoDB
        const screenshotData: any = {
            userId,
            sessionId,
            email,
            imageUrl,
        };
        if (timestamp) {
            screenshotData.createdAt = new Date(timestamp);
        }

        const newScreenshot = await Screenshot.create(screenshotData);

        return NextResponse.json(
            {
                success: true,
                url: imageUrl,
                dbId: newScreenshot._id
            },
            { headers: getCorsHeaders(origin) }
        );

    } catch (error: any) {
        const httpCode = error?.http_code ?? error?.error?.http_code;
        console.error("Upload Error:", {
            message: error?.message ?? error?.error?.message,
            http_code: httpCode,
            name: error?.name,
        });
        return NextResponse.json(
            { error: getCloudinaryUploadErrorMessage(error) },
            { status: httpCode === 403 || httpCode === 401 ? httpCode : 500, headers: getCorsHeaders(origin) }
        );
    }
}