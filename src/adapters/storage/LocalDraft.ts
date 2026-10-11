import type { Document } from '../../domain/types';
import type { DraftRepository } from '../../usecases/ports';

export class LocalDraft implements DraftRepository {
  private readonly key = 'planner:draft:v1';

  read(): Document | null {
    const raw = localStorage.getItem(this.key);

    if (!raw) {
      return null;
    }

    const value = JSON.parse(raw) as { schema: number; document: Document };
    const doc = value.document;

    if (
      value.schema !== 1 ||
      !doc ||
      !Array.isArray(doc.cards) ||
      !Array.isArray(doc.links) ||
      !Array.isArray(doc.deleted) ||
      !doc.baseline ||
      typeof doc.title !== 'string' ||
      !doc.cards.every(
        (card) =>
          typeof card.id === 'string' &&
          typeof card.text === 'string' &&
          Number.isFinite(card.x) &&
          Number.isFinite(card.y) &&
          Number.isInteger(card.version),
      )
    ) {
      throw new Error('Сохранённый черновик повреждён. Создана новая доска.');
    }

    return doc;
  }

  write(document: Document): void {
    localStorage.setItem(this.key, JSON.stringify({ schema: 1, document }));
  }
}
