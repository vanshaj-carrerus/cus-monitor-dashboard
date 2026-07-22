import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";

export type SignalingEvent =
  | "request-stream"
  | "sdp-offer"
  | "sdp-answer"
  | "ice-candidate"
  | "stop-stream";

export interface SignalingPayload {
  adminId: string;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

const LOG = "[P2P Signaling]";

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.error(LOG, "Missing env vars", {
      hasUrl: Boolean(url),
      hasAnonKey: Boolean(anonKey),
    });
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  if (!supabaseClient) {
    console.log(LOG, "creating Supabase client", {
      url,
      anonKeyPrefix: anonKey.slice(0, 8) + "…",
    });
    supabaseClient = createClient(url, anonKey, {
      realtime: { params: { eventsPerSecond: 10 } },
    });
  }

  return supabaseClient;
}

export function getUserRoomChannelName(userId: string): string {
  return `room:user_${userId}`;
}

export async function subscribeToSignalingChannel(
  userId: string,
  onEvent: (event: SignalingEvent, payload: SignalingPayload) => void,
): Promise<RealtimeChannel> {
  const supabase = getSupabaseClient();
  const channelName = getUserRoomChannelName(userId);

  console.log(LOG, "subscribe start", {
    channelName,
    phoenixTopic: `realtime:${channelName}`,
  });

  const channel = supabase.channel(channelName, {
    config: { broadcast: { self: false } },
  });

  const events: SignalingEvent[] = [
    "request-stream",
    "sdp-offer",
    "sdp-answer",
    "ice-candidate",
    "stop-stream",
  ];

  for (const event of events) {
    channel.on("broadcast", { event }, ({ payload }) => {
      console.log(LOG, "← broadcast received", event, {
        adminId:
          payload && typeof payload === "object" && "adminId" in payload
            ? (payload as SignalingPayload).adminId
            : undefined,
        payloadKeys:
          payload && typeof payload === "object" ? Object.keys(payload) : [],
      });
      if (payload && typeof payload === "object" && "adminId" in payload) {
        onEvent(event, payload as SignalingPayload);
      } else {
        console.warn(LOG, "ignored broadcast — missing adminId", event, payload);
      }
    });
  }

  await new Promise<void>((resolve, reject) => {
    channel.subscribe((status, err) => {
      console.log(LOG, "subscribe status →", status, err ?? "");
      if (status === "SUBSCRIBED") resolve();
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        reject(new Error(`Failed to subscribe to ${channelName}: ${status}`));
      }
    });
  });

  console.log(LOG, "subscribe OK", {
    channelName,
    topic: channel.topic,
  });

  return channel;
}

export async function broadcastSignalingEvent(
  channel: RealtimeChannel,
  event: SignalingEvent,
  payload: SignalingPayload,
): Promise<void> {
  console.log(LOG, "→ send", event, {
    topic: channel.topic,
    adminId: payload.adminId,
    hasSdp: Boolean(payload.sdp),
    hasCandidate: Boolean(payload.candidate),
  });

  const result = await channel.send({
    type: "broadcast",
    event,
    payload,
  });

  console.log(LOG, "→ send result", event, result);
  if (result !== "ok") {
    console.warn(LOG, "broadcast may have failed", event, result);
  }
}

export async function unsubscribeChannel(channel: RealtimeChannel): Promise<void> {
  console.log(LOG, "unsubscribe", channel.topic);
  const supabase = getSupabaseClient();
  await supabase.removeChannel(channel);
}
