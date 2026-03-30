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

test.describe('Contact Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('#formulario').scrollIntoViewIfNeeded();
  });

  test('contact form section is visible', async ({ page }) => {
    await expect(page.locator('#formulario')).toBeVisible();
  });

  test('form has name field', async ({ page }) => {
    await expect(page.locator('#cf-name')).toBeVisible();
  });

  test('form has email field', async ({ page }) => {
    await expect(page.locator('#cf-email')).toBeVisible();
  });

  test('form has phone field', async ({ page }) => {
    await expect(page.locator('#cf-phone')).toBeVisible();
  });

  test('form has service dropdown', async ({ page }) => {
    await expect(page.locator('#cf-service')).toBeVisible();
  });

  test('form has message textarea', async ({ page }) => {
    await expect(page.locator('#cf-message')).toBeVisible();
  });

  test('form has submit button', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Enviar Mensagem' })).toBeVisible();
  });

  test('service dropdown has all 8 services', async ({ page }) => {
    const select = page.locator('#cf-service');
    for (const svc of SERVICES) {
      await expect(select.locator(`option[value="${svc}"]`)).toHaveCount(1);
    }
  });

  test('validation errors shown when submitting empty form', async ({ page }) => {
    await page.getByRole('button', { name: 'Enviar Mensagem' }).click();
    await expect(page.getByText('Nome obrigatório (mínimo 2 caracteres).')).toBeVisible();
    await expect(page.getByText('Email inválido ou obrigatório.')).toBeVisible();
    await expect(page.getByText('Telefone obrigatório.')).toBeVisible();
    await expect(page.getByText('Mensagem obrigatória (mínimo 10 caracteres).')).toBeVisible();
  });

  test('email validation shows error for invalid email', async ({ page }) => {
    await page.locator('#cf-email').fill('not-an-email');
    await page.getByRole('button', { name: 'Enviar Mensagem' }).click();
    await expect(page.getByText('Email inválido ou obrigatório.')).toBeVisible();
  });

  test('email validation passes for valid email', async ({ page }) => {
    await page.locator('#cf-name').fill('João Silva');
    await page.locator('#cf-email').fill('joao@exemplo.pt');
    await page.locator('#cf-phone').fill('+351 912 345 678');
    await page.locator('#cf-message').fill('Olá, gostaria de mais informações sobre os serviços.');
    // Email field should not show error
    await expect(page.locator('#cf-email + p.text-red-500')).not.toBeVisible();
  });
});
