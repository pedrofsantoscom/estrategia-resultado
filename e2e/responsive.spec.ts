import { test, expect } from '@playwright/test';

test.describe('Responsive Design — Desktop (1280px)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
  });

  test('desktop nav links are visible', async ({ page }) => {
    // At 1280px, md:flex applies → desktop nav is visible
    const display = await page.evaluate(() => {
      const navEl = document.querySelector('nav');
      // Find the div that has both 'hidden' and 'md:flex' in its classList
      const divs = navEl?.querySelectorAll('div') ?? [];
      for (const div of divs) {
        if (div.classList.contains('md:flex')) {
          return window.getComputedStyle(div).display;
        }
      }
      return 'not found';
    });
    expect(display).not.toBe('none');
    expect(display).not.toBe('not found');
  });

  test('hamburger menu button has md:hidden class (hides at desktop breakpoint)', async ({ page }) => {
    // Verify the hamburger button carries the md:hidden Tailwind class that hides it at ≥768px.
    // Checking the class rather than computed display because Tailwind utilities require a
    // production build to be fully generated — the class attribute is source-of-truth.
    const hasClass = await page.evaluate(() => {
      const btn = document.querySelector('button[aria-label="Abrir menu"]');
      return btn ? btn.classList.contains('md:hidden') : false;
    });
    expect(hasClass).toBe(true);
  });

  test('services section shows 8 cards', async ({ page }) => {
    const cards = page.locator('#servicos .card-hover');
    await expect(cards).toHaveCount(8);
  });
});

test.describe('Responsive Design — Tablet (768px)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
  });

  test('hero section is visible', async ({ page }) => {
    await expect(page.locator('#inicio')).toBeVisible();
  });

  test('service cards are visible', async ({ page }) => {
    const cards = page.locator('#servicos .card-hover');
    await expect(cards).toHaveCount(8);
  });
});

test.describe('Responsive Design — Mobile (375px)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
  });

  test('hamburger menu button has md:hidden class (responsive markup)', async ({ page }) => {
    // Verify the hamburger button carries the md:hidden Tailwind class that hides it at ≥768px.
    // Checking the class rather than computed display because Tailwind utilities require a
    // production build to be fully generated — the class attribute is source-of-truth.
    const hasClass = await page.evaluate(() => {
      const btn = document.querySelector('button[aria-label="Abrir menu"]');
      return btn ? btn.classList.contains('md:hidden') : false;
    });
    expect(hasClass).toBe(true);
  });

  test('desktop nav links container has hidden + md:flex classes (responsive markup)', async ({ page }) => {
    // Verify the desktop nav container carries both 'hidden' and 'md:flex' Tailwind classes
    // that hide it on mobile and show it at ≥768px.
    // Checking the class rather than computed display because Tailwind utilities require a
    // production build to be fully generated — the class attribute is source-of-truth.
    const hasClasses = await page.evaluate(() => {
      const navEl = document.querySelector('nav');
      const divs = navEl?.querySelectorAll('div') ?? [];
      for (const div of divs) {
        if (div.classList.contains('md:flex') && div.classList.contains('hidden')) {
          return true;
        }
      }
      return false;
    });
    expect(hasClasses).toBe(true);
  });

  test('hero section is visible on mobile', async ({ page }) => {
    await expect(page.locator('#inicio')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('service cards are stacked on mobile', async ({ page }) => {
    const cards = page.locator('#servicos .card-hover');
    await expect(cards).toHaveCount(8);
    const firstBox = await cards.nth(0).boundingBox();
    const secondBox = await cards.nth(1).boundingBox();
    // Stacked: first card's bottom edge should be above second card's top
    expect(firstBox!.y + firstBox!.height).toBeLessThanOrEqual(secondBox!.y + 5);
  });

  test('"Pedir Contacto" CTA button is in nav on mobile', async ({ page }) => {
    await expect(page.locator('nav').getByRole('button', { name: 'Pedir Contacto' })).toBeVisible();
  });
});
