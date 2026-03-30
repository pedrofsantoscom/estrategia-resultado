import { test } from '@playwright/test';
test('check h-6 with fixed source', async ({ page }) => {
  await page.goto('/');
  const h = await page.evaluate(() => {
    const d = document.createElement('div');
    d.className = 'h-6';
    document.body.appendChild(d);
    const r = getComputedStyle(d).height;
    document.body.removeChild(d);
    return r;
  });
  console.log('h-6 height:', h);
});
