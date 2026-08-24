import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

try {
  const checks = [
    { path: "/", name: "homeDesktop", viewport: { width: 1280, height: 900 } },
    { path: "/hakkimizda", name: "aboutMobile", viewport: { width: 375, height: 812 } },
  ];
  const results = [];

  for (const check of checks) {
    const page = await browser.newPage({ viewport: check.viewport });
    await page.addInitScript(() => localStorage.setItem("theme", "light"));
    await page.goto(`http://127.0.0.1:3000${check.path}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(100);

    const isLight = await page.evaluate(() => document.documentElement.classList.contains("light"));
    const themeControl = await page.getByRole("button", { name: "Karanlık moda geç" }).count();
    if (!isLight || themeControl !== 1) throw new Error(`${check.name} için gündüz tema tercihi uygulanmadı.`);

    await page.screenshot({
      path: `/home/ubuntu/webdev-static-assets/light-theme-${check.name}.png`,
      fullPage: false,
    });
    results.push({ screen: check.name, lightThemeApplied: isLight, themeControlFound: themeControl === 1 });
    await page.close();
  }

  console.log(JSON.stringify(results));
} finally {
  await browser.close();
}
