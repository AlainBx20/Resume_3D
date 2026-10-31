import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (err) => errors.push(String(err)));

await page.goto("http://localhost:5183/", { waitUntil: "load" });
await page.waitForTimeout(8000);
await page.mouse.click(640, 400);
await page.waitForTimeout(1000);

// spawn view — the sign board should face us, orange side visible
await page.screenshot({ path: "sign-1-spawn.png" });

// look right at the sign for a close check
await page.mouse.move(900, 420);
await page.waitForTimeout(400);
await page.screenshot({ path: "sign-2-closeup.png" });

// turn around 180° to check lamp arms from across the plaza
await page.mouse.move(640, 400);
await page.waitForTimeout(200);
for (let i = 0; i < 6; i++) {
  await page.mouse.move(940, 400);
  await page.waitForTimeout(150);
}
await page.screenshot({ path: "sign-3-turned.png" });

console.log("ERRORS:", JSON.stringify(errors.slice(0, 10)));
await browser.close();
