import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { HyperspinPlatformTheme } from "../../services/hyperspinPlatformThemesService";
import {
  listHyperspinGames,
  type HyperspinGame,
} from "../../services/hyperspinGamesService";
import { launchSelectedGame } from "../../services/emulatorLauncher";

type GamesPageLocationState = {
  platform: HyperspinPlatformTheme;
};

function GameBackground({ game }: { game: HyperspinGame | null }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !game?.videoUrl) return;

    video.load();
    void video.play().catch(() => {});
  }, [game?.videoUrl]);

  if (!game) {
    return <div className="absolute inset-0 bg-black" />;
  }

  if (game.videoUrl) {
    return (
      <video
        ref={videoRef}
        key={game.videoUrl}
        src={game.videoUrl}
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        // muted
        loop
        playsInline
        controls={false}
      />
    );
  }

  if (game.wheelImageUrl) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        <img
          src={game.wheelImageUrl}
          alt={game.description}
          className="max-h-[70%] max-w-[70%] object-contain opacity-90"
          draggable={false}
        />
      </div>
    );
  }

  return <div className="absolute inset-0 bg-black" />;
}

export function GamesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as GamesPageLocationState | null) ?? null;
  const platform = state?.platform ?? null;

  const [games, setGames] = useState<HyperspinGame[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loadingGames, setLoadingGames] = useState(false);
  const [gamesError, setGamesError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchVisible, setSearchVisible] = useState(false);
  const [launchingGameName, setLaunchingGameName] = useState<string | null>(null);
  const [keyboardUnlockAt, setKeyboardUnlockAt] = useState(0);

  const wheelContainerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handleWindowFocus = () => {
      // Evita que teclas usadas no emulador (ex.: Enter/Esc)
      // disparem ações acidentais ao devolver foco para o app.
      setKeyboardUnlockAt(Date.now() + 450);
    };

    window.addEventListener("focus", handleWindowFocus);
    return () => window.removeEventListener("focus", handleWindowFocus);
  }, []);

  const filteredGames = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return games;
    }

    return games.filter((game) => {
      const haystack = [
        game.description,
        game.name,
        game.manufacturer ?? "",
        game.genre ?? "",
        game.year ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [games, searchTerm]);

  const selectedGame = useMemo(() => {
    if (filteredGames.length === 0) return null;
    return (
      filteredGames[Math.min(selectedIndex, filteredGames.length - 1)] ?? null
    );
  }, [filteredGames, selectedIndex]);

  const visibleWheelItems = useMemo(() => {
    return filteredGames
      .map((game, index) => ({
        game,
        index,
        offset: index - selectedIndex,
      }))
      .filter((item) => Math.abs(item.offset) <= 4);
  }, [filteredGames, selectedIndex]);

  const loadGames = useCallback(async () => {
    if (!platform) return;

    setLoadingGames(true);
    setGamesError(null);

    try {
      const items = await listHyperspinGames({
        hyperspinBasePath: "E:/HyperSpin_1.5.1",
        mediaBasePath: "E:/HyperSpin_1.5.1/Media",
        platformName: platform.name,
      });

      setGames(items);
      setSelectedIndex(0);
    } catch (error) {
      console.error("Erro real ao ler jogos do HyperSpin:", error);
      setGames([]);
      setGamesError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoadingGames(false);
    }
  }, [platform]);

  useEffect(() => {
    void loadGames();
  }, [loadGames]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm]);

  useEffect(() => {
    if (searchVisible) {
      searchInputRef.current?.focus();
    }
  }, [searchVisible]);

  const launchGame = useCallback(
    async (game: HyperspinGame) => {
      if (!platform || launchingGameName) return;

      setLaunchingGameName(game.name);

      const clearLoadingOnBlurOrTimeout = new Promise<void>((resolve) => {
        let done = false;

        const finish = () => {
          if (done) return;
          done = true;
          window.removeEventListener("blur", handleBlur);
          clearTimeout(timer);
          resolve();
        };

        const handleBlur = () => {
          finish();
        };

        const timer = window.setTimeout(finish, 4000);
        window.addEventListener("blur", handleBlur, { once: true });
      });

      try {
        const launchPromise = launchSelectedGame({
          platformName: platform.name,
          romName: game.name,
        });

        // O indicador fica até o jogo realmente iniciar (janela perde foco)
        // ou, no pior caso, até um timeout curto.
        await clearLoadingOnBlurOrTimeout;

        await launchPromise;
      } catch (error) {
        console.error("Erro ao executar jogo:", error);
      } finally {
        setLaunchingGameName(null);
      }
    },
    [launchingGameName, platform],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase() ?? "";
      const isTypingField =
        tagName === "input" ||
        tagName === "textarea" ||
        target?.isContentEditable === true;

      if (event.key === "/") {
        if (isTypingField) return;

        event.preventDefault();
        setSearchVisible(true);
        return;
      }

      if (event.key === "Escape") {
        if (Date.now() < keyboardUnlockAt) {
          event.preventDefault();
          return;
        }

        if (searchVisible || searchTerm) {
          event.preventDefault();
          setSearchVisible(false);
          setSearchTerm("");
          return;
        }

        event.preventDefault();
        navigate(-1);
        return;
      }

      if (event.key === "Enter" && selectedGame && !isTypingField) {
        if (Date.now() < keyboardUnlockAt || event.repeat) {
          event.preventDefault();
          return;
        }

        event.preventDefault();
        void launchGame(selectedGame);
        return;
      }

      if (filteredGames.length === 0) return;

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((currentIndex) =>
          currentIndex <= 0 ? filteredGames.length - 1 : currentIndex - 1,
        );
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((currentIndex) =>
          currentIndex >= filteredGames.length - 1 ? 0 : currentIndex + 1,
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    filteredGames.length,
    navigate,
    platform?.name,
    searchTerm,
    searchVisible,
    selectedGame,
    launchGame,
    keyboardUnlockAt,
  ]);

  if (!platform) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 text-white">
        <div className="text-center">
          <div className="text-lg font-semibold">
            Nenhuma plataforma selecionada
          </div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-4 rounded bg-zinc-800 px-4 py-2 text-sm text-white"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black text-white">
      <GameBackground game={selectedGame} />

      <div className="pointer-events-none absolute inset-0 from-black/30 via-transparent to-black/30" />
      <div className="pointer-events-none absolute inset-0  from-black/55 via-transparent to-black/25" />

      <div className="absolute left-6 top-6 z-30 rounded-md bg-black/45 px-3 py-2 text-xs text-zinc-300 backdrop-blur-sm">
        {platform.name} • Enter inicia • / filtra • Esc volta
      </div>

      {searchVisible ? (
        <div className="absolute left-1/2 top-6 z-40 -translate-x-1/2">
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Filtrar jogo..."
            className="w-full rounded-xl border border-zinc-700 bg-black/75 px-4 py-3 text-sm text-white outline-none backdrop-blur-md placeholder:text-zinc-500 focus:border-zinc-500"
          />
        </div>
      ) : null}

      {launchingGameName ? (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/35 text-base font-semibold text-zinc-100">
          Carregando {launchingGameName}...
        </div>
      ) : null}

      {loadingGames ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center text-sm text-zinc-300">
          Lendo jogos...
        </div>
      ) : gamesError ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center px-6 text-center text-sm text-red-500">
          {gamesError}
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center px-6 text-center text-sm text-zinc-400">
          {searchTerm.trim()
            ? "Nenhum jogo encontrado para esse filtro."
            : "Nenhum jogo encontrado."}
        </div>
      ) : (
        <div
          ref={wheelContainerRef}
          className="absolute left-[6%] top-1/2 z-30 flex w-[40%] -translate-y-1/2 flex-col items-start justify-center"
        >
          {visibleWheelItems.map(({ game, offset }) => {
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
                key={game.name}
                type="button"
                onClick={() => void launchGame(game)}
                disabled={Boolean(launchingGameName)}
                className="absolute left-0 origin-left text-left transition-all duration-200 ease-out disabled:cursor-wait"
                style={{
                  transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
                  opacity,
                  zIndex: 100 - absOffset,
                }}
              >
                <div className="flex items-center gap-3">
                  {isSelected ? (
                    <div className="h-10 w-1.5 rounded-full bg-white/90 shadow-[0_0_18px_rgba(255,255,255,0.45)]" />
                  ) : (
                    <div className="h-10 w-1.5 rounded-full bg-transparent" />
                  )}

                  <div className="min-w-0">
                    <div
                      className={[
                        "truncate font-black uppercase tracking-wide transition-all",
                        isSelected
                          ? "text-5xl text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.18)]"
                          : absOffset === 1
                            ? "text-3xl text-zinc-200"
                            : absOffset === 2
                              ? "text-2xl text-zinc-300"
                              : "text-xl text-zinc-400",
                      ].join(" ")}
                    >
                      {game.description}
                    </div>

                    {isSelected ? (
                      <div className="mt-2 text-sm text-zinc-300">
                        {[game.year, game.manufacturer, game.genre]
                          .filter(Boolean)
                          .join(" • ") || game.name}
                      </div>
                    ) : null}
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
