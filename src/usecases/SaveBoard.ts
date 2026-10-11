import type { BoardRepository } from './ports';
import type { Card, Document } from '../domain/types';

export class SaveBoard {
  constructor(private readonly repository: BoardRepository) {}

  async execute(input: Document, progress: (document: Document) => void): Promise<Document> {
    let doc = structuredClone(input);
    const commit = () => progress(structuredClone(doc));

    if (!doc.id) {
      const board = await this.repository.create(doc.title);
      doc = { ...doc, id: board.id, savedTitle: board.title };
      commit();
    }

    if (doc.title !== doc.savedTitle) {
      await this.repository.rename(doc.id!, doc.title);
      doc.savedTitle = doc.title;
      commit();
    }

    for (const removed of [...doc.deleted]) {
      await this.repository.deleteCard(removed);
      doc.deleted = doc.deleted.filter((card) => card.id !== removed.id);
      delete doc.baseline[removed.id];
      commit();
    }

    for (const initial of [...doc.cards]) {
      let card = initial;

      if (card.version === 0) {
        const remote = await this.repository.createCard(doc.id!, card);
        doc.cards = doc.cards.map((item) =>
          item.id === card.id ? { ...card, id: remote.id, version: remote.version } : item,
        );
        doc.links = doc.links.map((link) => ({
          ...link,
          source: link.source === card.id ? remote.id : link.source,
          target: link.target === card.id ? remote.id : link.target,
        }));
        doc.baseline[remote.id] = remote;
        card = { ...card, id: remote.id, version: remote.version };
        commit();
      }

      let base = doc.baseline[card.id];

      if (card.text !== base.text || card.comment !== base.comment) {
        const remote = await this.repository.updateCard(card);
        doc.baseline[card.id] = remote;
        card = { ...card, version: remote.version };
        doc.cards = this.replace(doc.cards, card);
        base = remote;
        commit();
      }

      if (card.x !== base.x || card.y !== base.y) {
        card = await this.repository.moveCard(doc.id!, card);
        doc.baseline[card.id] = card;
        doc.cards = this.replace(doc.cards, card);
        commit();
      }
    }

    for (const link of doc.links.filter((item) => !item.persisted)) {
      const remote = await this.repository.createLink(link);
      doc.links = doc.links.map((item) => (item.id === link.id ? remote : item));
      commit();
    }

    return doc;
  }

  private replace(cards: Card[], updated: Card): Card[] {
    return cards.map((card) => (card.id === updated.id ? updated : card));
  }
}
