import { chromium } from "playwright";
import { existsSync } from "node:fs";

const browserCandidates = [
  process.env.BROWSER_PATH,
  "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].filter(Boolean);
const executablePath = browserCandidates.find((candidate) => existsSync(candidate));
const browser = await chromium.launch(executablePath ? { executablePath } : {});
const errors = [];
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on("pageerror", (error) => errors.push(String(error)));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});

await page.goto("http://localhost:5183/", { waitUntil: "load", timeout: 60000 });
await page.waitForTimeout(4000);
await page.screenshot({ path: "qa-intro.png" });

const chapterCount = await page.locator(".resume-link").count();
if (chapterCount !== 6) throw new Error(`Expected 6 résumé chapters, found ${chapterCount}`);

await page.getByRole("button", { name: /Education/ }).click();
await page.waitForTimeout(300);
if (!(await page.getByText("Faculty of Sciences of Tunis (FST)").isVisible())) throw new Error("Education overview did not open");
if (!(await page.getByText("Lycée Pilote Radhiâ Haddad, El Omrane").isVisible())) throw new Error("Education overview is incomplete");
await page.screenshot({ path: "qa-panel.png" });
await page.getByRole("button", { name: "Close résumé chapter" }).click();

await page.getByRole("button", { name: /(Enter the town|Continue exploring)/ }).click();
await page.waitForTimeout(700);
const pointerLocked = await page.evaluate(() => Boolean(document.pointerLockElement));
if (!pointerLocked) throw new Error("Town did not acquire pointer lock from the entry overlay");
await page.screenshot({ path: "qa-spawn.png" });

const movementBefore = await page.evaluate(() => [
  window.__camera.position.x,
  window.__camera.position.z,
]);
await page.keyboard.down("KeyW");
await page.waitForTimeout(450);
await page.keyboard.up("KeyW");
const movementAfter = await page.evaluate(() => [
  window.__camera.position.x,
  window.__camera.position.z,
]);
if (Math.hypot(movementAfter[0] - movementBefore[0], movementAfter[1] - movementBefore[1]) < 0.5) {
  throw new Error("Player movement was blocked near spawn");
}

await page.evaluate(() => document.exitPointerLock());
await page.locator(".pause-card").waitFor({ state: "visible", timeout: 3000 });

for (const id of ["about", "education", "experience", "skills", "projects", "contact"]) {
  await page.evaluate((sectionId) => {
    window.__townStore.getState().setLocked(true);
    window.__townStore.getState().enterHouse(sectionId);
  }, id);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `qa-interior-${id}.png` });
  const inside = await page.evaluate(() => window.__townStore.getState().insideId);
  if (inside !== id) throw new Error(`Failed to enter ${id}`);
  await page.evaluate(() => window.__townStore.getState().exitHouse());
  await page.waitForTimeout(150);
}

await page.keyboard.press("Digit3");
await page.waitForTimeout(5000);
await page.evaluate(() => {
  window.__atm.boltSeed = 0.42;
  window.__atm.boltAt = performance.now();
  window.__atm.flash = 1;
});
await page.waitForTimeout(80);
await page.screenshot({ path: "qa-weather-storm.png" });
await page.keyboard.press("Digit4");
await page.waitForTimeout(5000);
await page.screenshot({ path: "qa-weather-snow.png" });

const renderInfo = await page.evaluate(() => ({
  calls: window.__renderer.info.render.calls,
  triangles: window.__renderer.info.render.triangles,
  geometries: window.__renderer.info.memory.geometries,
  textures: window.__renderer.info.memory.textures,
}));

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
mobile.on("pageerror", (error) => errors.push(`mobile: ${String(error)}`));
await mobile.goto("http://localhost:5183/", { waitUntil: "load", timeout: 60000 });
await mobile.waitForTimeout(2500);
await mobile.screenshot({ path: "qa-mobile.png" });
if ((await mobile.locator(".resume-link").count()) !== 6) throw new Error("Mobile résumé menu is incomplete");

console.log(JSON.stringify({ pointerLocked, chapterCount, renderInfo, errors }, null, 2));
await browser.close();
if (errors.length) process.exitCode = 1;
