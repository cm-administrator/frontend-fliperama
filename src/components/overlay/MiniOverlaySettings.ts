export type MiniPlacement =
  | "top"
  | "topLeft"
  | "topRight"
  | "bottom"
  | "bottomLeft"
  | "bottomRight"
  | "right"
  | "left";

const MINI_HEIGHT_KEY = "mini-overlay-height";
const MINI_PLACEMENT_KEY = "mini-overlay-placement";

export const MINI_DEFAULT_HEIGHT = 250;
export const MINI_DEFAULT_PLACEMENT: MiniPlacement = "topRight";

export function getStoredMiniHeight(): number {
  const raw = localStorage.getItem(MINI_HEIGHT_KEY);
  const n = raw ? Number(raw) : NaN;
  // limites opcionais para evitar valores absurdos
  if (!Number.isFinite(n) || n <= 0) return MINI_DEFAULT_HEIGHT;
  return Math.round(n);
}

export function setStoredMiniHeight(height: number) {
  localStorage.setItem(MINI_HEIGHT_KEY, String(Math.round(height)));
}

export function getStoredMiniPlacement(): MiniPlacement {
  const raw = localStorage.getItem(MINI_PLACEMENT_KEY);
  const allowed: MiniPlacement[] = [
    "top",
    "topLeft",
    "topRight",
    "bottom",
    "bottomLeft",
    "bottomRight",
    "right",
    "left",
  ];
  return allowed.includes(raw as MiniPlacement)
    ? (raw as MiniPlacement)
    : MINI_DEFAULT_PLACEMENT;
}

export function setStoredMiniPlacement(p: MiniPlacement) {
  localStorage.setItem(MINI_PLACEMENT_KEY, p);
}
