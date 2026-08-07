import { env } from "cloudflare:workers";

export const dynamic = "force-dynamic";
type Bindings = { DB: D1Database };
const featured = { id: "benjamin-cecilia", leftName: "Benjamin", rightName: "Cécilia", score: 100, leftImage: "/benjamin.jpg", rightImage: "/cecilia.webp", featured: true };

async function ensureSchema(db: D1Database) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS leaderboard (id TEXT PRIMARY KEY, left_name TEXT NOT NULL, right_name TEXT NOT NULL, score INTEGER NOT NULL, left_image BLOB NOT NULL, right_image BLOB NOT NULL, image_type TEXT NOT NULL, created_at INTEGER NOT NULL)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON leaderboard (score DESC, created_at ASC)`),
  ]);
}

export async function GET() {
  const { DB } = env as unknown as Bindings; await ensureSchema(DB);
  const rows = await DB.prepare(`SELECT id, left_name, right_name, score FROM leaderboard ORDER BY score DESC, created_at ASC LIMIT 9`).all<{ id: string; left_name: string; right_name: string; score: number }>();
  return Response.json({ matches: [featured, ...rows.results.map(row => ({ id: row.id, leftName: row.left_name, rightName: row.right_name, score: row.score, leftImage: `/api/leaderboard/image?id=${encodeURIComponent(row.id)}&side=left`, rightImage: `/api/leaderboard/image?id=${encodeURIComponent(row.id)}&side=right` }))] });
}

export async function POST(request: Request) {
  const { DB } = env as unknown as Bindings; await ensureSchema(DB); const form = await request.formData();
  const leftName = String(form.get("leftName") ?? "").trim().slice(0, 30); const rightName = String(form.get("rightName") ?? "").trim().slice(0, 30); const score = Number(form.get("score")); const leftImage = form.get("leftImage"); const rightImage = form.get("rightImage");
  if (!leftName || !rightName || !Number.isInteger(score) || score < 0 || score > 100 || !(leftImage instanceof File) || !(rightImage instanceof File)) return Response.json({ error: "Données manquantes" }, { status: 400 });
  if (leftImage.type !== "image/jpeg" || rightImage.type !== "image/jpeg" || leftImage.size > 600_000 || rightImage.size > 600_000) return Response.json({ error: "Images invalides" }, { status: 400 });
  const cutoff = await DB.prepare(`SELECT score FROM leaderboard ORDER BY score DESC, created_at ASC LIMIT 1 OFFSET 8`).first<{ score: number }>(); if (cutoff && score <= cutoff.score) return Response.json({ error: "Le classement a changé" }, { status: 409 });
  const id = crypto.randomUUID(); const [leftBytes, rightBytes] = await Promise.all([leftImage.arrayBuffer(), rightImage.arrayBuffer()]);
  await DB.prepare(`INSERT INTO leaderboard (id, left_name, right_name, score, left_image, right_image, image_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind(id, leftName, rightName, score, leftBytes, rightBytes, "image/jpeg", Date.now()).run();
  await DB.prepare(`DELETE FROM leaderboard WHERE id IN (SELECT id FROM leaderboard ORDER BY score DESC, created_at ASC LIMIT -1 OFFSET 9)`).run();
  return Response.json({ ok: true, score });
}
