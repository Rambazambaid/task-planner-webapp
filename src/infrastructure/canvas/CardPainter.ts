import { CARD_HEIGHT, CARD_WIDTH } from '../../domain/types';
import type { Card, Document } from '../../domain/types';
import { HitTester } from './HitTester';

export class CardPainter {
  private readonly hitTester = new HitTester();

  paint(
    ctx: CanvasRenderingContext2D,
    card: Card,
    doc: Document,
    selected: boolean,
    index: number,
  ): void {
    const condition = doc.links.some(
      (link) => link.target === card.id && link.kind === 'CONDITION',
    );
    const accent = condition ? '#ab8148' : '#6c7e59';
    ctx.save();
    ctx.translate(card.x, card.y);
    ctx.shadowColor = 'rgba(40, 46, 33, 0.07)';
    ctx.shadowBlur = selected ? 18 : 10;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, 12);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = selected ? 1.8 : 1;
    ctx.strokeStyle = selected ? '#85966e' : '#e0e3db';
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.roundRect(18, 19, 6, 6, 2);
    ctx.fill();
    ctx.font = '500 10px "Manrope Variable", system-ui, sans-serif';
    ctx.fillText(
      condition
        ? 'УСЛОВИЕ'
        : !doc.links.some((link) => link.target === card.id)
          ? 'НАЧАЛО СЦЕНАРИЯ'
          : 'ЭТАП СЦЕНАРИЯ',
      33,
      26,
    );
    ctx.fillStyle = '#afb3a8';
    ctx.textAlign = 'right';
    ctx.fillText(String(index + 1).padStart(2, '0'), CARD_WIDTH - 18, 26);
    ctx.textAlign = 'left';
    ctx.font = `${card.text ? 500 : 400} 15px "Manrope Variable", system-ui, sans-serif`;
    ctx.fillStyle = card.text ? '#2e342b' : '#a3a89b';
    this.text(ctx, card.text || 'Что произойдёт на этом этапе?', 18, 58, CARD_WIDTH - 36, 3);
    ctx.strokeStyle = '#f0f1ec';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(18, 132);
    ctx.lineTo(CARD_WIDTH - 18, 132);
    ctx.stroke();
    ctx.font = '400 10px "Manrope Variable", system-ui, sans-serif';
    ctx.fillStyle = '#969d8d';
    ctx.fillText(card.comment ? '◌  Есть комментарий' : 'Двойной клик — редактировать', 18, 153);
    ctx.restore();

    for (const kind of ['NEXT', 'CONDITION'] as const) {
      if (!doc.links.some((link) => link.source === card.id && link.kind === kind)) {
        const point = this.hitTester.plusCenter(card, kind);
        ctx.save();
        ctx.strokeStyle = '#d2d9c9';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(
          kind === 'NEXT' ? card.x + CARD_WIDTH : point.x,
          kind === 'NEXT' ? point.y : card.y + CARD_HEIGHT,
        );
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
        ctx.fillStyle = '#fafbf7';
        ctx.beginPath();
        ctx.arc(point.x, point.y, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = '#7e8c6c';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(point.x - 4, point.y);
        ctx.lineTo(point.x + 4, point.y);
        ctx.moveTo(point.x, point.y - 4);
        ctx.lineTo(point.x, point.y + 4);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  private text(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    width: number,
    limit: number,
  ): void {
    const lines: string[] = [];
    let line = '';

    for (const char of text.slice(0, 500)) {
      if (char === '\n') {
        lines.push(line);
        line = '';
      } else if (ctx.measureText(line + char).width > width) {
        const space = line.lastIndexOf(' ');
        lines.push(space > 0 ? line.slice(0, space) : line);
        line = (space > 0 ? line.slice(space + 1) : '') + char;
      } else {
        line += char;
      }

      if (lines.length === limit) {
        break;
      }
    }

    if (lines.length < limit) {
      lines.push(line);
    } else {
      lines[limit - 1] = lines[limit - 1].slice(0, -2) + '…';
    }

    lines.forEach((value, index) => ctx.fillText(value, x, y + index * 22));
  }
}
