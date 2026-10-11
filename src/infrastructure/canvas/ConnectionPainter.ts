import { CARD_HEIGHT, CARD_WIDTH } from '../../domain/types';
import type { Document } from '../../domain/types';

export class ConnectionPainter {
  paint(ctx: CanvasRenderingContext2D, doc: Document): void {
    const cards = new Map(doc.cards.map((card) => [card.id, card]));

    for (const link of doc.links) {
      const source = cards.get(link.source);
      const target = cards.get(link.target);

      if (!source || !target) {
        continue;
      }

      const vertical = link.kind === 'CONDITION';
      const from = {
        x: source.x + (vertical ? CARD_WIDTH / 2 : CARD_WIDTH),
        y: source.y + (vertical ? CARD_HEIGHT : CARD_HEIGHT / 2),
      };
      const to = {
        x: target.x + (vertical ? CARD_WIDTH / 2 : 0),
        y: target.y + (vertical ? 0 : CARD_HEIGHT / 2),
      };
      const bend = Math.max(45, Math.abs(vertical ? to.y - from.y : to.x - from.x) / 2);
      ctx.save();
      ctx.strokeStyle = vertical ? '#b9a27f' : '#a7b29a';
      ctx.fillStyle = ctx.strokeStyle;
      ctx.lineWidth = 1.5;
      ctx.setLineDash(vertical ? [4, 5] : []);
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.bezierCurveTo(
        from.x + (vertical ? 0 : bend),
        from.y + (vertical ? bend : 0),
        to.x - (vertical ? 0 : bend),
        to.y - (vertical ? bend : 0),
        to.x,
        to.y,
      );
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(to.x, to.y);
      ctx.lineTo(to.x - (vertical ? 4 : 7), to.y - (vertical ? 7 : 4));
      ctx.lineTo(to.x + (vertical ? 4 : -7), to.y + (vertical ? -7 : 4));
      ctx.fill();
      ctx.restore();
    }
  }
}
