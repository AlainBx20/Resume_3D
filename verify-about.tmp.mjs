import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (err) => errors.push(String(err)));
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });

await page.goto("http://localhost:5183/", { waitUntil: "load" });
await page.waitForTimeout(9000);
await page.mouse.click(640, 400);
await page.waitForTimeout(1000);

await page.screenshot({ path: "out-1-spawn.png" });

// strafe right off the Skills path, then walk across the plaza to About
await page.keyboard.down("KeyD");
await page.waitForTimeout(1200);
await page.keyboard.up("KeyD");
await page.keyboard.down("KeyW");
await page.waitForTimeout(5000);
await page.keyboard.up("KeyW");
await page.screenshot({ path: "out-2-plaza.png" });
await page.keyboard.down("KeyW");
await page.waitForTimeout(5500);
await page.keyboard.up("KeyW");
await page.waitForTimeout(300);
await page.screenshot({ path: "out-3-about-door.png" });
const pos = await page.evaluate(() => (window.__playerPos ?? []).map((n) => n.toFixed(1)).join(","));
console.log("pos:", pos);

await page.keyboard.press("KeyE");
await page.waitForTimeout(2500);
await page.screenshot({ path: "out-4-about-interior.png" });
await page.mouse.move(240, 420);
await page.waitForTimeout(400);
await page.screenshot({ path: "out-5-about-left.png" });

console.log("ERRORS:", JSON.stringify(errors.slice(0, 10)));
await browser.close();
