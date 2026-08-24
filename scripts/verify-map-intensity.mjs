import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto("http://127.0.0.1:3000/?theme=dark", { waitUntil: "networkidle" });
  await page.waitForSelector(".turkey-map svg g[data-city-code]");

  const fills = await page.$$eval(".turkey-map svg g[data-city-code] path", paths =>
    paths.map(path => getComputedStyle(path).fill)
  );
  const distinctFills = [...new Set(fills)];
  if (!fills.length) throw new Error("Haritadaki il bölgelerinin renk verisi okunamadı.");

  await page.locator('g[data-city-code="06"]').hover();
  const tooltip = page.getByRole("tooltip");
  await tooltip.waitFor();
  const tooltipText = await tooltip.textContent();
  const enterAnimation = await tooltip.evaluate(element => ({
    className: element.className,
    animationName: getComputedStyle(element).animationName,
    personalLeaderInfoVisible: Boolean(element.querySelector(".map-vote-tooltip-leader")) || element.textContent?.includes("GÜNÜN LİDERİ") || false,
  }));
  if (!tooltipText?.includes("Ankara") || !tooltipText.includes("Günlük oy") || !tooltipText.includes("Türkiye sırası") || enterAnimation.personalLeaderInfoVisible || !enterAnimation.className.includes("is-visible") || !enterAnimation.animationName.includes("map-tooltip-enter")) {
    throw new Error("Harita tooltipi anlık oy bilgisini göstermedi.");
  }

  await page.locator(".map-panel").screenshot({ path: "/home/ubuntu/webdev-static-assets/map-vote-tooltip.png" });
  await page.mouse.move(4, 4);
  const closingTooltip = page.locator(".map-vote-tooltip.is-closing");
  await closingTooltip.waitFor();
  const exitAnimation = await closingTooltip.evaluate(element => getComputedStyle(element).animationName);
  if (!exitAnimation.includes("map-tooltip-exit")) {
    throw new Error("Harita tooltipi çıkış animasyonuna geçmedi.");
  }
  await closingTooltip.waitFor({ state: "detached" });
  await page.locator('g[data-city-code="06"]').click();
  await tooltip.waitFor();
  const clickPresentation = await tooltip.evaluate(element => ({
    className: element.className,
    animationName: getComputedStyle(element).animationName,
  }));
  if (!clickPresentation.className.includes("is-static") || clickPresentation.animationName !== "none") {
    throw new Error("Tıklama tooltipi ilk kareden sabit görünmedi.");
  }
  const rankingPresentation = await page.locator(".ranking-row", { hasText: "Ankara" }).evaluate(element => ({
    className: element.className,
    backgroundColor: getComputedStyle(element).backgroundColor,
  }));
  const podiumHasSelection = await page.locator(".podium-card").evaluateAll(cards => cards.some(card => card.classList.contains("selected")));
  if (rankingPresentation.className.includes("selected") || rankingPresentation.backgroundColor !== "rgba(0, 0, 0, 0)" || podiumHasSelection) {
    throw new Error("Harita seçimi sıralama veya podyum kartını kalıcı olarak vurguladı.");
  }
  await page.locator(".map-panel").screenshot({ path: "/home/ubuntu/webdev-static-assets/map-vote-tooltip.png" });
  console.log(JSON.stringify({ distinctFillCount: distinctFills.length, fills: distinctFills, tooltipText, enterAnimation: enterAnimation.animationName, exitAnimation, clickPresentation, rankingPresentation, podiumHasSelection }));
} finally {
  await browser.close();
}
