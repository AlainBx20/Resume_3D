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

await page.screenshot({ path: "int-0-spawn.png" });

// spawn is within interact range of the Skills house — enter it directly
await page.keyboard.press("KeyE");
await page.waitForTimeout(2500);
await page.screenshot({ path: "int-1-skills.png" });

// look around the room
await page.mouse.move(240, 400); // pan left
await page.waitForTimeout(400);
await page.screenshot({ path: "int-2-skills-left.png" });
await page.mouse.move(1040, 400); // pan right
await page.waitForTimeout(400);
await page.screenshot({ path: "int-3-skills-right.png" });

console.log("ERRORS:", JSON.stringify(errors.slice(0, 10)));
await browser.close();
