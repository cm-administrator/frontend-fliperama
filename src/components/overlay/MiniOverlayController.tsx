// MiniOverlayController.tsx (RODA DENTRO DA OVERLAY MINI WINDOW)

import { invoke } from "@tauri-apps/api/core";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import {
  currentMonitor,
  getCurrentWindow,
  PhysicalPosition,
  PhysicalSize,
  primaryMonitor,
  type Monitor,
} from "@tauri-apps/api/window";
import React, { useEffect, useRef, useState } from "react";
import { getStoredOverlayMonitor } from "../../services/monitorStorage";

type ExitMode = "toApp" | "toDesktop";

type Placement =
  | "top"
  | "topLeft"
  | "topRight"
  | "bottom"
  | "bottomLeft"
  | "bottomRight"
  | "right"
  | "left";

type Props = {
  showSeconds: number;
  intervalMinutes?: number;

  width?: number; // largura do mini overlay (em logical px)
  height?: number; // altura do mini overlay (em logical px)
  margin?: number; // margem (em logical px)
  placement?: Placement;

  /**
   * Aplica a classe body.overlay-hidden (CSS já existe no seu projeto)
   * para manter o fundo transparente nesta janela.
   */
  transparentBody?: boolean;

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

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function setTransparentBody(enabled: boolean) {
  document.body.classList.toggle("overlay-hidden", enabled);
  document.documentElement.classList.toggle("overlay-hidden", enabled); // html
}

async function computePhysicalPlacement(opts: {
  placement: Placement;
  widthLogical: number;
  heightLogical: number;
  marginLogical: number;
}) {
  const w = getCurrentWindow();
  const scale = (await safe(w.scaleFactor())) ?? 1;

  const stored = getStoredOverlayMonitor();
  const monitor: Monitor | null = stored
    ? ({
        name: stored.name,
        position: stored.position,
        size: stored.size,
        scaleFactor: stored.scaleFactor,
        workArea: { position: stored.position, size: stored.size }, // ok p/ seu cálculo atual
      } as unknown as Monitor)
    : ((await safe(currentMonitor())) ??
      (await safe(primaryMonitor())) ??
      null);

  // monitor.position/size em Physical (px reais)
  const screenX = monitor?.position?.x ?? 0;
  const screenY = monitor?.position?.y ?? 0;
  const screenW = monitor?.size?.width ?? 1920;
  const screenH = monitor?.size?.height ?? 1080;

  // converte dimensões/margem (logical -> physical)
  const widthPx = Math.max(1, Math.round(opts.widthLogical * scale));
  const heightPx = Math.max(1, Math.round(opts.heightLogical * scale));
  const marginPx = Math.max(0, Math.round(opts.marginLogical * scale));

  const left = screenX + marginPx;
  const top = screenY + marginPx;
  const right = screenX + screenW - widthPx - marginPx;
  const bottom = screenY + screenH - heightPx - marginPx;

  let x = left;
  let y = top;

  switch (opts.placement) {
    case "top":
      x = screenX + Math.floor((screenW - widthPx) / 2);
      y = top;
      break;
    case "bottom":
      x = screenX + Math.floor((screenW - widthPx) / 2);
      y = bottom;
      break;
    case "left":
      x = left;
      y = screenY + Math.floor((screenH - heightPx) / 2);
      break;
    case "right":
      x = right;
      y = screenY + Math.floor((screenH - heightPx) / 2);
      break;
    case "topLeft":
      x = left;
      y = top;
      break;
    case "topRight":
      x = right;
      y = top;
      break;
    case "bottomLeft":
      x = left;
      y = bottom;
      break;
    case "bottomRight":
      x = right;
      y = bottom;
      break;
  }

  // clamp dentro do monitor (physical)
  x = clamp(x, screenX, screenX + screenW - widthPx);
  y = clamp(y, screenY, screenY + screenH - heightPx);

  return { x, y, widthPx, heightPx };
}

export default function MiniOverlayController({
  showSeconds,
  intervalMinutes = 0.5,
  width = 520,
  height = 120,
  margin = 16,
  placement = "top",
  transparentBody = true,
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
    // deixa o fundo transparente nesta janela (se habilitado)
    if (transparentBody) setTransparentBody(true);

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

    const showMiniOverlay = async () => {
      await safe(invoke("save_foreground_window"));

      await safe(w.setAlwaysOnTop(true));
      await safe(w.setDecorations(false));
      await safe(w.setFullscreen(false));

      const p = await computePhysicalPlacement({
        placement,
        widthLogical: width,
        heightLogical: height,
        marginLogical: margin,
      });

      await safe(w.setSize(new PhysicalSize(p.widthPx, p.heightPx)));
      await safe(w.setPosition(new PhysicalPosition(p.x, p.y)));
      await safe(w.setShadow(false));
      await safe(w.show());
      await safe(w.unminimize());

      setVisible(true);
      await raf();
      await raf();
    };

    const hideMiniOverlay = async () => {
      setVisible(false);

      await safe(w.hide());
      await safe(invoke("restore_foreground_window"));

      onHidden?.();
    };

    (async () => {
      await safe(w.hide());

      while (!signal.aborted) {
        const showMs = Math.max(0, Number(showSecondsRef.current) || 0) * 1000;
        const intervalMs =
          Math.max(0, Number(intervalMinutesRef.current) || 0) * 60_000;

        await showMiniOverlay().catch(console.error);
        await sleepAbortable(showMs);
        if (signal.aborted) break;

        await hideMiniOverlay().catch(console.error);
        await sleepAbortable(intervalMs);
      }
    })();

    return () => {
      abort.abort();
      if (transparentBody) setTransparentBody(false);
    };
  }, [height, margin, onHidden, placement, transparentBody, width]);

  const exit = async (mode: ExitMode = "toApp") => {
    abortRef.current?.abort();
    setVisible(false);

    const w = getCurrentWindow();

    await safe(invoke("restore_foreground_window"));
    //setCursorHidden(false);

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
