export const noStore = { "Cache-Control": "no-store" };

export function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const result = value.normalize("NFC").replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "").trim();
  return result.length >= 2 && result.length <= max ? result : null;
}

export async function readGuestPayload(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return { error: "Permintaan tidak dapat diproses.", status: 403 } as const;
  }
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return { error: "Format kiriman tidak sesuai.", status: 415 } as const;
  }
  const raw = await request.text();
  if (raw.length > 4096) return { error: "Kiriman terlalu panjang.", status: 413 } as const;
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Invalid payload");
    if (data.website) return { error: "Permintaan tidak dapat diproses.", status: 400 } as const;
    return { data } as const;
  } catch {
    return { error: "Kiriman tidak dapat dibaca.", status: 400 } as const;
  }
}

// Opaque HttpOnly cookie identifies a browser for RSVP updates and duplicate control.
// RSVP names and attendance are never exposed by a public API.
export function getGuestSession(request: Request) {
  const value = request.headers.get("cookie")?.split(";").map((x) => x.trim()).find((x) => x.startsWith("sd_guest="))?.slice(9);
  const valid = value && /^[0-9a-f-]{36}$/.test(value);
  const id = valid ? value : crypto.randomUUID();
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  const cookie = `sd_guest=${id}; HttpOnly; SameSite=Lax; Path=/; Max-Age=31536000${secure}`;
  return { id, cookie };
}
