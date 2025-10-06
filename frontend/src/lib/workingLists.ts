import { supabase } from './supabaseClient'

export type WorkingList = {
  id: string
  user_id: string
  name: string | null
  raw: any[]
  unified: any[]
  updated_at: string
}

export async function upsertWorkingList(
  userId: string,
  data: { name?: string; raw: any[]; unified: any[] }
) {
  // 1er intento: upsert por UNIQUE(user_id)
  const { error } = await supabase
    .from('working_lists')
    .upsert(
      {
        user_id: userId,
        name: data.name ?? null,
        raw: data.raw,
        unified: data.unified,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

  if (!error) return

  // Fallback: si onConflict falla (p.ej. UNIQUE aún no existe), borra y reinserta
  await supabase.from('working_lists').delete().eq('user_id', userId)

  const { error: e2 } = await supabase.from('working_lists').insert({
    user_id: userId,
    name: data.name ?? null,
    raw: data.raw,
    unified: data.unified,
    updated_at: new Date().toISOString(),
  })
  if (e2) throw e2
}

export async function fetchLatestWorkingList(userId: string) {
  const { data, error } = await supabase
    .from('working_lists')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle<WorkingList>()
  if (error) throw error
  return data ?? null
}

export async function clearWorkingList(userId: string) {
  const { error } = await supabase.from('working_lists').delete().eq('user_id', userId)
  if (error) throw error
}
