import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { HyperspinTheme } from "../../types/hyperspinTheme";
import { loadHyperspinTheme } from "../../services/hyperspinThemeService";
import { extractThemeZipToCache } from "../../services/hyperspinThemeArchiveService";

type HyperspinThemeContextValue = {
  theme: HyperspinTheme | null;
  themeXmlPath: string | null;
  loading: boolean;
  error: string | null;
  loadTheme: (xmlPath: string) => Promise<void>;
  loadThemeFromZip: (themeZipPath: string) => Promise<void>;
  reload: () => Promise<void>;
  clearTheme: () => void;
};

const HyperspinThemeContext = createContext<HyperspinThemeContextValue | null>(
  null,
);

const themeCache = new Map<string, HyperspinTheme>();
const zipToXmlCache = new Map<string, string>();

export function HyperspinThemeProvider({
  children,
  initialThemeXmlPath,
}: {
  children: React.ReactNode;
  initialThemeXmlPath?: string;
}) {
  const [theme, setTheme] = useState<HyperspinTheme | null>(null);
  const [themeXmlPath, setThemeXmlPath] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadTheme = useCallback(async (xmlPath: string) => {
    setLoading(true);
    setError(null);

    try {
      const cached = themeCache.get(xmlPath);

      if (cached) {
        setTheme(cached);
        setThemeXmlPath(xmlPath);
        return;
      }

      const loadedTheme = await loadHyperspinTheme(xmlPath);

      themeCache.set(xmlPath, loadedTheme);

      setTheme(loadedTheme);
      setThemeXmlPath(xmlPath);
    } catch (loadError) {
      setTheme(null);
      setThemeXmlPath(xmlPath);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Erro ao carregar theme.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadThemeFromZip = useCallback(
    async (themeZipPath: string) => {
      setLoading(true);
      setError(null);

      try {
        const cachedXmlPath = zipToXmlCache.get(themeZipPath);

        if (cachedXmlPath) {
          await loadTheme(cachedXmlPath);
          return;
        }

        const extracted = await extractThemeZipToCache(themeZipPath);
        zipToXmlCache.set(themeZipPath, extracted.themeXmlPath);

        await loadTheme(extracted.themeXmlPath);
      } catch (loadError) {
        setTheme(null);
        setThemeXmlPath(null);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Erro ao carregar theme zip.",
        );
      } finally {
        setLoading(false);
      }
    },
    [loadTheme],
  );

  const reload = useCallback(async () => {
    if (!themeXmlPath) return;

    themeCache.delete(themeXmlPath);
    await loadTheme(themeXmlPath);
  }, [loadTheme, themeXmlPath]);

  const clearTheme = useCallback(() => {
    setTheme(null);
    setThemeXmlPath(null);
    setError(null);
  }, []);

  useEffect(() => {
    if (!initialThemeXmlPath) return;
    void loadTheme(initialThemeXmlPath);
  }, [initialThemeXmlPath, loadTheme]);

  const value = useMemo<HyperspinThemeContextValue>(
    () => ({
      theme,
      themeXmlPath,
      loading,
      error,
      loadTheme,
      loadThemeFromZip,
      reload,
      clearTheme,
    }),
    [
      theme,
      themeXmlPath,
      loading,
      error,
      loadTheme,
      loadThemeFromZip,
      reload,
      clearTheme,
    ],
  );

  return (
    <HyperspinThemeContext.Provider value={value}>
      {children}
    </HyperspinThemeContext.Provider>
  );
}

export function useHyperspinTheme() {
  const context = useContext(HyperspinThemeContext);

  if (!context) {
    throw new Error(
      "useHyperspinTheme must be used within HyperspinThemeProvider",
    );
  }

  return context;
}
