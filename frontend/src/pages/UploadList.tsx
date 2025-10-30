import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabaseClient'
import { searchOffers, bestOffer, collapseByProvider, type Offer } from '../lib/providers'

import {
  saveHistory,
  lastTotalFor,
  createAlert,
  logAffiliateClick, // tracking afiliados
} from '../lib/history'
// correcto (usa el camelCase del archivo que dejamos)
import {
  upsertWorkingList,
  fetchLatestWorkingList,
  clearWorkingList,
  listSaved,
  openListIntoDraft,
  renameList,
  deleteList,
  type WorkingList,
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
  const [alerts, setAlerts] = useState<
    { product: string; provider: string; message: string }[]
  >([])
  const [grandTotal, setGrandTotal] = useState(0)

  // Errores y plan
  const [csvError, setCsvError] = useState<string | null>(null)
  const { plan } = usePlan()
  const planLimit = plan === 'premium' ? 50 : plan === 'b2b' ? 200 : 5

  // ===== Tracking de afiliados =====
  const [userId, setUserId] = useState<string | null>(null)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, [])

  const trackClick = async (product: string, provider: string, url?: string) => {
    if (!userId || !url) return
    try {
      await logAffiliateClick(userId, product, provider, url)
    } catch {
      /* silencio */
    }
  }
  // =================================

  // ---------- Cargar borrador al entrar ----------
  useEffect(() => {
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const draft = await fetchLatestWorkingList(user.id)
        if (draft) {
          setRawRows(draft.raw ?? [])
          setUnified(draft.unified ?? [])
        }
      } catch (e) {
        console.warn('No se pudo cargar borrador:', e)
      }
    })()
  }, [])

  // ---------- Guardar borrador cuando cambie ----------
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
  if (!file) return;
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws) as RawRow[];

  // Validación FLEXIBLE: infiere columnas de producto/cantidad
  const { productKey, qtyKey } = inferHeaders(rows as RawRow[]);
  if (!rows.length || !productKey || !qtyKey) {
    setCsvError(
      "No pude identificar columnas de producto/cantidad. " +
      "Verifica que el archivo tenga al menos una columna con nombres de artículo y otra con cantidades."
    );
    setRawRows([]); setUnified([]); setCompareRows([]); setAlerts([]); setGrandTotal(0);
    return;
  }

  setCsvError(null);
  setRawRows(rows as RawRow[]);
  setCompareRows([]); setAlerts([]); setGrandTotal(0);

  // Unificación robusta (tolerante a mayúsculas, acentos, orden, etc.)
  setUnified(unify(rows as RawRow[]));
};

const unifiedCount = unified.length;
const canCompare = unifiedCount > 0;

/* ================== HELPERS ROBUSTOS ================== */

// Normaliza strings: sin acentos, minúsculas, espacios compactados
function norm(s: any) {
  return String(s ?? "")
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .toLowerCase().trim().replace(/\s+/g, " ");
}

// Convierte cantidades: acepta "1,5", "1.500", "1 500", etc.
function toNumber(v: any): number {
  if (v == null || v === "") return 0;
  const raw = String(v).replace(/\s/g, "").replace(/,/g, ".");
  const m = raw.match(/-?\d+(\.\d+)?/);
  const n = Number(m ? m[0] : NaN);
  return Number.isFinite(n) ? n : 0;
}

// Sinónimos por campo (para cabeceras)
const CANDS = {
  product: [
    "producto","nombre","product","name","item","description","product name","artículo","articulo"
  ],
  qty: [
    "cantidad","qty","quantity","cant","cantidad total","total cantidad","qty total"
  ],
  sku: [
    "sku","código","codigo","id","ref","reference","clave","num articulo","num artículo","ean","upc"
  ],
  unit: [
    "unidad","unit","uom","unidad de medida","medida"
  ],
} as const;

