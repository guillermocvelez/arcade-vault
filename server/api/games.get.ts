import { serverSupabaseClient } from "#supabase/server";

interface GameRow {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
  cover: string;
  color: "cyan" | "magenta" | "green" | "yellow";
  sort_order: number;
}

interface GameStatsRow {
  game_id: string;
  best: number | null;
  plays: number;
}

export interface GameWithStats extends GameRow {
  best: number;
  plays: number;
}

export default defineEventHandler(async (event): Promise<GameWithStats[]> => {
  const client = await serverSupabaseClient(event);

  const [gamesResult, statsResult] = await Promise.all([
    client
      .from("games")
      .select("id, title, short, long, cat, cover, color, sort_order")
      .order("sort_order", { ascending: true })
      .returns<GameRow[]>(),
    client.from("game_stats").select("game_id, best, plays").returns<GameStatsRow[]>(),
  ]);

  if (gamesResult.error) {
    throw createError({ statusCode: 500, statusMessage: gamesResult.error.message });
  }
  if (statsResult.error) {
    throw createError({ statusCode: 500, statusMessage: statsResult.error.message });
  }

  const statsByGameId = new Map(statsResult.data.map((row) => [row.game_id, row]));

  return gamesResult.data.map((game) => {
    const stats = statsByGameId.get(game.id);
    return { ...game, best: stats?.best ?? 0, plays: stats?.plays ?? 0 };
  });
});
