import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs/promises";
import { exec as execCb } from "node:child_process";
import { promisify } from "node:util";
import { ENV } from "./env.js";
import { TIMEFRAMES, timeframeLabel } from "./config.js";
import { addIndicatorsBestEffort, gotoChart, hidePopupsBestEffort, setTimeframe } from "./tv.js";

const exec = promisify(execCb);

function buildChartUrl() {
  // Prefer explicit CHART_URL if provided; otherwise open generic chart with symbol param.
  if (ENV.chartUrl) {
    // If chartUrl already contains symbol, we still append/override symbol param for safety.
    const u = new URL(ENV.chartUrl);
    u.searchParams.set("symbol", ENV.symbol);
    return u.toString();
  }
  const u = new URL("https://www.tradingview.com/chart/");
  u.searchParams.set("symbol", ENV.symbol);
  return u.toString();
}

async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

async function gitAutoPushIfEnabled() {
  if (!ENV.autoGitPush) return;

  // Only commit when there are changes
  const { stdout: status } = await exec("git status --porcelain");
  if (!status.trim()) {
    console.log("Git: no changes to commit.");
    return;
  }

  await exec("git add .");
  try {
    await exec(`git commit -m "${ENV.gitCommitMessage.replaceAll('"', '\\"')}"`);
  } catch (e: any) {
    // In case another process committed or nothing to commit.
    const msg = String(e?.stdout ?? e?.message ?? e);
    console.warn("Git commit warning:", msg);
  }
  await exec(`git push ${ENV.gitPushRemote} ${ENV.gitPushBranch}`);
  console.log(`Git: pushed to ${ENV.gitPushRemote} ${ENV.gitPushBranch}`);
}

async function main() {
  const headedCli = process.argv.includes("--headed");
  const headless = headedCli ? false : ENV.headless;

  const browser = await chromium.launch({
    headless,
    slowMo: ENV.slowMoMs || undefined
  });

  const context = await browser.newContext({
    viewport: { width: ENV.viewportWidth, height: ENV.viewportHeight }
  });

  // Auth via cookies
  const cookies: any[] = [
    {
      name: "sessionid",
      value: ENV.tvSessionId,
      domain: ".tradingview.com",
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "Lax"
    }
  ];
  if (ENV.tvSessionIdSign) {
    cookies.push({
      name: "sessionid_sign",
      value: ENV.tvSessionIdSign,
      domain: ".tradingview.com",
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "Lax"
    });
  } else {
    console.warn("TV_SESSIONID_SIGN is empty. If TradingView redirects to login, please also set sessionid_sign.");
  }
  await context.addCookies(cookies);

  const page = await context.newPage();

  const chartUrl = buildChartUrl();
  await gotoChart(page, chartUrl);
  await hidePopupsBestEffort(page);

  if (ENV.manualSetup) {
    // Let user tweak indicators and save layout.
    console.log("MANUAL_SETUP=true → Bạn có thể chỉnh indicator / save layout. Đóng tab để bot tiếp tục...");
    await page.waitForEvent("close");
    await context.close();
    await browser.close();
    return;
  }

  if (ENV.addIndicators) {
    await addIndicatorsBestEffort(page);
  }

  const outRoot = path.join(process.cwd(), ENV.outputDir, ENV.symbol.replace(/[:/\\]/g, "_"));

  // Clear old screenshots for this symbol before taking new ones
  // Windows sometimes locks folders (Explorer preview, antivirus, etc.).
  // Use retries; if it still fails, fall back to deleting files inside.
  try {
    await fs.rm(outRoot, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  } catch (e: any) {
    const code = e?.code;
    console.warn("Warning: could not remove output dir (", code, "). Falling back to deleting files inside...");
    try {
      const entries = await fs.readdir(outRoot, { withFileTypes: true });
      for (const ent of entries) {
        const p = path.join(outRoot, ent.name);
        await fs.rm(p, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }).catch(() => {});
      }
    } catch {}
  }
  await ensureDir(outRoot);

  for (const tf of TIMEFRAMES) {
    await setTimeframe(page, chartUrl, tf);
    await hidePopupsBestEffort(page);

    const filename = `${timeframeLabel(tf)}.png`;
    const outPath = path.join(outRoot, filename);

    // Screenshot full page so includes chart; you can change to clip if you want strict chart-only.
    await page.screenshot({ path: outPath, fullPage: true });
    console.log("Saved:", outPath);
  }

  // After screenshots, optionally commit & push results to GitHub
  await gitAutoPushIfEnabled();

  await context.close();
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
