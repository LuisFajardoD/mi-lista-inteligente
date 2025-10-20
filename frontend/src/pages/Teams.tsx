import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

type Team = { id: string; name: string }
type Member = { user_email: string; role: 'owner'|'editor'|'viewer' }

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([])
  const [name, setName] = useState('')
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Member['role']>('viewer')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string>('')

  const loadTeams = async () => {
    const { data, error } = await supabase.from('teams').select('id,name').order('created_at', { ascending: false })
    if (!error) setTeams(data as Team[])
  }

  const loadMembers = async (teamId: string) => {
    const { data, error } = await supabase.from('team_members')
      .select('user_email,role')
      .eq('team_id', teamId)
      .order('added_at', { ascending: false })
    if (!error) setMembers(data as Member[])
  }

  useEffect(() => { loadTeams() }, [])
  useEffect(() => { if (selectedTeam) loadMembers(selectedTeam) }, [selectedTeam])

  const createTeam = async () => {
    if (!name.trim()) return
    setLoading(true)
    setMsg('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Inicia sesión')
      const { data, error } = await supabase.from('teams')
        .insert({ name, owner_id: user.id })
        .select('id,name').single()
      if (error) throw error
      setName('')
      setTeams([data as Team, ...teams])
      setMsg('Equipo creado')
    } catch (e: any) {
      setMsg(`Error: ${e.message || e}`)
    } finally {
      setLoading(false)
    }
  }

  const addMember = async () => {
    if (!selectedTeam || !email.trim()) return
    setLoading(true); setMsg('')
    try {
      const { error } = await supabase.from('team_members')
        .insert({ team_id: selectedTeam, user_email: email.trim().toLowerCase(), role })
      if (error) throw error
      setEmail('')
      await loadMembers(selectedTeam)
      setMsg('Miembro agregado')
    } catch (e: any) {
      setMsg(`Error: ${e.message || e}`)
    } finally {
      setLoading(false)
    }
  }

  const removeMember = async (user_email: string) => {
    if (!selectedTeam) return
    setLoading(true); setMsg('')
    try {
      const { error } = await supabase.from('team_members')
        .delete().eq('team_id', selectedTeam).eq('user_email', user_email)
      if (error) throw error
      await loadMembers(selectedTeam)
      setMsg('Miembro eliminado')
    } catch (e: any) {
      setMsg(`Error: ${e.message || e}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="card">
        <h2>Equipos y Roles</h2>
        <p className="muted">Crea un equipo, agrega miembros por correo y asígnales rol (owner/editor/viewer).</p>

        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:8 }}>
          <input className="input" placeholder="Nombre del equipo" value={name} onChange={e=>setName(e.target.value)} />
          <button className="btn" onClick={createTeam} disabled={loading}>Crear equipo</button>
        </div>

        <div style={{ marginTop:16 }}>
          <label>Seleccionar equipo:</label>
          <select className="input" value={selectedTeam ?? ''} onChange={e=>setSelectedTeam(e.target.value || null)}>
            <option value="">—</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        {selectedTeam && (
          <div className="card" style={{ marginTop:16 }}>
            <h3>Miembros</h3>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <input className="input" placeholder="correo@dominio.com" value={email} onChange={e=>setEmail(e.target.value)} />
              <select className="input" value={role} onChange={e=>setRole(e.target.value as Member['role'])}>
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
              </select>
              <button className="btn" onClick={addMember} disabled={loading}>Agregar</button>
            </div>

            <table style={{ marginTop:12 }}>
              <thead><tr><th>Correo</th><th>Rol</th><th></th></tr></thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.user_email}>
                    <td>{m.user_email}</td>
                    <td style={{ textTransform:'capitalize' }}>{m.role}</td>
                    <td><button className="btn" onClick={()=>removeMember(m.user_email)} disabled={loading}>Eliminar</button></td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr><td colSpan={3} className="muted">Sin miembros</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {msg && <p className="muted" style={{ marginTop:8 }}>{msg}</p>}
      </div>
    </div>
  )
}
