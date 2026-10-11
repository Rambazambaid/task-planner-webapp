import type { BoardRepository } from '../../usecases/ports';
import type { BoardSummary, Card, Document, Link, LinkKind } from '../../domain/types';
import { GraphQLClient } from './GraphQLClient';

interface RemoteCard {
  id: string;
  text: string;
  comment: string | null;
  version: number;
  positionX: number;
  positionY: number;
}

interface RemoteLink {
  id: string;
  sourceCardId: string;
  targetCardId: string;
  kind: LinkKind;
}

const fields = 'id text comment positionX positionY version';
const mapCard = (card: RemoteCard): Card => ({
  id: card.id,
  text: card.text,
  comment: card.comment,
  version: card.version,
  x: card.positionX,
  y: card.positionY,
});
const mapLink = (link: RemoteLink): Link => ({
  id: link.id,
  source: link.sourceCardId,
  target: link.targetCardId,
  kind: link.kind,
  persisted: true,
});

export class GraphQLBoardRepository implements BoardRepository {
  constructor(private readonly client: GraphQLClient) {}

  async list(): Promise<BoardSummary[]> {
    const data = await this.client.request<{ boards: { boards: BoardSummary[] } }>(
      'query { boards(first:100) { boards { id title } } }',
    );

    return data.boards.boards;
  }

  async load(id: string): Promise<Document> {
    const data = await this.client.request<{
      boardGraph: {
        board: BoardSummary;
        cards: RemoteCard[];
        links: RemoteLink[];
      };
    }>(
      `query($id:ID!) { boardGraph(boardId:$id) {
      board { id title } cards { ${fields} }
      links { id sourceCardId targetCardId kind }
    } }`,
      { id },
    );
    const graph = data.boardGraph;
    const cards = graph.cards.map(mapCard);

    return {
      ...graph.board,
      savedTitle: graph.board.title,
      cards,
      links: graph.links.map(mapLink),
      baseline: Object.fromEntries(cards.map((card) => [card.id, { ...card }])),
      deleted: [],
    };
  }

  async create(title: string): Promise<BoardSummary> {
    const data = await this.client.request<{ createBoard: BoardSummary }>(
      'mutation($title:String!){createBoard(title:$title){id title}}',
      { title },
    );

    return data.createBoard;
  }

  async rename(id: string, title: string): Promise<void> {
    await this.client.request(
      'mutation($id:ID!,$title:String!){updateBoard(id:$id,title:$title){id}}',
      { id, title },
    );
  }

  async createCard(boardId: string, card: Card): Promise<Card> {
    const data = await this.client.request<{ createCard: RemoteCard }>(
      `mutation($input:CreateCardInput!){createCard(input:$input){${fields}}}`,
      { input: { boardId, positionX: card.x, positionY: card.y } },
    );

    return mapCard(data.createCard);
  }

  async updateCard(card: Card): Promise<Card> {
    const data = await this.client.request<{ updateCard: RemoteCard }>(
      `mutation($input:UpdateCardInput!){updateCard(input:$input){${fields}}}`,
      {
        input: {
          id: card.id,
          expectedVersion: card.version,
          text: card.text,
          comment: card.comment,
        },
      },
    );

    return mapCard(data.updateCard);
  }

  async moveCard(boardId: string, card: Card): Promise<Card> {
    const data = await this.client.request<{ moveCards: RemoteCard[] }>(
      `mutation($board:ID!,$moves:[MoveCardInput!]!){moveCards(boardId:$board,moves:$moves){${fields}}}`,
      {
        board: boardId,
        moves: [
          { id: card.id, expectedVersion: card.version, positionX: card.x, positionY: card.y },
        ],
      },
    );

    return mapCard(data.moveCards[0]);
  }

  async deleteCard(card: Card): Promise<void> {
    await this.client.request('mutation($id:ID!,$v:Int!){deleteCard(id:$id,expectedVersion:$v)}', {
      id: card.id,
      v: card.version,
    });
  }

  async createLink(link: Link): Promise<Link> {
    const data = await this.client.request<{ createLink: RemoteLink }>(
      'mutation($input:CreateLinkInput!){createLink(input:$input){id sourceCardId targetCardId kind}}',
      { input: { sourceCardId: link.source, targetCardId: link.target, kind: link.kind } },
    );

    return mapLink(data.createLink);
  }
}
