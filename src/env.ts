function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function optional(name: string, fallback?: string): string | undefined {
  return process.env[name] ?? fallback;
}

function bool(name: string, fallback: boolean): boolean {
  const v = process.env[name];
  if (v == null) return fallback;
  return ["1", "true", "yes", "y", "on"].includes(v.toLowerCase());
}

function num(name: string, fallback: number): number {
  const v = process.env[name];
  if (!v) return fallback;
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return n;
}

export const ENV = {
  tvSessionId: required("TV_SESSIONID"),
  tvSessionIdSign: optional("TV_SESSIONID_SIGN"),

  symbol: optional("SYMBOL", "BINANCE:ETHUSDT.P")!,
  chartUrl: optional("CHART_URL"),

  outputDir: optional("OUTPUT_DIR", "output")!,

  autoGitPush: bool("AUTO_GIT_PUSH", false),
  gitCommitMessage: optional("GIT_COMMIT_MESSAGE", "update code")!,
  gitPushRemote: optional("GIT_PUSH_REMOTE", "origin")!,
  gitPushBranch: optional("GIT_PUSH_BRANCH", "main")!,

  headless: bool("HEADLESS", true),
  slowMoMs: num("SLOW_MO_MS", 0),
  viewportWidth: num("VIEWPORT_WIDTH", 1920),
  viewportHeight: num("VIEWPORT_HEIGHT", 1080),

  manualSetup: bool("MANUAL_SETUP", false),
  addIndicators: bool("ADD_INDICATORS", true)
};
