/* eslint-disable react-refresh/only-export-components */
import { invoke } from "@tauri-apps/api/core";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const DEFAULT_MINUTES_OPTIONS = [5, 10, 15] as const;
const SESSION_STORAGE_KEY = "arcade-play-session";

type SessionStatus = "idle" | "active" | "expired";

type PlaySessionContextValue = {
  status: SessionStatus;
  durationOptionsMinutes: readonly number[];
  selectedDurationMinutes: number | null;
  remainingSeconds: number;
  startSession: (minutes: number) => void;
  resetSession: () => void;
  isSessionActive: boolean;
};

const PlaySessionContext = createContext<PlaySessionContextValue | null>(null);

async function pinMiniOverlayWindow() {
  await invoke("ensure_overlay_mini_window");
  const overlayMini = await WebviewWindow.getByLabel("overlay_mini");

  if (!overlayMini) return;

  await overlayMini.setAlwaysOnTop(true);
  await overlayMini.show();
  await overlayMini.unminimize();
}

async function closeMiniOverlayWindow() {
  await invoke("close_overlay_mini_window");
}

export function PlaySessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [selectedDurationMinutes, setSelectedDurationMinutes] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const isSessionActive = status === "active" && remainingSeconds > 0;
  const isMiniOverlayWindow = window.location.pathname === "/player-mini";

  const startSession = useCallback((minutes: number) => {
    if (!Number.isFinite(minutes) || minutes <= 0) return;

    setSelectedDurationMinutes(minutes);
    setRemainingSeconds(minutes * 60);
    setStatus("active");
  }, []);

  const resetSession = useCallback(() => {
    setStatus("idle");
    setRemainingSeconds(0);
    setSelectedDurationMinutes(null);
  }, []);

  useEffect(() => {
    if (isMiniOverlayWindow) return;
    if (status !== "active") return;

    const timer = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setStatus("expired");
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isMiniOverlayWindow, status]);

  useEffect(() => {
    if (isMiniOverlayWindow) return;

    if (isSessionActive) {
      localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({
          remainingSeconds,
          selectedDurationMinutes,
          status,
          updatedAt: Date.now(),
        }),
      );
      return;
    }

    localStorage.removeItem(SESSION_STORAGE_KEY);
  }, [isMiniOverlayWindow, isSessionActive, remainingSeconds, selectedDurationMinutes, status]);

  useEffect(() => {
    if (isMiniOverlayWindow) return;

    if (isSessionActive) {
      pinMiniOverlayWindow().catch(() => {
        // ambiente web/dev sem runtime tauri
      });
      return;
    }

    closeMiniOverlayWindow().catch(() => {
      // ambiente web/dev sem runtime tauri
    });
  }, [isMiniOverlayWindow, isSessionActive]);

  useEffect(() => {
    if (isMiniOverlayWindow || !isSessionActive) return;

    const repin = () => {
      pinMiniOverlayWindow().catch(() => {
        // ambiente web/dev sem runtime tauri
      });
    };

    const timer = window.setInterval(repin, 1500);
    window.addEventListener("focus", repin);
    document.addEventListener("visibilitychange", repin);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", repin);
      document.removeEventListener("visibilitychange", repin);
    };
  }, [isMiniOverlayWindow, isSessionActive]);

  const value = useMemo<PlaySessionContextValue>(
    () => ({
      status,
      durationOptionsMinutes: DEFAULT_MINUTES_OPTIONS,
      selectedDurationMinutes,
      remainingSeconds,
      startSession,
      resetSession,
      isSessionActive,
    }),
    [isSessionActive, remainingSeconds, resetSession, selectedDurationMinutes, startSession, status],
  );

  return (
    <PlaySessionContext.Provider value={value}>{children}</PlaySessionContext.Provider>
  );
}

export function usePlaySession() {
  const context = useContext(PlaySessionContext);

  if (!context) {
    throw new Error("usePlaySession must be used within PlaySessionProvider");
  }

  return context;
}
