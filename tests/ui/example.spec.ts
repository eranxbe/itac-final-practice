import { test, expect } from '@playwright/test';

test('has title', { tag: ['@ui', '@smoke'] }, async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Playwright/);
});

test('get started link', { tag: ['@ui', '@regression'] }, async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: 'Get started' }).click();

  await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
});
