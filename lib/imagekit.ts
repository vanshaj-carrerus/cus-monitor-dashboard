import { upload } from "@imagekit/next";
import { getUploadAuthParams } from "@imagekit/next/server";

function trimEnv(value: string | undefined) {
    return value?.trim().replace(/^["']|["']$/g, "") ?? "";
}

export function ensureImageKitConfigured() {
    const publicKey = trimEnv(process.env.IMAGEKIT_PUBLIC_KEY);
    const privateKey = trimEnv(process.env.IMAGEKIT_PRIVATE_KEY);

    const missing: string[] = [];
    if (!publicKey) missing.push("IMAGEKIT_PUBLIC_KEY");
    if (!privateKey) missing.push("IMAGEKIT_PRIVATE_KEY");

    if (missing.length > 0) {
        throw new Error(`Missing ImageKit environment variables: ${missing.join(", ")}`);
    }

    return { publicKey, privateKey };
}

export async function uploadScreenshotToImageKit(
    base64Data: string,
    userId: string,
    email: string
): Promise<string> {
    const { publicKey, privateKey } = ensureImageKitConfigured();
    const { token, expire, signature } = getUploadAuthParams({ publicKey, privateKey });

    const result = await upload({
        file: `data:image/png;base64,${base64Data}`,
        fileName: `screenshot_${Date.now()}.png`,
        folder: `/cus_spy_monitor/${userId}`,
        tags: ["monitoring", email],
        token,
        expire,
        signature,
        publicKey,
        useUniqueFileName: true,
    });

    if (!result.url) {
        throw new Error("ImageKit upload failed: no URL returned");
    }

    return result.url;
}
