// OverlayController.tsx (RODA DENTRO DA OVERLAY WINDOW)
// Esconde o cursor enquanto o overlay estiver exibido (via CSS body.overlay-cursor-hidden)

import { invoke } from "@tauri-apps/api/core";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import {
  getCurrentWindow,
  PhysicalPosition,
  PhysicalSize,
} from "@tauri-apps/api/window";
import React, { useEffect, useRef, useState } from "react";
import { getStoredOverlayMonitor } from "../../services/monitorStorage";

type ExitMode = "toApp" | "toDesktop";

type Props = {
  showSeconds: number;
  intervalMinutes?: number;
  onHidden?: () => void;
  children: (
    visible: boolean,
    exit: (mode?: ExitMode) => Promise<void>,
  ) => React.ReactNode;
};

function raf(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function safe<T>(p: Promise<T>): Promise<T | undefined> {
  try {
    return await p;
  } catch {
    return undefined;
  }
}

function setCursorHidden(hidden: boolean) {
  document.body.classList.toggle("overlay-cursor-hidden", hidden);
}

export default function OverlayController({
  showSeconds,
  intervalMinutes = 0.5,
  onHidden,
  children,
}: Props) {
  const [visible, setVisible] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const showSecondsRef = useRef(showSeconds);
  const intervalMinutesRef = useRef(intervalMinutes);

  useEffect(() => {
    showSecondsRef.current = showSeconds;
  }, [showSeconds]);

  useEffect(() => {
    intervalMinutesRef.current = intervalMinutes;
  }, [intervalMinutes]);

  useEffect(() => {
    const w = getCurrentWindow();
    const abort = new AbortController();
    abortRef.current = abort;
    const { signal } = abort;

    const sleepAbortable = (ms: number) =>
      new Promise<void>((resolve) => {
        const id = window.setTimeout(resolve, ms);
        signal.addEventListener(
          "abort",
          () => {
            window.clearTimeout(id);
            resolve();
          },
          { once: true },
        );
      });

    const showOverlay = async () => {
      setCursorHidden(true);
      await safe(invoke("save_foreground_window"));

      await safe(w.setAlwaysOnTop(true));
      await safe(w.setDecorations(false));

      const stored = getStoredOverlayMonitor();
      if (stored) {
        await safe(w.setFullscreen(true)); //NÃO COLOCAR ESSE CARALHO COMO FALSE
        await safe(
          w.setSize(new PhysicalSize(stored.size.width, stored.size.height)),
        );
        await safe(
          w.setPosition(
            new PhysicalPosition(stored.position.x, stored.position.y),
          ),
        );
      } else {
        // fallback: mantém seu comportamento
        await safe(w.setFullscreen(true));
      }

      await safe(w.show());
      await safe(w.unminimize());
      setVisible(true);
      await raf();
      await raf();
    };
    const hideOverlay = async () => {
      setVisible(false);

      await safe(w.hide());
      await safe(invoke("restore_foreground_window"));

      // mostra cursor depois de esconder
      setCursorHidden(false);

      onHidden?.();
    };

    (async () => {
      // começa escondida e com cursor visível
      setCursorHidden(false);
      await safe(w.hide());

      while (!signal.aborted) {
        const showMs = Math.max(0, Number(showSecondsRef.current) || 0) * 1000;
        const intervalMs =
          Math.max(0, Number(intervalMinutesRef.current) || 0) * 60_000;

        await showOverlay().catch(console.error);
        await sleepAbortable(showMs);
        if (signal.aborted) break;

        await hideOverlay().catch(console.error);
        await sleepAbortable(intervalMs);
      }
    })();

    return () => {
      abort.abort();
      // cleanup: nunca deixar o cursor “preso” escondido
      setCursorHidden(false);
    };
  }, [onHidden]);

  const exit = async (mode: ExitMode = "toApp") => {
    abortRef.current?.abort();
    setVisible(false);

    const w = getCurrentWindow();

    await safe(invoke("restore_foreground_window"));
    setCursorHidden(false);

    if (mode === "toDesktop") {
      await safe(w.close()); // ✅ fecha de verdade
      return;
    }

    const main = await WebviewWindow.getByLabel("main");
    await main?.show();
    await main?.unminimize();
    await main?.setFocus();

    await safe(w.close()); // ✅ fecha de verdade
  };

  return <>{children(visible, exit)}</>;
}
