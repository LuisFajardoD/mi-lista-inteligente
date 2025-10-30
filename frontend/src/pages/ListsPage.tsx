// frontend/src/pages/ListsPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { listLists, getList, renameList, removeList } from '../lib/lists';
import { upsertWorkingList } from '../lib/workingLists';

type SavedList = { id: string; name: string; created_at: string };

export default function ListsPage() {
  const [rows, setRows] = useState<SavedList[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setRows([]); setLoading(false); return; }

    const { data, error } = await listLists();
    if (error) console.error(error);
    setRows((data as SavedList[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function onOpen(id: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await getList(id);
    if (error || !data) { alert('No se pudo abrir la lista'); return; }

    const rec = data as any;
    const payload = rec?.data ?? {};
    const raw = Array.isArray(payload?.raw) ? payload.raw : [];
    const unified = Array.isArray(payload?.unified) ? payload.unified : [];
    const name = (rec?.name as string) ?? 'Borrador desde lista';

    await upsertWorkingList(user.id, { name, raw, unified });
    navigate('/upload');
  }

  async function onRename(id: string, current: string) {
    const name = window.prompt('Nuevo nombre:', current ?? '')?.trim();
    if (!name) return;
    const { error } = await renameList(id, name);
    if (error) alert(error.message);
    await load();
  }

  async function onDelete(id: string) {
    if (!window.confirm('¿Eliminar esta lista definitivamente?')) return;
    const { error } = await removeList(id);
    if (error) alert(error.message);
    await load();
  }

  async function onShare() {
    alert('Compartir lo reactivamos después; primero dejemos esto estable.');
  }

  return (
    <div className="list-page">
      <div className="card-soft">
        <h2 className="section-title">Listas guardadas</h2>

        {loading ? (
          <p className="muted">Cargando…</p>
        ) : rows.length === 0 ? (
          <p className="muted">Aún no tienes listas guardadas.</p>
        ) : (
          <>
            <div className="table-wrap" style={{ marginTop: 8 }}>
              <table className="table table-compact">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Fecha</th>
                    <th style={{ width: 360 }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>{r.name}</td>
                      <td>{new Date(r.created_at).toLocaleString()}</td>
                      <td>
                        <div className="actions-inline">
                          <button className="btn btn--compact" onClick={() => onOpen(r.id)}>Abrir</button>
                          <button className="btn btn--compact" onClick={() => onRename(r.id, r.name)}>Renombrar</button>
                          <button className="btn btn--compact outline" onClick={onShare}>Compartir</button>
                          <button className="btn btn--compact outline" onClick={() => onDelete(r.id)}>Borrar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>


              </table>
            </div>

            <p className="muted" style={{ marginTop: 8 }}>
              Consejo: usa nombres cortos y claros para encontrar tus listas más rápido.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
