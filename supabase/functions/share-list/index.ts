// @ts-nocheck
/// <reference lib="deno.window" />
import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

type Body = {
  list_id: string;
  invitee_email: string;
  role?: "viewer" | "editor";
};

Deno.serve(async (req: Request): Promise<Response> => {
  try {
    // 1. Extraer parámetros y validar
    const body = (await req.json()) as Body;
    const { list_id, invitee_email, role = "viewer" } = body;

    if (!list_id || !invitee_email) {
      return new Response(JSON.stringify({ error: "Parámetros obligatorios faltantes" }), { status: 400 });
    }

    // 2. Crear cliente de Supabase con rol de servicio
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const client = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

    // 3. Obtener el usuario que comparte (dueño)
    const { data: { user }, error: userError } = await client.auth.getUser((req.headers.get("Authorization") ?? "").replace("Bearer ", ""));
    if (userError || !user) throw new Error("No se pudo autenticar al usuario.");

    // 4. Crear o actualizar el registro en shared_lists
    const { error: eShare } = await client
      .from("shared_lists")
      .upsert(
        { list_id, owner_id: user.id, invitee_email, role, revoked_at: null },
        { onConflict: "list_id,invitee_email" }
      );
    if (eShare) throw eShare;

    // 5. Generar un token de invitación y guardarlo
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(); // 7 días

    const { error: eToken } = await client
      .from("invite_tokens")
      .upsert(
        { list_id, invitee_email, token, expires_at: expiresAt, used_at: null },
        { onConflict: "list_id,invitee_email" }
      );
    if (eToken) throw eToken;

    // 6. Construir y devolver el enlace de aceptación
    const acceptUrlBase = Deno.env.get("PUBLIC_APP_URL") ?? "http://localhost:5173/accept";
    const link = `${acceptUrlBase}?token=${encodeURIComponent(token)}`;

    return new Response(JSON.stringify({ ok: true, link }), { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), { status: 400 });
  }
});