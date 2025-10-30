// frontend/src/main.tsx
import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";

import App from "./App"; // Puedes lazy-loadearlo también si quieres
import { AuthProvider, useAuth } from "./lib/auth";
import "./index.css";

// === Lazy pages (mejor performance) ===
const AuthPage    = React.lazy(() => import("./pages/Auth"));
const UploadList  = React.lazy(() => import("./pages/UploadList"));
const ListsPage   = React.lazy(() => import("./pages/ListsPage"));
const HistoryPage = React.lazy(() => import("./pages/History"));
const Payments    = React.lazy(() => import("./pages/Payments"));
const Teams       = React.lazy(() => import("./pages/Teams"));
const Compare     = React.lazy(() => import("./pages/Compare"));
const AcceptPage  = React.lazy(() => import("./pages/AcceptPage"));

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

const router = createBrowserRouter([
  // Login fuera del shell (sin sidebar/topbar)
  { path: "/auth", element: <AuthPage /> },

  // App con shell
  {
    path: "/",
    element: <App />,
    children: [
      // Home → /upload
      { index: true, element: <Navigate to="upload" replace /> },

      // Secciones protegidas
      {
        path: "upload",
        element: (
          <RequireAuth>
            <UploadList />
          </RequireAuth>
        ),
      },
      {
        path: "lists",
        element: (
          <RequireAuth>
            <ListsPage />
          </RequireAuth>
        ),
      },
      {
        path: "history",
        element: (
          <RequireAuth>
            <HistoryPage />
          </RequireAuth>
        ),
      },
      {
        path: "payments",
        element: (
          <RequireAuth>
            <Payments />
          </RequireAuth>
        ),
      },
      {
        path: "teams",
        element: (
          <RequireAuth>
            <Teams />
          </RequireAuth>
        ),
      },
      // (Solo si usas esta vista interna)
      {
        path: "compare",
        element: (
          <RequireAuth>
            <Compare />
          </RequireAuth>
        ),
      },

      // Ruta pública para aceptar invitaciones (maneja 401 dentro)
      { path: "accept", element: <AcceptPage /> },

      // Cualquier otra → /upload
      { path: "*", element: <Navigate to="upload" replace /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <Suspense
        fallback={
          <div className="wrap">
            <div className="card">Cargando…</div>
          </div>
        }
      >
        <RouterProvider router={router} />
      </Suspense>
    </AuthProvider>
  </React.StrictMode>
);
