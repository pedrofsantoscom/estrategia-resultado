import { test, expect } from '@playwright/test';

const SERVICES = [
  'Fiscalidade e Contabilidade',
  'Consultoria Jurídica',
  'Consultoria de Empresas',
  'Gestão de Rendas',
  'Crédito',
  'Seguros',
  'Apoio a Negócios',
  'IRS',
];

test.describe('Service Cards', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('services section has 8 service cards', async ({ page }) => {
    const cards = page.locator('#servicos .card-hover');
    await expect(cards).toHaveCount(8);
  });

  test('each card has a name (h3)', async ({ page }) => {
    const headings = page.locator('#servicos .card-hover h3');
    await expect(headings).toHaveCount(8);
    for (const name of SERVICES) {
      await expect(page.locator('#servicos .card-hover h3').filter({ hasText: name })).toBeVisible();
    }
  });

  test('each card has a description paragraph', async ({ page }) => {
    const cards = page.locator('#servicos .card-hover');
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      const desc = cards.nth(i).locator('p');
      await expect(desc).toBeVisible();
      const text = await desc.textContent();
      expect(text!.trim().length).toBeGreaterThan(10);
    }
  });

  test('each card has a "Contactar sobre este serviço" button', async ({ page }) => {
    const buttons = page.getByRole('button', { name: 'Contactar sobre este serviço' });
    await expect(buttons).toHaveCount(8);
  });

  test('clicking service contact button scrolls to contact form', async ({ page }) => {
    const firstButton = page.getByRole('button', { name: 'Contactar sobre este serviço' }).first();
    await firstButton.click();
    await page.waitForTimeout(600);
    await expect(page.locator('#formulario')).toBeInViewport();
  });

  test('service is pre-selected in form dropdown after clicking', async ({ page }) => {
    const firstButton = page.getByRole('button', { name: 'Contactar sobre este serviço' }).first();
    await firstButton.click();
    await page.waitForTimeout(600);
    const select = page.locator('#cf-service');
    const selectedValue = await select.inputValue();
    expect(selectedValue).toBe(SERVICES[0]);
  });
});
