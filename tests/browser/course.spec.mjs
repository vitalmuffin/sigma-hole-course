// Optional Playwright test template. Install @playwright/test separately.
import { test, expect } from "@playwright/test";

test("mobile shell, explicit quiz, and no console errors", async ({ page }) => {
  const errors = [];
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("http://127.0.0.1:8000/");
  await expect(page.locator("#course-title")).toBeVisible();
  await expect(page.locator("#quiz-dialog")).not.toBeVisible();
  await page.getByRole("button", { name: /knowledge check|verständnischeck/i }).click();
  await expect(page.locator("#quiz-dialog")).toBeVisible();
  expect(errors).toEqual([]);
});