// Intenta encontrar una clave en el objeto basándose en candidatos + heurísticas
function inferHeaderKey(keys: string[], kind: keyof typeof CANDS): string | null {
  // Mapa normalizado → original
  const normToOrig = new Map<string, string>();
  keys.forEach(k => normToOrig.set(norm(k), k));

  // 1) match exacto por sinónimos
  for (const cand of CANDS[kind]) {
    const found = normToOrig.get(norm(cand));
    if (found) return found;
  }

  // 2) empieza-con
  for (const k of keys) {
    const nk = norm(k);
    if (CANDS[kind].some(c => nk.startsWith(norm(c)))) return k;
  }

  // 3) incluye
  for (const k of keys) {
    const nk = norm(k);
    if (CANDS[kind].some(c => nk.includes(norm(c)))) return k;
  }

  // 4) heurísticas por tipo (resueltas en inferHeaders)
  return null;
}

// Analiza la primera página de datos para decidir por heurísticas
function inferHeaders(rows: Record<string, any>[]) {
  const first = rows[0] ?? {};
  const keys = Object.keys(first);

  let productKey = inferHeaderKey(keys, "product");
  let qtyKey     = inferHeaderKey(keys, "qty");
  let skuKey     = inferHeaderKey(keys, "sku");
  let unitKey    = inferHeaderKey(keys, "unit");

  // Heurística con muestras si falta algo
  const sample = rows.slice(0, Math.min(50, rows.length));

  if (!qtyKey) {
    // Columna con mayor proporción de números > 0
    let best: { key: string; score: number } | null = null;
    for (const k of keys) {
      const score = sample.reduce((acc, r) => acc + (toNumber(r[k]) > 0 ? 1 : 0), 0);
      if (!best || score > best.score) best = { key: k, score };
    }
    if (best && best.score > 0) qtyKey = best.key;
  }

  if (!productKey) {
    // Columna con textos más largos y diversos
    let best: { key: string; score: number } | null = null;
    for (const k of keys) {
      const vals = sample.map(r => String(r[k] ?? "")).filter(Boolean);
      if (!vals.length) continue;
      const avgLen = vals.reduce((a, s) => a + s.length, 0) / vals.length;
      const uniq = new Set(vals.map(v => norm(v))).size;
      const score = avgLen * 0.7 + uniq * 0.3;
      if (!best || score > best.score) best = { key: k, score };
    }
    if (best) productKey = best.key;
  }

  if (!skuKey) {
    // “Códigos”: muchos valores con 5+ chars, sin espacios, alfanum/guiones
    let best: { key: string; score: number } | null = null;
    for (const k of keys) {
      const score = sample.reduce((acc, r) => {
        const v = String(r[k] ?? "").trim();
        if (!v) return acc;
        const compact = v.replace(/\s/g, "");
        const looks = (compact.length >= 5 && /^[0-9A-Za-z\-]+$/.test(compact)) ? 1 : 0;
        return acc + looks;
      }, 0);
      if (!best || score > best.score) best = { key: k, score };
    }
    if (best && best.score > 0) skuKey = best.key;
  }

  return { productKey, qtyKey, skuKey, unitKey };
}

// Lee un valor de una fila por clave original (si falla, intenta por sinónimos)
function readCell(row: Record<string, any>, key: string | null, fallbacks: readonly string[]): any {
  if (key && Object.prototype.hasOwnProperty.call(row, key)) return row[key];
  // fallback por sinónimos
  const map = new Map<string, string>();
  Object.keys(row).forEach(k => map.set(norm(k), k));
  for (const fb of fallbacks) {
    const real = map.get(norm(fb));
    if (real) return row[real];
  }
  return undefined;
}

