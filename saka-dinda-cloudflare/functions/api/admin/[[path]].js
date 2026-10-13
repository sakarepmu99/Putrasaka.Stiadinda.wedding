// Saka & Dinda — private administration API with authenticated RSVP editing and targeted deletions on Cloudflare Pages.
// Required Pages Production bindings: DB (D1), ADMIN_PASSWORD (secret), ADMIN_SESSION_SECRET (secret).
// The general /api/[[path]].js service proxy remains unchanged.
const JSON_HEADERS = {
  "Cache-Control": "no-store, private",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
};
const SESSION_NAME = "sd_admin_session";
const SESSION_SECONDS = 8 * 60 * 60;
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const enc = new TextEncoder();
const noCache = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), {
  status,
  headers: { ...JSON_HEADERS, ...headers },
});

function validConfig(env) {
  return Boolean(env?.DB && typeof env.ADMIN_PASSWORD === "string" && env.ADMIN_PASSWORD.length >= 16 &&
    typeof env.ADMIN_SESSION_SECRET === "string" && env.ADMIN_SESSION_SECRET.length >= 32);
}
function encodeBase64Url(bytes) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function sha256(text) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(text)));
}
function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}
async function sign(secret, text) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(text)));
}
function cookieValue(request, name) {
  const item = (request.headers.get("Cookie") || "").split(";").map(s => s.trim())
    .find(s => s.startsWith(name + "="));
  return item ? item.slice(name.length + 1) : null;
}
async function isLoggedIn(request, env) {
  const token = cookieValue(request, SESSION_NAME);
  if (!token) return false;
  const match = token.match(/^v1\.(\d{13})\.([A-Za-z0-9_-]{43})$/);
  if (!match) return false;
  const expires = Number(match[1]);
  if (!Number.isSafeInteger(expires) || Date.now() >= expires || expires - Date.now() > SESSION_SECONDS * 1000) return false;
  const expected = encodeBase64Url(await sign(env.ADMIN_SESSION_SECRET, `v1.${match[1]}`));
  return constantTimeEqual(enc.encode(match[2]), enc.encode(expected));
}
function sameOrigin(request) {
  const origin = request.headers.get("Origin");
  return Boolean(origin && origin === new URL(request.url).origin);
}
async function ipKey(request, env) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  return encodeBase64Url(await sha256(env.ADMIN_SESSION_SECRET + "|" + ip));
}
async function failLogin(env, key, previous, now) {
  const previousFailures = previous && now - previous.last_failed <= WINDOW_MS ? previous.failures : 0;
  const failures = previousFailures + 1;
  const blockedUntil = failures >= MAX_FAILURES ? now + WINDOW_MS : 0;
  await env.DB.prepare(`INSERT INTO admin_login_attempts (ip_key, failures, last_failed, locked_until)
    VALUES (?, ?, ?, ?) ON CONFLICT(ip_key) DO UPDATE SET
    failures = excluded.failures, last_failed = excluded.last_failed, locked_until = excluded.locked_until`)
    .bind(key, failures, now, blockedUntil).run();
  return blockedUntil > now;
}
function validUuid(id) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}
function cleanName(value) {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  return cleaned.length > 0 && cleaned.length <= 80 ? cleaned : null;
}
async function jsonBody(request) {
  if (!(request.headers.get("content-type") || "").toLowerCase().includes("application/json"))
    return { error: "Gunakan JSON.", status: 415 };
  const raw = await request.text();
  if (raw.length > 4096) return { error: "Permintaan terlalu besar.", status: 413 };
  try {
    const data = JSON.parse(raw);
    return data && typeof data === "object" && !Array.isArray(data)
      ? { data } : { error: "Data tidak valid.", status: 400 };
  } catch {
    return { error: "JSON tidak valid.", status: 400 };
  }
}

