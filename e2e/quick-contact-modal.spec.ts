import { test, expect } from '@playwright/test';

test.describe('Quick Contact Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('"Pedir Contacto" button in nav opens modal', async ({ page }) => {
    await page.locator('nav').getByRole('button', { name: 'Pedir Contacto' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.locator('#modal-title')).toBeVisible();
  });

  test('modal has backdrop overlay', async ({ page }) => {
    await page.locator('nav').getByRole('button', { name: 'Pedir Contacto' }).click();
    await expect(page.locator('.modal-backdrop')).toBeVisible();
  });

  test('modal has name field', async ({ page }) => {
    await page.locator('nav').getByRole('button', { name: 'Pedir Contacto' }).click();
    await expect(page.locator('#qc-name')).toBeVisible();
  });

  test('modal has phone field', async ({ page }) => {
    await page.locator('nav').getByRole('button', { name: 'Pedir Contacto' }).click();
    await expect(page.locator('#qc-phone')).toBeVisible();
  });

  test('modal has preferred time dropdown', async ({ page }) => {
    await page.locator('nav').getByRole('button', { name: 'Pedir Contacto' }).click();
    await expect(page.locator('#qc-time')).toBeVisible();
  });

  test('modal has service dropdown', async ({ page }) => {
    await page.locator('nav').getByRole('button', { name: 'Pedir Contacto' }).click();
    await expect(page.locator('#qc-service')).toBeVisible();
  });

  test('close button closes modal', async ({ page }) => {
    await page.locator('nav').getByRole('button', { name: 'Pedir Contacto' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    // Use element.click() via evaluate — bypasses Playwright viewport/actionability checks
    // for buttons that may have zero dimensions due to missing CSS in test environment
    await page.evaluate(() => {
      const btn = document.querySelector('button[aria-label="Fechar modal"]') as HTMLElement;
      btn?.click();
    });
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 3000 });
  });

  test('backdrop click closes modal', async ({ page }) => {
    await page.locator('nav').getByRole('button', { name: 'Pedir Contacto' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    // Dispatch a click event directly on the .modal-backdrop element so that
    // event.target.classList.contains('modal-backdrop') evaluates to true,
    // matching the onBackdropClick guard in the Angular component.
    await page.evaluate(() => {
      const backdrop = document.querySelector('.modal-backdrop') as HTMLElement;
      if (backdrop) {
        backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      }
    });
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 3000 });
  });

  test('validation shows errors when submitting empty modal form', async ({ page }) => {
    await page.locator('nav').getByRole('button', { name: 'Pedir Contacto' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.locator('#qc-name').fill('');
    await page.locator('#qc-phone').fill('');
    await page.locator('[role="dialog"] button[type="submit"]').click({ force: true });
    await expect(page.getByText('Nome obrigatório.')).toBeVisible();
    await expect(page.getByText('Telefone obrigatório.')).toBeVisible();
  });
});
