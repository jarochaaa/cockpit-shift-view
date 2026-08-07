export function formatSeconds(totalSeconds: number) {
  const minutes = totalSeconds / 60;
  return `${minutes.toFixed(1)}m`;
}

export function formatPercent(ratio: number) {
  return `${(ratio * 100).toFixed(2)}%`;
}

export function minutesSince(iso: string) {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
}
