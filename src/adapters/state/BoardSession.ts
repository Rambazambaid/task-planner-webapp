import { BoardGraph } from '../../domain/BoardGraph';
import type { Document } from '../../domain/types';
import type { BoardRepository, DraftRepository } from '../../usecases/ports';
import { SaveBoard } from '../../usecases/SaveBoard';
import type { EditorStore } from './EditorStore';

export class BoardSession {
  private readonly saver: SaveBoard;

  constructor(
    private readonly store: EditorStore,
    readonly repository: BoardRepository,
    private readonly drafts: DraftRepository,
  ) {
    this.saver = new SaveBoard(repository);
  }

  async save(): Promise<void> {
    const state = this.store.getState();

    if (state.busy) {
      return;
    }

    const title = state.document.title.trim();

    if (!title || [...title].length > 200) {
      this.store.setState({ error: 'Название доски должно содержать от 1 до 200 символов.' });
      return;
    }

    this.store.setState({ busy: true, error: null, notice: null });
    let selection = state.selectedId;
    let previous = state.document;

    try {
      const doc = await this.saver.execute({ ...state.document, title }, (document) => {
        const index = previous.cards.findIndex((card) => card.id === selection);
        selection = document.cards[index]?.id ?? document.cards[0]?.id ?? null;
        previous = document;
        this.store.setState({ document, selectedId: selection });
        this.cache(document);
      });
      this.store.setState({
        document: doc,
        savedAt: new Date().toISOString(),
        notice: 'Доска сохранена на сервере',
      });
    } catch (error) {
      this.store.setState({ error: this.message(error) });
    } finally {
      this.store.setState({ busy: false });
    }
  }

  async open(id: string): Promise<boolean> {
    if (this.store.getState().busy) {
      return false;
    }

    this.store.setState({ busy: true, error: null });

    try {
      let doc = await this.repository.load(id);

      if (doc.cards.length === 0) {
        doc = { ...doc, cards: BoardGraph.create().document.cards };
      }

      this.replace(doc);
      return true;
    } catch (error) {
      this.store.setState({ error: this.message(error) });
      return false;
    } finally {
      this.store.setState({ busy: false });
    }
  }

  create(): void {
    if (!this.store.getState().busy) {
      this.replace(BoardGraph.create().document);
    }
  }

  cache(document: Document): void {
    try {
      this.drafts.write(document);
    } catch {
      this.store.setState({
        error:
          'Не удалось сохранить черновик в браузере. Экспортируйте JSON или сохраните на сервер.',
      });
    }
  }

  export(): void {
    const blob = new Blob([JSON.stringify(this.store.getState().document, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'planner-board.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  private replace(document: Document): void {
    this.store.setState({
      document,
      selectedId: document.cards[0]?.id ?? null,
      savedAt: null,
      notice: null,
    });
    this.cache(document);
  }

  private message(error: unknown): string {
    return error instanceof Error ? error.message : 'Не удалось выполнить действие';
  }
}
