import { expect, test } from '@playwright/test';

test('canvas starts with a card, plus buttons create connections, draft survives reload', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByLabel('Что происходит?')).toHaveValue('');
  await expect(page.getByRole('heading', { name: 'Начните с первого действия' })).toBeVisible();
  await page.getByLabel('Что происходит?').fill('Открытие модального окна');
  const canvas = page.locator('canvas');
  const box = (await canvas.boundingBox())!;
  // Initial fit is at 100% in this desktop viewport. The card is centred including plus margins.
  const cardX = (box.width - 302) / 2;
  const cardY = (box.height - 224) / 2;
  await canvas.click({ position: { x: cardX + 280, y: cardY + 87 } });
  await expect(page.locator('.board-stats')).toContainText('2 карточки');
  await page.getByLabel('Что происходит?').fill('Выбор клиента');
  await canvas.click({ position: { x: cardX + 348 + 126, y: cardY + 202 } });
  await expect(page.locator('.board-stats')).toContainText('3 карточки');
  await page.getByLabel('Что происходит?').fill('Клиент найден');
  await expect(page.getByLabel('Что происходит?')).toHaveValue('Клиент найден');
  await page.waitForTimeout(350);
  await page.reload();
  await expect(page.locator('.board-stats')).toContainText('3 карточки');
  await page.getByRole('button', { name: 'Показать всю доску' }).click();
  await page.screenshot({ path: 'test-results/scenario-desktop.png' });
  expect(errors).toEqual([]);
});

test('server error is visible without losing changes; mobile layout has no horizontal overflow', async ({
  page,
}) => {
  await page.route('**/graphql', (route) => route.abort());
  await page.goto('/');
  await page.getByLabel('Что происходит?').fill('Мой черновик');
  await page.getByRole('button', { name: /Сохранить доску/ }).click();
  await expect(page.getByRole('alert')).toContainText('Нет связи с сервером');
  await expect(page.getByLabel('Что происходит?')).toHaveValue('Мой черновик');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);
  await page.getByRole('button', { name: 'Закрыть уведомление' }).click();
  await page.screenshot({ path: 'test-results/scenario-mobile.png' });
  await page.getByLabel('Что происходит?').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/scenario-mobile-editor.png' });
});

test('dragging updates card coordinates and zoom controls update the viewport', async ({
  page,
}) => {
  await page.goto('/');
  const box = (await page.locator('canvas').boundingBox())!;
  const start = { x: box.x + (box.width - 302) / 2 + 80, y: box.y + (box.height - 224) / 2 + 70 };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 100, start.y + 60, { steps: 8 });
  await page.mouse.up();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const raw = localStorage.getItem('planner:draft:v1');

        if (!raw) {
          return null;
        }

        const draft = JSON.parse(raw);
        return { x: draft.document.cards[0].x, y: draft.document.cards[0].y };
      }),
    )
    .toEqual({ x: 100, y: 60 });
  await page.getByRole('button', { name: 'Увеличить масштаб' }).click();
  await expect(page.locator('.zoom-controls')).toContainText('120%');
  await page.getByRole('button', { name: 'Показать всю доску' }).click();
  await expect(page.locator('.zoom-controls')).toContainText('100%');
});
