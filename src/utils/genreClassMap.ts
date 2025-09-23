// AI Generated: GitHub Copilot - 2025-09-20
// Maps TMDB / display genre names to CSS class-friendly slugs.
// This map aims to cover the canonical TMDB genres and common variants/aliases.
const MAP: Record<string, string> = {
  // TMDB canonical genres (2025 common list)
  action: "action",
  adventure: "adventure",
  animation: "animation",
  comedy: "comedy",
  crime: "crime",
  documentary: "documentary",
  drama: "drama",
  family: "family",
  fantasy: "fantasy",
  history: "history",
  horror: "horror",
  music: "music",
  mystery: "mystery",
  romance: "romance",
  "science fiction": "scifi",
  scifi: "scifi",
  "sci-fi": "scifi",
  "sci fi": "scifi",
  "tv movie": "tvmovie",
  thriller: "thriller",
  war: "war",
  western: "western",

  // Common aliases and synonyms (single unique entries)
  musical: "music",
  musicals: "music",
  "sci fi/fantasy": "scifi",
  "sci-fi & fantasy": "scifi",
  "science-fiction": "scifi",
  "science fiction & fantasy": "scifi",
  sciencefiction: "scifi",
  biography: "documentary",
  biopic: "documentary",
  biographical: "documentary",
  biopics: "documentary",
  "true story": "documentary",
  "rom-com": "romance",
  romcom: "romance",
  "romantic comedy": "romance",
  romantic: "romance",
  "romantic drama": "romance",
  supernatural: "fantasy",
  erotica: "drama",
  detective: "mystery",
  suspense: "thriller",
  "psychological thriller": "thriller",
  "political thriller": "thriller",
  noir: "crime",
  "neo-noir": "crime",
  "neo noir": "crime",
  heist: "crime",
  "martial arts": "action",
  "kung fu": "action",
  "action-adventure": "adventure",
  "sword and sandal": "adventure",
  arthouse: "drama",
  indie: "drama",
  period: "history",
  "period drama": "history",
  historical: "history",
  short: "short",
  experimental: "documentary",
  "family friendly": "family",
  kids: "family",
  children: "family",
  "coming-of-age": "drama",
  "coming of age": "drama",
  "space opera": "scifi",
  "space-opera": "scifi",
  "fantasy-adventure": "fantasy",
  "true-life": "documentary",
  "slice of life": "drama",
  sports: "sport",
  sport: "sport",
  "war drama": "war",
  spy: "thriller",
  espionage: "thriller",
  courtroom: "drama",
  legal: "drama",
  "family drama": "family",
  medical: "drama",
  "western comedy": "western",
  "dark comedy": "comedy",
  "black comedy": "comedy",
  satire: "comedy",
  parody: "comedy",
  "musical drama": "music",
  dance: "music",
};

export function getGenreClassSlug(genre: string): string {
  if (!genre) return "default";
  const key = genre.toLowerCase().trim();
  if (MAP[key]) return MAP[key];
  // Fallback slugify: letters/numbers only, collapse repeated separators
  const slug = key
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "default";
}

export default getGenreClassSlug;
