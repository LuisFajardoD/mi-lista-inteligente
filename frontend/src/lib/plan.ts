// frontend/src/lib/plan.ts
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export type PlanName = 'free'|'premium'|'b2b';

export async function getPlan() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { plan: 'free' as PlanName, error: null };
  const { data, error } = await supabase
    .from('user_plans')
    .select('plan')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) return { plan: 'free' as PlanName, error };
  return { plan: (data?.plan ?? 'free') as PlanName, error: null };
}

export async function setPlan(next: PlanName) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No auth');
  const { error } = await supabase
    .from('user_plans')
    .upsert({ user_id: user.id, plan: next, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export function usePlan() {
  const [plan, set] = useState<PlanName>('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { plan } = await getPlan();
      set(plan);
      setLoading(false);
    })();
  }, []);

  return { plan, loading, refresh: async () => {
    const { plan } = await getPlan();
    set(plan);
  }, setPlan: (next: PlanName) => set(next) };
}
