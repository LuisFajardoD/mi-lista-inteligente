// @ts-nocheck

/// <reference lib="deno.window" />
import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

type InviteTokenRow = {
  id: string;
  list_id: string;
  invitee_email: string;
  expires_at: string | null;
  used_at: string | null;
  token: string;
};

Deno.serve(async (req: Request): Promise<Response> => {
  try {
    const { token } = await req.json();
    if (!token) {
      return new Response(JSON.stringify({ error: "Falta token" }), { status: 400 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const client = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

    // 1) Verificar token
    const { data: t, error: e1 } = await client
      .from("invite_tokens")
      .select("*")
      .eq("token", token)
      .maybeSingle<InviteTokenRow>();

    if (e1) throw e1;
    if (!t) throw new Error("Token inválido");
    if (t.used_at) throw new Error("Token ya usado");
    if (t.expires_at && new Date(t.expires_at) < new Date()) throw new Error("Token expirado");

    // 2) Marcar como usado
    const { error: e2 } = await client
      .from("invite_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("token", token);
    if (e2) throw e2;

    // Nota: el dueñ@ ya creó el registro en shared_lists; aquí solo marcamos el token.
    return new Response(JSON.stringify({ ok: true, list_id: t.list_id }), { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), { status: 400 });
  }
});
