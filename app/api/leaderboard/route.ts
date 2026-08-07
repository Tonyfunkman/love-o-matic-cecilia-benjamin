import { env } from "cloudflare:workers";
import { deterministicScore } from "../../deterministic-score";

export const dynamic = "force-dynamic";
type Bindings = { DB: D1Database; PHOTOS: R2Bucket };
const featured = { id: "benjamin-cecilia", leftName: "Benjamin", rightName: "Cécilia", score: 100, leftImage: "/benjamin.jpg", rightImage: "/cecilia.webp", featured: true };
async function ensureSchema(db: D1Database) { await db.batch([db.prepare(`CREATE TABLE IF NOT EXISTS leaderboard (id TEXT PRIMARY KEY, left_name TEXT NOT NULL, right_name TEXT NOT NULL, score INTEGER NOT NULL, left_image_key TEXT NOT NULL, right_image_key TEXT NOT NULL, created_at INTEGER NOT NULL)`), db.prepare(`CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON leaderboard (score DESC, created_at ASC)`)]); }

export async function GET() {
  const bindings = env as unknown as Bindings; await ensureSchema(bindings.DB);
  const rows = await bindings.DB.prepare(`SELECT id, left_name, right_name, score, left_image_key, right_image_key FROM leaderboard ORDER BY score DESC, created_at ASC LIMIT 9`).all<{ id: string; left_name: string; right_name: string; score: number; left_image_key: string; right_image_key: string }>();
  return Response.json({ matches: [featured, ...rows.results.map(row => ({ id: row.id, leftName: row.left_name, rightName: row.right_name, score: row.score, leftImage: `/api/leaderboard/image?key=${encodeURIComponent(row.left_image_key)}`, rightImage: `/api/leaderboard/image?key=${encodeURIComponent(row.right_image_key)}` }))] });
}

export async function POST(request: Request) {
  const bindings = env as unknown as Bindings; await ensureSchema(bindings.DB); const form = await request.formData();
  const leftName = String(form.get("leftName") ?? "").trim().slice(0, 30); const rightName = String(form.get("rightName") ?? "").trim().slice(0, 30); const leftImage = form.get("leftImage"); const rightImage = form.get("rightImage");
  if (!leftName || !rightName || !(leftImage instanceof File) || !(rightImage instanceof File)) return Response.json({ error: "Données manquantes" }, { status: 400 });
  const allowed = new Set(["image/jpeg", "image/png", "image/webp"]); if (!allowed.has(leftImage.type) || !allowed.has(rightImage.type) || leftImage.size > 8_000_000 || rightImage.size > 8_000_000) return Response.json({ error: "Images invalides" }, { status: 400 });
  const [leftBytes, rightBytes] = await Promise.all([leftImage.arrayBuffer(), rightImage.arrayBuffer()]); const score = await deterministicScore(leftBytes, rightBytes);
  const cutoff = await bindings.DB.prepare(`SELECT score FROM leaderboard ORDER BY score DESC, created_at ASC LIMIT 1 OFFSET 8`).first<{ score: number }>(); if (cutoff && score <= cutoff.score) return Response.json({ error: "Le classement a changé" }, { status: 409 });
  const id = crypto.randomUUID(); const leftKey = `${id}/left`; const rightKey = `${id}/right`; await Promise.all([bindings.PHOTOS.put(leftKey, leftBytes, { httpMetadata: { contentType: leftImage.type } }), bindings.PHOTOS.put(rightKey, rightBytes, { httpMetadata: { contentType: rightImage.type } })]);
  await bindings.DB.prepare(`INSERT INTO leaderboard (id, left_name, right_name, score, left_image_key, right_image_key, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).bind(id, leftName, rightName, score, leftKey, rightKey, Date.now()).run();
  const removed = await bindings.DB.prepare(`SELECT id, left_image_key, right_image_key FROM leaderboard ORDER BY score DESC, created_at ASC LIMIT -1 OFFSET 9`).all<{ id: string; left_image_key: string; right_image_key: string }>();
  for (const row of removed.results) { await bindings.DB.prepare(`DELETE FROM leaderboard WHERE id = ?`).bind(row.id).run(); await Promise.all([bindings.PHOTOS.delete(row.left_image_key), bindings.PHOTOS.delete(row.right_image_key)]); }
  return Response.json({ ok: true, score });
}
