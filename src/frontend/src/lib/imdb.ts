export interface IMDBRating {
  value: number;
  voteCount: number;
}

export async function fetchIMDBRating(
  imdbId: string,
): Promise<IMDBRating | null> {
  try {
    const res = await fetch(`https://api.imdbapi.dev/titles/${imdbId}`);
    if (!res.ok) return null;
    const data = await res.json();
    const rating = data?.aggregateRating;
    if (!rating?.ratingValue) return null;
    return { value: rating.ratingValue, voteCount: rating.voteCount ?? 0 };
  } catch {
    return null;
  }
}
