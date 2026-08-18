import { serverSupabaseClient } from "#supabase/server";

interface ScoreRowRaw {
  name: string;
  score: number;
  created_at: string;
}

export interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string;
}

const DEFAULT_LIMIT = 12;

function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

export default defineEventHandler(async (event): Promise<ScoreRow[]> => {
  const query = getQuery(event);
  const gameId = typeof query.game === "string" ? query.game : "";
  const limit = Number(query.limit) > 0 ? Number(query.limit) : DEFAULT_LIMIT;

  if (!gameId) {
    throw createError({ statusCode: 400, statusMessage: "El parámetro 'game' es obligatorio." });
  }

  const client = await serverSupabaseClient(event);

  const { data, error } = await client
    .from("scores")
    .select("name, score, created_at")
    .eq("game_id", gameId)
    .order("score", { ascending: false })
    .limit(limit)
    .returns<ScoreRowRaw[]>();

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  return data.map((row, i) => ({
    rank: i + 1,
    name: row.name,
    score: row.score,
    date: formatDate(row.created_at),
  }));
});
