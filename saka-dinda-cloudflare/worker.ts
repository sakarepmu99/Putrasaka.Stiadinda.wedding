import * as rsvp from "./app/api/rsvp/route";
import * as wishes from "./app/api/wishes/route";
interface Env { ASSETS: Fetcher; DB: D1Database }
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const path = new URL(request.url).pathname;
    const route = path === "/api/rsvp" ? rsvp : path === "/api/wishes" ? wishes : null;
    if (route) {
      if (request.method === "GET") return route.GET(request);
      if (request.method === "POST") return route.POST(request);
      return Response.json({ error: "Metode tidak didukung." }, { status: 405, headers: { Allow: "GET, POST" } });
    }
    if (path.startsWith("/api/")) return Response.json({ error: "Tidak ditemukan." }, { status: 404 });
    return env.ASSETS.fetch(request);
  },
};
