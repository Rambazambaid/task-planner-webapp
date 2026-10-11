import { CARD_HEIGHT, CARD_WIDTH } from './types';
import type { Card, Document, LinkKind, Point } from './types';

export class BoardGraph {
  constructor(readonly document: Document) {}

  static create(): BoardGraph {
    const card: Card = {
      id: crypto.randomUUID(),
      text: '',
      comment: null,
      version: 0,
      x: 0,
      y: 0,
    };

    return new BoardGraph({
      id: null,
      title: 'Новый сценарий',
      savedTitle: null,
      cards: [card],
      links: [],
      baseline: {},
      deleted: [],
    });
  }

  hasNext(id: string, kind: LinkKind): boolean {
    return this.document.links.some((link) => link.source === id && link.kind === kind);
  }

  add(sourceId: string, kind: LinkKind): BoardGraph {
    if (this.hasNext(sourceId, kind)) {
      return this;
    }

    const source = this.document.cards.find((card) => card.id === sourceId);

    if (!source) {
      throw new Error('Карточка не найдена');
    }

    const point = this.freePosition(source, kind);
    const card: Card = {
      id: crypto.randomUUID(),
      text: '',
      comment: null,
      version: 0,
      ...point,
    };

    return new BoardGraph({
      ...this.document,
      cards: [...this.document.cards, card],
      links: [
        ...this.document.links,
        {
          id: crypto.randomUUID(),
          source: sourceId,
          target: card.id,
          kind,
          persisted: false,
        },
      ],
    });
  }

  update(id: string, patch: Partial<Pick<Card, 'text' | 'comment' | 'x' | 'y'>>): BoardGraph {
    return new BoardGraph({
      ...this.document,
      cards: this.document.cards.map((card) => (card.id === id ? { ...card, ...patch } : card)),
    });
  }

  remove(id: string): BoardGraph {
    const card = this.document.cards.find((item) => item.id === id);

    if (!card || this.document.cards.length === 1) {
      return this;
    }

    return new BoardGraph({
      ...this.document,
      cards: this.document.cards.filter((item) => item.id !== id),
      links: this.document.links.filter((link) => link.source !== id && link.target !== id),
      deleted: card.version > 0 ? [...this.document.deleted, card] : this.document.deleted,
    });
  }

  isDirty(): boolean {
    const doc = this.document;

    return (
      doc.title !== doc.savedTitle ||
      doc.deleted.length > 0 ||
      doc.links.some((link) => !link.persisted) ||
      doc.cards.some((card) => {
        const base = doc.baseline[card.id];

        return (
          !base ||
          card.text !== base.text ||
          card.comment !== base.comment ||
          card.x !== base.x ||
          card.y !== base.y
        );
      })
    );
  }

  private freePosition(source: Point, kind: LinkKind): Point {
    const point = {
      x: source.x + (kind === 'NEXT' ? CARD_WIDTH + 96 : 0),
      y: source.y + (kind === 'CONDITION' ? CARD_HEIGHT + 100 : 0),
    };

    while (
      this.document.cards.some(
        (card) =>
          Math.abs(card.x - point.x) < CARD_WIDTH + 24 &&
          Math.abs(card.y - point.y) < CARD_HEIGHT + 24,
      )
    ) {
      point.y += CARD_HEIGHT + 100;
    }

    return point;
  }
}
