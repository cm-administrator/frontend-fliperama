// src/services/iniConfig.ts
import { appConfigDir, join } from "@tauri-apps/api/path";
import {
  exists,
  mkdir,
  readTextFile,
  writeTextFile,
} from "@tauri-apps/plugin-fs";

type IniData = Record<string, Record<string, string>>;

function parseIni(text: string): IniData {
  const out: IniData = {};
  let section = "default";
  out[section] = {};

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith(";") || line.startsWith("#")) continue;

    if (line.startsWith("[") && line.endsWith("]")) {
      section = line.slice(1, -1).trim() || "default";
      out[section] ??= {};
      continue;
    }

    const eq = line.indexOf("=");
    if (eq <= 0) continue;

    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();

    out[section] ??= {};
    out[section][key] = value;
  }

  return out;
}

async function ensureIni(): Promise<string> {
  const cfgDir = await appConfigDir();
  const iniPath = await join(cfgDir, "yt-overlay.ini");

  await mkdir(cfgDir, { recursive: true });

  const has = await exists(iniPath);
  if (!has) {
    const defaultIni = `; yt-overlay.ini
;
; Arquivo de configuração do aplicativo.
; Como editar:
; 1) Feche o aplicativo
; 2) Edite e salve este arquivo
; 3) Abra o aplicativo novamente
;
; Comentários começam com ';' ou '#'.

[ads]
; Caminho para o ZIP de anúncios OU para uma PASTA contendo 1+ zips.
; - Se for pasta: o app escolhe automaticamente o zip mais recente pelo NOME.
; - Se for arquivo: o app usa esse zip diretamente.
;
; Recomendação de nome dos zips (ordenável por data):
;   2026-02-03T11-19.zip
; ou 20260203T111900.zip
;
; Exemplos:
; zipPath=C:\\Users\Samuel\\Documents\\ads\\2026-02-03T11-19.zip
; zipPath=C:\\Users\\Samuel\\Documents\\ads\\
zipPath=

[player]
; Intervalo de atualização (em minutos).
; - intervalMinutes=0     -> modo contínuo (não agenda timer; roda conforme a lógica de execução atual do player)
; - intervalMinutes>0     -> roda a cada N minutos (ex.: 0.5 = 30s)
;
; Limites:
; - mínimo: 0.05 (3 segundos)
; - máximo: 1440 (24 horas)
intervalMinutes=0.5
`;
    await writeTextFile(iniPath, defaultIni);
  }

  return iniPath;
}

async function readIni(): Promise<{ iniPath: string; ini: IniData }> {
  const iniPath = await ensureIni();
  const iniText = await readTextFile(iniPath);
  return { iniPath, ini: parseIni(iniText) };
}

function parseNumber(
  raw: string,
  fallback: number,
  opts?: { min?: number; max?: number },
): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  if (opts?.min !== undefined && n < opts.min) return fallback;
  if (opts?.max !== undefined && n > opts.max) return fallback;
  return n;
}

export type AppConfig = {
  iniPath: string;
  adsZipPath: string | null;
  intervalMinutes: number; // sempre retorna um número válido
};

export async function loadAppConfig(): Promise<AppConfig> {
  const { iniPath, ini } = await readIni();

  const adsZipPath = (ini.ads?.zipPath ?? "").trim() || null;

  const raw = (ini.player?.intervalMinutes ?? "").trim();

  const intervalMinutes =
    raw === "0" ? 0 : parseNumber(raw, 0.5, { min: 0.05, max: 1440 });
  return { iniPath, adsZipPath, intervalMinutes };
}

export async function requireAdsZipPath(): Promise<string> {
  const cfg = await loadAppConfig();
  if (!cfg.adsZipPath) {
    throw new Error(
      `zipPath não configurado. Edite o arquivo:\n${cfg.iniPath}\n\n` +
        `Na seção [ads], informe zipPath=...`,
    );
  }
  return cfg.adsZipPath;
}