// ---------- Unificación flexible (usa las cabeceras inferidas) ----------
function unify(rows: RawRow[]): UnifiedRow[] {
  if (!rows || rows.length === 0) return [];

  const { productKey, qtyKey, skuKey, unitKey } = inferHeaders(rows);

  const bag = new Map<string, (UnifiedRow & { _count: number })>();

  for (const r of rows) {
    const productVal = readCell(r, productKey, CANDS.product);
    const qtyVal     = readCell(r, qtyKey,     CANDS.qty);
    const skuVal     = readCell(r, skuKey,     CANDS.sku);
    const unitVal    = readCell(r, unitKey,    CANDS.unit);

    const key = norm(productVal);
    if (!key) continue;

    const qty = toNumber(qtyVal);

    const row: UnifiedRow = {
      product: String(productVal ?? "").toLowerCase(),
      sku: skuVal ? String(skuVal) : undefined,
      unit: unitVal ? String(unitVal).toLowerCase() : undefined,
      quantity: qty,
      mergedCount: 1,
    };

    const prev = bag.get(key);
    if (!prev) bag.set(key, { ...row, _count: 1 });
    else {
      prev.quantity += row.quantity;
      prev.mergedCount += 1;
      prev._count += 1;
      bag.set(key, prev);
    }
  }

  return Array.from(bag.values()).map(({ _count, ...row }) => row);
}


  

  // ---------- Guardar lista (saved_lists) ----------
  async function saveCurrentList(defaultName = 'Mi lista') {
  const name = window.prompt('Nombre para guardar esta lista:', defaultName)?.trim()
  if (!name) return
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return alert('Inicia sesión.')

  // En la tabla solo existe "data".
  const payload = { user_id: user.id, name, data: { raw: rawRows, unified } }

  const { error } = await supabase.from('saved_lists').insert(payload)
  if (error) alert('No se pudo guardar: ' + error.message)
  else alert('Lista guardada.')
}

  // --- Filas para PDF ---
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

  // ---------- Exportar CSV (Carrito Rápido) ----------
  function downloadCartCsv(rows: {
    product: string
    provider: string
    price: number
    shipping: number
    qty: number
    affiliateUrl?: string
  }[], filename = 'carrito_rapido.csv') {
    const headers = [
      'producto', 'proveedor', 'precio', 'envio',
      'total_unidad', 'cantidad', 'total_linea', 'enlace_compra'
    ]
    const lines = rows.map(r => {
      const unit = r.price + r.shipping
      const line = unit * r.qty
      const q = (v: any) => typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : String(v)
      return [
        q(r.product), q(r.provider),
        (r.price).toFixed(2), (r.shipping).toFixed(2),
        (unit).toFixed(2), r.qty,
        (line).toFixed(2), q(r.affiliateUrl ?? '')
      ].join(',')
    })
    const csv = [headers.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadCsv = () => {
    if (!compareRows.length) return
    const best = compareRows
      .filter(r => r.selected)
      .map(r => ({
        product: r.product,
        provider: r.selected!.provider,
        price: r.selected!.price,
        shipping: r.selected!.shipping,
        qty: r.quantity,
        affiliateUrl: r.selected!.affiliateUrl,
      }))
    if (best.length === 0) return
    downloadCartCsv(best, 'carrito_rapido.csv')
  }



// ---------- Comparar precios (rápido y robusto) ----------
const handleCompareHere = async () => {
  if (!canCompare) return
  setLoading(true)
  setAlerts([])

  const { data: { user } } = await supabase.auth.getUser()

  const norm = (s: any) =>
    String(s ?? '')
      .normalize('NFD').replace(/\p{Diacritic}/gu, '')
      .replace(/\s+/g, ' ')
      .trim()

  const sample = unified
    .slice(0, planLimit)
    .map(u => ({ product: norm(u.product), quantity: u.quantity || 1 }))
    .filter(it => it.product.length > 1)

  // timeout helper
  const withTimeout = <T,>(p: Promise<T>, ms = 6000): Promise<T> =>
    Promise.race([
      p,
      new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)),
    ])

  try {
    // ejecuta todas pero sin bloquearse si una falla o tarda
    const MAX_OFFERS_PER_ITEM = 3;

    const settled = await Promise.allSettled(
      sample.map(async (item) => {
        const raw = await withTimeout(searchOffers(item.product, user?.id), 6000);
        const offers = collapseByProvider(raw).slice(0, MAX_OFFERS_PER_ITEM);
        const selected = bestOffer(offers);
        return { ...item, offers, selected } as CompareRow;
      })
    );

    const rows: CompareRow[] = settled.map((s, i) =>
      s.status === 'fulfilled'
        ? s.value
        : ({ ...sample[i], offers: [], selected: undefined } as CompareRow)
    );


    setCompareRows(rows)

    const total = rows.reduce((acc, r) => {
      const unit = r.selected ? r.selected.price + r.selected.shipping : 0
      return acc + unit * r.quantity
    }, 0)
    setGrandTotal(total)

    if (user) {
      const toPersist = rows
        .filter(r => r.selected)
        .map(r => ({ product: r.product, quantity: r.quantity, chosen: r.selected! }))
      if (toPersist.length > 0) await saveHistory(user.id, toPersist)

      const news: { product: string; provider: string; message: string }[] = []
      for (const r of rows) {
        if (!r.selected) continue
        const sel = r.selected
        const unit = sel.price + sel.shipping

        const prev = await lastTotalFor(user.id, r.product, sel.provider)
        if (typeof prev === 'number' && prev > 0 && unit < prev) {
          const drop = (prev - unit) / prev
          if (drop >= 0.05) {
            await createAlert(user.id, r.product, sel.provider, 'PRICE_DROP', prev, unit)
            news.push({ product: r.product, provider: sel.provider, message: `Baja de precio ${(drop * 100).toFixed(1)}%` })
          }
        }

        if (sel.available && typeof sel.prevTotal === 'number' && sel.prevTotal === 0 && unit > 0) {
          await createAlert(user.id, r.product, sel.provider, 'BACK_IN_STOCK', sel.prevTotal, unit)
          news.push({ product: r.product, provider: sel.provider, message: 'Disponible nuevamente' })
        }
      }
      setAlerts(news)
    }
  } finally {
    setLoading(false)
  }
}



  // Limpiar borrador
  const handleClearDraft = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await clearWorkingList(user.id)
    setRawRows([]); setUnified([]); setCompareRows([]); setAlerts([]); setGrandTotal(0); setCsvError(null)
  }

  // ---------- UI ----------
