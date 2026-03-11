import { invoke } from "@tauri-apps/api/core";
import { getPlatformRuntimeConfig } from "./platformRuntimeConfig";

export async function launchSelectedGame(params: {
  platformName: string;
  romName: string;
}) {
  const runtimeConfig = await getPlatformRuntimeConfig(params.platformName);

  if (runtimeConfig.launchProfile !== "mame") {
    throw new Error(
      `Perfil de execução não suportado para a plataforma: ${params.platformName}`,
    );
  }

  console.log("launchSelectedGame", {
    platformName: params.platformName,
    emulatorPath: runtimeConfig.emulatorPath,
    romsDir: runtimeConfig.romsDir,
    romName: params.romName,
  });

  await invoke("launch_mame", {
    mamePath: runtimeConfig.emulatorPath,
    romName: params.romName,
    romsDir: runtimeConfig.romsDir,
  });
}
