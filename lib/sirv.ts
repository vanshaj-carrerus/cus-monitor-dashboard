function trimEnv(value: string | undefined) {
    return value?.trim().replace(/^["']|["']$/g, "") ?? "";
}

export function ensureSirvConfigured() {
    const clientId = trimEnv(process.env.SIRV_CLIENT_ID);
    const clientSecret = trimEnv(process.env.SIRV_CLIENT_SECRET);
    const cdnUrl = trimEnv(process.env.SIRV_CDN_URL); // e.g. "youraccount.sirv.com"

    if (!clientId || !clientSecret || !cdnUrl) {
        throw new Error(
            "Missing Sirv environment variables: SIRV_CLIENT_ID, SIRV_CLIENT_SECRET, SIRV_CDN_URL"
        );
    }

    return { clientId, clientSecret, cdnUrl };
}

async function getSirvToken(clientId: string, clientSecret: string): Promise<string> {
    const res = await fetch("https://api.sirv.com/v2/token", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ clientId, clientSecret }),
    });

    if (!res.ok) {
        throw new Error(`Sirv token request failed with status ${res.status}`);
    }

    const data = await res.json();
    return data.token;
}

export async function uploadScreenshotToSirv(
    base64Data: string,
    userId: string,
    _email: string
): Promise<string> {
    const { clientId, clientSecret, cdnUrl } = ensureSirvConfigured();
    const token = await getSirvToken(clientId, clientSecret);

    const filePath = `/cus_spy_monitor/${userId}/screenshot_${Date.now()}.png`;
    const binaryData = Buffer.from(base64Data, "base64");

    const res = await fetch(
        `https://api.sirv.com/v2/files/upload?filename=${encodeURIComponent(filePath)}`,
        {
            method: "POST",
            headers: {
                "content-type": "image/png",
                authorization: `Bearer ${token}`,
            },
            body: binaryData,
        }
    );

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Sirv upload failed with status ${res.status}: ${text}`);
    }

    return `https://${cdnUrl}${filePath}`;
}
