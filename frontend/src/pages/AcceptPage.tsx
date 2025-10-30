import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function AcceptPage() {
  const [sp] = useSearchParams();
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const token = sp.get('token');
        if (!token) { alert('Falta token'); return; }

        const { error } = await supabase.functions.invoke('accept-invite', {
          body: { token },
        });

        if (error) {
          alert(error.message);
        } else {
          alert('Invitación aceptada');
          nav('/lists');
        }
      } catch (e: any) {
        alert(e?.message ?? String(e));
      }
    })();
  }, [sp, nav]);

  return (
    <div className="wrap">
      <div className="card"><h2>Aceptando invitación…</h2></div>
    </div>
  );
}
