import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { usePlan } from '../lib/plan';

type Plan = 'free' | 'premium' | 'b2b';

export default function Payments() {
  const { plan, setPlan } = usePlan();
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>('');

  useEffect(() => { setStatus(''); }, [plan]);

  const simulatePayment = async (target: Plan) => {
    setSaving(true);
    setStatus('Procesando pago en sandbox…');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('user_plans')
          .upsert({ user_id: user.id, plan: target, updated_at: new Date().toISOString() });
        if (error) throw error;
        setPlan(target);
        setStatus(`Plan actualizado a ${target.toUpperCase()} (sandbox)`);
      } else {
        setPlan(target);
        setStatus(`Plan (local) actualizado a ${target.toUpperCase()}`);
      }
    } catch (e: any) {
      setPlan(target);
      setStatus(`Plan (local) actualizado a ${target.toUpperCase()} — Nota: sin persistencia en DB (${e?.message || 'error'})`);
    } finally {
      setSaving(false);
    }
  };

  const isActive = (p: Plan) => plan === p;

  return (
    <div className="container">
      <div className="card">
        <h2>Planes y pagos (Sandbox)</h2>
        <p className="muted">Activa un plan (sin cobro real). Tu estado actual se refleja abajo.</p>

        {/* Grid responsive */}
        <div className="plans-grid">
          {/* Free */}
          <article className={`card-soft plan-card ${isActive('free') ? 'selected' : ''}`}>
            <div className="plan-head">
              <h3 className="plan-title">Free</h3>
              <p className="plan-price">$0 <span>/mes</span></p>
            </div>

            <ul className="plan-feat">
              <li>Subir 1 lista sencilla</li>
              <li>2–3 tiendas (Amazon, Walmart, Mercado Libre)</li>
              <li>Comparación básica de precio y stock</li>
              <li>Enlaces directos de compra (afiliados)</li>
            </ul>

            <div className="plan-actions">
              {isActive('free') ? (
                <button className="btn" disabled>Plan activo</button>
              ) : (
                <button className="btn btn-ghost" disabled={saving} onClick={() => simulatePayment('free')}>
                  Cambiar a FREE
                </button>
              )}
            </div>
          </article>

          {/* Premium */}
          <article className={`card-soft plan-card ${isActive('premium') ? 'selected' : ''}`}>
            <div className="plan-head">
              <h3 className="plan-title">Premium</h3>
              <p className="plan-price">$69 MXN <span>/mes</span></p>
            </div>

            <ul className="plan-feat">
              <li>Varias listas simultáneas</li>
              <li>Unificación de duplicados</li>
              <li>Más tiendas (Coppel, Liverpool, Office Depot, …)</li>
              <li>Costo total con envíos o recogida</li>
              <li>Alertas (precio y disponibilidad)</li>
              <li>Historial de precios</li>
              <li>Reporte PDF del comparativo</li>
            </ul>

            <div className="plan-actions">
              {isActive('premium') ? (
                <button className="btn" disabled>Plan activo</button>
              ) : (
                <button className="btn btn-ghost" disabled={saving} onClick={() => simulatePayment('premium')}>
                  Activar Premium
                </button>
              )}
            </div>
          </article>

          {/* B2B */}
          <article className={`card-soft plan-card ${isActive('b2b') ? 'selected' : ''}`}>
            <div className="plan-head">
              <h3 className="plan-title">B2B / Negocios</h3>
              <p className="plan-price">$149 MXN <span>/mes</span></p>
            </div>

            <ul className="plan-feat">
              <li>Todo lo de Premium</li>
              <li>Alertas por volumen (p. ej., 50+ unidades)</li>
              <li>Reportes avanzados y proyecciones de ahorro</li>
              <li>Importación masiva (CSV/Excel) y compartir con equipos</li>
              <li>Soporte prioritario</li>
            </ul>

            <div className="plan-actions">
              {isActive('b2b') ? (
                <button className="btn" disabled>Plan activo</button>
              ) : (
                <button className="btn btn-ghost" disabled={saving} onClick={() => simulatePayment('b2b')}>
                  Activar B2B
                </button>
              )}
            </div>
          </article>

        </div>

        <p style={{ marginTop: 12 }}>
          Plan actual: <strong style={{ textTransform: 'uppercase' }}>{plan}</strong>
        </p>
        {status && <p className="muted" style={{ marginTop: 8 }}>{status}</p>}
      </div>
    </div>
  );
}
