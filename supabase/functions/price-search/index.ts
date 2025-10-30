// @ts-nocheck
/// <reference lib="deno.window" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, accept",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
  "Content-Type": "application/json; charset=utf-8",
};

type Item = { product: string; quantity?: number };

const J = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: CORS });

async function searchML(q: string, limit = 8) {
  const u = new URL("https://api.mercadolibre.com/sites/MLM/search");
  u.searchParams.set("q", q);
  u.searchParams.set("limit", String(Math.max(1, Math.min(limit, 20))));

  let debug: any = undefined;

  let r: Response;
  try {
    // sin headers especiales
    r = await fetch(u.toString());
  } catch (e) {
    debug = { fetchError: String(e) };
    return { offers: [], debug };
  }

  if (!r.ok) {
    const body = await r.text().catch(() => "");
    debug = { status: r.status, body: body?.slice(0, 500) ?? "" };
    return { offers: [], debug };
  }

  const d = await r.json().catch(() => ({}));
  const rows: any[] = Array.isArray(d?.results) ? d.results : [];
  const offers = rows.map((it) => ({
    provider: "MercadoLibre",
    title: String(it?.title ?? ""),
    price: Number(it?.price ?? 0),
    shipping: it?.shipping?.free_shipping ? 0 : 0,
    available: Number(it?.available_quantity ?? 0) > 0,
    url: String(it?.permalink ?? ""),
    image: it?.thumbnail ?? undefined,
  }));

  return { offers, debug };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }
  if (req.method !== "POST") return J({ error: "use POST" }, 405);

  try {
    const body: any = await req.json().catch(() => ({}));
    const q = (body?.q ?? body?.query ?? "").toString().trim();
    const limit = Number(body?.limit ?? 8);

    // modo 1: una sola query
    if (q) {
      const { offers, debug } = await searchML(q, limit);
      return J({ offers, debug });
    }

    // modo 2: items[]
    const items: Item[] = Array.isArray(body?.items) ? body.items : [];
    const result = [];
    for (const it of items) {
      const s = (it?.product ?? "").toString().trim();
      const { offers, debug } = s ? await searchML(s, limit) : { offers: [], debug: undefined };
      result.push({ product: s, offers, debug });
    }
    return J({ ok: true, result });
  } catch (e) {
    return J({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
