import udgLogo from '../assets/udg.svg'
import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/auth'

export default function AuthPage() {
  const { user } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Si ya hay sesión, redirige a la última ruta o /upload
  useEffect(() => {
    if (user) {
      const to = (loc.state as any)?.from?.pathname || '/upload'
      nav(to, { replace: true })
    }
  }, [user, nav, loc.state])

  const needEnv =
    !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY

  async function handleSignIn() {
    setMsg(null)
    if (!email || !password) { setMsg('Ingresa correo y contraseña.'); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      nav('/upload', { replace: true })
    } catch (e: any) {
      setMsg(`Error al iniciar sesión: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleSignUp() {
    setMsg(null)
    if (!email || !password) { setMsg('Ingresa correo y contraseña.'); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      setMsg('Registro enviado. Revisa tu correo para confirmar.')
    } catch (e: any) {
      setMsg(`Error al registrarte: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleReset() {
    setMsg(null)
    if (!email) { setMsg('Ingresa tu correo para recuperar.'); return }
    setLoading(true)
    try {
      const redirectTo = `${window.location.origin}/auth`
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
      if (error) throw error
      setMsg('Te enviamos el enlace de recuperación.')
    } catch (e: any) {
      setMsg(`Error al enviar correo: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!loading) handleSignIn()
  }

  return (
    <div className="auth-screen">
      {/* Encabezado compacto y más cercano a la tarjeta */}
      <header className="auth-header" style={{ marginBottom: 6 }}>
        {/* Logo más grande SOLO en login */}
        <img src={udgLogo} alt="" className="logo-udg" style={{ width: 72, height: 72 }} />
        <div className="brand-title">
          <div className="app-name">Mi Lista Inteligente</div>
          <div className="app-sub muted">
            Optimiza compras comparando precios y stock en tiempo real
          </div>
        </div>
      </header>

      <main className="auth-center">
        <section className="auth-card">
          <h1 className="auth-title">Accede a tu cuenta</h1>
          <p className="auth-sub muted">Usa tu correo institucional o personal para continuar.</p>

          {/* FORM para permitir Enter y controlar submit una sola vez */}
          <form onSubmit={onSubmit}>
            <div className="field">
              <label className="label">Correo</label>
              <input
                className="input"
                type="email"
                placeholder="tucorreo@udgvirtual.mx"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
                disabled={loading}
              />
            </div>

            <div className="field">
              <label className="label">Contraseña</label>
              <div className="input-wrap">
                <input
                  className="input has-addon"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                />
                {/* Botón “ojito” con el mismo alto del input y sin romper layout */}
                <button
                  type="button"
                  className="input-addon"
                  aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={showPwd}
                  onClick={() => setShowPwd(s => !s)}
                  disabled={loading}
                >
                  {showPwd ? (
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M12 5c5 0 9 4 10 7-1 3-5 7-10 7S3 15 2 12c1-3 5-7 10-7m0 3a4 4 0 1 0 .001 8.001A4 4 0 0 0 12 8"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M2.39 1.73L1.11 3l3.32 3.32C2.76 7.48 1.5 9.61 1 12c1 3 5 7 11 7 2.01 0 3.8-.5 5.36-1.27L21 22.27 22.27 21 2.39 1.73M12 7c2.76 0 5 2.24 5 5 0 .59-.11 1.16-.31 1.68l-6.37-6.37C10.84 7.11 11.41 7 12 7m0 10c-5 0-9-4-10-7 .41-1.23 1.22-2.45 2.29-3.5l2.17 2.17A4.96 4.96 0 0 0 7 12a5 5 0 0 0 5 5c.78 0 1.52-.18 2.18-.5l1.62 1.62C14.84 18.63 13.47 19 12 19Z"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Botones con separación y estados de carga */}
            <div className="actions" style={{ gap: 10, marginTop: 12 }}>
              <button
                type="submit"
                className="btn primary block"
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? 'Entrando…' : 'Iniciar sesión'}
              </button>

              <button
                type="button"
                className="btn outline block"
                onClick={handleSignUp}
                disabled={loading}
                aria-busy={loading}
              >
                Registrarme
              </button>

              <button
                type="button"
                className="btn outline block"
                onClick={handleReset}
                disabled={loading}
              >
                Recuperar contraseña
              </button>
            </div>
          </form>

          {msg && <p className="muted help" style={{ marginTop: 10 }}>{msg}</p>}

          {needEnv && (
            <p className="muted help">Configura <code>.env.local</code> con tus claves de Supabase.</p>
          )}

          {/* Créditos sin viñetas */}
          <div className="credits">
            <div className="credits-title">Desarrollado por:</div>
            <div className="credits-list">
              PO: <b>Luis Enrique</b><br />
              SM: <b>Alicia</b><br />
              Dev FE: <b>Eduardo</b><br />
              Dev BE: <b>Luis Yasmani</b>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
