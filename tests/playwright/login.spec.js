import { test, expect } from '@playwright/test';

const strapiUrl = 'http://localhost:13377'

export async function doLogin(page) {
  await page.goto(`${strapiUrl}/admin`);
  await page.goto(`${strapiUrl}/admin/auth/login`);

  await page.locator('[placeholder="e\\.g\\. kai\\@doe\\.com"]').click();
  await page.locator('[placeholder="e\\.g\\. kai\\@doe\\.com"]').fill('test@test.test');
  // await page.locator('[placeholder="e\\.g\\. kai\\@doe\\.com"]').press('Tab');
  await page.locator('input[name="password"]').fill('TESTtest123');
  await page.locator('button:has-text("Login")').click();
  await expect(page).toHaveURL(`${strapiUrl}/admin/`);
}

export default function createTests() {
  test('test log in to Strapi', async ({ page }) => {
    await doLogin(page)
  });
}
