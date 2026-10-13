import { and, desc, eq, lt, or } from "drizzle-orm";
import { getDb } from "@/db";
import { wishes } from "@/db/schema";
import { cleanText, getGuestSession, noStore, readGuestPayload } from "@/lib/guest-request";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 8;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const cursor = url.searchParams.get("before");
    const parsed = cursor?.match(/^(\d+):([0-9a-f-]{36})$/);
    if (cursor && (!parsed || !Number.isSafeInteger(Number(parsed[1])))) {
      return Response.json({ error: "Halaman tidak tersedia." }, { status: 400, headers: noStore });
    }
    const db = getDb();
    const before = parsed ? Number(parsed[1]) : null;
    const where = before !== null && parsed ? or(lt(wishes.createdAt, before), and(eq(wishes.createdAt, before), lt(wishes.id, parsed[2]))) : undefined;
    const rows = await db.select({ id: wishes.id, name: wishes.name, message: wishes.message, createdAt: wishes.createdAt })
      .from(wishes).where(where)
      .orderBy(desc(wishes.createdAt), desc(wishes.id)).limit(PAGE_SIZE + 1);
    const items = rows.slice(0, PAGE_SIZE);
    const last = items[items.length - 1];
    return Response.json({ wishes: items, nextCursor: rows.length > PAGE_SIZE ? `${last.createdAt}:${last.id}` : null }, { headers: noStore });
  } catch (error) {
    console.error("Guestbook load failed", error);
    return Response.json({ error: "Ucapan belum dapat dimuat. Silakan coba lagi." }, { status: 503, headers: noStore });
  }
}

export async function POST(request: Request) {
  const payload = await readGuestPayload(request);
  if ("error" in payload) return Response.json({ error: payload.error }, { status: payload.status, headers: noStore });
  const name = cleanText(payload.data.name, 80);
  const message = cleanText(payload.data.message, 600);
  if (!name || !message) return Response.json({ error: "Isi nama dan ucapan (2–600 karakter)." }, { status: 400, headers: noStore });
  try {
    const db = getDb();
    const session = getGuestSession(request);
    const now = Date.now();
    const [last] = await db.select({ createdAt: wishes.createdAt }).from(wishes).where(eq(wishes.visitorId, session.id)).orderBy(desc(wishes.createdAt)).limit(1);
    if (last && now - last.createdAt < 30000) return Response.json({ error: "Ucapan sebelumnya sudah tersimpan. Tunggu 30 detik untuk mengirim lagi." }, { status: 429, headers: noStore });
    const id = crypto.randomUUID();
    await db.insert(wishes).values({ id, visitorId: session.id, name, message, createdAt: now });
    return Response.json({ wish: { id, name, message, createdAt: now } }, { status: 201, headers: { ...noStore, "Set-Cookie": session.cookie } });
  } catch (error) {
    console.error("Guestbook save failed", error);
    return Response.json({ error: "Ucapan belum tersimpan. Silakan coba lagi sebentar." }, { status: 503, headers: noStore });
  }
}
