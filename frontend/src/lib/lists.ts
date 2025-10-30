// frontend/src/lib/lists.ts
import { supabase } from './supabaseClient'

export async function listLists() {
  return supabase
    .from('saved_lists')
    .select('id,name,created_at')
    .order('created_at', { ascending: false })
}

export async function getList(id: string) {
  return supabase
    .from('saved_lists')
    .select('id,name,created_at,data')
    .eq('id', id)
    .single()
}

export async function renameList(id: string, name: string) {
  return supabase
    .from('saved_lists')
    .update({ name })
    .eq('id', id)
}

export async function removeList(id: string) {
  return supabase
    .from('saved_lists')
    .delete()
    .eq('id', id)
}
