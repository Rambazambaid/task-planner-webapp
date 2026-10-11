import type { Point, Document } from '../../domain/types';
import { Editor } from '../../usecases/Editor';
import { HitTester } from './HitTester';
import { Viewport } from './Viewport';

interface CanvasState {
  document: Document;
  busy: boolean;
}

export class CanvasInteraction {
  private readonly hitTester = new HitTester();
  private drag: { id: string | null; start: Point; origin: Point } | null = null;
  private space = false;
  private readonly abort = new AbortController();

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly viewport: Viewport,
    private readonly editor: Editor,
    private readonly state: () => CanvasState,
    private readonly redraw: () => void,
    private readonly edit: () => void,
  ) {
    const signal = this.abort.signal;
    canvas.addEventListener('pointerdown', this.down, { signal });
    canvas.addEventListener('pointermove', this.move, { signal });
    canvas.addEventListener('pointerup', this.up, { signal });
    canvas.addEventListener('pointercancel', this.up, { signal });
    canvas.addEventListener('dblclick', this.doubleClick, { signal });
    canvas.addEventListener('wheel', this.wheel, { signal, passive: false });
    canvas.addEventListener('keydown', this.keyDown, { signal });
    canvas.addEventListener('keyup', this.keyUp, { signal });
    canvas.addEventListener('blur', this.blur, { signal });
  }

  dispose(): void {
    this.abort.abort();
  }

  private point(event: MouseEvent): Point {
    const rect = this.canvas.getBoundingClientRect();

    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  private down = (event: PointerEvent): void => {
    if (event.button !== 0 && event.button !== 1) {
      return;
    }

    this.canvas.focus();
    const start = this.point(event);
    const world = this.viewport.toWorld(start);
    const hit = this.hitTester.hit(world, this.state().document);

    if (hit?.type === 'plus' && !this.space && event.button === 0) {
      this.editor.add(hit.id, hit.kind);
      return;
    }

    if (hit?.type === 'card' && !this.space && event.button === 0) {
      if (this.state().busy) {
        return;
      }

      this.editor.select(hit.id);
      const card = this.state().document.cards.find((item) => item.id === hit.id)!;
      this.drag = { id: hit.id, start: world, origin: { x: card.x, y: card.y } };
    } else {
      this.drag = { id: null, start, origin: { x: this.viewport.x, y: this.viewport.y } };
    }

    this.canvas.setPointerCapture(event.pointerId);
    this.canvas.style.cursor = 'grabbing';
  };

  private move = (event: PointerEvent): void => {
    const point = this.point(event);

    if (!this.drag) {
      this.canvas.style.cursor = this.hitTester.hit(
        this.viewport.toWorld(point),
        this.state().document,
      )
        ? 'pointer'
        : 'grab';
      return;
    }

    if (this.drag.id) {
      const world = this.viewport.toWorld(point);
      this.editor.move(this.drag.id, {
        x: this.drag.origin.x + world.x - this.drag.start.x,
        y: this.drag.origin.y + world.y - this.drag.start.y,
      });
    } else {
      this.viewport.x = this.drag.origin.x + point.x - this.drag.start.x;
      this.viewport.y = this.drag.origin.y + point.y - this.drag.start.y;
      this.redraw();
    }
  };

  private up = (event: PointerEvent): void => {
    this.drag = null;
    this.canvas.style.cursor = 'grab';

    if (this.canvas.hasPointerCapture(event.pointerId)) {
      this.canvas.releasePointerCapture(event.pointerId);
    }
  };

  private wheel = (event: WheelEvent): void => {
    event.preventDefault();
    this.viewport.zoomAt(Math.exp(-event.deltaY * 0.002), this.point(event));
    this.redraw();
  };

  private doubleClick = (event: MouseEvent): void => {
    const hit = this.hitTester.hit(this.viewport.toWorld(this.point(event)), this.state().document);

    if (hit?.type === 'card') {
      this.editor.select(hit.id);
      this.edit();
    }
  };

  private keyDown = (event: KeyboardEvent): void => {
    if (event.code === 'Space') {
      event.preventDefault();
      this.space = true;
    }
  };

  private keyUp = (): void => {
    this.space = false;
  };
  private blur = (): void => {
    this.space = false;
    this.drag = null;
  };
}
