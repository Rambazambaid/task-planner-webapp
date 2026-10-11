import { BoardGraph } from '../domain/BoardGraph';
import type { Card, Document, LinkKind, Point } from '../domain/types';

export interface EditorPort {
  read(): { document: Document; selectedId: string | null; busy: boolean };
  write(document: Document, selectedId?: string | null): void;
  select(id: string | null): void;
}

export class Editor {
  constructor(private readonly state: EditorPort) {}

  add(source: string, kind: LinkKind): void {
    const current = this.state.read();

    if (current.busy) {
      return;
    }

    const graph = new BoardGraph(current.document).add(source, kind);
    this.state.write(graph.document, graph.document.cards.at(-1)!.id);
  }

  update(id: string, patch: Partial<Pick<Card, 'text' | 'comment'>>): void {
    const current = this.state.read();

    if (!current.busy) {
      this.state.write(new BoardGraph(current.document).update(id, patch).document);
    }
  }

  move(id: string, point: Point): void {
    const current = this.state.read();

    if (!current.busy) {
      this.state.write(
        new BoardGraph(current.document).update(id, {
          x: Math.max(-1e7, Math.min(1e7, Math.round(point.x))),
          y: Math.max(-1e7, Math.min(1e7, Math.round(point.y))),
        }).document,
      );
    }
  }

  remove(id: string): void {
    const current = this.state.read();

    if (!current.busy) {
      const doc = new BoardGraph(current.document).remove(id).document;
      this.state.write(doc, doc.cards[0]?.id ?? null);
    }
  }

  rename(title: string): void {
    const current = this.state.read();

    if (!current.busy) {
      this.state.write({ ...current.document, title });
    }
  }

  select(id: string | null): void {
    if (!this.state.read().busy) {
      this.state.select(id);
    }
  }
}
