import { describe, expect, it } from 'vitest';
import { BoardGraph } from '../../src/domain/BoardGraph';
import { HitTester } from '../../src/infrastructure/canvas/HitTester';
import { Viewport } from '../../src/infrastructure/canvas/Viewport';

describe('BoardGraph', () => {
  it('starts with one empty card and two available outgoing directions', () => {
    const graph = BoardGraph.create();
    const card = graph.document.cards[0];
    expect(graph.document.cards).toHaveLength(1);
    expect(card.text).toBe('');
    expect(graph.hasNext(card.id, 'NEXT')).toBe(false);
    expect(graph.hasNext(card.id, 'CONDITION')).toBe(false);
    expect(graph.isDirty()).toBe(true);
  });

  it('adds horizontal and vertical cards only once per source and direction', () => {
    let graph = BoardGraph.create();
    const root = graph.document.cards[0];
    graph = graph.add(root.id, 'NEXT').add(root.id, 'CONDITION');
    const next = graph.document.cards[1];
    const condition = graph.document.cards[2];
    expect(next.x).toBeGreaterThan(root.x);
    expect(condition.y).toBeGreaterThan(root.y);
    expect(graph.add(root.id, 'NEXT').document.cards).toHaveLength(3);
    expect(graph.document.links.map((link) => link.kind)).toEqual(['NEXT', 'CONDITION']);
  });

  it('removing a linked card restores the plus without deleting its neighbour', () => {
    let graph = BoardGraph.create();
    const root = graph.document.cards[0];
    graph = graph.add(root.id, 'NEXT');
    graph = graph.remove(graph.document.cards[1].id);
    expect(graph.document.cards).toHaveLength(1);
    expect(graph.hasNext(root.id, 'NEXT')).toBe(false);
    expect(graph.remove(root.id).document.cards).toHaveLength(1);
  });

  it('hit testing hides occupied direction and detects available vertical plus', () => {
    let graph = BoardGraph.create();
    const root = graph.document.cards[0];
    const hitTester = new HitTester();
    expect(hitTester.hit(hitTester.plusCenter(root, 'NEXT'), graph.document)?.type).toBe('plus');
    graph = graph.add(root.id, 'NEXT');
    expect(hitTester.hit(hitTester.plusCenter(root, 'NEXT'), graph.document)).toBeNull();
    expect(hitTester.hit(hitTester.plusCenter(root, 'CONDITION'), graph.document)).toMatchObject({
      type: 'plus',
      kind: 'CONDITION',
    });
  });
});

describe('Viewport', () => {
  it('keeps the world position under the cursor fixed when zooming', () => {
    const viewport = new Viewport();
    viewport.x = 40;
    viewport.y = 25;
    const cursor = { x: 150, y: 90 };
    const before = viewport.toWorld(cursor);
    viewport.zoomAt(1.5, cursor);
    expect(viewport.toWorld(cursor)).toEqual(before);
  });
});
