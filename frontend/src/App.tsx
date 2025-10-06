import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from './lib/auth'
import { supabase } from './lib/supabaseClient'

export default function App() {
  const { user } = useAuth()
  const nav = useNavigate()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    nav('/auth', { replace: true })
  }

  return (
    <>
      <header className="topbar">
        <div className="wrap">
          {/* Título → link al inicio (subir lista) */}
          <NavLink to="/upload" className="brand">
            Mi Lista Inteligente
          </NavLink>

          {/* Menú: solo “Historial” y “Salir” si hay sesión */}
          <nav className="menu">
            {user ? (
              <>
                <NavLink to="/history">Historial</NavLink>
                <button className="linklike" onClick={handleSignOut}>Salir</button>
              </>
            ) : (
              <NavLink to="/auth">Autenticación</NavLink>
            )}
          </nav>
        </div>
      </header>

      <main className="page">
        <div className="wrap">
          <Outlet />
        </div>
      </main>
    </>
  )
}
