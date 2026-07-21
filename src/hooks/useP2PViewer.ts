"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  broadcastSignalingEvent,
  subscribeToSignalingChannel,
  unsubscribeChannel,
  type SignalingPayload,
} from "../../lib/signaling";
import { rtcConfig } from "../../lib/webrtc-config";

export type RemoteCommand =
  | { t: "mouseMove"; x: number; y: number }
  | { t: "mouseDown" | "mouseUp"; button: number; x: number; y: number }
  | { t: "mouseWheel"; deltaY: number; x: number; y: number }
  | { t: "keyDown" | "keyUp"; key: string; code: string };

interface UseP2PViewerOptions {
  userId: string;
  enabled: boolean;
  adminId: string;
  controlEnabled: boolean;
}

interface UseP2PViewerResult {
  stream: MediaStream | null;
  connectionState: RTCPeerConnectionState | "idle" | "connecting";
  error: string | null;
  sendCommand: (command: RemoteCommand) => void;
}

export function useP2PViewer({
  userId,
  enabled,
  adminId,
  controlEnabled,
}: UseP2PViewerOptions): UseP2PViewerResult {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<
    RTCPeerConnectionState | "idle" | "connecting"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const adminIdRef = useRef(adminId);
  const controlEnabledRef = useRef(controlEnabled);

  useEffect(() => {
    adminIdRef.current = adminId;
  }, [adminId]);

  useEffect(() => {
    controlEnabledRef.current = controlEnabled;
  }, [controlEnabled]);

  const cleanup = useCallback(async () => {
    dataChannelRef.current?.close();
    dataChannelRef.current = null;

    pcRef.current?.close();
    pcRef.current = null;

    if (channelRef.current) {
      await unsubscribeChannel(channelRef.current);
      channelRef.current = null;
    }

    setStream(null);
    setConnectionState("idle");
  }, []);

  const handleSignalingEvent = useCallback(
    async (event: string, payload: SignalingPayload) => {
      if (payload.adminId !== adminIdRef.current) return;

      const pc = pcRef.current;
      const channel = channelRef.current;
      if (!pc || !channel) return;

      try {
        if (event === "sdp-offer" && payload.sdp) {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));

          if (controlEnabledRef.current) {
            const dc = pc.createDataChannel("remote-control");
            dataChannelRef.current = dc;
          }

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          await broadcastSignalingEvent(channel, "sdp-answer", {
            adminId: adminIdRef.current,
            sdp: answer,
          });
        } else if (event === "ice-candidate" && payload.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        }
      } catch (err) {
        console.error("[P2P Viewer] Signaling error:", err);
        setError(err instanceof Error ? err.message : "Signaling failed");
      }
    },
    [],
  );

  useEffect(() => {
    if (!enabled || !userId || !adminId) {
      void cleanup();
      return;
    }

    let cancelled = false;

    const start = async () => {
      try {
        setError(null);
        setConnectionState("connecting");

        const pc = new RTCPeerConnection(rtcConfig);
        pcRef.current = pc;

        pc.ontrack = (event) => {
          const mediaStream =
            event.streams[0] ?? new MediaStream([event.track]);
          setStream(mediaStream);
        };

        pc.onconnectionstatechange = () => {
          setConnectionState(pc.connectionState);
          if (
            pc.connectionState === "failed" ||
            pc.connectionState === "disconnected"
          ) {
            setError("Peer connection lost");
          }
        };

        pc.onicecandidate = async (event) => {
          if (!event.candidate || !channelRef.current) return;
          await broadcastSignalingEvent(channelRef.current, "ice-candidate", {
            adminId: adminIdRef.current,
            candidate: event.candidate.toJSON(),
          });
        };

        const channel = await subscribeToSignalingChannel(
          userId,
          (evt, payload) => {
            void handleSignalingEvent(evt, payload);
          },
        );

        if (cancelled) {
          await unsubscribeChannel(channel);
          pc.close();
          return;
        }

        channelRef.current = channel;

        await broadcastSignalingEvent(channel, "request-stream", {
          adminId: adminIdRef.current,
        });
      } catch (err) {
        console.error("[P2P Viewer] Failed to start:", err);
        setError(err instanceof Error ? err.message : "Failed to connect");
        setConnectionState("failed");
      }
    };

    void start();

    return () => {
      cancelled = true;
      if (channelRef.current) {
        void broadcastSignalingEvent(channelRef.current, "stop-stream", {
          adminId: adminIdRef.current,
        }).catch(() => {});
      }
      void cleanup();
    };
  }, [enabled, userId, adminId, cleanup, handleSignalingEvent]);

  const sendCommand = useCallback((command: RemoteCommand) => {
    const dc = dataChannelRef.current;
    if (!dc || dc.readyState !== "open" || !controlEnabledRef.current) return;
    dc.send(JSON.stringify(command));
  }, []);

  return { stream, connectionState, error, sendCommand };
}
