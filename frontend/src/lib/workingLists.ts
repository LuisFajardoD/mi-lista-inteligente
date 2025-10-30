// frontend/src/lib/workingLists.ts
import { supabase } from './supabaseClient'

export type WorkingList = {
  id: string
  user_id: string
  name: string | null
  raw: any[] | null
  unified: any[] | null
  created_at?: string | null
  updated_at?: string | null
}

/* ======== BORRADOR (working_lists) ======== */

// Upsert por usuario (requiere UNIQUE(user_id) en DB)
export async function upsertWorkingList(
  userId: string,
  payload: { name?: string; raw?: any[]; unified?: any[] }
) {
  const { data, error } = await supabase
    .from('working_lists')
    .upsert(
      {
        user_id: userId,
        name: payload.name ?? 'Borrador',
        raw: payload.raw ?? [],
        unified: payload.unified ?? [],
        // aunque tengas trigger, enviamos updated_at para compatibilidad
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (error) throw error
  return data as WorkingList
}

// Como user_id es UNIQUE, podemos usar single() directo
export async function fetchLatestWorkingList(userId: string) {
  try {
    const { data, error } = await supabase
      .from('working_lists')
      .select('id,user_id,name,raw,unified,updated_at,created_at')
      .eq('user_id', userId)
      .single()

    // PGRST116 = no row found
    if (error && (error as any).code !== 'PGRST116') {
      console.warn('fetchLatestWorkingList error:', error)
      return null
    }
    return (data ?? null) as WorkingList | null
  } catch (e) {
    console.warn('fetchLatestWorkingList exception:', e)
    return null
  }
}

export async function clearWorkingList(userId: string) {
  const { error } = await supabase.from('working_lists').delete().eq('user_id', userId)
  if (error) throw error
}

/* ======== LISTAS GUARDADAS (saved_lists) ======== */

export async function listSaved(userId: string) {
  const { data, error } = await supabase
    .from('saved_lists')
    .select('id,name,data,created_at,updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) throw error

  // Normaliza por si updated_at es null (primeras filas antes del trigger)
  return (data ?? []).map((r: any) => ({
    id: r.id,
    user_id: userId,
    name: r.name ?? null,
    raw: null, // no lo pedimos en el listado
    unified: (r.data?.unified ?? []) as any[],
    created_at: r.created_at ?? null,
    updated_at: r.updated_at ?? r.created_at ?? null,
  })) as WorkingList[]
}

export async function openListIntoDraft(userId: string, savedListId: string) {
  const { data, error } = await supabase
    .from('saved_lists')
    .select('name,data')
    .eq('id', savedListId)
    .single();
  if (error) throw error;

  return upsertWorkingList(userId, {
    name: (data as any)?.name ?? 'Borrador desde lista',
    raw: (data as any)?.data?.raw ?? [],
    unified: (data as any)?.data?.unified ?? [],
  });
}


export async function renameList(id: string, name: string) {
  const { error } = await supabase.from('saved_lists').update({ name }).eq('id', id)
  if (error) throw error
}

export async function deleteList(id: string) {
  const { error } = await supabase.from('saved_lists').delete().eq('id', id)
  if (error) throw error
}
