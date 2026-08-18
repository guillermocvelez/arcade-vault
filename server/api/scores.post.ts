import { serverSupabaseServiceRole } from "#supabase/server";

interface ScorePayload {
  game: string;
  name: string;
  score: number;
}

interface ScoreSuccessResponse {
  ok: true;
}

export default defineEventHandler(async (event): Promise<ScoreSuccessResponse> => {
  const body = await readBody<Partial<ScorePayload>>(event);

  const gameId = body?.game?.trim() ?? "";
  const name = body?.name?.trim().slice(0, 10) ?? "";
  const score = Number(body?.score);

  if (!gameId || !name) {
    throw createError({ statusCode: 400, statusMessage: "El juego y el nombre son obligatorios." });
  }

  if (!Number.isInteger(score) || score < 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "La puntuación debe ser un entero mayor o igual a 0.",
    });
  }

  const client = serverSupabaseServiceRole(event);

  const { data: game, error: gameError } = await client
    .from("games")
    .select("id")
    .eq("id", gameId)
    .maybeSingle();

  if (gameError) {
    throw createError({ statusCode: 500, statusMessage: gameError.message });
  }
  if (!game) {
    throw createError({ statusCode: 404, statusMessage: `El juego '${gameId}' no existe.` });
  }

  const { error: insertError } = await client
    .from("scores")
    .insert({ game_id: gameId, name, score });

  if (insertError) {
    throw createError({ statusCode: 500, statusMessage: insertError.message });
  }

  return { ok: true };
});
