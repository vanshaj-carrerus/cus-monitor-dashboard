import { v2 as cloudinary } from "cloudinary";

function trimEnv(value: string | undefined) {
    return value?.trim().replace(/^["']|["']$/g, "") ?? "";
}

export function getCloudinaryConfig() {
    return {
        cloud_name: trimEnv(process.env.CLOUDINARY_CLOUD_NAME),
        api_key: trimEnv(process.env.CLOUDINARY_API_KEY),
        api_secret: trimEnv(process.env.CLOUDINARY_API_SECRET),
    };
}

export function ensureCloudinaryConfigured() {
    const config = getCloudinaryConfig();
    const missing = Object.entries(config)
        .filter(([, value]) => !value)
        .map(([key]) => key);

    if (missing.length > 0) {
        throw new Error(`Missing Cloudinary environment variables: ${missing.join(", ")}`);
    }

    cloudinary.config(config);
    return config;
}

export function getCloudinaryUploadErrorMessage(error: unknown) {
    const err = error as {
        http_code?: number;
        message?: string;
        error?: { message?: string; http_code?: number };
    };

    const httpCode = err.http_code ?? err.error?.http_code;
    const message = err.message ?? err.error?.message ?? "Cloudinary upload failed";

    if (httpCode === 403) {
        return [
            message,
            "Cloudinary rejected the upload (403).",
            "Verify CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are all from the same Cloudinary account.",
            "After updating server env vars, redeploy/restart the app so the new values are loaded.",
        ].join(" ");
    }

    if (httpCode === 401) {
        return [
            message,
            "Cloudinary credentials are invalid (401).",
            "Check that the API key and secret belong to the configured cloud name.",
        ].join(" ");
    }

    return message;
}

export { cloudinary };
