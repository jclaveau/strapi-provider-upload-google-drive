import { test, expect } from '@playwright/test';

export async function doLogin(page) {
  // Go to http://localhost:13377/admin
  await page.goto('http://localhost:13377/admin');
  // Go to http://localhost:13377/admin/auth/login
  await page.goto('http://localhost:13377/admin/auth/login');
  // Click [placeholder="e\.g\. kai\@doe\.com"]
  await page.locator('[placeholder="e\\.g\\. kai\\@doe\\.com"]').click();
  // Fill [placeholder="e\.g\. kai\@doe\.com"]
  await page.locator('[placeholder="e\\.g\\. kai\\@doe\\.com"]').fill('test@test.test');
  // Press Tab
  await page.locator('[placeholder="e\\.g\\. kai\\@doe\\.com"]').press('Tab');
  // Fill input[name="password"]
  await page.locator('input[name="password"]').fill('TESTtest123');
  // Click button:has-text("Login")
  await page.locator('button:has-text("Login")').click();
  await expect(page).toHaveURL('http://localhost:13377/admin/');
}

export default function createTests() {
  test('test log in ', async ({ page }) => {
    await doLogin(page)
  });
}
