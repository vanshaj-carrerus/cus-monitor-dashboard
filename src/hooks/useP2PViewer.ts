"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  broadcastSignalingEvent,
  getUserRoomChannelName,
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
const LOG = "[P2P Viewer]";

function log(...args: unknown[]) {
  console.log(LOG, ...args);
}

function logWarn(...args: unknown[]) {
  console.warn(LOG, ...args);
}

function logError(...args: unknown[]) {
  console.error(LOG, ...args);
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
  const iceCandidateCountRef = useRef({ local: 0, remote: 0 });

  useEffect(() => {
    adminIdRef.current = adminId;
  }, [adminId]);

  useEffect(() => {
    controlEnabledRef.current = controlEnabled;
  }, [controlEnabled]);

  // If control is enabled after connect, ensure a data channel exists.
  useEffect(() => {
    if (!enabled || !controlEnabled) return;
    const pc = pcRef.current;
    if (!pc || pc.connectionState !== "connected") return;
    const existing = dataChannelRef.current;
    if (
      existing &&
      (existing.readyState === "open" || existing.readyState === "connecting")
    ) {
      return;
    }
    log("creating data channel remote-control (control enabled mid-session)");
    const dc = pc.createDataChannel("remote-control", { ordered: true });
    dc.onopen = () => log("datachannel open (mid-session)");
    dc.onclose = () => log("datachannel closed (mid-session)");
    dc.onerror = (ev) => logError("datachannel error (mid-session)", ev);
    dataChannelRef.current = dc;
  }, [enabled, controlEnabled, connectionState]);

  const setPhaseStatus = useCallback((next: P2PPhase, message: string) => {
    log(`phase → ${next}:`, message);
    setPhase(next);
    setStatusMessage(message);
  }, []);

  const cleanup = useCallback(async () => {
    log("cleanup()");
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
    iceCandidateCountRef.current = { local: 0, remote: 0 };

    setStream(null);
    setConnectionState("idle");
    setPhase("idle");
    setStatusMessage("");
  }, []);

  const flushPendingIce = useCallback(async (pc: RTCPeerConnection) => {
    const pending = pendingIceRef.current;
    pendingIceRef.current = [];
    log(`flushing ${pending.length} queued remote ICE candidate(s)`);
    for (const candidate of pending) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        logWarn("Failed to add queued ICE candidate:", err);
      }
    }
  }, []);

  useEffect(() => {
    log("effect deps", { enabled, userId, adminId, controlEnabled });

    if (!enabled || !userId || !adminId) {
      log("skip start — missing enabled/userId/adminId", {
        enabled,
        userId,
        adminId,
      });
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
      logError("FAILED:", message, {
        requestsSent: requestCountRef.current,
        offerReceived: offerReceivedRef.current,
        iceLocal: iceCandidateCountRef.current.local,
        iceRemote: iceCandidateCountRef.current.remote,
        pcState: pcRef.current?.connectionState,
        iceState: pcRef.current?.iceConnectionState,
      });
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
      log("← signaling event", event, {
        adminId: payload.adminId,
        expectedAdminId: adminIdRef.current,
        hasSdp: Boolean(payload.sdp),
        hasCandidate: Boolean(payload.candidate),
        sdpType: payload.sdp?.type,
      });

      if (payload.adminId !== adminIdRef.current) {
        logWarn("ignored event — adminId mismatch", {
          got: payload.adminId,
          expected: adminIdRef.current,
        });
        return;
      }

      const pc = pcRef.current;
      const channel = channelRef.current;
      if (!pc || !channel) {
        logWarn("ignored event — pc/channel not ready");
        return;
      }

      try {
        if (event === "sdp-offer" && payload.sdp) {
          if (remoteDescriptionSetRef.current) {
            logWarn("duplicate sdp-offer ignored");
            return;
          }

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
          log("setRemoteDescription(offer)", {
            type: payload.sdp.type,
            sdpLength: payload.sdp.sdp?.length ?? 0,
          });

          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          remoteDescriptionSetRef.current = true;
          await flushPendingIce(pc);

          // Always negotiate the data channel up front; commands are gated client-side.
          if (!dataChannelRef.current) {
            log("creating data channel remote-control");
            const dc = pc.createDataChannel("remote-control", { ordered: true });
            dc.onopen = () => log("datachannel open");
            dc.onclose = () => log("datachannel closed");
            dc.onerror = (ev) => logError("datachannel error", ev);
            dataChannelRef.current = dc;
          }

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          log("→ broadcast sdp-answer", {
            type: answer.type,
            sdpLength: answer.sdp?.length ?? 0,
          });

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
          iceCandidateCountRef.current.remote += 1;
          log(
            `← remote ICE #${iceCandidateCountRef.current.remote}`,
            payload.candidate.candidate?.slice(0, 80),
          );
          if (!remoteDescriptionSetRef.current) {
            pendingIceRef.current.push(payload.candidate);
            log("queued remote ICE (remote description not set yet)");
            return;
          }
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        }
      } catch (err) {
        logError("Signaling handler error:", err);
        fail(err instanceof Error ? err.message : "Signaling failed");
      }
    };

    const start = async () => {
      const room = getUserRoomChannelName(userId);
      log("════════ START P2P SESSION ════════", {
        userId,
        adminId,
        controlEnabled,
        room,
        iceServers: rtcConfig.iceServers,
        offerTimeoutMs: OFFER_TIMEOUT_MS,
        iceTimeoutMs: ICE_TIMEOUT_MS,
      });

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
        iceCandidateCountRef.current = { local: 0, remote: 0 };

        const pc = new RTCPeerConnection(rtcConfig);
        pcRef.current = pc;
        log("RTCPeerConnection created");

        pc.ontrack = (event) => {
          log("ontrack", {
            kind: event.track.kind,
            id: event.track.id,
            streams: event.streams.length,
          });
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
          log("connectionState →", state);
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
              "WebRTC peer connection failed after ICE connected (often DTLS/crypto mismatch between browser and desktop agent).",
            );
          } else if (state === "disconnected") {
            fail("Peer connection disconnected.");
          }
        };

        pc.oniceconnectionstatechange = () => {
          const ice = pc.iceConnectionState;
          log("iceConnectionState →", ice);
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

        pc.onicegatheringstatechange = () => {
          log("iceGatheringState →", pc.iceGatheringState);
        };

        pc.onicecandidate = async (event) => {
          if (!event.candidate) {
            log("local ICE gathering complete (null candidate)");
            return;
          }
          if (!channelRef.current) {
            logWarn("local ICE ready but channel missing");
            return;
          }
          iceCandidateCountRef.current.local += 1;
          log(
            `→ local ICE #${iceCandidateCountRef.current.local}`,
            event.candidate.candidate?.slice(0, 80),
          );
          await broadcastSignalingEvent(channelRef.current, "ice-candidate", {
            adminId: adminIdRef.current,
            candidate: event.candidate.toJSON(),
          });
        };

        log("subscribing to signaling channel…");
        const channel = await subscribeToSignalingChannel(
          userId,
          (evt, payload) => {
            void handleSignalingEvent(evt, payload);
          },
        );

        if (cancelled) {
          log("cancelled during subscribe — aborting");
          await unsubscribeChannel(channel);
          pc.close();
          return;
        }

        channelRef.current = channel;
        log("subscribed OK", {
          topic: channel.topic,
          room,
        });
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
          log(`→ broadcast request-stream #${n}`, {
            adminId: adminIdRef.current,
            userId,
            room,
          });
          void broadcastSignalingEvent(channelRef.current, "request-stream", {
            adminId: adminIdRef.current,
          }).catch((err) => {
            logError("request-stream broadcast failed:", err);
          });
        };

        requestStream();
        requestInterval = setInterval(requestStream, 2000);

        offerTimer = setTimeout(() => {
          if (cancelled || offerReceivedRef.current || failedRef.current) return;
          logWarn("offer timeout — never received sdp-offer from agent");
          fail(
            `No offer from desktop agent after ${OFFER_TIMEOUT_MS / 1000}s (${requestCountRef.current} requests sent). ` +
              `Confirm the agent is running, logged in as “${userId}”, and rebuilt with the latest signaling fix.`,
          );
        }, OFFER_TIMEOUT_MS);
      } catch (err) {
        logError("Failed to start:", err);
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
      log("effect cleanup / session end");
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
    controlEnabled,
    cleanup,
    flushPendingIce,
    setPhaseStatus,
  ]);

  const sendCommand = useCallback((command: RemoteCommand) => {
    const dc = dataChannelRef.current;
    if (!dc || dc.readyState !== "open" || !controlEnabledRef.current) {
      if (controlEnabledRef.current) {
        logWarn("sendCommand skipped — datachannel not open", {
          hasDc: Boolean(dc),
          state: dc?.readyState,
          command: command.t,
        });
      }
      return;
    }
    log("→ datachannel command", command.t);
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
