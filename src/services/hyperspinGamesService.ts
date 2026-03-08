import { convertFileSrc } from "@tauri-apps/api/core";
import { join } from "@tauri-apps/api/path";
import { readDir, readTextFile } from "@tauri-apps/plugin-fs";
import { getPlatformRuntimeConfig } from "./platformRuntimeConfig";

export type HyperspinGame = {
  name: string;
  description: string;
  manufacturer: string | null;
  year: string | null;
  genre: string | null;
  wheelImagePath: string | null;
  wheelImageUrl: string | null;
  videoPath: string | null;
  videoUrl: string | null;
};

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif"];
const VIDEO_EXTENSIONS = [".mp4", ".webm", ".m4v", ".mov", ".avi", ".flv"];

function getTextContent(parent: Element, tagName: string): string | null {
  const element = parent.getElementsByTagName(tagName)[0];
  const value = element?.textContent?.trim();

  return value ? value : null;
}

function sortGames(
  firstItem: HyperspinGame,
  secondItem: HyperspinGame,
): number {
  return firstItem.description.localeCompare(
    secondItem.description,
    undefined,
    {
      sensitivity: "base",
      numeric: true,
    },
  );
}

function removeExtension(fileName: string): string {
  return fileName.replace(/\.[^.]+$/i, "").trim();
}

function normalizeMediaKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\.[^.]+$/i, "")
    .replace(/[^\w\s()-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizeRomKey(value: string): string {
  return value.trim().toLowerCase();
}

async function buildMediaMap(
  directoryPath: string,
  allowedExtensions: string[],
): Promise<Map<string, string>> {
  const entries = await readDir(directoryPath);
  const mediaMap = new Map<string, string>();

  for (const entry of entries) {
    if (!entry.isFile || !entry.name) continue;

    const lowerName = entry.name.toLowerCase();
    const hasAllowedExtension = allowedExtensions.some((extension) =>
      lowerName.endsWith(extension),
    );

    if (!hasAllowedExtension) continue;

    const absolutePath = await join(directoryPath, entry.name);
    const key = normalizeMediaKey(removeExtension(entry.name));

    if (!mediaMap.has(key)) {
      mediaMap.set(key, absolutePath);
    }
  }

  return mediaMap;
}

async function buildRomMap(
  romsDir: string,
  acceptedRomExtensions: string[],
): Promise<Map<string, string>> {
  const entries = await readDir(romsDir);
  const romMap = new Map<string, string>();

  for (const entry of entries) {
    if (!entry.isFile || !entry.name) continue;

    const lowerName = entry.name.toLowerCase();
    const hasAcceptedExtension = acceptedRomExtensions.some((extension) =>
      lowerName.endsWith(extension),
    );

    if (!hasAcceptedExtension) continue;

    const absolutePath = await join(romsDir, entry.name);
    const key = normalizeRomKey(removeExtension(entry.name));

    if (!romMap.has(key)) {
      romMap.set(key, absolutePath);
    }
  }

  return romMap;
}

export async function listHyperspinGames(params: {
  hyperspinBasePath: string;
  mediaBasePath: string;
  platformName: string;
}): Promise<HyperspinGame[]> {
  const { hyperspinBasePath, mediaBasePath, platformName } = params;

  const runtimeConfig = getPlatformRuntimeConfig(platformName);

  const databaseXmlPath = await join(
    hyperspinBasePath,
    "Databases",
    platformName,
    `${platformName}.xml`,
  );

  const xmlContent = await readTextFile(databaseXmlPath);

  const parser = new DOMParser();
  const document = parser.parseFromString(xmlContent, "application/xml");
  const parseError = document.querySelector("parsererror");

  if (parseError) {
    throw new Error(`Falha ao interpretar XML da plataforma: ${platformName}`);
  }

  const wheelDir = await join(mediaBasePath, platformName, "Images", "Wheel");
  const videoDir = await join(mediaBasePath, platformName, "Video");

  let wheelMap = new Map<string, string>();
  let videoMap = new Map<string, string>();

  try {
    wheelMap = await buildMediaMap(wheelDir, IMAGE_EXTENSIONS);
  } catch (error) {
    console.warn("Não foi possível ler a pasta Wheel:", wheelDir, error);
  }

  try {
    videoMap = await buildMediaMap(videoDir, VIDEO_EXTENSIONS);
  } catch (error) {
    console.warn("Não foi possível ler a pasta Video:", videoDir, error);
  }

  const romMap = await buildRomMap(
    runtimeConfig.romsDir,
    runtimeConfig.acceptedRomExtensions,
  );

  const gameElements = Array.from(document.getElementsByTagName("game"));
  const games: HyperspinGame[] = [];

  for (const gameElement of gameElements) {
    const rawName = gameElement.getAttribute("name")?.trim();

    if (!rawName) continue;

    const romKey = normalizeRomKey(rawName);
    const romExists = romMap.has(romKey);

    if (!romExists) {
      continue;
    }

    const description = getTextContent(gameElement, "description") ?? rawName;
    const manufacturer = getTextContent(gameElement, "manufacturer");
    const year = getTextContent(gameElement, "year");
    const genre = getTextContent(gameElement, "genre");

    const mediaKey = normalizeMediaKey(rawName);

    const wheelImagePath = wheelMap.get(mediaKey) ?? null;
    const videoPath = videoMap.get(mediaKey) ?? null;

    games.push({
      name: rawName,
      description,
      manufacturer,
      year,
      genre,
      wheelImagePath,
      wheelImageUrl: wheelImagePath ? convertFileSrc(wheelImagePath) : null,
      videoPath,
      videoUrl: videoPath ? convertFileSrc(videoPath) : null,
    });
  }

  return games.sort(sortGames);
}
