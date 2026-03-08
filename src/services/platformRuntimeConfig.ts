export type PlatformLaunchProfile = "mame";

export type PlatformRuntimeConfig = {
  emulatorPath: string;
  romsDir: string;
  acceptedRomExtensions: string[];
  launchProfile: PlatformLaunchProfile;
};

const DEFAULT_MAME_RUNTIME_CONFIG: PlatformRuntimeConfig = {
  emulatorPath: "E:/HyperSpin_1.5.1/Emulators/MAME/mame.exe",
  romsDir: "E:/HyperSpin_1.5.1/Emulators/MAME/roms",
  acceptedRomExtensions: [".zip", ".7z"],
  launchProfile: "mame",
};

const PLATFORM_RUNTIME_OVERRIDES: Record<string, Partial<PlatformRuntimeConfig>> = {
  // se depois quiser customizar alguma plataforma específica, põe aqui
  // MAME: {},
};

export function getPlatformRuntimeConfig(
  platformName: string,
): PlatformRuntimeConfig {
  const override = PLATFORM_RUNTIME_OVERRIDES[platformName];

  if (!override) {
    return DEFAULT_MAME_RUNTIME_CONFIG;
  }

  return {
    ...DEFAULT_MAME_RUNTIME_CONFIG,
    ...override,
  };
}