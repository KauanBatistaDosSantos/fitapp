import { Link, Outlet, ScrollRestoration, useLocation } from "react-router-dom";
import { clsx } from "clsx";
import "./App.css";

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

function Header() {
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
        <Link
          to="/"
          className={clsx("app-home-link", isHome && "app-home-link--disabled")}
        >
          Início
        </Link>
      </div>
    </header>
  );
}

export default function AppShell() {
  return (
    <div className="app-shell">
      <Header />
      <main className="app-main">
        <Outlet />
      </main>
      <ScrollRestoration />
    </div>
  );
}