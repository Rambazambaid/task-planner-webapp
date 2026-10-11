import { BoardGraph } from '../domain/BoardGraph';
import { Editor } from '../usecases/Editor';
import { GraphQLClient } from '../adapters/api/GraphQLClient';
import { GraphQLBoardRepository } from '../adapters/api/GraphQLBoardRepository';
import { LocalDraft } from '../adapters/storage/LocalDraft';
import { createEditorStore } from '../adapters/state/EditorStore';
import { StoreEditorPort } from '../adapters/state/StoreEditorPort';
import { BoardSession } from '../adapters/state/BoardSession';
import { config } from './config';

export function createRuntime() {
  const drafts = new LocalDraft();
  let document = BoardGraph.create().document;
  let error: string | null = null;

  try {
    document = drafts.read() ?? document;
  } catch {
    error = 'Не удалось прочитать локальный черновик. Доступна новая доска.';
  }

  const store = createEditorStore(document);
  store.setState({ error });
  const editor = new Editor(new StoreEditorPort(store));
  const repository = new GraphQLBoardRepository(new GraphQLClient(config.graphqlUrl));
  const session = new BoardSession(store, repository, drafts);

  return { store, editor, session };
}

export type Runtime = ReturnType<typeof createRuntime>;
