import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

type WorkingList = { id: string; name: string; updated_at: string }

export default function ShareList() {
  const [lists, setLists] = useState<WorkingList[]>([])
  const [selected, setSelected] = useState<string>('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'viewer'|'editor'>('viewer')
  const [msg, setMsg] = useState('')

  const loadLists = async () => {
    const { data, error } = await supabase
      .from('working_lists')
      .select('id,name,updated_at')
      .order('updated_at', { ascending: false })
      .limit(25)
    if (!error) setLists(data as WorkingList[])
  }

  useEffect(() => { loadLists() }, [])

  const share = async () => {
    if (!selected || !email.trim()) return
    setMsg('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Inicia sesión')

      const { error } = await supabase.from('shared_lists').insert({
        working_list_id: selected,
        owner_id: user.id,
        invitee_email: email.trim().toLowerCase(),
        role
      })
      if (error) throw error
      setMsg('Compartido registrado (interno)')
      setEmail('')
    } catch (e: any) {
      setMsg(`Error: ${e.message || e}`)
    }
  }

  return (
    <div className="container">
      <div className="card">
        <h2>Compartir listas (interno)</h2>
        <p className="muted">Registra un acceso por correo para una lista (viewer/editor). Para demo de Sprint 6.</p>

        <div style={{ marginTop: 8 }}>
          <label>Selecciona una lista:</label>
          <select className="input" value={selected} onChange={e=>setSelected(e.target.value)}>
            <option value="">—</option>
            {lists.map(l => (
              <option key={l.id} value={l.id}>
                {l.name || 'Borrador'} — {new Date(l.updated_at).toLocaleString()}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:8 }}>
          <input className="input" placeholder="correo@dominio.com" value={email} onChange={e=>setEmail(e.target.value)} />
          <select className="input" value={role} onChange={e=>setRole(e.target.value as 'viewer' | 'editor')}>
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
          </select>
          <button className="btn" onClick={share}>Compartir</button>
        </div>

        {msg && <p className="muted" style={{ marginTop: 8 }}>{msg}</p>}
      </div>
    </div>
  )
}
