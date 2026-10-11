import type { BoardSummary, Card, Document, Link } from '../domain/types';

export interface BoardRepository {
  list(): Promise<BoardSummary[]>;
  load(id: string): Promise<Document>;
  create(title: string): Promise<BoardSummary>;
  rename(id: string, title: string): Promise<void>;
  createCard(boardId: string, card: Card): Promise<Card>;
  updateCard(card: Card): Promise<Card>;
  moveCard(boardId: string, card: Card): Promise<Card>;
  deleteCard(card: Card): Promise<void>;
  createLink(link: Link): Promise<Link>;
}

export interface DraftRepository {
  read(): Document | null;
  write(document: Document): void;
}
