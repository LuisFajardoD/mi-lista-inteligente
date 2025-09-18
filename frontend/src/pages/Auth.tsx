import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const signUp = async () => {
    setLoading(true); setMsg(null)
    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    setMsg(error ? 'Error al registrarte: ' + error.message : '¡Revisa tu correo para confirmar el registro!')
  }

  const signIn = async () => {
    setLoading(true); setMsg(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    setMsg(error ? 'Credenciales no válidas.' : 'Sesión iniciada.')
  }

  const reset = async () => {
    setLoading(true); setMsg(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:5173/auth'
    })
    setLoading(false)
    setMsg(error ? 'No se pudo enviar el correo de recuperación.' : 'Correo de recuperación enviado.')
  }

  return (
    <div className="card">
      <h2>Autenticación</h2>
      <div className="row">
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input placeholder="Contraseña" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      </div>
      <div className="row" style={{marginTop:12}}>
        <button onClick={signUp} disabled={loading}>Registrarme</button>
        <button onClick={signIn} disabled={loading}>Iniciar sesión</button>
        <button onClick={reset} disabled={loading || !email}>Recuperar contraseña</button>
      </div>
      {msg && <p className="muted" style={{marginTop:12}}>{msg}</p>}
      <p className="muted" style={{marginTop:12}}>
        Configura tus variables en <code>.env.local</code> con <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code>.
      </p>
    </div>
  )
}
