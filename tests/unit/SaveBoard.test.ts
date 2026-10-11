import { describe, expect, it } from 'vitest';
import { BoardGraph } from '../../src/domain/BoardGraph';
import type { Card, Document, Link } from '../../src/domain/types';
import type { BoardRepository } from '../../src/usecases/ports';
import { SaveBoard } from '../../src/usecases/SaveBoard';

class MemoryRepository implements BoardRepository {
  cards = new Map<string, Card>();
  created = 0;
  boards = 0;
  failLink = false;
  expectedVersions: number[] = [];

  async list() {
    return [];
  }
  async load(): Promise<Document> {
    throw new Error('not needed');
  }
  async create(title: string) {
    this.boards++;
    return { id: 'board-remote', title };
  }
  async rename() {}

  async createCard(_boardId: string, card: Card) {
    this.created++;
    const remote = { ...card, id: `remote-${this.created}`, version: 1, text: '', comment: null };
    this.cards.set(remote.id, remote);
    return remote;
  }

  async updateCard(card: Card) {
    this.expectedVersions.push(card.version);
    const base = this.cards.get(card.id)!;
    const remote = { ...base, text: card.text, comment: card.comment, version: base.version + 1 };
    this.cards.set(card.id, remote);
    return remote;
  }

  async moveCard(_boardId: string, card: Card) {
    this.expectedVersions.push(card.version);
    const remote = { ...card, version: card.version + 1 };
    this.cards.set(card.id, remote);
    return remote;
  }

  async deleteCard(card: Card) {
    this.cards.delete(card.id);
  }

  async createLink(link: Link) {
    if (this.failLink) {
      throw new Error('link failed');
    }
    expect(this.cards.has(link.source)).toBe(true);
    expect(this.cards.has(link.target)).toBe(true);
    return { ...link, id: 'remote-link', persisted: true };
  }
}

describe('SaveBoard', () => {
  it('remaps card IDs and saves text, comment and links', async () => {
    let graph = BoardGraph.create();
    const root = graph.document.cards[0];
    graph = graph
      .update(root.id, { text: 'Открытие окна', comment: 'Заметка' })
      .add(root.id, 'NEXT');
    const repository = new MemoryRepository();
    const saved = await new SaveBoard(repository).execute(graph.document, () => {});
    expect(saved.cards[0]).toMatchObject({
      id: 'remote-1',
      version: 2,
      text: 'Открытие окна',
      comment: 'Заметка',
    });
    expect(saved.links[0]).toMatchObject({
      source: 'remote-1',
      target: 'remote-2',
      persisted: true,
    });
    expect(new BoardGraph(saved).isDirty()).toBe(false);
  });

  it('retries from acknowledged progress after partial failure without recreating cards', async () => {
    const graph = BoardGraph.create();
    const doc = graph.add(graph.document.cards[0].id, 'CONDITION').document;
    const repository = new MemoryRepository();
    repository.failLink = true;
    const saver = new SaveBoard(repository);
    let progress = doc;
    await expect(
      saver.execute(doc, (value) => {
        progress = value;
      }),
    ).rejects.toThrow('link failed');
    expect(repository.created).toBe(2);
    expect(progress.cards.every((card) => card.version > 0)).toBe(true);
    repository.failLink = false;
    const saved = await saver.execute(progress, () => {});
    expect(repository.created).toBe(2);
    expect(repository.boards).toBe(1);
    expect(new BoardGraph(saved).isDirty()).toBe(false);
  });

  it('uses the new version when text and position both change', async () => {
    const repository = new MemoryRepository();
    const saver = new SaveBoard(repository);
    const saved = await saver.execute(BoardGraph.create().document, () => {});
    const edited = new BoardGraph(saved).update(saved.cards[0].id, {
      text: 'Новый текст',
      x: 200,
      comment: null,
    });
    const result = await saver.execute(edited.document, () => {});
    expect(repository.expectedVersions).toEqual([1, 2]);
    expect(result.cards[0]).toMatchObject({ text: 'Новый текст', x: 200, version: 3 });
    expect(new BoardGraph(result).isDirty()).toBe(false);
  });
});
