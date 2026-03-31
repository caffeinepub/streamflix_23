export function formatYear(dateStr: string | undefined): string {
  if (!dateStr) return "";
  return dateStr.slice(0, 4);
}

export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

export function formatRuntime(minutes: number | undefined): string {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function getMatchPercent(rating: number): number {
  return Math.round((rating / 10) * 100);
}

export function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return `${str.slice(0, max).trimEnd()}...`;
}
