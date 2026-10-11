export type LinkKind = 'NEXT' | 'CONDITION';

export interface Point {
  x: number;
  y: number;
}

export interface Card extends Point {
  id: string;
  text: string;
  comment: string | null;
  version: number;
}

export interface Link {
  id: string;
  source: string;
  target: string;
  kind: LinkKind;
  persisted: boolean;
}

export interface Document {
  id: string | null;
  title: string;
  savedTitle: string | null;
  cards: Card[];
  links: Link[];
  baseline: Record<string, Card>;
  deleted: Card[];
}

export interface BoardSummary {
  id: string;
  title: string;
}

export const CARD_WIDTH = 252;
export const CARD_HEIGHT = 174;
export const MAX_TEXT_LENGTH = 10_000;
