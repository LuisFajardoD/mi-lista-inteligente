import { Link, Outlet, useLocation } from 'react-router-dom'
import './index.css'

export default function App() {
  const { pathname } = useLocation()
  const is = (p: string) => (pathname === p ? 'active' : '')

  return (
    <div className="container">
      <header className="topbar">
        <h1>Mi Lista Inteligente</h1>
        <nav>
          <Link to="/auth" className={is('/auth')}>Autenticación</Link>
          <Link to="/upload" className={is('/upload')}>Subir lista</Link>
          <Link to="/unified" className={is('/unified')}>Lista unificada</Link>
          <Link to="/compare" className={is('/compare')}>Comparador</Link> {/* ⬅️ NUEVO */}
        </nav>
      </header>
      <main className="content">
        <Outlet />
      </main>
      <footer className="footer">
        <small>Proyecto académico • UDGVirtual</small>
      </footer>
    </div>
  )
}
