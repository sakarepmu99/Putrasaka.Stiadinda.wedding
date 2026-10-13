import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { rsvps } from "@/db/schema";
import { cleanText, getGuestSession, noStore, readGuestPayload } from "@/lib/guest-request";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = getGuestSession(request);
    const [rsvp] = await getDb().select({ name: rsvps.name, attendance: rsvps.attendance, guests: rsvps.guests }).from(rsvps).where(eq(rsvps.visitorId, session.id)).limit(1);
    return Response.json({ rsvp: rsvp ?? null }, { headers: noStore });
  } catch {
    return Response.json({ error: "Konfirmasi belum dapat dimuat." }, { status: 503, headers: noStore });
  }
}

export async function POST(request: Request) {
  const payload = await readGuestPayload(request);
  if ("error" in payload) return Response.json({ error: payload.error }, { status: payload.status, headers: noStore });
  const { data } = payload;
  const name = cleanText(data.name, 80);
  const attendance = data.attendance;
  const guests = attendance === "no" ? 0 : data.guests;
  if (!name || !["yes", "no"].includes(attendance) || !Number.isInteger(guests) || guests < 0 || guests > 10 || (attendance === "yes" && guests < 1)) {
    return Response.json({ error: "Isi nama, pilihan kehadiran, dan jumlah tamu dengan benar." }, { status: 400, headers: noStore });
  }
  try {
    const db = getDb();
    const session = getGuestSession(request);
    const now = Date.now();
    const [existing] = await db.select({ id: rsvps.id, updatedAt: rsvps.updatedAt }).from(rsvps).where(eq(rsvps.visitorId, session.id)).limit(1);
    if (existing && now - existing.updatedAt < 3000) {
      return Response.json({ error: "Tunggu sebentar sebelum mengubah konfirmasi." }, { status: 429, headers: noStore });
    }
    await db.insert(rsvps).values({ id: crypto.randomUUID(), visitorId: session.id, name, attendance, guests, createdAt: now, updatedAt: now })
      .onConflictDoUpdate({ target: rsvps.visitorId, set: { name, attendance, guests, updatedAt: now } });
    return Response.json({ ok: true, updated: !!existing }, { headers: { ...noStore, "Set-Cookie": session.cookie } });
  } catch (error) {
    console.error("RSVP save failed", error);
    return Response.json({ error: "Konfirmasi belum tersimpan. Silakan coba lagi sebentar." }, { status: 503, headers: noStore });
  }
}
