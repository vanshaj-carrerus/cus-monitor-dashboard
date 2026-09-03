import UploadCounter from "../src/models/upload_counter";
import { cloudinary, ensureCloudinaryConfigured } from "./cloudinary";
import { uploadScreenshotToImageKit } from "./imagekit";

type CloudName = "cloudinary" | "imagekit";

async function uploadToCloudinary(base64Data: string, userId: string, email: string): Promise<string> {
    ensureCloudinaryConfigured();
    const result = await cloudinary.uploader.upload(`data:image/png;base64,${base64Data}`, {
        folder: `cus_spy_monitor/${userId}`,
        resource_type: "image",
        tags: ["monitoring", email],
    });
    return result.secure_url;
}

const uploaders: Record<CloudName, (base64Data: string, userId: string, email: string) => Promise<string>> = {
    cloudinary: uploadToCloudinary,
    imagekit: uploadScreenshotToImageKit,
};

// Picks which cloud goes first for this upload, alternating turn by turn via an
// atomic counter so concurrent requests still split evenly between the two clouds.
async function getPrimaryCloud(): Promise<CloudName> {
    const counter = await UploadCounter.findByIdAndUpdate(
        "screenshot_upload",
        { $inc: { value: 1 } },
        { upsert: true, new: true }
    );
    return counter.value % 2 === 0 ? "cloudinary" : "imagekit";
}

// Requires DBConnect() to have been called already by the caller.
export async function uploadScreenshotRotating(
    base64Data: string,
    userId: string,
    email: string
): Promise<string> {
    const primary = await getPrimaryCloud();
    const fallback: CloudName = primary === "cloudinary" ? "imagekit" : "cloudinary";

    try {
        return await uploaders[primary](base64Data, userId, email);
    } catch (primaryError) {
        console.warn(`${primary} upload failed, falling back to ${fallback}:`, primaryError);
        return await uploaders[fallback](base64Data, userId, email);
    }
}
