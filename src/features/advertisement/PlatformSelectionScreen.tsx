import { useCallback, useEffect, useMemo, useState } from "react";
import {
  listHyperspinPlatforms,
  type HyperspinPlatformTheme,
} from "../../services/hyperspinPlatformThemesService";
import { useHyperspinTheme } from "../../app/provider/HyperspinThemeProvider";
import { HyperspinThemePreview } from "./HyperspinThemePreview";

type PlatformSelectionScreenProps = {
  themesBasePath: string;
  visible?: boolean;
  onSelectPlatform: (platform: HyperspinPlatformTheme) => void | Promise<void>;
};

export function PlatformSelectionScreen({
  themesBasePath,
  visible = true,
  onSelectPlatform,
}: PlatformSelectionScreenProps) {
  const { loadThemeFromZip, clearTheme } = useHyperspinTheme();

  const [platforms, setPlatforms] = useState<HyperspinPlatformTheme[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loadingPlatforms, setLoadingPlatforms] = useState(false);
  const [platformsError, setPlatformsError] = useState<string | null>(null);

  const selectedPlatform = useMemo(() => {
    if (platforms.length === 0) return null;
    return platforms[Math.min(selectedIndex, platforms.length - 1)] ?? null;
  }, [platforms, selectedIndex]);

  const loadPlatforms = useCallback(async () => {
    setLoadingPlatforms(true);
    setPlatformsError(null);

    try {
      const items = await listHyperspinPlatforms(themesBasePath);
      setPlatforms(items);
      setSelectedIndex(0);
    } catch (error) {
      console.error("Erro real ao ler plataformas do HyperSpin:", error);
      setPlatforms([]);
      setPlatformsError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoadingPlatforms(false);
    }
  }, [themesBasePath]);

  useEffect(() => {
    if (!visible) return;
    void loadPlatforms();
  }, [visible, loadPlatforms]);

  useEffect(() => {
    if (!visible) return;

    if (!selectedPlatform) {
      clearTheme();
      return;
    }

    void loadThemeFromZip(selectedPlatform.themeZipPath);
  }, [visible, selectedPlatform, loadThemeFromZip, clearTheme]);

  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (platforms.length === 0) return;

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((currentIndex) =>
          currentIndex <= 0 ? platforms.length - 1 : currentIndex - 1,
        );
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((currentIndex) =>
          currentIndex >= platforms.length - 1 ? 0 : currentIndex + 1,
        );
        return;
      }

      if (event.key === "Enter" && selectedPlatform) {
        event.preventDefault();
        void onSelectPlatform(selectedPlatform);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [visible, platforms.length, selectedPlatform, onSelectPlatform]);

  if (!visible) return null;

  return (
    <div className="grid h-screen w-screen grid-cols-[360px_1fr] overflow-hidden bg-zinc-950 text-white">
      <aside className="flex h-full flex-col border-r border-zinc-800 bg-zinc-900">
        <div className="border-b border-zinc-800 px-5 py-4">
          <h1 className="text-lg font-semibold">Escolha a plataforma</h1>
          <p className="mt-1 text-sm text-zinc-400">{themesBasePath}</p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loadingPlatforms ? (
            <div className="px-5 py-4 text-sm text-zinc-400">
              Lendo plataformas...
            </div>
          ) : platformsError ? (
            <div className="px-5 py-4 text-sm text-red-500">
              {platformsError}
            </div>
          ) : platforms.length === 0 ? (
            <div className="px-5 py-4 text-sm text-zinc-500">
              Nenhuma plataforma encontrada.
            </div>
          ) : (
            <ul className="py-2">
              {platforms.map((platform, index) => {
                const isSelected = index === selectedIndex;

                return (
                  <li key={platform.themeZipPath}>
                    <button
                      type="button"
                      onMouseEnter={() => setSelectedIndex(index)}
                      onClick={() => void onSelectPlatform(platform)}
                      className={[
                        "flex w-full items-center justify-between px-5 py-3 text-left transition-colors",
                        isSelected
                          ? "bg-zinc-800 text-white"
                          : "text-zinc-300 hover:bg-zinc-800/60",
                      ].join(" ")}
                    >
                      <span className="truncate">{platform.name}</span>
                      {isSelected ? (
                        <span className="ml-3 text-xs text-zinc-400">
                          Enter
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      <main className="h-full w-full bg-black">
        <HyperspinThemePreview />
      </main>
    </div>
  );
}
