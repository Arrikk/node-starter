export function buildBullMQJobId(...segments: string[]): string {
  return segments.map((segment) => segment.replace(/:/g, "-")).join("-");
}
