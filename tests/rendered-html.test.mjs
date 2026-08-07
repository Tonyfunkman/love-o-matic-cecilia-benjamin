import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("includes the complete leaderboard experience", async () => {
  const [page, layout, migration] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0000_yellow_the_phantom.sql", import.meta.url), "utf8"),
  ]);
  assert.match(layout, /Benjamin & Cécilia/);
  assert.match(page, /TOP MATCHS/); assert.match(page, /NOUVEAU TOP 10/); assert.match(page, /\/api\/leaderboard/);
  assert.match(migration, /CREATE TABLE `leaderboard`/); assert.match(migration, /idx_leaderboard_rank/);
  assert.doesNotMatch(page + layout, /react-loading-skeleton|codex-preview/);
});
