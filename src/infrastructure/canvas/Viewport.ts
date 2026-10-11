import { CARD_HEIGHT, CARD_WIDTH } from '../../domain/types';
import type { Card, Point } from '../../domain/types';

export class Viewport {
  x = 0;
  y = 0;
  zoom = 1;
  width = 1;
  height = 1;

  toWorld(point: Point): Point {
    return { x: (point.x - this.x) / this.zoom, y: (point.y - this.y) / this.zoom };
  }

  zoomAt(factor: number, point: Point): void {
    const world = this.toWorld(point);
    this.zoom = Math.max(0.25, Math.min(2, this.zoom * factor));
    this.x = point.x - world.x * this.zoom;
    this.y = point.y - world.y * this.zoom;
  }

  fit(cards: Card[]): void {
    if (!cards.length) {
      return;
    }

    const minX = Math.min(...cards.map((card) => card.x));
    const minY = Math.min(...cards.map((card) => card.y));
    const width = Math.max(...cards.map((card) => card.x)) - minX + CARD_WIDTH + 50;
    const height = Math.max(...cards.map((card) => card.y)) - minY + CARD_HEIGHT + 50;
    this.zoom = Math.max(
      0.25,
      Math.min(1, (this.width - 140) / width, (this.height - 180) / height),
    );
    this.x = (this.width - width * this.zoom) / 2 - minX * this.zoom;
    this.y = (this.height - height * this.zoom) / 2 - minY * this.zoom;
  }
}
