import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient'; // esta ruta es correcta porque este archivo vive en src/lib/
import { usePlan } from './plan';            // si tu usePlan está en otro lugar, ajusta la ruta

export type AppPlan = 'free' | 'premium' | 'b2b';

export function useSandboxPayments() {
  const { plan, setPlan } = usePlan();
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>('');

  useEffect(() => { setStatus(''); }, [plan]);

  const simulatePayment = async (target: AppPlan) => {
    setSaving(true);
    setStatus('Procesando pago en sandbox…');
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { error } = await supabase
          .from('user_plans')
          .upsert({
            user_id: user.id,
            plan: target,
            updated_at: new Date().toISOString(),
          });
        if (error) throw error;

        setPlan(target);
        setStatus(`Plan actualizado a ${target.toUpperCase()} (sandbox)`);
      } else {
        setPlan(target);
        setStatus(`Plan (local) actualizado a ${target.toUpperCase()}`);
      }
    } catch (e: any) {
      setPlan(target);
      setStatus(`Plan (local) actualizado — sin persistencia en DB (${e?.message || 'error'})`);
    } finally {
      setSaving(false);
    }
  };

  return { plan, saving, status, simulatePayment };
}
