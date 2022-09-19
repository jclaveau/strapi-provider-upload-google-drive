import { test, expect } from '@playwright/test';
import { doLogin } from './login.spec';
import { isInternetAvailable } from 'is-internet-available'

const strapiUrl     = 'http://localhost:13377'
const clientId      = process.env.GCLOUD_CLIENT_ID
const clientSecret  = process.env.GCLOUD_CLIENT_SECRET
const email         = process.env.GMAIL_EMAIL
const password      = process.env.GMAIL_PASSWORD


const navigateToSettings = async ({ page }) => {
  await doLogin(page)

  // Go to http://localhost:13378/admin
  await page.goto(`${strapiUrl}/admin`);
  await expect(page).toHaveURL(`${strapiUrl}/admin`);
  // Click span:has-text("Settings") >> nth=0
  await page.locator('span:has-text("Settings")').first().click();
  await expect(page).toHaveURL(`${strapiUrl}/admin/settings/application-infos`);
  // Click #subnav-list-5 >> text=Configuration
  await page.locator(':text("Google Drive Uploads")')
    .locator("xpath=ancestor::li  >> text=Configuration")
    .click();
  await expect(page).toHaveURL(`${strapiUrl}/admin/settings/upload-google-drive`);

  // wait for the settings to be loaded
  await page.locator('input[name="clientId"]').click();
}
test('navigate to settings page from admin home', navigateToSettings);


test('refresh Google OAuth token', async ({ page, request }) => {

  const googleIsReachable = await isInternetAvailable({ authority: 'https://accounts.google.com' });
  test.skip(! googleIsReachable, 'Google is not reachable')

  await navigateToSettings({page})

  // Set the clientId and clientSecret
  await page.locator('input[name="clientId"]').click();
  await page.locator('input[name="clientId"]').fill(clientId);
  await page.locator('input[name="clientSecret"]').click();
  await page.locator('input[name="clientSecret"]').fill(clientSecret);
  // Blur to trigger redirect uri update
  await page.locator('input[name="clientSecret"]').evaluate(e => e.blur());

  // Start Google Oauth authentication
  await expect(page.locator('button:has-text("Generate New Token")')).not.toBeDisabled();
  await page.locator('button:has-text("Generate New Token")').click();


  // Displaying GoogleOAuth error if it fails (required in CI environment)
  await page.waitForNavigation();
  if(page.url().match(new RegExp("^https://accounts.google.com/signin/oauth/error"))) {
    await page.locator('button:has-text("Request Details")').click({ force: true });
  }

  await expect(page).toHaveURL('https://accounts.google.com/o/oauth2/v2/auth/identifier?access_type=offline&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive.file&response_type=code&client_id=999645799896-1fu96u9kpue38dj0cvu4frsojjq9ufcl.apps.googleusercontent.com&redirect_uri=http%3A%2F%2Flocalhost%3A13377%2Fupload-google-drive%2Fgoogle-auth-redirect-uri&hl=en&flowName=GeneralOAuthFlow');

  // Authenticate
  await page.locator('[aria-label="Email or phone"]').fill(email);
  await page.locator('[aria-label="Email or phone"]').press('Enter');
  await expect(page).toHaveURL(new RegExp('https://accounts.google.com/signin/v2/challenge/pwd'));
  await page.locator('[aria-label="Enter your password"]').fill(password);
  await page.locator('[aria-label="Enter your password"]').evaluate(e => e.blur());
  await page.locator('#passwordNext button:has-text("Next")').click();

  // Ensure we are well redirected and the token is stored
  await expect(page).toHaveURL('http://localhost:13377/admin/settings/upload-google-drive');
  const fetchedSettings = JSON.parse(await page.locator('pre').textContent());
  expect(fetchedSettings).toMatchObject({
    clientId: clientId,
    clientSecret: clientSecret,
    tokens: expect.objectContaining({
      access_token: expect.stringMatching(".+"),
      refresh_token: expect.stringMatching(".+"),
      scope: 'https://www.googleapis.com/auth/drive.file',
    }),
  })

  // TODO ensure these values do not come from the config
});