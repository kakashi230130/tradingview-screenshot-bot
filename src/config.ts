export const TIMEFRAMES = [
  "5",
  "15",
  "60",
  "240"
] as const;

export type Timeframe = (typeof TIMEFRAMES)[number];

export function timeframeLabel(tf: Timeframe) {
  switch (tf) {
    case "5": return "5m";
    case "15": return "15m";
    case "60": return "1h";
    case "240": return "4h";
  }
}
