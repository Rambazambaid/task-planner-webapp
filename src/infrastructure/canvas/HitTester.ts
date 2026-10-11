import { CARD_HEIGHT, CARD_WIDTH } from '../../domain/types';
import type { Document, LinkKind, Point } from '../../domain/types';

export type Hit = { type: 'card'; id: string } | { type: 'plus'; id: string; kind: LinkKind };

export class HitTester {
  hit(point: Point, document: Document): Hit | null {
    for (const card of [...document.cards].reverse()) {
      for (const kind of ['NEXT', 'CONDITION'] as const) {
        const hasNext = document.links.some(
          (link) => link.source === card.id && link.kind === kind,
        );
        const center = this.plusCenter(card, kind);

        if (!hasNext && Math.hypot(point.x - center.x, point.y - center.y) <= 17) {
          return { type: 'plus', id: card.id, kind };
        }
      }

      if (
        point.x >= card.x &&
        point.x <= card.x + CARD_WIDTH &&
        point.y >= card.y &&
        point.y <= card.y + CARD_HEIGHT
      ) {
        return { type: 'card', id: card.id };
      }
    }

    return null;
  }

  plusCenter(card: Point, kind: LinkKind): Point {
    return kind === 'NEXT'
      ? { x: card.x + CARD_WIDTH + 28, y: card.y + CARD_HEIGHT / 2 }
      : { x: card.x + CARD_WIDTH / 2, y: card.y + CARD_HEIGHT + 28 };
  }
}
