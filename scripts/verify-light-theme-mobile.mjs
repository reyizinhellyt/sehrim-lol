import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

try {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  await context.addInitScript(() => localStorage.setItem("theme", "light"));
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3000/hakkimizda", { waitUntil: "domcontentloaded" });
  await page.waitForSelector('button[aria-label="Karanlık moda geç"]');

  const result = await page.evaluate(() => ({
    hasLightClass: document.documentElement.classList.contains("light"),
    storedTheme: localStorage.getItem("theme"),
  }));
  if (!result.hasLightClass || result.storedTheme !== "light") {
    throw new Error("Mobil gündüz tema tercihi uygulanmadı.");
  }

  await page.screenshot({ path: "/home/ubuntu/webdev-static-assets/light-theme-about-mobile.png", fullPage: false });
  console.log(JSON.stringify(result));
  await context.close();
} finally {
  await browser.close();
}
