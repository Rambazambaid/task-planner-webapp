import { expect, test } from '@playwright/test';

test('saves canvas scenario to the real API and opens the persisted graph', async ({
  page,
  request,
}) => {
  test.skip(process.env.E2E_REAL_BACKEND !== '1', 'Set E2E_REAL_BACKEND=1 with a test backend');
  await page.goto('/');
  const title = `E2E Перевод ${Date.now()}`;
  await page.getByLabel('Название', { exact: true }).fill(title);
  await page.getByLabel('Что происходит?').fill('Открытие модального окна');
  await page.getByLabel(/Комментарий/).fill('Проверить данные клиента');
  await page.getByRole('button', { name: 'Следующий этап', exact: true }).click();
  await page.getByLabel('Что происходит?').fill('Перевод денежных средств');
  await page.getByRole('button', { name: /Сохранить доску/ }).click();
  await expect(page.getByRole('status')).toContainText('Доска сохранена на сервере');
  const remoteId = await page.evaluate(
    () => JSON.parse(localStorage.getItem('planner:draft:v1')!).document.id as string,
  );

  try {
    await expect(page.getByRole('button', { name: /Сохранить доску/ })).toBeDisabled();
    await page.getByRole('button', { name: 'Мои сценарии' }).click();
    await page.getByRole('button', { name: title, exact: true }).click();
    await expect(page.getByLabel('Что происходит?')).not.toHaveValue('');
    await expect(page.locator('.board-stats')).toContainText('2 карточки');
    const result = await request.post('/graphql', {
      data: {
        query: 'query($id:ID!){boardGraph(boardId:$id){cards{id text comment} links{kind}}}',
        variables: { id: remoteId },
      },
    });
    const graph = (await result.json()).data.boardGraph;
    expect(graph.cards.map((card: { text: string }) => card.text)).toContain(
      'Перевод денежных средств',
    );
    expect(
      graph.cards.some(
        (card: { comment: string | null }) => card.comment === 'Проверить данные клиента',
      ),
    ).toBe(true);
    expect(graph.links).toEqual([{ kind: 'NEXT' }]);
  } finally {
    await request.post('/graphql', {
      data: { query: 'mutation($id:ID!){deleteBoard(id:$id)}', variables: { id: remoteId } },
    });
  }
});
