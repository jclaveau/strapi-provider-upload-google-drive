import { test, expect } from '@playwright/test';
import { doLogin } from './login.spec';

// test.describe(logInTest)
// logInTest()

test('go to settings page from admin home', async ({ page, request }) => {

  await doLogin(page)

  // Go to http://localhost:13377/admin
  await page.goto('http://localhost:13377/admin');
  await expect(page).toHaveURL('http://localhost:13377/admin');
  // Click span:has-text("Settings") >> nth=0
  await page.locator('span:has-text("Settings")').first().click();
  await expect(page).toHaveURL('http://localhost:13377/admin/settings/application-infos');
  // Click #subnav-list-5 >> text=Configuration
  await page.locator('#subnav-list-5 >> text=Configuration').click();
  await expect(page).toHaveURL('http://localhost:13377/admin/settings/upload-google-drive');

  // wait for the settings to be loaded
  await page.locator('input[name="clientId"]').click();

  // ensure there is no remaining text not translated
  expect(await page.locator("body").innerHTML()).not.toMatch(/TOTRAD/);
});