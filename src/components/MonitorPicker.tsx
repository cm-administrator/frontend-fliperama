// src/components/monitors/MonitorPicker.tsx
import type { Monitor } from "@tauri-apps/api/window";
import { useMemo } from "react";
import { monitorId } from "../services/monitorStorage";

type Props = {
  monitors: Monitor[];
  selectedId: string | null;
  onSelect: (monitor: Monitor) => void;
  height?: number; // px
  width?: number;  // px (opcional, se quiser travar)
};

export function MonitorPicker({
  monitors,
  selectedId,
  onSelect,
  height = 220,
  width,
}: Props) {
  const layout = useMemo(() => {
    if (monitors.length === 0) return null;

    const minX = Math.min(...monitors.map((m) => m.position.x));
    const minY = Math.min(...monitors.map((m) => m.position.y));
    const maxX = Math.max(...monitors.map((m) => m.position.x + m.size.width));
    const maxY = Math.max(...monitors.map((m) => m.position.y + m.size.height));

    const worldW = Math.max(1, maxX - minX);
    const worldH = Math.max(1, maxY - minY);

    const padding = 12;

    return { minX, minY, worldW, worldH, padding };
  }, [monitors]);

  if (!layout) {
    return (
      <div className="rounded border p-3 text-sm text-muted-foreground">
        Nenhum monitor detectado.
      </div>
    );
  }

  // Viewport (caixa visível)
  const viewH = height;
  const viewW = width ?? 360; // escolha um padrão estável (ou passe por props)

  // Scale que respeita altura E largura disponíveis
  const usableW = Math.max(1, viewW - layout.padding * 2);
  const usableH = Math.max(1, viewH - layout.padding * 2);
  const scale = Math.min(usableW / layout.worldW, usableH / layout.worldH);

  // Tamanho real do stage (mundo escalado)
  const stageW = layout.worldW * scale;
  const stageH = layout.worldH * scale;

  return (
    <div
      className="rounded border bg-background"
      style={{
        height: viewH,
        width: viewW,
      }}
    >
      {/* Centraliza o stage dentro do viewport */}
      <div
        className="h-full w-full"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: layout.padding,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            position: "relative",
            width: stageW,
            height: stageH,
          }}
        >
          {monitors.map((m, idx) => {
            const id = monitorId(m);

            // Coordenadas relativas ao "mundo"
            const relX = m.position.x - layout.minX;
            const relY = m.position.y - layout.minY;

            const x = relX * scale;
            const y = relY * scale;
            const w = Math.max(18, m.size.width * scale);
            const h = Math.max(18, m.size.height * scale);

            const selected = selectedId === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelect(m)}
                title={m.name ?? `Monitor ${idx + 1}`}
                style={{
                  position: "absolute",
                  left: x,
                  top: y,
                  width: w,
                  height: h,
                }}
                className={[
                  "rounded border text-xs",
                  "flex items-center justify-center",
                  selected
                    ? "border-primary ring-2 ring-primary/40"
                    : "border-input hover:border-primary/70",
                ].join(" ")}
              >
                <span className="text-base font-semibold">{idx + 1}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}