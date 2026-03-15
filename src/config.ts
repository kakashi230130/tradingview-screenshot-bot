export const TIMEFRAMES = [
  "3",
  "5",
  "15",
  "60",
  "240",
  "D"
] as const;

export type Timeframe = (typeof TIMEFRAMES)[number];

export function timeframeLabel(tf: Timeframe) {
  switch (tf) {
    case "3": return "3m";
    case "5": return "5m";
    case "15": return "15m";
    case "60": return "1h";
    case "240": return "4h";
    case "D": return "1d";
  }
}
