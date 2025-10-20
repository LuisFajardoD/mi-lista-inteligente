import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { usePlan } from '../lib/plan'

type Plan = 'free' | 'premium' | 'b2b'

export default function Payments() {
  const { plan, setPlan } = usePlan()
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<string>('')

  useEffect(() => { setStatus('') }, [plan])

  const simulatePayment = async (target: Plan) => {
    setSaving(true)
    setStatus('Procesando pago en sandbox…')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
  
        const { error } = await supabase.from('user_plans')
          .upsert({ user_id: user.id, plan: target, updated_at: new Date().toISOString() })
        if (error) throw error
        setPlan(target) // espejo en localStorage para la UI
        setStatus(`Plan actualizado a ${target.toUpperCase()} (sandbox)`)
      } else {
        // sin sesión: fallback local
        setPlan(target)
        setStatus(`Plan (local) actualizado a ${target.toUpperCase()}`)
      }
    } catch (e: any) {
      setPlan(target)
      setStatus(`Plan (local) actualizado a ${target.toUpperCase()} — Nota: sin persistencia en DB (${e?.message || 'error'})`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container">
      <div className="card">
        <h2>Pagos (Sandbox)</h2>
        <p className="muted">Activación de un plan (sin cobro real).</p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
          <button className="btn" disabled={saving} onClick={() => simulatePayment('premium')}>Activar PREMIUM</button>
          <button className="btn" disabled={saving} onClick={() => simulatePayment('b2b')}>Activar B2B</button>
          <button className="btn" disabled={saving} onClick={() => simulatePayment('free')}>Volver a FREE</button>
        </div>

        <p style={{ marginTop: 12 }}>
          Plan actual: <strong style={{ textTransform: 'uppercase' }}>{plan}</strong>
        </p>
        {status && <p className="muted" style={{ marginTop: 8 }}>{status}</p>}
      </div>
    </div>
  )
}
