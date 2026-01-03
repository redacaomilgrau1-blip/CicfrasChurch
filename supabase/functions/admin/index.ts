import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type SongPayload = {
  id: string;
  title: string;
  artist?: string | null;
  key?: string | null;
  content: string;
  created_at?: string | null;
  updated_at?: string | null;
};

const jsonResponse = (body: unknown, status = 200) => {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
};

const getPin = async (client: ReturnType<typeof createClient>, fallbackPin: string) => {
  const { data } = await client
    .from('admin_settings')
    .select('value')
    .eq('key', 'pin')
    .maybeSingle();

  return data?.value || fallbackPin;
};

const verifyPin = async (client: ReturnType<typeof createClient>, pin: string, fallbackPin: string) => {
  const storedPin = await getPin(client, fallbackPin);
  return storedPin === pin;
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const fallbackPin = Deno.env.get('ADMIN_PIN_DEFAULT') || 'Mylena 10!';

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Missing Supabase env vars' }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const body = await req.json().catch(() => ({}));
  const action = body.action as string | undefined;

  if (!action) {
    return jsonResponse({ error: 'Missing action' }, 400);
  }

  if (action === 'verify_pin') {
    const pin = String(body.pin || '');
    const ok = await verifyPin(supabase, pin, fallbackPin);
    return jsonResponse({ ok });
  }

  if (action === 'set_pin') {
    const currentPin = String(body.currentPin || '');
    const newPin = String(body.newPin || '');

    if (!newPin || newPin.length < 4) {
      return jsonResponse({ error: 'Invalid PIN' }, 400);
    }

    const ok = await verifyPin(supabase, currentPin, fallbackPin);
    if (!ok) {
      return jsonResponse({ error: 'Invalid current PIN' }, 401);
    }

    const { error } = await supabase
      .from('admin_settings')
      .upsert({ key: 'pin', value: newPin }, { onConflict: 'key' });

    if (error) {
      return jsonResponse({ error: error.message }, 500);
    }

    return jsonResponse({ ok: true });
  }

  const pin = String(body.pin || '');
  const ok = await verifyPin(supabase, pin, fallbackPin);
  if (!ok) {
    return jsonResponse({ error: 'Invalid PIN' }, 401);
  }

  if (action === 'save_song') {
    const song = body.song as SongPayload | undefined;
    if (!song) {
      return jsonResponse({ error: 'Missing song' }, 400);
    }

    const { error } = await supabase
      .from('songs')
      .upsert(song, { onConflict: 'id' });

    if (error) {
      return jsonResponse({ error: error.message }, 500);
    }

    return jsonResponse({ ok: true });
  }

  if (action === 'bulk_upsert_songs') {
    const songs = (body.songs as SongPayload[]) || [];
    if (songs.length === 0) {
      return jsonResponse({ ok: true });
    }

    const { error } = await supabase
      .from('songs')
      .upsert(songs, { onConflict: 'id' });

    if (error) {
      return jsonResponse({ error: error.message }, 500);
    }

    return jsonResponse({ ok: true });
  }

  if (action === 'delete_song') {
    const id = String(body.id || '');
    if (!id) {
      return jsonResponse({ error: 'Missing id' }, 400);
    }

    const { error } = await supabase
      .from('songs')
      .delete()
      .eq('id', id);

    if (error) {
      return jsonResponse({ error: error.message }, 500);
    }

    return jsonResponse({ ok: true });
  }

  if (action === 'clear_songs') {
    const { error } = await supabase
      .from('songs')
      .delete()
      .neq('id', '');

    if (error) {
      return jsonResponse({ error: error.message }, 500);
    }

    return jsonResponse({ ok: true });
  }

  return jsonResponse({ error: 'Unknown action' }, 400);
});
