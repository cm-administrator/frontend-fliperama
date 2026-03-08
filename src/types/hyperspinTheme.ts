export type HyperspinLayerType = "image" | "video" | "flash" | "unknown";

export type HyperspinThemeLayer = {
  id: string;
  name: string;
  type: HyperspinLayerType;
  source: string;
  absolutePath: string;
  url: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  zIndex: number;
  opacity: number;
  visible: boolean;
  loop: boolean;
  rawAttributes: Record<string, string>;
};

export type HyperspinTheme = {
  name: string;
  xmlPath: string;
  baseWidth: number;
  baseHeight: number;
  layers: HyperspinThemeLayer[];
};
