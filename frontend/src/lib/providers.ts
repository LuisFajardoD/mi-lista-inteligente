import { supabase } from './supabaseClient';

export type Offer = {
  provider: string;
  price: number;
  shipping: number;
  available: boolean;
  affiliateUrl?: string;
  prevTotal?: number;
  image?: string;
};

export const offerTotal = (o: Offer) => (o.price ?? 0) + (o.shipping ?? 0);

export function bestOffer(arr: Offer[]) {
  return arr.length ? [...arr].sort((a, b) => offerTotal(a) - offerTotal(b))[0] : undefined;
}

export function collapseByProvider(offers: Offer[]): Offer[] {
  const byProv = new Map<string, Offer>();
  for (const o of offers) {
    const key = (o.provider ?? '').toLowerCase().trim() || 'desconocido';
    const prev = byProv.get(key);
    if (!prev || offerTotal(o) < offerTotal(prev)) byProv.set(key, o);
  }
  return [...byProv.values()].sort((a, b) => offerTotal(a) - offerTotal(b));
}

export async function searchOffers(query: string, userId?: string | null): Promise<Offer[]> {
  const q = (query ?? '').toString().trim();
  if (!q) return [];
  try {
    const { data, error } = await supabase.functions.invoke('price-search', {
      body: { q, limit: 8, user_id: userId ?? null },
      headers: { 'content-type': 'application/json' },
    });
    if (error) return [];
    const items = Array.isArray(data?.offers) ? data.offers : [];
    return items.map((it: any): Offer => ({
      provider: String(it.provider ?? ''),
      price: Number(it.price ?? 0),
      shipping: Number(it.shipping ?? 0),
      available: Boolean(it.available),
      affiliateUrl: String(it.url ?? ''),
      image: typeof it.image === 'string' ? it.image : undefined,
    }));
  } catch {
    return [];
  }
}
