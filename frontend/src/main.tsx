import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'

import App from './App'
import AuthPage from './pages/Auth'
import UploadList from './pages/UploadList'
import HistoryPage from './pages/History'

import { AuthProvider, useAuth } from './lib/auth'
import './index.css'

function RequireAuth({ children }: { children: JSX.Element }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/auth" replace />
  return children
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      // Inicio => /upload
      { index: true, element: <Navigate to="/upload" replace /> },

      // Autenticación
      { path: 'auth', element: <AuthPage /> },

      // Subir lista (página principal protegida)
      {
        path: 'upload',
        element: (
          <RequireAuth>
            <UploadList />
          </RequireAuth>
        ),
      },

      // Historial
      {
        path: 'history',
        element: (
          <RequireAuth>
            <HistoryPage />
          </RequireAuth>
        ),
      },

      // Cualquier ruta desconocida → inicio
      { path: '*', element: <Navigate to="/upload" replace /> },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
)
