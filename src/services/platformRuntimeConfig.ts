import { loadRuntimeIniConfig } from "./iniConfig";

export type PlatformLaunchProfile = "mame";

export type PlatformRuntimeConfig = {
  emulatorPath: string;
  romsDir: string;
  acceptedRomExtensions: string[];
  launchProfile: PlatformLaunchProfile;
};

const PLATFORM_RUNTIME_OVERRIDES: Record<
  string,
  Partial<PlatformRuntimeConfig>
> = {
  // se depois quiser customizar alguma plataforma específica, põe aqui
  // MAME: {},
};

export async function getPlatformRuntimeConfig(
  platformName: string,
): Promise<PlatformRuntimeConfig> {
  const iniConfig = await loadRuntimeIniConfig();
  const override = PLATFORM_RUNTIME_OVERRIDES[platformName];

  const baseConfig: PlatformRuntimeConfig = {
    emulatorPath: iniConfig.emulatorPath,
    romsDir: iniConfig.romsDir,
    acceptedRomExtensions: iniConfig.acceptedRomExtensions,
    launchProfile: iniConfig.launchProfile,
  };

  return {
    ...baseConfig,
    ...override,
  };
}
