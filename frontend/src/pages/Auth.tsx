import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function AuthPage() {
  const { user } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // ⬇️ Mantiene tu redirect si ya hay sesión
  useEffect(() => {
    if (user) {
      const to = (loc.state as any)?.from?.pathname || '/upload'
      nav(to, { replace: true })
    }
  }, [user, nav, loc.state])

  const needEnv =
    !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY

  const handleSignUp = async () => {
    setMsg(null)
    if (!email || !password) { setMsg('Ingresa correo y contraseña.'); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      setMsg('Registro enviado. Revisa tu correo para confirmar tu cuenta y luego inicia sesión.')
    } catch (e: any) {
      setMsg(`Error al registrarte: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async () => {
    setMsg(null)
    if (!email || !password) { setMsg('Ingresa correo y contraseña.'); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      // ⬇️ Mantiene tu navegación al inicio
      nav('/upload', { replace: true })
    } catch (e: any) {
      setMsg(`Error al iniciar sesión: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    setMsg(null)
    if (!email) { setMsg('Ingresa tu correo para enviar el enlace de recuperación.'); return }
    setLoading(true)
    try {
      const redirectTo = `${window.location.origin}/auth`
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
      if (error) throw error
      setMsg('Te enviamos un correo para restablecer tu contraseña.')
    } catch (e: any) {
      setMsg(`Error al enviar correo: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-center">
      <div className="card auth-card">
        <h1>Accede a tu cuenta</h1>
        <p className="muted sub">Usa tu correo institucional o personal para continuar.</p>

        {/* Rejilla 2 columnas, con labels para mejor alineación */}
        <div className="form-grid">
          <label>
            <span>Correo</span>
            <input
              className="input"
              type="email"
              placeholder="tucorreo@udgvirtual.mx"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>

          <label>
            <span>Contraseña</span>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
        </div>

        <div className="actions" style={{ marginTop: 8 }}>
          <button className="btn primary" onClick={handleSignIn} disabled={loading}>Iniciar sesión</button>
          <button className="btn" onClick={handleSignUp} disabled={loading}>Registrarme</button>
          <button className="btn" onClick={handleReset} disabled={loading}>Recuperar contraseña</button>
        </div>

        {msg && <p className="muted" style={{ marginTop: 12 }}>{msg}</p>}

        {needEnv && (
          <p className="muted" style={{ marginTop: 8 }}>
            Configura <code>.env.local</code> con <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code>.
          </p>
        )}
      </div>
    </div>
  )
}
