import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs/promises";
import { ENV } from "./env.js";
import { TIMEFRAMES, timeframeLabel } from "./config.js";
import { addIndicatorsBestEffort, gotoChart, hidePopupsBestEffort, setTimeframe } from "./tv.js";

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

function todayStr() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}_${hh}-${mi}-${ss}`;
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

  const outRoot = path.join(process.cwd(), ENV.outputDir, ENV.symbol.replace(/[:/\\]/g, "_"), todayStr());
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

  await context.close();
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
