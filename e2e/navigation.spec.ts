import { test, expect } from '@playwright/test';

test.describe('Navigation & Scroll', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('page loads with correct title', async ({ page }) => {
    const title = await page.title();
    expect(title).toContain('Estratégia & Resultado');
  });

  test('nav link scrolls to Serviços section', async ({ page }) => {
    await page.getByRole('button', { name: 'Serviços' }).first().click();
    await expect(page.locator('#servicos')).toBeInViewport();
  });

  test('nav link scrolls to Sobre Nós section', async ({ page }) => {
    await page.getByRole('button', { name: 'Sobre Nós' }).first().click();
    await expect(page.locator('#sobre-nos')).toBeInViewport();
  });

  test('nav link scrolls to Localização section', async ({ page }) => {
    await page.getByRole('button', { name: 'Localização' }).first().click();
    await expect(page.locator('#localizacao')).toBeInViewport();
  });

  test('nav link scrolls to Contactos section', async ({ page }) => {
    await page.getByRole('button', { name: 'Contactos' }).first().click();
    await expect(page.locator('#contactos')).toBeInViewport();
  });

  test('nav link scrolls to Formulário section', async ({ page }) => {
    await page.getByRole('button', { name: 'Formulário' }).first().click();
    await expect(page.locator('#formulario')).toBeInViewport();
  });

  test('scroll-to-top button absent before scrolling', async ({ page }) => {
    // Button is inside @if (showScrollTop()) — should not be in DOM initially
    const count = await page.locator('button[aria-label="Voltar ao topo"]').count();
    expect(count).toBe(0);
  });

  test('scroll-to-top button appears after scrolling down', async ({ page }) => {
    await page.mouse.wheel(0, 1200);
    // Wait for Angular zoneless re-render to add the button to DOM
    await page.waitForFunction(
      () => document.querySelector('button[aria-label="Voltar ao topo"]') !== null,
      { timeout: 5000 },
    );
  });

  test('scroll-to-top button scrolls back to top', async ({ page }) => {
    await page.mouse.wheel(0, 1200);
    await page.waitForFunction(
      () => document.querySelector('button[aria-label="Voltar ao topo"]') !== null,
      { timeout: 5000 },
    );
    // Use element.click() via evaluate — bypasses Playwright viewport/actionability checks
    // for buttons that may have zero dimensions due to missing CSS in test environment
    await page.evaluate(() => {
      const btn = document.querySelector('button[aria-label="Voltar ao topo"]') as HTMLElement;
      btn?.click();
    });
    await page.waitForTimeout(800);
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBe(0);
  });

  test('mobile hamburger menu button exists in DOM', async ({ page }) => {
    // The hamburger is md:hidden — check it exists regardless of CSS visibility
    const count = await page.locator('button[aria-label="Abrir menu"]').count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('mobile hamburger menu opens on click', async ({ page }) => {
    // Use element.click() via evaluate — bypasses Playwright viewport/actionability checks
    // for buttons that may have zero dimensions due to missing CSS in test environment
    await page.evaluate(() => {
      const btn = document.querySelector('button[aria-label="Abrir menu"]') as HTMLElement;
      btn?.click();
    });
    // Mobile menu renders inside @if (menuOpen()) — wait for it to appear in DOM
    await page.waitForFunction(
      () => document.querySelector('nav .space-y-1') !== null,
      { timeout: 3000 },
    );
  });

  test('mobile hamburger menu closes on second click', async ({ page }) => {
    const clickHamburger = () => page.evaluate(() => {
      const btn = document.querySelector('button[aria-label="Abrir menu"]') as HTMLElement;
      btn?.click();
    });
    await clickHamburger();
    await page.waitForFunction(() => document.querySelector('nav .space-y-1') !== null, { timeout: 3000 });
    await clickHamburger();
    await page.waitForFunction(() => document.querySelector('nav .space-y-1') === null, { timeout: 3000 });
  });
});
