import { AppProvider } from "./provider/AppProvider";
import { HyperspinThemeProvider } from "./provider/HyperspinThemeProvider";
import { ThemeProvider } from "./provider/ThemeProviderContext";
import { AppRoutes } from "./routers/AppRoutes";

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <HyperspinThemeProvider>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </HyperspinThemeProvider>
    </ThemeProvider>
  );
}
