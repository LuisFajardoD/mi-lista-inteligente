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
        <div className="wrap topbar-inner">
          {/* Marca → /upload si hay sesión, si no /auth */}
          <NavLink to={user ? '/upload' : '/auth'} className="brand">
            Mi Lista Inteligente
          </NavLink>

          <nav className="menu">
            {user ? (
              <>
                <NavLink to="/history">Historial</NavLink>
                <NavLink to="/payments">Pagos</NavLink>
                <NavLink to="/teams">Equipos</NavLink>
                <NavLink to="/share">Compartir</NavLink>
                <button className="linklike" onClick={handleSignOut}>Salir</button>
              </>
            ) : (
              <NavLink to="/auth">Autenticación</NavLink>
            )}
          </nav>

          {/* Selector de plan: SOLO con sesión iniciada */}
          {user && (
            <div className="menu plan-picker">
              <span className="muted">Plan:</span>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value as any)}
                className="input plan-select"
              >
                <option value="free">Gratis</option>
                <option value="premium">Premium</option>
                <option value="b2b">B2B</option>
              </select>
            </div>
          )}
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
