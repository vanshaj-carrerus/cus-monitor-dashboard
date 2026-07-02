import ImageKit from "@imagekit/nodejs";

function trimEnv(value: string | undefined) {
    return value?.trim().replace(/^["']|["']$/g, "") ?? "";
}

export function ensureImageKitConfigured() {
    const privateKey = trimEnv(process.env.IMAGEKIT_PRIVATE_KEY);

    if (!privateKey) {
        throw new Error("Missing ImageKit environment variables: IMAGEKIT_PRIVATE_KEY");
    }

    return { privateKey };
}

export async function uploadScreenshotToImageKit(
    base64Data: string,
    userId: string,
    email: string
): Promise<string> {
    const { privateKey } = ensureImageKitConfigured();
    const imagekit = new ImageKit({ privateKey });

    const result = await imagekit.files.upload({
        file: `data:image/png;base64,${base64Data}`,
        fileName: `screenshot_${Date.now()}.png`,
        folder: `/cus_spy_monitor/${userId}`,
        tags: ["monitoring", email],
        useUniqueFileName: true,
    });

    if (!result.url) {
        throw new Error("ImageKit upload failed: no URL returned");
    }

    return result.url;
}
