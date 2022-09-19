import { test, expect } from '@playwright/test';

import { doLogin } from './login.spec';
import allTranslations from '../../admin/src/translations/allTranslations';

test('test there is no missing translation', async ({ page, request }) => {
  await doLogin(page)

  for (const locale in allTranslations) {
    await request.put(`http://localhost:13377/admin/users/me`, {
      // TODO only put the locale?
      data: {
        "email": "test@test.test",
        "firstname": "Test",
        "lastname": "Test",
        "username": "test@test.test",
        "preferedLanguage": locale,
        "currentPassword": "TESTtest123"
      }
    });

    await page.goto('http://localhost:13377/admin/settings/upload-google-drive');
    await expect(page).toHaveURL('http://localhost:13377/admin/settings/upload-google-drive');

    // wait for the settings to be loaded
    await page.locator('input[name="clientId"]').click();

    // ensure there is no remaining text not translated
    expect(await page.locator("body").innerHTML()).not.toMatch(/TOTRAD/);
  }
});