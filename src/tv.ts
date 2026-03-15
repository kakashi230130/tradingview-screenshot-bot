import type { Page } from "playwright";
import type { Timeframe } from "./config.js";

export async function gotoChart(page: Page, chartUrl: string) {
  await page.goto(chartUrl, { waitUntil: "domcontentloaded" });
  // TradingView is heavy; wait a bit for chart canvas to mount.
  await page.waitForTimeout(2500);
}

/**
 * More robust than UI clicking: reload the chart with the `interval` query param.
 * Example: https://www.tradingview.com/chart/<id>/?symbol=...&interval=15
 */
export async function setTimeframe(page: Page, baseChartUrl: string, tf: Timeframe) {
  const u = new URL(baseChartUrl);
  u.searchParams.set("interval", tf);
  await page.goto(u.toString(), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
}

export async function addIndicatorsBestEffort(_page: Page) {
  // Disabled: indicators (Volume/MA) are already configured on the chart.
  // Keeping this function as a no-op so the rest of the pipeline stays unchanged.
  return;
}

export async function hidePopupsBestEffort(page: Page) {
  // Dismiss cookie/marketing popups if present.
  const texts = [
    /accept all/i,
    /i understand/i,
    /got it/i,
    /close/i
  ];
  for (const re of texts) {
    const btn = page.getByRole("button", { name: re }).first();
    if (await btn.isVisible({ timeout: 500 }).catch(() => false)) {
      await btn.click().catch(() => {});
      await page.waitForTimeout(300);
    }
  }
}