function parsePaging(url) {
  const rawOffset = url.searchParams.get("offset") || "0";
  const rawLimit = url.searchParams.get("limit") || "50";
  if (!/^\d{1,8}$/.test(rawOffset) || !/^\d{1,3}$/.test(rawLimit)) return null;
  const offset = Number(rawOffset), limit = Number(rawLimit);
  if (limit < 1 || limit > 200) return null;
  return { offset, limit };
}

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const action = url.pathname.replace(/^\/api\/admin\/?/, "").replace(/\/$/, "");
  if (!validConfig(env)) return noCache({ error: "Konfigurasi admin belum lengkap. Periksa DB dan Secrets pada Cloudflare Pages." }, 503);
  if (!request.url.startsWith("https://")) return noCache({ error: "HTTPS diperlukan." }, 403);

  if (action === "login" && request.method === "POST") {
    if (!sameOrigin(request)) return noCache({ error: "Asal permintaan tidak sesuai." }, 403);
    if (!(request.headers.get("content-type") || "").toLowerCase().includes("application/json"))
      return noCache({ error: "Gunakan JSON." }, 415);
    const key = await ipKey(request, env);
    try {
      const previous = await env.DB.prepare("SELECT failures, last_failed, locked_until FROM admin_login_attempts WHERE ip_key = ?")
        .bind(key).first();
      const now = Date.now();
      if (previous && previous.locked_until > now) return noCache({ error: "Terlalu banyak percobaan. Coba lagi setelah 15 menit." }, 429);
      const raw = await request.text();
      if (raw.length > 2048) return noCache({ error: "Permintaan terlalu panjang." }, 413);
      let submitted = "";
      try { const body = JSON.parse(raw); submitted = typeof body.password === "string" ? body.password : ""; }
      catch { return noCache({ error: "Permintaan tidak valid." }, 400); }
      const actualHash = await sha256(submitted);
      const expectedHash = await sha256(env.ADMIN_PASSWORD);
      if (!constantTimeEqual(actualHash, expectedHash)) {
        const blocked = await failLogin(env, key, previous, now);
        return noCache({ error: blocked ? "Terlalu banyak percobaan. Coba lagi setelah 15 menit." : "Password admin tidak sesuai." }, blocked ? 429 : 401);
      }
      await env.DB.prepare("DELETE FROM admin_login_attempts WHERE ip_key = ?").bind(key).run();
      const expiry = String(now + SESSION_SECONDS * 1000);
      const signature = encodeBase64Url(await sign(env.ADMIN_SESSION_SECRET, `v1.${expiry}`));
      return noCache({ ok: true }, 200, {
        "Set-Cookie": `${SESSION_NAME}=v1.${expiry}.${signature}; HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age=${SESSION_SECONDS}`,
      });
    } catch (error) {
      console.error("Admin login error", error);
      return noCache({ error: "Layanan login admin belum siap. Periksa tabel keamanan D1." }, 503);
    }
  }

  if (action === "logout" && request.method === "POST") {
    if (!sameOrigin(request)) return noCache({ error: "Asal permintaan tidak sesuai." }, 403);
    return noCache({ ok: true }, 200, {
      "Set-Cookie": `${SESSION_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age=0`,
    });
  }

  if (!await isLoggedIn(request, env)) return noCache({ error: "Silakan login sebagai admin." }, 401);

  // Mutations require a signed admin session, same-origin request, and an exact UUID.
  // Only these two carefully scoped actions can modify the database.
  const record = action.match(/^(rsvps|wishes)\/([^/]+)$/);
  if (record && ["PATCH", "DELETE"].includes(request.method)) {
    if (!sameOrigin(request)) return noCache({ error: "Asal permintaan tidak sesuai." }, 403);
    const [, table, id] = record;
    if (!validUuid(id)) return noCache({ error: "ID data tidak valid." }, 400);
    if (table === "wishes" && request.method !== "DELETE")
      return noCache({ error: "Metode tidak didukung untuk ucapan." }, 405, { Allow: "DELETE" });
    try {
      if (request.method === "DELETE") {
        const result = await env.DB.prepare(table === "rsvps"
          ? "DELETE FROM rsvps WHERE id = ?"
          : "DELETE FROM wishes WHERE id = ?").bind(id).run();
        if (!result?.meta?.changes) return noCache({ error: "Data tidak ditemukan atau sudah dihapus." }, 404);
        return noCache({ ok: true, deletedId: id });
      }
      // RSVP PATCH. Old updated_at guards against overwriting a more recent edit.
      const parsed = await jsonBody(request);
      if (parsed.error) return noCache({ error: parsed.error }, parsed.status);
      const { name, attendance, guests, updated_at } = parsed.data;
      const clean = cleanName(name);
      const validAttendance = attendance === "yes" || attendance === "no";
      const validGuests = Number.isInteger(guests) && guests >= 0 && guests <= 10 &&
        (attendance === "yes" ? guests >= 1 : guests === 0);
      const validVersion = Number.isSafeInteger(updated_at) && updated_at > 0;
      if (!clean || !validAttendance || !validGuests || !validVersion)
        return noCache({ error: "Isi nama, status, dan jumlah tamu secara benar (1–10 untuk hadir, 0 untuk tidak hadir)." }, 400);
      const time = Math.max(Date.now(), updated_at + 1);
      const result = await env.DB.prepare(`UPDATE rsvps SET name = ?, attendance = ?, guests = ?, updated_at = ?
        WHERE id = ? AND updated_at = ?`).bind(clean, attendance, guests, time, id, updated_at).run();
      if (!result?.meta?.changes) return noCache({ error: "Data berubah atau tidak ditemukan. Refresh daftar lalu coba lagi." }, 409);
      return noCache({ ok: true, updated: { id, name: clean, attendance, guests, updated_at: time } });
    } catch (e) {
      console.error("Admin mutation error", e);
      return noCache({ error: "Perubahan belum dapat disimpan. Coba lagi." }, 503);
    }
  }

  if (request.method !== "GET") return noCache({ error: "Metode tidak didukung." }, 405, { Allow: "GET" });
  if (action === "me") return noCache({ ok: true, loggedIn: true });

  try {
    if (action === "summary") {
      const [rsvp, wish] = await Promise.all([
        env.DB.prepare(`SELECT COUNT(*) AS responses,
            COALESCE(SUM(CASE WHEN attendance='yes' THEN 1 ELSE 0 END), 0) AS attending,
            COALESCE(SUM(CASE WHEN attendance='no' THEN 1 ELSE 0 END), 0) AS not_attending,
            COALESCE(SUM(CASE WHEN attendance='yes' THEN guests ELSE 0 END), 0) AS guest_total
          FROM rsvps`).first(),
        env.DB.prepare("SELECT COUNT(*) AS total FROM wishes").first(),
      ]);
      // Aggregated by Jakarta calendar day; group in SQL so no personal records are sent to chart code.
      // DB timestamps are Unix milliseconds.
      const [rsvpTrend, wishTrend] = await Promise.all([
        env.DB.prepare(`SELECT date(created_at / 1000, 'unixepoch', '+7 hours') AS day, COUNT(*) AS count
          FROM rsvps WHERE created_at >= unixepoch(date('now', '+7 hours', '-13 days') || ' 00:00:00', '-7 hours') * 1000
          GROUP BY day ORDER BY day`).all(),
        env.DB.prepare(`SELECT date(created_at / 1000, 'unixepoch', '+7 hours') AS day, COUNT(*) AS count
          FROM wishes WHERE created_at >= unixepoch(date('now', '+7 hours', '-13 days') || ' 00:00:00', '-7 hours') * 1000
          GROUP BY day ORDER BY day`).all()
      ]);
      return noCache({ responses: rsvp?.responses || 0, attending: rsvp?.attending || 0,
        notAttending: rsvp?.not_attending || 0, guests: rsvp?.guest_total || 0, wishes: wish?.total || 0,
        rsvpDaily: rsvpTrend?.results || [], wishDaily: wishTrend?.results || [] });
    }
    if (action === "rsvps" || action === "wishes") {
      const paging = parsePaging(url);
      if (!paging) return noCache({ error: "Parameter halaman tidak valid." }, 400);
      const table = action === "rsvps" ? "rsvps" : "wishes";
      const cols = action === "rsvps"
        ? "id, name, attendance, guests, created_at, updated_at"
        : "id, name, message, created_at";
      const result = await env.DB.prepare(`SELECT ${cols} FROM ${table} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`)
        .bind(paging.limit + 1, paging.offset).all();
      const rows = result?.results || [];
      return noCache({ items: rows.slice(0, paging.limit), nextOffset: rows.length > paging.limit ? paging.offset + paging.limit : null });
    }
    return noCache({ error: "Endpoint admin tidak ditemukan." }, 404);
  } catch (error) {
    console.error("Admin read error", error);
    return noCache({ error: "Data belum dapat dimuat. Periksa D1 binding." }, 503);
  }
}
