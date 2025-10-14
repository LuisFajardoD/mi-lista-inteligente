import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabaseClient'
import { searchOffers, bestOffer, type Offer } from '../lib/providers'
import {
  saveHistory,
  lastTotalFor,
  createAlert,
  logAffiliateClick,  // tracking afiliados
} from '../lib/history'
import {
  upsertWorkingList,
  fetchLatestWorkingList,
  clearWorkingList,
} from '../lib/workingLists'
import { downloadComparePdf, type PdfRow } from '../lib/pdf'
import { usePlan } from '../lib/plan'

type RawRow = Record<string, any>

type UnifiedRow = {
  product: string
  sku?: string
  unit?: string
  quantity: number
  mergedCount: number
}

type CompareRow = {
  product: string
  quantity: number
  offers: Offer[]
  selected?: Offer
}

export default function UploadList() {
  // Trabajo actual (borrador)
  const [rawRows, setRawRows] = useState<RawRow[]>([])
  const [unified, setUnified] = useState<UnifiedRow[]>([])

  // Comparación
  const [loading, setLoading] = useState(false)
  const [compareRows, setCompareRows] = useState<CompareRow[]>([])
  const [alerts, setAlerts] = useState<{ product: string; provider: string; message: string }[]>([])
  const [grandTotal, setGrandTotal] = useState(0)

  // Errores y plan
  const [csvError, setCsvError] = useState<string | null>(null)
  const { plan } = usePlan()
  const planLimit = plan === 'premium' ? 50 : plan === 'b2b' ? 200 : 5

  // ===== Tracking de afiliados (Sprint 4) =====
  const [userId, setUserId] = useState<string | null>(null)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, [])

  const trackClick = async (product: string, provider: string, url?: string) => {
    if (!userId || !url) return
    try { await logAffiliateClick(userId, product, provider, url) } catch {}
  }
  // ============================================

  // ---------- Persistence: cargar borrador al entrar ----------
  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const draft = await fetchLatestWorkingList(user.id)
      if (draft) {
        setRawRows(draft.raw ?? [])
        setUnified(draft.unified ?? [])
      }
    })()
  }, [])

  // ---------- Persistence: guardar borrador cuando cambie ----------
  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      if (rawRows.length || unified.length) {
        try {
          await upsertWorkingList(user.id, {
            name: 'Borrador actual',
            raw: rawRows,
            unified,
          })
        } catch {
          /* silencio */
        }
      }
    })()
  }, [rawRows, unified])

  // ---------- Subir lista ----------
  const handleFile = async (file?: File | null) => {
    if (!file) return
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(ws) as RawRow[]

    // Validación básica: debe tener columnas producto y cantidad
    const cols = rows[0] ? Object.keys(rows[0]).map(c => c.toLowerCase()) : []
    const hasProduct = cols.some(c => ['nombre','producto','product','name'].includes(c))
    const hasQty = cols.some(c => ['cantidad','quantity','qty'].includes(c))
    if (!rows.length || !hasProduct || !hasQty) {
      setCsvError('El archivo debe incluir columnas de producto (nombre/producto) y cantidad.')
      setRawRows([]); setUnified([]); setCompareRows([]); setAlerts([]); setGrandTotal(0)
      return
    }

    setCsvError(null)
    setRawRows(rows)
    setCompareRows([])
    setAlerts([])
    setGrandTotal(0)
    setUnified(unify(rows))
  }

  const rawCount = rawRows.length
  const unifiedCount = unified.length
  const canCompare = unifiedCount > 0

  // ---------- Utilidades ----------
  function normalizeKey(s: any) {
    const v = String(s ?? '')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .trim()
    return v.replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ')
  }

  function readQty(v: any): number {
    const n = Number(v)
    return Number.isFinite(n) ? n : 0
  }

  // Unificación: soporta español + equivalentes ingleses
  function unify(rows: RawRow[]): UnifiedRow[] {
    const map = new Map<string, UnifiedRow & { _count: number }>()
    for (const r of rows) {
      const product =
        r.nombre ?? r.name ?? r.product ?? r.Producto ?? r.PRODUCTO ?? r.item ?? r.Item ?? r['product name'] ?? ''
      const sku = r.sku ?? r.SKU ?? r.Sku
      const unit = r.unidad ?? r.unit ?? r.UNIDAD ?? r.Unit
      const qty =
        r.cantidad ?? r.quantity ?? r.CANTIDAD ?? r.qty ?? r.Qty ?? r.QTY ?? r['cantidad total'] ?? r['Cantidad total']

      const key = normalizeKey(product)
      if (!key) continue

      const prev = map.get(key)
      if (!prev) {
        map.set(key, {
          product: String(product).toLowerCase(),
          sku: sku ? String(sku) : undefined,
          unit: unit ? String(unit).toLowerCase() : undefined,
          quantity: readQty(qty),
          mergedCount: 1,
          _count: 1,
        })
      } else {
        prev.quantity += readQty(qty)
        prev.mergedCount += 1
        prev._count += 1
        map.set(key, prev)
      }
    }
    return Array.from(map.values()).map(({ _count, ...row }) => row)
  }

  // --- Filas para PDF a partir de compareRows (todas las ofertas) ---
  const rowsForPdf: PdfRow[] = useMemo(() => {
    if (!compareRows.length) return []
    return compareRows.flatMap(r =>
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
  }, [compareRows])

  // ---------- Comparar precios aquí mismo ----------
  const handleCompareHere = async () => {
    if (!canCompare) return
    setLoading(true)
    setAlerts([])

    const { data: { user } } = await supabase.auth.getUser()

    // Límite por plan para la demo: Free=5, Premium=50, B2B=200
    const sample = unified.slice(0, planLimit).map(u => ({
      product: normalizeKey(u.product),
      quantity: u.quantity || 1,
    }))

    const computed: CompareRow[] = []
    for (const item of sample) {
      const offers = await searchOffers(item.product, user?.id) // añade affiliateUrl si hay userId
      const selected = bestOffer(offers)
      computed.push({ ...item, offers, selected })
    }
    setCompareRows(computed)

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

        // Baja de precio (>= 5%)
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

  // Limpiar borrador
  const handleClearDraft = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await clearWorkingList(user.id)
    setRawRows([]); setUnified([]); setCompareRows([]); setAlerts([]); setGrandTotal(0); setCsvError(null)
  }

  // Columnas para tabla de preview (muestra TODO)
  const previewColumns = useMemo(() => {
    if (!rawRows[0]) return [] as string[]
    return Object.keys(rawRows[0])
  }, [rawRows])

  return (
    <div className="container">
      {/* 1) Subir lista */}
      <div className="card">
        <h2>1) Subir lista (CSV/XLSX)</h2>
        <input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
        <p className="muted" style={{ marginTop: 8 }}>
          Columnas recomendadas: <strong>nombre</strong> y <strong>cantidad</strong> (acepta equivalentes en español o inglés).
        </p>
        {csvError && (
          <p className="muted" style={{ marginTop: 8, color: '#ffb4b4' }}>
            {csvError}
          </p>
        )}
        {(rawRows.length || unified.length) > 0 && (
          <div className="actions" style={{ marginTop: 8 }}>
            <button className="btn" onClick={handleClearDraft}>Limpiar borrador</button>
          </div>
        )}
      </div>

      {/* 2) Previsualización */}
      <div className="card" style={{ marginTop: 16 }}>
        <h2>2) Previsualización de la lista cargada</h2>
        <p>Filas: <strong>{rawCount}</strong></p>
        {rawRows.length > 0 && (
          <table>
            <thead>
              <tr>
                {previewColumns.map(c => <th key={c}>{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {rawRows.map((r, i) => (
                <tr key={i}>
                  {previewColumns.map(c => <td key={c}>{String(r[c])}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 3) Lista unificada */}
      <div className="card" style={{ marginTop: 16 }}>
        <h2>3) Lista unificada</h2>

        {unifiedCount === 0 ? (
          <p className="muted">Aún no hay datos unificados.</p>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>SKU</th>
                  <th>Cantidad total</th>
                  <th>Unidad</th>
                  <th>Filas unificadas</th>
                </tr>
              </thead>
              <tbody>
                {unified.map((u, i) => (
                  <tr key={i}>
                    <td style={{ textTransform: 'capitalize' }}>{u.product}</td>
                    <td>{u.sku ?? '—'}</td>
                    <td>{u.quantity}</td>
                    <td>{u.unit ?? '—'}</td>
                    <td>{u.mergedCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="muted" style={{ marginTop: 8 }}>
              Filas unificadas: <strong>{unifiedCount}</strong>
            </div>

            <div className="actions" style={{ marginTop: 12 }}>
              <button className="btn primary" onClick={handleCompareHere} disabled={loading}>
                {loading ? 'Procesando…' : 'Comparar precios'}
              </button>
            </div>

            <p className="muted" style={{ marginTop: 8 }}>
              Plan <strong style={{ textTransform: 'capitalize' }}>{plan}</strong>: se comparan hasta <strong>{planLimit}</strong> productos.
            </p>
          </>
        )}
      </div>

      {/* 4) Resultados del comparativo */}
      {compareRows.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <h2>4) Resultados del comparativo</h2>

          {alerts.length > 0 && (
            <div className="card" style={{ marginTop: 8 }}>
              <h3>Alertas</h3>
              <ul>
                {alerts.map((a, i) => (
                  <li key={i}>[{a.provider}] {a.product}: {a.message}</li>
                ))}
              </ul>
            </div>
          )}

          <div
            className="card"
            style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}
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
              {compareRows.flatMap(r =>
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
                      <td>{o.provider} {isBest && <span className="badge ok" style={{ marginLeft: 6 }}>Mejor opción</span>}</td>
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
        </div>
      )}
    </div>
  )
}
