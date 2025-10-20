import { supabase } from './supabaseClient'

export type WorkingList = {
  id: string
  user_id: string
  name: string | null
  raw: any[]
  unified: any[]
  updated_at: string
}

const nowIso = () => new Date().toISOString()

/**
 * Guarda/actualiza el borrador del usuario.
 * 1) Intenta UPSERT por UNIQUE(user_id)  → requiere la constraint que ya agregamos en SQL.
 * 2) Si el backend no tiene esa constraint y devuelve 400 on_conflict, hace:
 *    - busca el último borrador del usuario
 *    - si existe → UPDATE por id
 *    - si no    → INSERT
 */
export async function upsertWorkingList(
  userId: string,
  data: { name?: string; raw: any[]; unified: any[] }
) {
  // ---- intento A: UPSERT por user_id (lo ideal)
  const upsertRes = await supabase
    .from('working_lists')
    .upsert(
      [
        {
          user_id: userId,
          name: data.name ?? null,
          raw: data.raw,
          unified: data.unified,
          updated_at: nowIso(),
        },
      ],
      { onConflict: 'user_id' }
    )

  if (!upsertRes.error) return

  const errMsg = (upsertRes.error?.message || '').toLowerCase()
  const isOnConflictIssue =
    errMsg.includes('on_conflict') || errMsg.includes('on conflict') || upsertRes.status === 400

  if (!isOnConflictIssue) {
    // Otro tipo de error: propágalo
    throw upsertRes.error
  }

  // ---- intento B: buscar el último borrador y actualizar por id; si no hay, insertar
  const { data: existing, error: qErr } = await supabase
    .from('working_lists')
    .select<'id'>('id')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)

  if (qErr) throw qErr

  if (existing && existing.length > 0) {
    const { error: updErr } = await supabase
      .from('working_lists')
      .update({
        name: data.name ?? null,
        raw: data.raw,
        unified: data.unified,
        updated_at: nowIso(),
      })
      .eq('id', existing[0].id)

    if (updErr) throw updErr
  } else {
    const { error: insErr } = await supabase.from('working_lists').insert([
      {
        user_id: userId,
        name: data.name ?? null,
        raw: data.raw,
        unified: data.unified,
        updated_at: nowIso(),
      },
    ])
    if (insErr) throw insErr
  }
}

export async function fetchLatestWorkingList(userId: string) {
  const { data, error } = await supabase
    .from('working_lists')
    .select('id, user_id, name, raw, unified, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return (data as WorkingList | null) ?? null
}

export async function clearWorkingList(userId: string) {
  const { error } = await supabase.from('working_lists').delete().eq('user_id', userId)
  if (error) throw error
}
