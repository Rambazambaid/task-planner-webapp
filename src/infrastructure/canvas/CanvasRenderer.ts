import type { Document } from '../../domain/types';
import { Viewport } from './Viewport';
import { CardPainter } from './CardPainter';
import { ConnectionPainter } from './ConnectionPainter';

export class CanvasRenderer {
  private readonly cards = new CardPainter();
  private readonly connections = new ConnectionPainter();
  private readonly context: CanvasRenderingContext2D;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    readonly viewport: Viewport,
  ) {
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Ваш браузер не поддерживает Canvas 2D');
    }

    this.context = context;
  }

  resize(width: number, height: number): void {
    const ratio = window.devicePixelRatio || 1;
    this.canvas.width = Math.round(width * ratio);
    this.canvas.height = Math.round(height * ratio);
    this.viewport.width = width;
    this.viewport.height = height;
  }

  draw(doc: Document, selected: string | null): void {
    const ctx = this.context;
    const view = this.viewport;
    const ratio = window.devicePixelRatio || 1;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, view.width, view.height);
    ctx.fillStyle = '#cdd2c6';
    const step = 24 * view.zoom;

    for (let x = view.x % step; x < view.width; x += step) {
      for (let y = view.y % step; y < view.height; y += step) {
        ctx.beginPath();
        ctx.arc(x, y, 0.75, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.translate(view.x, view.y);
    ctx.scale(view.zoom, view.zoom);
    this.connections.paint(ctx, doc);
    doc.cards.forEach((card, index) =>
      this.cards.paint(ctx, card, doc, selected === card.id, index),
    );
  }
}
