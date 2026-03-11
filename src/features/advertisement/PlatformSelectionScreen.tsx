import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHyperspinTheme } from "../../app/provider/HyperspinThemeProvider";
import {
  listHyperspinPlatforms,
  type HyperspinPlatformTheme,
} from "../../services/hyperspinPlatformThemesService";
import { HyperspinThemePreview } from "./HyperspinThemePreview";

type PlatformSelectionScreenProps = {
  visible?: boolean;
  onSelectPlatform: (platform: HyperspinPlatformTheme) => void | Promise<void>;
};

function PlatformBackground({
  platform,
}: {
  platform: HyperspinPlatformTheme | null;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !platform?.videoUrl) return;

    video.load();
    void video.play().catch(() => {});
  }, [platform?.videoUrl]);

  if (!platform) {
    return <div className="absolute inset-0 bg-black" />;
  }

  if (platform.videoUrl) {
    return (
      <video
        ref={videoRef}
        key={platform.videoUrl}
        src={platform.videoUrl}
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        // muted
        loop
        playsInline
        controls={false}
      />
    );
  }

  if (platform.wheelImageUrl) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        <img
          src={platform.wheelImageUrl}
          alt={platform.name}
          className="max-h-[70%] max-w-[70%] object-contain opacity-90"
          draggable={false}
        />
      </div>
    );
  }

  return <div className="absolute inset-0 bg-black" />;
}

