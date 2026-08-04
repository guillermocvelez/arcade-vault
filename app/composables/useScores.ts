export interface SavedScore {
  game: string;
  score: number;
  name: string;
  at: number;
}

const STORAGE_KEY = "av_scores";

export function useScores() {
  const saveScore = (entry: Omit<SavedScore, "at">) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const all: SavedScore[] = raw ? JSON.parse(raw) : [];
      all.push({ ...entry, at: Date.now() });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch {}
  };

  return { saveScore };
}
