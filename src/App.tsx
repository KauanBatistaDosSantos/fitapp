import { useEffect, useLayoutEffect, useState } from "react";
import { Link, Outlet, ScrollRestoration, useLocation } from "react-router-dom";
import "./App.css";

type AppTheme = "light" | "dark" | "colorful";
type AppThemePreference = "system" | AppTheme;

const themeLabels: Record<AppThemePreference, string> = {
  system: "Sistema",
  light: "Claro",
  dark: "Escuro",
  colorful: "Colorido",
};

function loadTheme(): AppThemePreference {
  const saved = localStorage.getItem("fitjourney:theme-choice-v2");
  return saved === "light" || saved === "dark" || saved === "colorful" ? saved : "system";
}

const systemTheme = (): AppTheme =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const TITLES: Record<string, string> = {
  "/": "Seus progressos",
  "/diet": "Alimentação diária",
  "/diet/config": "Configurar dieta",
  "/water": "Água diária",
  "/water/config": "Configurar água",
  "/training": "Treino semanal",
  "/training/config": "Configurar treinos",
  "/weight": "Meta de peso",
  "/weight/config": "Configurar peso",
};

function Header({
  theme,
  onThemeChange,
}: {
  theme: AppThemePreference;
  onThemeChange: (theme: AppThemePreference) => void;
}) {
  const location = useLocation();
  const title = TITLES[location.pathname] ?? "Fit Journey";
  const isHome = location.pathname === "/";

  return (
    <header className="app-header">
      <div className="app-header-inner">
        {!isHome && (
          <Link to=".." relative="path" className="app-back" aria-label="Voltar">
            ←
          </Link>
        )}
        <div className="app-header-texts">
          <span className="app-header-kicker">Fit Journey</span>
          <h1 className="app-header-title">{title}</h1>
        </div>
        <div className="app-header-spacer" />
        <label className="app-theme">
          <span>Tema</span>
          <select value={theme} onChange={(event) => onThemeChange(event.target.value as AppThemePreference)}>
            {(Object.keys(themeLabels) as AppThemePreference[]).map((value) => (
              <option key={value} value={value}>
                {themeLabels[value]}
              </option>
            ))}
          </select>
        </label>
        {!isHome && (
          <Link to="/" className="app-home-link" aria-label="Ir para início">
            🏠 Início
          </Link>
        )}
      </div>
    </header>
  );
}

export default function AppShell() {
  const [theme, setTheme] = useState<AppThemePreference>(loadTheme);
  const [deviceTheme, setDeviceTheme] = useState<AppTheme>(systemTheme);
  const appliedTheme = theme === "system" ? deviceTheme : theme;

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = appliedTheme;
    localStorage.setItem("fitjourney:theme-choice-v2", theme);
  }, [appliedTheme, theme]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => {
      setDeviceTheme(event.matches ? "dark" : "light");
    };
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  return (
    <div className="app-shell">
      <Header theme={theme} onThemeChange={setTheme} />
      <main className="app-main">
        <Outlet />
      </main>
      <ScrollRestoration />
    </div>
  );
}
