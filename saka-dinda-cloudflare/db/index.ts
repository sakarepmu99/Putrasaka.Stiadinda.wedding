import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb() {
  const database = (env as typeof env & { DB?: D1Database }).DB;
  if (!database) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Bind the invitation database as `DB` in wrangler.jsonc."
    );
  }

  return drizzle(database, { schema });
}
