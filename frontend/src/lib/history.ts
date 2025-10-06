// frontend/src/lib/history.ts
import { supabase } from './supabaseClient'
import type { Offer } from './providers'

/** Guarda el historial de precios (elección del usuario). */
export async function saveHistory(
  userId: string,
  rows: { product: string; quantity: number; chosen: Offer }[]
) {
  const payload = rows.map(r => ({
    user_id: userId,
    product: r.product,
    provider: r.chosen.provider,
    price: r.chosen.price,
    shipping: r.chosen.shipping,
    total_unit: r.chosen.price + r.chosen.shipping,
  }))
  const { error } = await supabase.from('price_history').insert(payload)
  if (error) throw error
}

/** Último total (precio+envío) registrado para comparar caídas de precio. */
export async function lastTotalFor(userId: string, product: string, provider: string) {
  const { data, error } = await supabase
    .from('price_history')
    .select('total_unit')
    .eq('user_id', userId)
    .eq('product', product)
    .eq('provider', provider)
    .order('captured_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data?.total_unit as number | undefined
}

/** Inserta una alerta (baja de precio o reabastecimiento). */
export async function createAlert(
  userId: string,
  product: string,
  provider: string,
  kind: 'PRICE_DROP' | 'BACK_IN_STOCK',
  prevTotal?: number,
  newTotal?: number
) {
  const { error } = await supabase.from('alerts').insert({
    user_id: userId,
    product,
    provider,
    kind,
    prev_total: prevTotal ?? null,
    new_total: newTotal ?? null,
  })
  if (error) throw error
}

/** Lista de alertas recientes. */
export async function fetchAlerts(userId: string) {
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data ?? []
}

/** Historial de precios (opcionalmente filtrado por producto). */
export async function fetchHistory(userId: string, product?: string) {
  let q = supabase
    .from('price_history')
    .select('*')
    .eq('user_id', userId)
    .order('captured_at', { ascending: false })
    .limit(200)
  if (product) q = q.ilike('product', `%${product}%`)
  const { data, error } = await q
  if (error) throw error
  return data ?? []
}

/** ✅ Registro de clics de afiliado (Sprint 4). */
export async function logAffiliateClick(
  userId: string,
  product: string,
  provider: string,
  affiliateUrl: string
) {
  const { error } = await supabase.from('affiliate_clicks').insert({
    user_id: userId,
    product,
    provider,
    affiliate_url: affiliateUrl,
  })
  if (error) throw error
}
