import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

type Team = { id: string; name: string };
type Member = { user_email: string; full_name: string | null; role: string };

const ROLE_OPTIONS = [
  { value: 'viewer',    label: 'Lector' },
  { value: 'editor',    label: 'Editor' },
  { value: 'commenter', label: 'Comentarista' },
  { value: 'guest',     label: 'Invitado' },
] as const;

const roleLabel = (value: string) =>
  ROLE_OPTIONS.find(r => r.value === value)?.label ?? value;

type AddForm = { full_name: string; email: string; role: string };
type EditForm = { full_name: string; email: string; role: string };

export default function Teams() {
  // Equipos
  const [teams, setTeams] = useState<Team[]>([]);
  // Miembros por equipo
  const [membersByTeam, setMembersByTeam] = useState<Record<string, Member[]>>({});
  // Formulario de alta por equipo
  const [addForm, setAddForm] = useState<Record<string, AddForm>>({});
  // Edición de nombre de equipo
  const [renamingTeamId, setRenamingTeamId] = useState<string | null>(null);
  const [newTeamName, setNewTeamName] = useState('');
  // Edición de miembro por equipo+email
  const [editingKey, setEditingKey] = useState<string | null>(null); // `${teamId}::${email}`
  const [editForm, setEditForm] = useState<EditForm>({ full_name: '', email: '', role: 'viewer' });

  // Crear equipo (campo superior)
  const [newTeam, setNewTeam] = useState('');
  // UI
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // ===== Carga =====
  const loadTeams = async () => {
    const { data, error } = await supabase
      .from('teams')
      .select('id,name')
      .order('created_at', { ascending: false });

    if (error) return;

    const list = (data ?? []) as Team[];
    setTeams(list);

    const ids = list.map(t => t.id);
    if (ids.length) {
      const { data: mdata, error: merror } = await supabase
        .from('team_members')
        .select('team_id,user_email,full_name,role')
        .in('team_id', ids);

      if (!merror) {
        const bucket: Record<string, Member[]> = {};
        ids.forEach(id => (bucket[id] = []));
        (mdata ?? []).forEach((row: any) => {
          const team_id: string = row.team_id;
          const m: Member = {
            user_email: row.user_email,
            full_name: row.full_name,
            role: row.role,
          };
          (bucket[team_id] ??= []).push(m);
        });
        setMembersByTeam(bucket);
      }
    } else {
      setMembersByTeam({});
    }

    // inicializar formularios de alta
    const forms: Record<string, AddForm> = {};
    list.forEach(t => {
      forms[t.id] = { full_name: '', email: '', role: 'viewer' };
    });
    setAddForm(forms);
  };

  useEffect(() => { loadTeams(); }, []);



  const [confirmDlg, setConfirmDlg] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  } | null>(null);

  function askConfirm(opts: {
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  }) {
    setConfirmDlg({ open: true, ...opts });
  }




  // ===== Acciones de Equipo =====
  const createTeam = async () => {
    if (!newTeam.trim()) return;
    setLoading(true); setMsg('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Inicia sesión');

      const { data, error } = await supabase
        .from('teams')
        .insert({ name: newTeam.trim(), owner_id: user.id })
        .select('id,name')
        .single();

      if (error) throw error;

      const created = data as Team;
      setTeams(t => [created, ...t]);
      setMembersByTeam(m => ({ [created.id]: [], ...m }));
      setAddForm(f => ({ [created.id]: { full_name: '', email: '', role: 'viewer' }, ...f }));
      setNewTeam('');
      setMsg('Equipo creado');
    } catch (e: any) {
      setMsg(`Error: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  const startRename = (teamId: string, currentName: string) => {
    setRenamingTeamId(teamId);
    setNewTeamName(currentName);
  };

  const cancelRename = () => {
    setRenamingTeamId(null);
    setNewTeamName('');
  };

  const saveRename = async (teamId: string) => {
    const trimmed = newTeamName.trim();
    if (!trimmed) return;
    setLoading(true); setMsg('');
    try {
      const { error } = await supabase.from('teams').update({ name: trimmed }).eq('id', teamId);
      if (error) throw error;
      setTeams(ts => ts.map(t => (t.id === teamId ? { ...t, name: trimmed } : t)));
      cancelRename();
      setMsg('Nombre de equipo actualizado');
    } catch (e: any) {
      setMsg(`Error: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteTeam = (teamId: string) => {
  askConfirm({
    title: 'Eliminar equipo',
    message: 'Esta acción no se puede deshacer.',
    confirmText: 'Eliminar definitivamente',
    onConfirm: async () => {
      setLoading(true); setMsg('');
      try {
        await supabase.from('team_members').delete().eq('team_id', teamId);
        const { error } = await supabase.from('teams').delete().eq('id', teamId);
        if (error) throw error;

        setTeams(ts => ts.filter(t => t.id !== teamId));
        setMembersByTeam(m => {
          const next = { ...m };
          delete next[teamId];
          return next;
        });

        setMsg('Equipo eliminado');
      } catch (e: any) {
        setMsg(`Error: ${e.message || e}`);
      } finally {
        setLoading(false);
      }
    }
  });
  };


  // ===== Acciones de Miembros =====
  const addMember = async (teamId: string) => {
    const form = addForm[teamId];
    if (!form || !form.email.trim()) return;
    setLoading(true); setMsg('');
    try {
      const payload = {
        team_id: teamId,
        user_email: form.email.trim().toLowerCase(),
        full_name: form.full_name.trim() || null,
        role: form.role,
      };
      const { error } = await supabase.from('team_members').insert(payload);
      if (error) throw error;

      setMembersByTeam(m => ({
        ...m,
        [teamId]: [{ user_email: payload.user_email, full_name: payload.full_name, role: payload.role }, ...(m[teamId] ?? [])],
      }));
      setAddForm(f => ({ ...f, [teamId]: { full_name: '', email: '', role: 'viewer' } }));
      setMsg('Miembro agregado');
    } catch (e: any) {
      setMsg(`Error: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  const removeMember = (teamId: string, email: string) => {
  askConfirm({
    title: 'Eliminar miembro',
    message: `¿Seguro que deseas eliminar a ${email} de este equipo?`,
    confirmText: 'Eliminar miembro',
    onConfirm: async () => {
      setLoading(true); setMsg('');
      try {
        const { error } = await supabase
          .from('team_members')
          .delete()
          .eq('team_id', teamId)
          .eq('user_email', email);
        if (error) throw error;

        setMembersByTeam(m => ({
          ...m,
          [teamId]: (m[teamId] ?? []).filter(x => x.user_email !== email),
        }));
        setMsg('Miembro eliminado');
      } catch (e: any) {
        setMsg(`Error: ${e.message || e}`);
      } finally {
        setLoading(false);
      }
    }
  });
  };


  const startEditMember = (teamId: string, m: Member) => {
    setEditingKey(`${teamId}::${m.user_email}`);
    setEditForm({
      email: m.user_email,
      full_name: m.full_name ?? '',
      role: m.role,
    });
  };

  const cancelEditMember = () => {
    setEditingKey(null);
  };

  const saveEditMember = async (teamId: string, originalEmail: string) => {
    const next = {
      user_email: editForm.email.trim().toLowerCase(),
      full_name: editForm.full_name.trim() || null,
      role: editForm.role,
    };
    setLoading(true); setMsg('');
    try {
      const { error } = await supabase
        .from('team_members')
        .update(next)
        .eq('team_id', teamId)
        .eq('user_email', originalEmail);
      if (error) throw error;

      setMembersByTeam(m => ({
        ...m,
        [teamId]: (m[teamId] ?? []).map(x =>
          x.user_email === originalEmail ? { user_email: next.user_email, full_name: next.full_name, role: next.role } : x
        ),
      }));
      setEditingKey(null);
      setMsg('Miembro actualizado');
    } catch (e: any) {
      setMsg(`Error: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  const inviteMember = async (teamId: string, toEmail: string, roleToGrant: string) => {
    setLoading(true); setMsg('');
    try {
      const token = crypto.randomUUID();
      const link = `${window.location.origin}/accept?token=${token}&team=${teamId}&email=${encodeURIComponent(
        toEmail
      )}&role=${roleToGrant}`;
      await navigator.clipboard.writeText(link);
      setMsg('Invitación generada y copiada al portapapeles.');
    } catch (e: any) {
      setMsg(`Error: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  // ===== Render =====
  return (
    <div className="container">
      <div className="card">
        <h2>Equipos y Roles</h2>
        <p className="muted">Crea un equipo, agrega miembros por correo y asígnales rol.</p>

        {/* Crear equipo */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          <input
            className="input"
            placeholder="Nombre del equipo"
            value={newTeam}
            onChange={e => setNewTeam(e.target.value)}
            style={{ minWidth: 220 }}
          />
          <button className="btn" onClick={createTeam} disabled={loading}>Crear equipo</button>
        </div>

        {/* Listado de equipos (siempre visibles) */}
        <div className="stack-md" style={{ marginTop: 16 }}>
          {teams.map(t => {
            const members = membersByTeam[t.id] ?? [];
            const isRenaming = renamingTeamId === t.id;

            return (
              <div key={t.id} className="card-soft" style={{ paddingTop: 14, paddingBottom: 14 }}>
                {/* Encabezado de equipo */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  {!isRenaming ? (
                    <>
                      <h3 style={{ margin: 0 }}>{t.name}</h3>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button className="btn btn-sm" onClick={() => startRename(t.id, t.name)} disabled={loading}>Renombrar</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => deleteTeam(t.id)} disabled={loading}>Eliminar</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <input
                        className="input"
                        value={newTeamName}
                        onChange={e => setNewTeamName(e.target.value)}
                        style={{ minWidth: 220 }}
                      />
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button className="btn btn-sm" onClick={() => saveRename(t.id)} disabled={loading}>Guardar</button>
                        <button
                          className="btn btn-sm"
                          onClick={() => setConfirmDlg(null)}
                          style={{
                            background: '#fff',
                            color: '#0f172a',
                            border: '1px solid #cbd5e1',
                            boxShadow: 'none'
                          }}
                        >
                          Cancelar
                        </button>



                      </div>
                    </>
                  )}
                </div>

                {/* Alta de miembro inline */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                  <input
                    className="input"
                    placeholder="Nombre"
                    value={addForm[t.id]?.full_name ?? ''}
                    onChange={e => setAddForm(f => ({ ...f, [t.id]: { ...(f[t.id] ?? { email: '', role: 'viewer', full_name: '' }), full_name: e.target.value } }))}
                  />
                  <input
                    className="input"
                    placeholder="correo@dominio.com"
                    value={addForm[t.id]?.email ?? ''}
                    onChange={e => setAddForm(f => ({ ...f, [t.id]: { ...(f[t.id] ?? { email: '', role: 'viewer', full_name: '' }), email: e.target.value } }))}
                    style={{ minWidth: 220 }}
                  />
                  <select
                    className="input"
                    value={addForm[t.id]?.role ?? 'viewer'}
                    onChange={e => setAddForm(f => ({ ...f, [t.id]: { ...(f[t.id] ?? { email: '', role: 'viewer', full_name: '' }), role: e.target.value } }))}
                  >
                    {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                  <button className="btn btn-ghost btn-sm" onClick={() => addMember(t.id)} disabled={loading}>Agregar</button>
                </div>

                {/* Miembros */}
                <div className="table-card" style={{ marginTop: 12 }}>
                  <table className="table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Correo</th>
                        <th>Rol</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.length === 0 && (
                        <tr><td colSpan={4} className="muted">Sin miembros</td></tr>
                      )}
                      {members.map(m => {
                        const key = `${t.id}::${m.user_email}`;
                        const isEditing = editingKey === key;
                        return (
                          <tr key={m.user_email}>
                            <td>
                              {isEditing ? (
                                <input
                                  className="input"
                                  value={editForm.full_name}
                                  onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))}
                                />
                              ) : (m.full_name ?? '—')}
                            </td>
                            <td>
                              {isEditing ? (
                                <input
                                  className="input"
                                  value={editForm.email}
                                  onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                                />
                              ) : m.user_email}
                            </td>
                            <td>
                              {isEditing ? (
                                <select
                                  className="input"
                                  value={editForm.role}
                                  onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                                >
                                  {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                </select>
                              ) : roleLabel(m.role)}
                            </td>
                            <td style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              {!isEditing ? (
                                <>
                                  <button className="btn btn-ghost btn-sm" onClick={() => startEditMember(t.id, m)} disabled={loading}>Editar</button>
                                  <button className="btn btn-ghost btn-sm" onClick={() => removeMember(t.id, m.user_email)} disabled={loading}>Eliminar</button>
                                  <button className="btn btn-ghost btn-sm" onClick={() => inviteMember(t.id, m.user_email, m.role)} disabled={loading}>Invitar</button>
                                </>
                              ) : (
                                <>
                                  <button className="btn btn-sm" onClick={() => saveEditMember(t.id, m.user_email)} disabled={loading}>Guardar</button>
                                  <button className="btn btn-ghost btn-sm" onClick={cancelEditMember} disabled={loading}>Cancelar</button>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>

        {msg && <p className="muted" style={{ marginTop: 8 }}>{msg}</p>}
      </div>
      {confirmDlg?.open && (
  <div className="modal-backdrop" onClick={() => setConfirmDlg(null)}>
    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
      <h3 style={{ margin: 0 }}>{confirmDlg.title}</h3>
      <p style={{ marginTop: 8 }}>{confirmDlg.message}</p>

      {/* ←——— PEGA ESTO ASÍ, SIN CLASES EN LOS BOTONES ———→ */}
      <div className="modal-actions">
        <button
          type="button"
          onClick={() => setConfirmDlg(null)}
          style={{
            background: '#ffffff',
            color: '#0f172a',
            border: '1px solid #cbd5e1',
            borderRadius: 10,
            padding: '8px 12px',
            fontSize: 14,
            lineHeight: 1,
            cursor: 'pointer',
            boxShadow: 'none'
          }}
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={async () => {
            setConfirmDlg(null);
            await confirmDlg.onConfirm();
          }}
          style={{
            background: '#b42318',
            color: '#ffffff',
            border: '1px solid rgba(0,0,0,.15)',
            borderRadius: 10,
            padding: '8px 12px',
            fontSize: 14,
            lineHeight: 1,
            cursor: 'pointer',
            boxShadow: 'none'
          }}
        >
          {confirmDlg.confirmText ?? 'Eliminar'}
        </button>
      </div>
      {/* ←——————————————————————————————————————————————→ */}
    </div>
  </div>
)}


</div>
  );
}
