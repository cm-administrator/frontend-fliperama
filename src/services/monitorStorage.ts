// src/app/monitorStorage.ts
import type { Monitor } from "@tauri-apps/api/window";

type StoredMonitor = {
  name: string | null;
  position: { x: number; y: number };
  size: { width: number; height: number };
  scaleFactor: number;
};

const KEY_OVERLAY = "lis.monitor.overlay";

function toStored(m: Monitor): StoredMonitor {
  return {
    name: m.name ?? null,
    position: { x: m.position.x, y: m.position.y },
    size: { width: m.size.width, height: m.size.height },
    scaleFactor: m.scaleFactor,
  };
}

// “id” determinístico (sem depender só do name)
export function monitorId(m: Monitor): string {
  const s = toStored(m);
  return `${s.name ?? "noname"}@${s.position.x},${s.position.y}:${s.size.width}x${s.size.height}:${s.scaleFactor}`;
}

function safeParse(json: string | null): StoredMonitor | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as StoredMonitor;
  } catch {
    return null;
  }
}

export function setStoredOverlayMonitor(m: Monitor) {
  localStorage.setItem(KEY_OVERLAY, JSON.stringify(toStored(m)));
}
export function getStoredOverlayMonitor(): StoredMonitor | null {
  return safeParse(localStorage.getItem(KEY_OVERLAY));
}
