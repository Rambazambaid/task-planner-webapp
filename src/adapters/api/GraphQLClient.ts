export class ApiError extends Error {
  constructor(
    message: string,
    readonly code = 'NETWORK_ERROR',
  ) {
    super(message);
  }
}

export class GraphQLClient {
  constructor(private readonly url: string) {}

  async request<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    let response: Response;

    try {
      response = await fetch(this.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables }),
        signal: AbortSignal.timeout(20_000),
      });
    } catch {
      throw new ApiError('Нет связи с сервером. Изменения остались в этом браузере.');
    }

    if (!response.ok) {
      throw new ApiError(`Сервер вернул ошибку ${response.status}. Попробуйте позже.`);
    }

    const result = (await response.json()) as {
      data?: T;
      errors?: { message: string; extensions?: { code?: string } }[];
    };

    if (result.errors?.length) {
      const error = result.errors[0];
      const code = error.extensions?.code;
      const message =
        code === 'CONFLICT'
          ? 'Доска изменена в другой вкладке. Экспортируйте черновик и загрузите версию сервера.'
          : code === 'NOT_FOUND'
            ? 'Доска или карточка больше не существует на сервере.'
            : code === 'VALIDATION_ERROR'
              ? 'Проверьте текст и координаты карточек.'
              : 'Не удалось выполнить операцию на сервере.';

      throw new ApiError(message, code);
    }

    if (!result.data) {
      throw new ApiError('Некорректный ответ сервера. Проверьте адрес GraphQL.');
    }

    return result.data;
  }
}
