import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { HyperspinPlatformTheme } from "../../services/hyperspinPlatformThemesService";
import { PlatformSelectionScreen } from "./PlatformSelectionScreen";
import { HyperspinThemeProvider } from "../../app/provider/HyperspinThemeProvider";

export function PlatformSelectionPage() {
  const navigate = useNavigate();

  const handleSelectPlatform = useCallback(
    async (platform: HyperspinPlatformTheme) => {
      navigate("/games", {
        state: {
          platform,
        },
      });
    },
    [navigate],
  );

  return (
    <HyperspinThemeProvider>
      <PlatformSelectionScreen onSelectPlatform={handleSelectPlatform} />
    </HyperspinThemeProvider>
  );
}