return (
  <div className="page-list">
    {/* === 1) Subir lista === */}
    <div className="card-soft list-upload">
      <h2 style={{ margin: '0 0 6px' }}>1) Subir lista (CSV/XLSX)</h2>

      <div style={{ margin: '4px 0 8px' }}>
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          style={{ display: 'block', width: '100%' }}
        />
      </div>

      <p className="muted">
        Columnas recomendadas: <strong>nombre</strong> y <strong>cantidad</strong> (acepta equivalentes en español o inglés).
      </p>

      {csvError && (
        <p className="muted" style={{ color: '#ffb4b4' }}>{csvError}</p>
      )}

      {(rawRows.length || unified.length) > 0 && (
        <div className="actions-row">
          <button className="btn btn-ghost btn-sm" onClick={handleClearDraft}>
            Limpiar borrador
          </button>
        </div>
      )}
    </div>

    {/* === 3) Lista unificada === */}
    <div className="card-soft stack-md" style={{ marginTop: 16 }}>
      <h3 className="section-title">3) Lista unificada</h3>

      {unifiedCount === 0 ? (
        <p className="muted">Aún no hay datos unificados.</p>
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>SKU</th>
                  <th className="center">Cantidad total</th>
                  <th className="center">Unidad</th>
                  <th className="center">Filas unificadas</th>
                </tr>
              </thead>
              <tbody>
                {unified.map((u, i) => (
                  <tr key={i}>
                    <td style={{ textTransform: 'capitalize' }}>{u.product}</td>
                    <td>{u.sku ?? '—'}</td>
                    <td className="center">{u.quantity}</td>
                    <td className="center">{u.unit ?? '—'}</td>
                    <td className="center">{u.mergedCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="muted">Filas unificadas: <strong>{unifiedCount}</strong></div>

          <div className="actions-row">
            <button className="btn btn-sm" onClick={handleCompareHere} disabled={loading}>
              {loading ? 'Procesando…' : 'Comparar precios'}
            </button>
            <button className="btn btn-sm" onClick={() => saveCurrentList('Mi lista')}>
              Guardar lista
            </button>
          </div>

          <p className="muted foot-note">
            Plan <strong style={{ textTransform: 'capitalize' }}>{plan}</strong>: se comparan hasta <strong>{planLimit}</strong> productos.
          </p>
        </>
      )}
    </div>

    {/* === 4) Resultados del comparativo === */}
{compareRows.length > 0 && (
  <div className="card-soft stack-md" style={{ marginTop: 16 }}>
    <h3 className="section-title">4) Resultados del comparativo</h3>

    {alerts.length > 0 && (
      <div className="card-soft" style={{ marginTop: 8 }}>
        <h3 className="section-title">Alertas</h3>
        <ul className="stack-md" style={{ marginTop: 6 }}>
          {alerts.map((a, i) => (
            <li key={i}>[{a.provider}] {a.product}: {a.message}</li>
          ))}
        </ul>
      </div>
    )}

    <div className="card-soft" style={{ marginTop: 12 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
        <div>
          <h4 className="section-title" style={{ marginBottom: 4 }}>Resumen</h4>
          <p>Total del carrito: <strong>${grandTotal.toFixed(2)}</strong></p>
        </div>
        <div className="actions-row" style={{ justifyContent: 'flex-start' }}>
          <button
            className="btn btn-sm"
            onClick={() => downloadComparePdf({
              title: 'Comparativo de precios — Mi Lista Inteligente',
              rows: rowsForPdf,
              grandTotal,
            })}
          >
            Descargar PDF
          </button>
          <button className="btn btn-sm" onClick={handleDownloadCsv}>
            Descargar CSV (Carrito rápido)
          </button>
        </div>
      </div>
    </div>

    <div className="compare-wrap">
      <table className="compare">
        <colgroup>
          <col className="c-product" />
          <col className="c-provider" />
          <col className="c-price" />
          <col className="c-ship" />
          <col className="c-unit" />
          <col className="c-qty" />
          <col className="c-line" />
          <col className="c-avail" />
          <col className="c-buy" />
        </colgroup>
        <thead>
          <tr>
            <th className="col-product">Producto</th>
            <th className="col-provider">Proveedor</th>
            <th className="col-price center">Precio</th>
            <th className="col-ship center">Envío</th>
            <th className="col-unit center">Total (unidad)</th>
            <th className="col-qty center">Cantidad</th>
            <th className="col-line center">Total (línea)</th>
            <th className="col-avail center">Disp.</th>
            <th className="col-buy center">Comprar</th>
          </tr>
        </thead>
        <tbody>
          {compareRows.flatMap((r) =>
            r.offers.map((o, idx) => {
              const unit = o.price + o.shipping;
              const line = unit * r.quantity;
              const isBest = r.selected?.provider === o.provider;

              return (
                <tr key={`${r.product}-${o.provider}-${idx}`} className={isBest ? 'best-row' : ''}>
                  <td className="wrap2">{r.product}</td>
                  <td className="provider-cell">
                    <span className="provider-txt">{o.provider}</span>
                    {isBest && <span className="badge-best">Mejor opción</span>}
                  </td>
                  <td className="center num">${o.price.toFixed(2)}</td>
                  <td className="center num col-ship">${o.shipping.toFixed(2)}</td>
                  <td className="center num">${unit.toFixed(2)}</td>
                  <td className="center num">{r.quantity}</td>
                  <td className="center num">${line.toFixed(2)}</td>
                  <td className="center">{o.available ? <span className="pill ok">Sí</span> : <span className="pill no">No</span>}</td>
                  <td className="center">
                    {o.affiliateUrl ? (
                      <a
                        className="btn-buy"
                        href={o.affiliateUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        onClick={() => trackClick(r.product, o.provider, o.affiliateUrl)}
                      >
                        Comprar
                      </a>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  </div>
)}

</div> 
); 
}