import type { Game } from "~/data/games";

interface GameApiResponse {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: Game["cat"];
  cover: string;
  color: Game["color"];
  sort_order: number;
  best: number;
  plays: number;
}

function formatPlays(count: number): string {
  if (count < 1000) return String(count);
  return `${(count / 1000).toFixed(1)}K`;
}

export async function fetchGamesList(): Promise<Game[]> {
  const rows = await $fetch<GameApiResponse[]>("/api/games");
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    short: row.short,
    long: row.long,
    cat: row.cat,
    cover: row.cover,
    color: row.color,
    best: row.best,
    plays: formatPlays(row.plays),
  }));
}

export function useGames() {
  const { data, pending, error } = useAsyncData<Game[]>("games", fetchGamesList);
  return { games: data, pending, error };
}
