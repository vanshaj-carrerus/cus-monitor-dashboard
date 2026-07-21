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

export type P2PPhase =
  | "idle"
  | "signaling"
  | "waiting-agent"
  | "answering"
  | "ice"
  | "connected"
  | "failed";

interface UseP2PViewerOptions {
  userId: string;
  enabled: boolean;
  adminId: string;
  controlEnabled: boolean;
}

interface UseP2PViewerResult {
  stream: MediaStream | null;
  connectionState: RTCPeerConnectionState | "idle" | "connecting";
  phase: P2PPhase;
  statusMessage: string;
  error: string | null;
  sendCommand: (command: RemoteCommand) => void;
}

const OFFER_TIMEOUT_MS = 15_000;
const ICE_TIMEOUT_MS = 20_000;

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
  const [phase, setPhase] = useState<P2PPhase>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const adminIdRef = useRef(adminId);
  const controlEnabledRef = useRef(controlEnabled);
  const remoteDescriptionSetRef = useRef(false);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const offerReceivedRef = useRef(false);
  const connectedRef = useRef(false);
  const requestCountRef = useRef(0);
  const failedRef = useRef(false);

  useEffect(() => {
    adminIdRef.current = adminId;
  }, [adminId]);

  useEffect(() => {
    controlEnabledRef.current = controlEnabled;
  }, [controlEnabled]);

  const setPhaseStatus = useCallback((next: P2PPhase, message: string) => {
    setPhase(next);
    setStatusMessage(message);
  }, []);

  const cleanup = useCallback(async () => {
    dataChannelRef.current?.close();
    dataChannelRef.current = null;

    pcRef.current?.close();
    pcRef.current = null;

    if (channelRef.current) {
      await unsubscribeChannel(channelRef.current);
      channelRef.current = null;
    }

    remoteDescriptionSetRef.current = false;
    pendingIceRef.current = [];
    offerReceivedRef.current = false;
    connectedRef.current = false;
    requestCountRef.current = 0;
    failedRef.current = false;

    setStream(null);
    setConnectionState("idle");
    setPhase("idle");
    setStatusMessage("");
  }, []);

  const flushPendingIce = useCallback(async (pc: RTCPeerConnection) => {
    const pending = pendingIceRef.current;
    pendingIceRef.current = [];
    for (const candidate of pending) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn("[P2P Viewer] Failed to add queued ICE candidate:", err);
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled || !userId || !adminId) {
      void cleanup();
      return;
    }

    let cancelled = false;
    let requestInterval: ReturnType<typeof setInterval> | null = null;
    let offerTimer: ReturnType<typeof setTimeout> | null = null;
    let iceTimer: ReturnType<typeof setTimeout> | null = null;

    const fail = (message: string) => {
      if (cancelled || failedRef.current) return;
      failedRef.current = true;
      setError(message);
      setPhaseStatus("failed", message);
      setConnectionState("failed");
      if (requestInterval) {
        clearInterval(requestInterval);
        requestInterval = null;
      }
      if (offerTimer) {
        clearTimeout(offerTimer);
        offerTimer = null;
      }
      if (iceTimer) {
        clearTimeout(iceTimer);
        iceTimer = null;
      }
    };

    const handleSignalingEvent = async (
      event: string,
      payload: SignalingPayload,
    ) => {
      if (payload.adminId !== adminIdRef.current) return;

      const pc = pcRef.current;
      const channel = channelRef.current;
      if (!pc || !channel) return;

      try {
        if (event === "sdp-offer" && payload.sdp) {
          if (remoteDescriptionSetRef.current) return;

          offerReceivedRef.current = true;
          if (requestInterval) {
            clearInterval(requestInterval);
            requestInterval = null;
          }
          if (offerTimer) {
            clearTimeout(offerTimer);
            offerTimer = null;
          }

          setPhaseStatus("answering", "Agent offer received — creating answer…");

          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          remoteDescriptionSetRef.current = true;
          await flushPendingIce(pc);

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

          setPhaseStatus(
            "ice",
            "Answer sent — negotiating ICE / peer connection…",
          );

          iceTimer = setTimeout(() => {
            if (cancelled || connectedRef.current || failedRef.current) return;
            fail(
              `Peer connection did not complete within ${ICE_TIMEOUT_MS / 1000}s after the offer. ` +
                `Signaling worked, but WebRTC/ICE could not connect (firewall, symmetric NAT, or codec issue).`,
            );
          }, ICE_TIMEOUT_MS);
        } else if (event === "ice-candidate" && payload.candidate) {
          if (!remoteDescriptionSetRef.current) {
            pendingIceRef.current.push(payload.candidate);
            return;
          }
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        }
      } catch (err) {
        console.error("[P2P Viewer] Signaling error:", err);
        fail(err instanceof Error ? err.message : "Signaling failed");
      }
    };

    const start = async () => {
      try {
        setError(null);
        setConnectionState("connecting");
        setPhaseStatus("signaling", "Connecting to signaling channel…");
        remoteDescriptionSetRef.current = false;
        pendingIceRef.current = [];
        offerReceivedRef.current = false;
        connectedRef.current = false;
        requestCountRef.current = 0;
        failedRef.current = false;

        const pc = new RTCPeerConnection(rtcConfig);
        pcRef.current = pc;

        pc.ontrack = (event) => {
          const mediaStream =
            event.streams[0] ?? new MediaStream([event.track]);
          setStream(mediaStream);
          connectedRef.current = true;
          setPhaseStatus("connected", "Video track received");
          if (iceTimer) {
            clearTimeout(iceTimer);
            iceTimer = null;
          }
        };

        pc.onconnectionstatechange = () => {
          const state = pc.connectionState;
          setConnectionState(state);

          if (state === "connected") {
            connectedRef.current = true;
            setPhaseStatus("connected", "Peer connection established");
            setError(null);
            if (iceTimer) {
              clearTimeout(iceTimer);
              iceTimer = null;
            }
          } else if (state === "connecting") {
            setPhaseStatus("ice", "WebRTC connecting…");
          } else if (state === "failed") {
            fail(
              "WebRTC peer connection failed. Often caused by firewall/NAT blocking P2P (STUN only, no TURN).",
            );
          } else if (state === "disconnected") {
            fail("Peer connection disconnected.");
          }
        };

        pc.oniceconnectionstatechange = () => {
          const ice = pc.iceConnectionState;
          if (ice === "checking") {
            setPhaseStatus("ice", "Checking ICE candidates…");
          } else if (ice === "connected" || ice === "completed") {
            connectedRef.current = true;
            setPhaseStatus("connected", `ICE ${ice}`);
          } else if (ice === "failed") {
            fail(
              "ICE negotiation failed. The browser and desktop agent could not find a direct network path.",
            );
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
        setPhaseStatus(
          "waiting-agent",
          `Joined signaling room for “${userId}” — waiting for desktop agent…`,
        );

        const requestStream = () => {
          if (
            cancelled ||
            offerReceivedRef.current ||
            failedRef.current ||
            !channelRef.current
          ) {
            return;
          }
          requestCountRef.current += 1;
          const n = requestCountRef.current;
          setStatusMessage(
            `Waiting for desktop agent… (request #${n}). Is the agent app running & online for “${userId}”?`,
          );
          void broadcastSignalingEvent(channelRef.current, "request-stream", {
            adminId: adminIdRef.current,
          }).catch((err) => {
            console.error("[P2P Viewer] request-stream failed:", err);
          });
        };

        requestStream();
        requestInterval = setInterval(requestStream, 2000);

        offerTimer = setTimeout(() => {
          if (cancelled || offerReceivedRef.current || failedRef.current) return;
          fail(
            `No offer from desktop agent after ${OFFER_TIMEOUT_MS / 1000}s (${requestCountRef.current} requests sent). ` +
              `Confirm the agent is running, logged in as “${userId}”, and rebuilt with the latest signaling fix.`,
          );
        }, OFFER_TIMEOUT_MS);
      } catch (err) {
        console.error("[P2P Viewer] Failed to start:", err);
        const message =
          err instanceof Error ? err.message : "Failed to connect";
        fail(
          message.includes("SUPABASE") || message.includes("Missing")
            ? `Signaling config error: ${message}`
            : message,
        );
      }
    };

    void start();

    return () => {
      cancelled = true;
      if (requestInterval) clearInterval(requestInterval);
      if (offerTimer) clearTimeout(offerTimer);
      if (iceTimer) clearTimeout(iceTimer);
      if (channelRef.current) {
        void broadcastSignalingEvent(channelRef.current, "stop-stream", {
          adminId: adminIdRef.current,
        }).catch(() => {});
      }
      void cleanup();
    };
  }, [
    enabled,
    userId,
    adminId,
    cleanup,
    flushPendingIce,
    setPhaseStatus,
  ]);

  const sendCommand = useCallback((command: RemoteCommand) => {
    const dc = dataChannelRef.current;
    if (!dc || dc.readyState !== "open" || !controlEnabledRef.current) return;
    dc.send(JSON.stringify(command));
  }, []);

  return {
    stream,
    connectionState,
    phase,
    statusMessage,
    error,
    sendCommand,
  };
}
