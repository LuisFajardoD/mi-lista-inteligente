import { useState } from 'react'
import { searchOffers, bestOffer, type Offer } from '../lib/providers'
import { saveHistory, lastTotalFor, createAlert } from '../lib/history'
import { supabase } from '../lib/supabaseClient'

type Row = {
  product: string
  quantity: number
  offers: Offer[]
  selected?: Offer
}

export default function Compare() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [alerts, setAlerts] = useState<{ product: string; provider: string; message: string }[]>([])
  const [grandTotal, setGrandTotal] = useState(0)

  const handleCompare = async () => {
    setLoading(true)
    setAlerts([])

    // Datos de ejemplo para proveedores simulados
    const sample = [
      { product: 'cuaderno profesional', quantity: 3 },
      { product: 'lapiz hb', quantity: 5 },
      { product: 'tijeras escolares', quantity: 1 },
    ]

    const computed: Row[] = []
    for (const item of sample) {
      const offers = await searchOffers(item.product)
      const selected = bestOffer(offers)
      computed.push({ ...item, offers, selected })
    }
    setRows(computed)

    const total = computed.reduce((acc, r) => {
      const unit = r.selected ? r.selected.price + r.selected.shipping : 0
      return acc + unit * r.quantity
    }, 0)
    setGrandTotal(total)

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const toPersist = computed
        .filter(r => r.selected)
        .map(r => ({ product: r.product, quantity: r.quantity, chosen: r.selected! }))

      if (toPersist.length > 0) {
        await saveHistory(user.id, toPersist)
      }

      const news: { product: string; provider: string; message: string }[] = []
      for (const r of computed) {
        if (!r.selected) continue
        const sel = r.selected
        const unit = sel.price + sel.shipping

        // Alerta de baja de precio (umbral mínimo 5%)
        const prev = await lastTotalFor(user.id, r.product, sel.provider)
        if (typeof prev === 'number' && prev > 0 && unit < prev) {
          const drop = (prev - unit) / prev
          if (drop >= 0.05) {
            await createAlert(user.id, r.product, sel.provider, 'PRICE_DROP', prev, unit)
            news.push({
              product: r.product,
              provider: sel.provider,
              message: `Baja de precio ${(drop * 100).toFixed(1)}%`,
            })
          }
        }

        // Alerta de reabastecimiento: antes en 0 y ahora disponible (>0)
        // Si el proveedor simulado expone prevTotal, se usa para detectar cambio de disponibilidad
        if (sel.available && typeof (sel as any).prevTotal === 'number' && (sel as any).prevTotal === 0 && unit > 0) {
          await createAlert(user.id, r.product, sel.provider, 'BACK_IN_STOCK', (sel as any).prevTotal, unit)
          news.push({
            product: r.product,
            provider: sel.provider,
            message: 'Disponible nuevamente',
          })
        }
      }
      setAlerts(news)
    }

    setLoading(false)
  }

  return (
    <div className="card">
      <h2>Comparador de precios (Sprint 2 + 3)</h2>
      <button onClick={handleCompare} disabled={loading}>
        {loading ? 'Procesando…' : 'Comparar'}
      </button>

      {alerts.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3>Alertas</h3>
          <ul>
            {alerts.map((a, i) => (
              <li key={i}>[{a.provider}] {a.product}: {a.message}</li>
            ))}
          </ul>
        </div>
      )}

      {rows.length > 0 && (
        <>
          <div className="card" style={{ marginTop: 16 }}>
            <h3>Resumen</h3>
            <p>Total del carrito: <strong>${grandTotal.toFixed(2)}</strong></p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Proveedor</th>
                <th>Precio</th>
                <th>Envío</th>
                <th>Total (unidad)</th>
                <th>Cantidad</th>
                <th>Total (línea)</th>
                <th>Disp.</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r =>
                r.offers.map(o => {
                  const unit = o.price + o.shipping
                  const line = unit * r.quantity
                  const isBest = r.selected?.provider === o.provider
                  return (
                    <tr
                      key={r.product + o.provider}
                      style={{
                        background: isBest ? '#b2f2bb' : '',
                        color: isBest ? '#000' : '',
                        fontWeight: isBest ? 'bold' : 'normal',
                      }}
                    >
                      <td style={{ textTransform: 'capitalize' }}>{r.product}</td>
                      <td>{o.provider} {isBest && <span style={{ marginLeft: 6 }}>⭐ Mejor opción</span>}</td>
                      <td>${o.price.toFixed(2)}</td>
                      <td>${o.shipping.toFixed(2)}</td>
                      <td>${unit.toFixed(2)}</td>
                      <td>{r.quantity}</td>
                      <td>${line.toFixed(2)}</td>
                      <td>{o.available ? 'Sí' : 'No'}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}
