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

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  if (!supabaseClient) {
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
      if (payload && typeof payload === "object" && "adminId" in payload) {
        onEvent(event, payload as SignalingPayload);
      }
    });
  }

  await new Promise<void>((resolve, reject) => {
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") resolve();
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        reject(new Error(`Failed to subscribe to ${channelName}: ${status}`));
      }
    });
  });

  return channel;
}

export async function broadcastSignalingEvent(
  channel: RealtimeChannel,
  event: SignalingEvent,
  payload: SignalingPayload,
): Promise<void> {
  await channel.send({
    type: "broadcast",
    event,
    payload,
  });
}

export async function unsubscribeChannel(channel: RealtimeChannel): Promise<void> {
  const supabase = getSupabaseClient();
  await supabase.removeChannel(channel);
}
