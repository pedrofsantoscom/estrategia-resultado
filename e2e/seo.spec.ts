import { test, expect } from '@playwright/test';

test.describe('SEO & Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('meta title is correct', async ({ page }) => {
    const title = await page.title();
    expect(title).toContain('Estratégia & Resultado');
    expect(title).toContain('Guimarães');
  });

  test('meta description is present and non-empty', async ({ page }) => {
    const desc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(desc).toBeTruthy();
    expect(desc!.length).toBeGreaterThan(20);
  });

  test('og:title is present', async ({ page }) => {
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    expect(ogTitle).toBeTruthy();
    expect(ogTitle).toContain('Estratégia');
  });

  test('og:description is present', async ({ page }) => {
    const ogDesc = await page.locator('meta[property="og:description"]').getAttribute('content');
    expect(ogDesc).toBeTruthy();
    expect(ogDesc!.length).toBeGreaterThan(20);
  });

  test('og:type is present', async ({ page }) => {
    const ogType = await page.locator('meta[property="og:type"]').getAttribute('content');
    expect(ogType).toBeTruthy();
  });

  test('og:url is present', async ({ page }) => {
    const ogUrl = await page.locator('meta[property="og:url"]').getAttribute('content');
    expect(ogUrl).toBeTruthy();
  });

  test('JSON-LD structured data is present', async ({ page }) => {
    const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
    expect(jsonLd).toBeTruthy();
    const parsed = JSON.parse(jsonLd!);
    expect(parsed['@type']).toBe('ProfessionalService');
    expect(parsed.name).toContain('Estratégia');
  });

  test('page has exactly one h1', async ({ page }) => {
    const h1s = page.locator('h1');
    await expect(h1s).toHaveCount(1);
  });

  test('sections have h2 headings', async ({ page }) => {
    const h2s = page.locator('h2');
    const count = await h2s.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('phone links use tel: protocol', async ({ page }) => {
    const telLinks = page.locator('a[href^="tel:"]');
    const count = await telLinks.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('email links use mailto: protocol', async ({ page }) => {
    const mailLinks = page.locator('a[href^="mailto:"]');
    const count = await mailLinks.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('all images have alt text', async ({ page }) => {
    const images = page.locator('img');
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt, `Image ${i} is missing alt text`).not.toBeNull();
    }
  });
});
