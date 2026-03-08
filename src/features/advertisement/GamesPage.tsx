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

function GamePreview({ game }: { game: HyperspinGame | null }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !game?.videoUrl) return;

    video.load();
    void video.play().catch(() => {});
  }, [game?.videoUrl]);

  if (!game) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black text-zinc-500">
        Nenhum jogo encontrado
      </div>
    );
  }

  if (game.videoUrl) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black">
        <video
          ref={videoRef}
          key={game.videoUrl}
          src={game.videoUrl}
          className="h-full w-full object-contain"
          autoPlay
          muted
          loop
          playsInline
          controls={false}
        />
      </div>
    );
  }

  if (game.wheelImageUrl) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black p-8">
        <img
          src={game.wheelImageUrl}
          alt={game.description}
          className="max-h-full max-w-full object-contain"
          draggable={false}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-black p-8 text-center">
      <div>
        <div className="text-3xl font-semibold text-white">
          {game.description}
        </div>
        <div className="mt-3 text-sm text-zinc-400">
          {[game.year, game.manufacturer, game.genre]
            .filter(Boolean)
            .join(" • ") || game.name}
        </div>
      </div>
    </div>
  );
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

  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const searchInputRef = useRef<HTMLInputElement | null>(null);

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
    return filteredGames[Math.min(selectedIndex, filteredGames.length - 1)] ?? null;
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
    if (!selectedGame) return;

    const element = itemRefs.current[selectedGame.name];
    element?.scrollIntoView({
      block: "nearest",
    });
  }, [selectedGame]);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase() ?? "";
      const isTypingField =
        tagName === "input" ||
        tagName === "textarea" ||
        target?.isContentEditable === true;

      if (event.key === "Escape") {
        event.preventDefault();
        navigate(-1);
        return;
      }

      if (event.key === "Enter" && selectedGame && !isTypingField) {
        event.preventDefault();

        launchSelectedGame({
          platformName: platform?.name ?? "",
          romName: selectedGame.name,
        }).catch((error) => {
          console.error("Erro ao executar jogo:", error);
        });

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
  }, [filteredGames.length, navigate, platform?.name, selectedGame]);

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
    <div className="grid h-screen w-screen grid-cols-[420px_1fr] overflow-hidden bg-zinc-950 text-white">
      <aside className="flex h-full flex-col border-r border-zinc-800 bg-zinc-900">
        <div className="border-b border-zinc-800 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold">{platform.name}</h1>
              <p className="mt-1 text-sm text-zinc-400">Escolha um jogo</p>
            </div>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="shrink-0 rounded bg-zinc-800 px-3 py-2 text-sm text-white hover:bg-zinc-700"
            >
              Voltar
            </button>
          </div>

          <div className="mt-4">
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Filtrar por nome..."
              className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-zinc-500"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loadingGames ? (
            <div className="px-5 py-4 text-sm text-zinc-400">
              Lendo jogos...
            </div>
          ) : gamesError ? (
            <div className="px-5 py-4 text-sm text-red-500">{gamesError}</div>
          ) : filteredGames.length === 0 ? (
            <div className="px-5 py-4 text-sm text-zinc-500">
              {searchTerm.trim()
                ? "Nenhum jogo encontrado para esse filtro."
                : "Nenhum jogo encontrado."}
            </div>
          ) : (
            <ul className="py-2">
              {filteredGames.map((game, index) => {
                const isSelected = index === selectedIndex;
                const hasMedia = Boolean(game.videoUrl || game.wheelImageUrl);

                return (
                  <li key={game.name}>
                    <button
                      ref={(element) => {
                        itemRefs.current[game.name] = element;
                      }}
                      type="button"
                      onMouseEnter={() => setSelectedIndex(index)}
                      onClick={() => {
                        launchSelectedGame({
                          platformName: platform.name,
                          romName: game.name,
                        }).catch((error) => {
                          console.error("Erro ao executar jogo:", error);
                        });
                      }}
                      className={[
                        "flex w-full flex-col px-5 py-3 text-left transition-colors",
                        isSelected
                          ? "bg-zinc-800 text-white"
                          : "text-zinc-300 hover:bg-zinc-800/60",
                      ].join(" ")}
                    >
                      <span className="truncate">{game.description}</span>

                      <span className="mt-1 text-xs text-zinc-400">
                        {[game.year, game.manufacturer, game.genre]
                          .filter(Boolean)
                          .join(" • ") || game.name}
                      </span>

                      {!hasMedia ? (
                        <span className="mt-1 text-[11px] text-amber-400">
                          Sem mídia encontrada
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
        <GamePreview game={selectedGame} />
      </main>
    </div>
  );
}