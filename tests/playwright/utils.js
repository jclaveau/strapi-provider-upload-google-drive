
async function waitAndFullSnapshot(page, delay=5000) {
  await page.evaluate(() => {
    return new Promise((resolve) => setTimeout(resolve, delay));
  });
  await page.screenshot({ path: 'test-results/manual_screenshot.png', fullPage: true });
}