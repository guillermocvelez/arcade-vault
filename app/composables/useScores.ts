export interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string;
}

export function useScores() {
  const saveScore = async (entry: { game: string; score: number; name: string }) => {
    await $fetch("/api/scores", { method: "POST", body: entry });
  };

  const fetchTop = (gameId: string, limit = 12) =>
    $fetch<ScoreRow[]>("/api/scores", { query: { game: gameId, limit } });

  return { saveScore, fetchTop };
}
