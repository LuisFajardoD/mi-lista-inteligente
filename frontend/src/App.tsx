import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from './lib/auth'
import { supabase } from './lib/supabaseClient'
import { usePlan } from './lib/plan'

export default function App() {
  const { user } = useAuth()
  const nav = useNavigate()
  const { plan, setPlan } = usePlan()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    nav('/auth', { replace: true })
  }

  return (
    <>
      <header className="topbar">
        <div className="wrap" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Título → link al inicio (subir lista) */}
          <NavLink to="/upload" className="brand">
            Mi Lista Inteligente
          </NavLink>

          {/* Menú: solo “Historial” y “Salir” si hay sesión */}
          <nav className="menu" style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
            {user ? (
              <>
                <NavLink to="/history">Historial</NavLink>
                <button className="linklike" onClick={handleSignOut}>Salir</button>
              </>
            ) : (
              <NavLink to="/auth">Autenticación</NavLink>
            )}
          </nav>

          {/* Selector de Plan */}
          <div className="menu" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="muted" style={{ fontSize: 13 }}>Plan:</span>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value as 'free' | 'premium' | 'b2b')}
              className="input"
              style={{ padding: '6px 8px', height: 32 }}
            >
              <option value="free">Gratis</option>
              <option value="premium">Premium</option>
              <option value="b2b">B2B</option>
            </select>
          </div>
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
