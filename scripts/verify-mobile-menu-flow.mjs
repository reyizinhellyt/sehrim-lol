import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

try {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await page.goto("http://127.0.0.1:3000/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Menüyü aç" }).click();
  await page.waitForSelector("#mobile-main-navigation");
  await page.waitForTimeout(450);

  const menuBox = await page.locator("#mobile-main-navigation").boundingBox();
  const heroBox = await page.locator(".hero-section").boundingBox();
  const menuBottom = menuBox ? menuBox.y + menuBox.height : 0;
  if (!menuBox || !heroBox || menuBottom > heroBox.y) {
    throw new Error("Mobil menü hero alanını aşağı itmedi.");
  }

  await page.screenshot({
    path: "/home/ubuntu/webdev-static-assets/mobile-menu-flow-check.png",
    fullPage: false,
  });
  console.log(JSON.stringify({ menuBottom, heroTop: heroBox.y, flowVerified: true }));
} finally {
  await browser.close();
}