export function PlatformSelectionScreen({
  visible = true,
  onSelectPlatform,
}: PlatformSelectionScreenProps) {
  const { loadThemeFromZip, clearTheme } = useHyperspinTheme();

  const [platforms, setPlatforms] = useState<HyperspinPlatformTheme[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loadingPlatforms, setLoadingPlatforms] = useState(false);
  const [platformsError, setPlatformsError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchVisible, setSearchVisible] = useState(false);

  const wheelContainerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const filteredPlatforms = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return platforms;
    }

    return platforms.filter((platform) =>
      platform.name.toLowerCase().includes(normalizedSearch),
    );
  }, [platforms, searchTerm]);

  const selectedPlatform = useMemo(() => {
    if (filteredPlatforms.length === 0) return null;
    return (
      filteredPlatforms[
        Math.min(selectedIndex, filteredPlatforms.length - 1)
      ] ?? null
    );
  }, [filteredPlatforms, selectedIndex]);

  const visibleWheelItems = useMemo(() => {
    return filteredPlatforms
      .map((platform, index) => ({
        platform,
        index,
        offset: index - selectedIndex,
      }))
      .filter((item) => Math.abs(item.offset) <= 4);
  }, [filteredPlatforms, selectedIndex]);

  const loadPlatforms = useCallback(async () => {
    setLoadingPlatforms(true);
    setPlatformsError(null);

    try {
      const items = await listHyperspinPlatforms();
      setPlatforms(items);
      setSelectedIndex(0);
    } catch (error) {
      console.error("Erro real ao ler plataformas do HyperSpin:", error);
      setPlatforms([]);
      setPlatformsError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoadingPlatforms(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    void loadPlatforms();
  }, [visible, loadPlatforms]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm]);

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

    if (searchVisible) {
      searchInputRef.current?.focus();
    }
  }, [visible, searchVisible]);

  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase() ?? "";
      const isTypingField =
        tagName === "input" ||
        tagName === "textarea" ||
        target?.isContentEditable === true;

      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "f") {
        event.preventDefault();
        event.stopPropagation();

        invoke("quit_app").catch((error) => {
          console.error("Erro ao encerrar aplicação:", error);
        });

        return;
      }

      if (event.key === "/") {
        if (isTypingField) return;

        event.preventDefault();
        setSearchVisible(true);
        return;
      }

      if (event.key === "Escape") {
        if (searchVisible || searchTerm) {
          event.preventDefault();
          setSearchVisible(false);
          setSearchTerm("");
          return;
        }
      }

      if (filteredPlatforms.length === 0) return;

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((currentIndex) =>
          currentIndex <= 0 ? filteredPlatforms.length - 1 : currentIndex - 1,
        );
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((currentIndex) =>
          currentIndex >= filteredPlatforms.length - 1 ? 0 : currentIndex + 1,
        );
        return;
      }

      if (event.key === "Enter" && selectedPlatform && !isTypingField) {
        event.preventDefault();
        void onSelectPlatform(selectedPlatform);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    visible,
    filteredPlatforms.length,
    selectedPlatform,
    onSelectPlatform,
    searchVisible,
    searchTerm,
  ]);

  if (!visible) return null;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black text-white">
      <PlatformBackground platform={selectedPlatform} />

      <div className="absolute inset-0">
        <HyperspinThemePreview transparentBackground />
      </div>

      <div className="pointer-events-none absolute inset-0  from-black/30 via-transparent to-black/30" />
      <div className="pointer-events-none absolute inset-0  from-black/45 via-transparent to-black/20" />

      <div className="absolute left-6 top-6 z-30 rounded-md bg-black/45 px-3 py-2 text-xs text-zinc-300 backdrop-blur-sm">
        Enter seleciona • / filtra • Esc limpa filtro • Ctrl+Shift+F encerra
      </div>

      {searchVisible ? (
        <div className="absolute left-1/2 top-6 z-40 -translate-x-1/2">
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Filtrar plataforma..."
            className="w-full rounded-xl border border-zinc-700 bg-black/75 px-4 py-3 text-sm text-white outline-none backdrop-blur-md placeholder:text-zinc-500 focus:border-zinc-500"
          />
        </div>
      ) : null}

      {loadingPlatforms ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center text-sm text-zinc-300">
          Lendo plataformas...
        </div>
      ) : platformsError ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center px-6 text-center text-sm text-red-500">
          {platformsError}
        </div>
      ) : filteredPlatforms.length === 0 ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center px-6 text-center text-sm text-zinc-400">
          {searchTerm.trim()
            ? "Nenhuma plataforma encontrada para esse filtro."
            : "Nenhuma plataforma encontrada."}
        </div>
      ) : (
        <div
          ref={wheelContainerRef}
          className="absolute left-[6%] top-1/2 z-30 flex w-[34%] -translate-y-1/2 flex-col items-start justify-center"
        >
          {visibleWheelItems.map(({ platform, offset }) => {
            const absOffset = Math.abs(offset);
            const isSelected = offset === 0;

            const translateY = offset * 92;
            const translateX =
              offset === 0 ? 0 : offset < 0 ? absOffset * 14 : absOffset * 18;

            const scale =
              absOffset === 0
                ? 1
                : absOffset === 1
                  ? 0.82
                  : absOffset === 2
                    ? 0.66
                    : absOffset === 3
                      ? 0.54
                      : 0.42;

            const opacity =
              absOffset === 0
                ? 1
                : absOffset === 1
                  ? 0.72
                  : absOffset === 2
                    ? 0.46
                    : absOffset === 3
                      ? 0.28
                      : 0.16;

            return (
              <button
                key={platform.themeZipPath}
                type="button"
                onClick={() => void onSelectPlatform(platform)}
                className="absolute left-0 origin-left text-left transition-all duration-200 ease-out"
                style={{
                  transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
                  opacity,
                  zIndex: 100 - absOffset,
                }}
              >
                <div className="flex items-center gap-3">
                  {isSelected ? (
                    <div className="h-9 w-1.5 rounded-full bg-white/90 shadow-[0_0_18px_rgba(255,255,255,0.45)]" />
                  ) : (
                    <div className="h-9 w-1.5 rounded-full bg-transparent" />
                  )}

                  <div
                    className={[
                      " truncate font-black uppercase tracking-wide transition-all",
                      isSelected
                        ? "text-5xl text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.18)]"
                        : absOffset === 1
                          ? "text-3xl text-zinc-200"
                          : absOffset === 2
                            ? "text-2xl text-zinc-300"
                            : "text-xl text-zinc-400",
                    ].join(" ")}
                  >
                    {platform.name}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
