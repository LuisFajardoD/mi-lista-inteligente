import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { searchOffers, bestOffer, type Offer } from '../lib/providers'
import { saveHistory, lastTotalFor, createAlert, logAffiliateClick } from '../lib/history'
import { supabase } from '../lib/supabaseClient'
import { downloadComparePdf, type PdfRow } from '../lib/pdf'

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

  // --- Tracking de afiliados ---
  const [userId, setUserId] = useState<string | null>(null)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, [])

  const trackClick = async (product: string, provider: string, url?: string) => {
    if (!userId || !url) return
    try { await logAffiliateClick(userId, product, provider, url) } catch {}
  }
  // -------------------------------

  // Arma filas para PDF a partir de rows (todas las ofertas)
  const rowsForPdf: PdfRow[] = useMemo(() => {
    if (!rows.length) return []
    return rows.flatMap(r =>
      r.offers.map(o => {
        const unit = o.price + o.shipping
        return {
          product: r.product,
          provider: o.provider,
          unit,
          qty: r.quantity,
          line: unit * r.quantity,
          available: o.available,
        }
      })
    )
  }, [rows])

  const runCompare = async (items: { product: string; quantity: number }[]) => {
    setLoading(true)
    setAlerts([])
    const { data: { user } } = await supabase.auth.getUser()

    const computed: Row[] = []
    for (const item of items) {
      const offers = await searchOffers(item.product, user?.id) // genera affiliateUrl si hay user
      const selected = bestOffer(offers)
      computed.push({ ...item, offers, selected })
    }
    setRows(computed)

    const total = computed.reduce((acc, r) => {
      const unit = r.selected ? r.selected.price + r.selected.shipping : 0
      return acc + unit * r.quantity
    }, 0)
    setGrandTotal(total)

    if (user) {
      const toPersist = computed
        .filter(r => r.selected)
        .map(r => ({ product: r.product, quantity: r.quantity, chosen: r.selected! }))

      if (toPersist.length > 0) await saveHistory(user.id, toPersist)

      const news: { product: string; provider: string; message: string }[] = []
      for (const r of computed) {
        if (!r.selected) continue
        const sel = r.selected
        const unit = sel.price + sel.shipping

        // Baja de precio
        const prev = await lastTotalFor(user.id, r.product, sel.provider)
        if (typeof prev === 'number' && prev > 0 && unit < prev) {
          const drop = (prev - unit) / prev
          if (drop >= 0.05) {
            await createAlert(user.id, r.product, sel.provider, 'PRICE_DROP', prev, unit)
            news.push({ product: r.product, provider: sel.provider, message: `Baja de precio ${(drop * 100).toFixed(1)}%` })
          }
        }

        // Reabastecimiento (si prevTotal=0 -> ahora disponible)
        if (sel.available && typeof sel.prevTotal === 'number' && sel.prevTotal === 0 && unit > 0) {
          await createAlert(user.id, r.product, sel.provider, 'BACK_IN_STOCK', sel.prevTotal, unit)
          news.push({ product: r.product, provider: sel.provider, message: 'Disponible nuevamente' })
        }
      }
      setAlerts(news)
    }

    setLoading(false)
  }

  const handleCompareExample = () =>
    runCompare([
      { product: 'cuaderno profesional', quantity: 3 },
      { product: 'lapiz hb', quantity: 5 },
      { product: 'tijeras escolares', quantity: 1 },
    ])

  return (
    <div className="card">
      <h2>Comparador de precios</h2>

      {/* Estado vacío */}
      {rows.length === 0 && !loading && (
        <div className="muted" style={{ marginTop: 4 }}>
          <p>
            Para comparar precios, primero <strong>sube tu lista</strong> o usa un conjunto de{' '}
            <strong>datos de ejemplo</strong>.
          </p>
          <div className="actions">
            <Link to="/upload" className="btn primary">Subir lista</Link>
            <button className="btn" onClick={handleCompareExample}>Usar ejemplo</button>
          </div>
        </div>
      )}

      {/* Acciones arriba */}
      <div className="actions" style={{ marginTop: 8, gap: 8, flexWrap: 'wrap' }}>
        <button onClick={handleCompareExample} className="btn" disabled={loading}>
          {loading ? 'Procesando…' : 'Comparar ejemplo'}
        </button>

        {/* Botón PDF aparece con resultados */}
        {rows.length > 0 && (
          <button
            className="btn"
            onClick={() =>
              downloadComparePdf({
                title: 'Comparativo de precios — Mi Lista Inteligente',
                rows: rowsForPdf,
                grandTotal,
              })
            }
          >
            Descargar PDF
          </button>
        )}
      </div>

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
          {/* Resumen + botón PDF */}
          <div
            className="card"
            style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}
          >
            <div>
              <h3>Resumen</h3>
              <p>Total del carrito: <strong>${grandTotal.toFixed(2)}</strong></p>
            </div>
            <div className="actions">
              <button
                className="btn"
                onClick={() =>
                  downloadComparePdf({
                    title: 'Comparativo de precios — Mi Lista Inteligente',
                    rows: rowsForPdf,
                    grandTotal,
                  })
                }
              >
                Descargar PDF
              </button>
            </div>
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
                <th>Comprar</th>
              </tr>
            </thead>
            <tbody>
              {rows.flatMap(r =>
                r.offers.map(o => {
                  const unit = o.price + o.shipping
                  const line = unit * r.quantity
                  const isBest = r.selected?.provider === o.provider
                  return (
                    <tr
                      key={r.product + o.provider}
                      style={{
                        background: isBest ? 'rgba(34,197,94,.15)' : '',
                        color: isBest ? '#eafff1' : '',
                        fontWeight: isBest ? 'bold' : 'normal',
                      }}
                    >
                      <td style={{ textTransform: 'capitalize' }}>{r.product}</td>
                      <td>{o.provider} {isBest && <span style={{ marginLeft: 6 }} className="badge ok">Mejor opción</span>}</td>
                      <td>${o.price.toFixed(2)}</td>
                      <td>${o.shipping.toFixed(2)}</td>
                      <td>${unit.toFixed(2)}</td>
                      <td>{r.quantity}</td>
                      <td>${line.toFixed(2)}</td>
                      <td>{o.available ? <span className="badge ok">Sí</span> : <span className="badge no">No</span>}</td>
                      <td>
                        {o.affiliateUrl ? (
                          <a
                            className="btn"
                            href={o.affiliateUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => trackClick(r.product, o.provider, o.affiliateUrl)}
                          >
                            Comprar
                          </a>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
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
