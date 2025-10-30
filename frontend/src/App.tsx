import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import udgLogo from "./assets/udg.svg";
import { useAuth } from "./lib/auth";
import { supabase } from "./lib/supabaseClient";


export default function App() {
  const { user } = useAuth();
  const loc = useLocation();

  // Tema claro/oscuro (persistente)
  const [theme, setTheme] = useState<"light" | "dark">(
    () => (localStorage.getItem("theme") as "light" | "dark") || "dark"
  );
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") root.setAttribute("data-theme", "light");
    else root.removeAttribute("data-theme");
    localStorage.setItem("theme", theme);
  }, [theme]);
  const toggleTheme = () => setTheme(t => (t === "light" ? "dark" : "light"));

  // Drawer móvil
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = () => setMobileOpen(false);

  // Cerrar sesión
  async function handleLogout() {
    try { await supabase.auth.signOut(); } finally { window.location.replace("/auth"); }
  }

  // Ítems del panel izquierdo (ya sin "Comparar" duplicado)
  const routes = useMemo(
    () => [
      { to: "/upload",   label: "Lista" },              // subir + unificar + comparar
      { to: "/lists",    label: "Listas guardadas" },   // (cuando la implementes)
      { to: "/history",  label: "Historial" },
      { to: "/teams",    label: "Equipos" },
      { to: "/payments", label: "Plan" },
    ],
    []
  );

  // No pintes el shell en /auth
  if (loc.pathname.startsWith("/auth")) return <Outlet />;

  return (
    <div className="app-shell">
      {/* Topbar */}
      <header className="topbar">
        <div className="brand-left">
          <button
            type="button"
            className="hamburger"
            aria-label="Abrir menú"
            onClick={() => setMobileOpen(true)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          <img src={udgLogo} alt="" className="logo-udg" />
          <div>
            <div className="app-title">Mi Lista Inteligente</div>
            <div className="app-sub">Optimiza compras comparando precios y stock en tiempo real</div>
          </div>
        </div>

        <div className="top-actions">
          <button
            type="button"
            className="icon-btn theme-btn"
            onClick={toggleTheme}
            aria-label="Cambiar tema"
            title={theme === "light" ? "Tema oscuro" : "Tema claro"}
          >
            {theme === "light" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M12.74 2a8.5 8.5 0 1 0 8.52 10.02A7 7 0 0 1 12.74 2z"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M6.76 4.84l-1.8-1.79l1.41-1.41l1.79 1.8l-1.4 1.4ZM1 13h3v-2H1v2Zm10-9h-2v3h2V4Zm7.45 1.46l-1.41-1.41l-1.8 1.79l1.42 1.42l1.79-1.8ZM20 11v2h3v-2h-3Zm-8 9h2v-3h-2v3Zm5.24-1.84l1.8 1.79l1.41-1.41l-1.79-1.8l-1.42 1.42ZM4.96 17.54l1.8-1.79l-1.42-1.42l-1.79 1.8l1.41 1.41ZM12 6a6 6 0 1 1 0 12A6 6 0 0 1 12 6Z"/>
              </svg>
            )}
          </button>

          <div className="avatar">{user?.email?.[0]?.toUpperCase() || "U"}</div>
        </div>
      </header>

      {/* Sidebar / Drawer */}
      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="side-header">
          <div className="side-title">Panel</div>
        </div>

        <nav className="nav" onClick={closeMobile}>
          <div className="group">General</div>
          {routes.slice(0, 3).map(r => (
            <NavLink key={r.to} to={r.to} className={({ isActive }) => (isActive ? "active" : "")}>
              <span>{r.label}</span>
            </NavLink>
          ))}

          <div className="group">Cuenta</div>
          {routes.slice(3).map(r => (
            <NavLink key={r.to} to={r.to} className={({ isActive }) => (isActive ? "active" : "")}>
              <span>{r.label}</span>
            </NavLink>
          ))}

          <div className="group">Sesión</div>
          <button type="button" className="btn block" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </nav>
      </aside>

      {/* Backdrop para cerrar el drawer */}
      <div className={`backdrop ${mobileOpen ? "show" : ""}`} onClick={closeMobile} aria-hidden={!mobileOpen} />

      {/* Contenido */}
      <main className="content" onClick={closeMobile}>
        <div className="wrap">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
