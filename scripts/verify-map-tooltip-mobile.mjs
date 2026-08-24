import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

try {
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3000/?theme=dark", { waitUntil: "networkidle" });
  await page.locator(".map-panel").scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  const city = page.locator('.turkey-map svg g[data-city-code="06"]');
  await city.waitFor();
  const cityBox = await city.boundingBox();
  if (!cityBox) throw new Error("Ankara il alanının ekran konumu ölçülemedi");
  await page.touchscreen.tap(cityBox.x + cityBox.width / 2, cityBox.y + cityBox.height / 2);

  const tooltip = page.locator(".map-vote-tooltip");
  await tooltip.waitFor();
  const enterAnimation = await tooltip.evaluate(tooltipElement => ({
    className: tooltipElement.className,
    animationName: getComputedStyle(tooltipElement).animationName,
    personalLeaderInfoVisible: Boolean(tooltipElement.querySelector(".map-vote-tooltip-leader")) || tooltipElement.textContent?.includes("GÜNÜN LİDERİ") || false,
  }));
  const metrics = await tooltip.evaluate(tooltipElement => {
    const mapElement = tooltipElement.closest(".turkey-map");
    if (!mapElement) return null;
    const tooltipBox = tooltipElement.getBoundingClientRect();
    const mapBox = mapElement.getBoundingClientRect();
    return {
      text: tooltipElement.textContent,
      isWithinMap: tooltipBox.left >= mapBox.left && tooltipBox.right <= mapBox.right && tooltipBox.top >= mapBox.top && tooltipBox.bottom <= mapBox.bottom,
      tooltipWidth: Math.round(tooltipBox.width),
      mapWidth: Math.round(mapBox.width),
    };
  });
  if (!metrics?.isWithinMap || !metrics.text?.includes("Ankara") || !metrics.text.includes("Günlük oy") || !metrics.text.includes("Türkiye sırası") || enterAnimation.personalLeaderInfoVisible || !enterAnimation.className.includes("is-static") || enterAnimation.animationName !== "none") {
    throw new Error(`Mobil tooltip konumu veya içeriği doğrulanamadı: ${JSON.stringify(metrics)}`);
  }
  const selectedDetail = page.locator(".city-detail-card", { hasText: "Ankara" });
  await selectedDetail.waitFor();
  const rankingPresentation = await page.locator(".ranking-row", { hasText: "Ankara" }).evaluate(element => ({
    className: element.className,
    backgroundColor: getComputedStyle(element).backgroundColor,
  }));
  const podiumHasSelection = await page.locator(".podium-card").evaluateAll(cards => cards.some(card => card.classList.contains("selected")));
  if (rankingPresentation.className.includes("selected") || rankingPresentation.backgroundColor !== "rgba(0, 0, 0, 0)" || podiumHasSelection) {
    throw new Error("Mobil harita seçimi sıralama veya podyum kartını kalıcı olarak vurguladı.");
  }

  await page.locator(".map-panel").screenshot({ path: "/home/ubuntu/webdev-static-assets/map-vote-tooltip-mobile.png" });
  await page.touchscreen.tap(cityBox.x + cityBox.width / 2, cityBox.y + cityBox.height / 2);
  const closingTooltip = page.locator(".map-vote-tooltip.is-closing");
  await closingTooltip.waitFor();
  await closingTooltip.waitFor({ state: "detached" });

  await page.touchscreen.tap(cityBox.x + cityBox.width / 2, cityBox.y + cityBox.height / 2);
  await tooltip.waitFor();
  const mapBox = await page.locator(".turkey-map").boundingBox();
  if (!mapBox) throw new Error("Harita sınırları ölçülemedi");
  await page.touchscreen.tap(5, Math.min(807, Math.max(5, mapBox.y + mapBox.height / 2)));
  await closingTooltip.waitFor();
  await closingTooltip.waitFor({ state: "detached" });
  console.log(JSON.stringify({ ...metrics, enterAnimation: enterAnimation.animationName, rankingPresentation, podiumHasSelection, secondTapClosed: true, outsideTapClosed: true }));
  await context.close();
} finally {
  await browser.close();
}
