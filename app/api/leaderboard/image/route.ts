import { env } from "cloudflare:workers";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const url = new URL(request.url); const id = url.searchParams.get("id"); const side = url.searchParams.get("side");
  if (!id || !/^[a-f0-9-]+$/.test(id) || (side !== "left" && side !== "right")) return new Response("Not found", { status: 404 });
  const column = side === "left" ? "left_image" : "right_image";
  const row = await (env as unknown as { DB: D1Database }).DB.prepare(`SELECT ${column} AS image, image_type FROM leaderboard WHERE id = ?`).bind(id).first<{ image: number[]; image_type: string }>();
  if (!row) return new Response("Not found", { status: 404 });
  return new Response(Uint8Array.from(row.image), { headers: { "content-type": row.image_type, "cache-control": "public, max-age=31536000, immutable", "x-content-type-options": "nosniff" } });
}
