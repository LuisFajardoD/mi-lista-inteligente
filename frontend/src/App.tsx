import { Link, Outlet, useLocation } from 'react-router-dom'
import './index.css'

export default function App() {
  const { pathname } = useLocation()
  return (
    <div className="container">
      <header className="topbar">
        <h1>Mi Lista Inteligente (MVP)</h1>
        <nav>
          <Link to="/auth" className={pathname==='/auth'?'active':''}>Autenticación</Link>
          <Link to="/upload" className={pathname==='/upload'?'active':''}>Subir lista</Link>
          <Link to="/unified" className={pathname==='/unified'?'active':''}>Lista unificada</Link>
        </nav>
      </header>
      <main className="content">
        <Outlet />
      </main>
      <footer className="footer">
        <small>Proyecto académico • Sprint 1</small>
      </footer>
    </div>
  )
}
