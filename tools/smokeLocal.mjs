/**
 * Local smoke test: signs in as the store owner and walks the main screens,
 * saving screenshots (desktop and phone width) and reporting console errors
 * and failed API calls. Exits 1 when anything failed.
 *
 * The login comes from the BACKEND .env (BOMBAY_OWNER_EMAIL / _PASSWORD,
 * written by scripts/createBombayMedical.mjs) and is never printed.
 *
 * Needs the web app on :8081 and the API on :5002. Uses the installed Chrome.
 * Run: node tools/smokeLocal.mjs <screenshot-folder>
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const APP = process.env.APP_URL || "http://localhost:8081";
const OUT = path.resolve(process.argv[2] || "smoke-shots");
const BACKEND_ENV = path.resolve(
  import.meta.dirname,
  "../../11Nov26-medical-back/.env",
);

const env = Object.fromEntries(
  fs
    .readFileSync(BACKEND_ENV, "utf8")
    .split(/\r?\n/)
    .map((l) => l.match(/^([A-Z0-9_]+)=(.*)$/))
    .filter(Boolean)
    .map(([, k, v]) => [k, v.replace(/^"|"$/g, "")]),
);
// SMOKE_EMAIL / SMOKE_PASSWORD override, e.g. for the QA server (scripts/qaServer.mjs).
const EMAIL = process.env.SMOKE_EMAIL || env.BOMBAY_OWNER_EMAIL;
const PASSWORD = process.env.SMOKE_PASSWORD || env.BOMBAY_OWNER_PASSWORD;
if (!EMAIL || !PASSWORD)
  throw new Error(
    "No login: set SMOKE_EMAIL/SMOKE_PASSWORD or BOMBAY_OWNER_* in the backend .env",
  );

const PAGES = [
  "dashboard",
  "products",
  "medguide",
  "sales",
  "inventory",
  "reports",
  "profile",
];
const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  phone: { width: 390, height: 844 },
};

fs.mkdirSync(OUT, { recursive: true });
const problems = [];
const browser = await chromium.launch({ channel: "chrome", headless: true });

for (const [label, viewport] of Object.entries(VIEWPORTS)) {
  const page = await browser.newPage({ viewport });
  // Failed requests are judged by the response handler below; the browser's
  // own "Failed to load resource" console line would only duplicate them.
  page.on("console", (m) => {
    if (m.type() === "error" && !m.text().startsWith("Failed to load resource"))
      problems.push(`[${label}] console: ${m.text().slice(0, 200)}`);
  });
  page.on("pageerror", (e) =>
    problems.push(`[${label}] page error: ${e.message.slice(0, 200)}`),
  );
  page.on("response", (r) => {
    const deviceLimit = r.status() === 409 && r.url().includes("/auth/login"); // handled below
    if (r.url().includes("/api/") && r.status() >= 400 && !deviceLimit)
      problems.push(
        `[${label}] ${r.status()} ${r.request().method()} ${r.url().replace(/^https?:\/\/[^/]+/, "")}`,
      );
  });
  // The app holds a live socket, so the network never goes idle: settle by time.
  const settle = () => page.waitForTimeout(2500);
  const shot = (name) =>
    page.screenshot({ path: path.join(OUT, `${label}-${name}.png`) });

  await page.goto(`${APP}/login`, { waitUntil: "domcontentloaded" });
  await settle();
  await shot("01-login");
  await page.getByPlaceholder("you@company.com").fill(EMAIL);
  await page.getByPlaceholder("••••••••").fill(PASSWORD);
  await page.getByText("Sign in", { exact: true }).last().click();
  // Each test browser is a new device; past the account's device limit the app
  // offers to end the other sessions, as a user would accept.
  const everywhere = page.getByText("Sign out everywhere and continue here", {
    exact: true,
  });
  await Promise.race([
    page.waitForURL((u) => !u.pathname.startsWith("/login"), {
      timeout: 30000,
    }),
    everywhere
      .waitFor({ timeout: 30000 })
      .then(() => everywhere.click())
      .catch(() => {}), // not shown: the sign-in went straight through
  ]);
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), {
    timeout: 30000,
  });
  await settle();
  await shot("02-after-login");
  if (new URL(page.url()).pathname !== "/dashboard")
    problems.push(
      `[${label}] after login landed on ${new URL(page.url()).pathname}, not /dashboard`,
    );
  // The Settings page is gone: no menu entry, and its old URL opens the Dashboard.
  if (
    label === "desktop" &&
    (await page.getByText("Settings", { exact: true }).count())
  )
    problems.push(`[${label}] a "Settings" entry is still shown`);
  await page.goto(`${APP}/settings`, { waitUntil: "domcontentloaded" });
  await settle();
  await shot("02b-old-settings-url");
  if (!(await page.getByText("Today's sales").count()))
    problems.push(
      `[${label}] /settings did not open the Dashboard (at ${page.url()})`,
    );

  for (const [i, route] of PAGES.entries()) {
    await page.goto(`${APP}/${route}`, { waitUntil: "domcontentloaded" });
    await settle();
    await shot(`${String(i + 3).padStart(2, "0")}-${route}`);
  }

  await page.goto(`${APP}/medguide`, { waitUntil: "domcontentloaded" });
  await page
    .getByPlaceholder("Search by name, salt or manufacturer")
    .fill("dolo 650");
  await page.waitForTimeout(1500);
  await settle();
  await shot("20-medguide-search");
  const hit = page.getByText(/dolo 650/i).first();
  if (await hit.count()) {
    await hit.click();
    await settle();
    await page.waitForTimeout(1000);
    await shot("21-medicine-detail");
  } else
    problems.push(`[${label}] MedGuide search for "dolo 650" showed no result`);
  await page.close();
}

await browser.close();
console.log(`Screenshots: ${OUT}`);
console.log(
  problems.length
    ? `PROBLEMS (${problems.length}):\n${problems.join("\n")}`
    : "No console errors or failed API calls.",
);
process.exitCode = problems.length ? 1 : 0;
