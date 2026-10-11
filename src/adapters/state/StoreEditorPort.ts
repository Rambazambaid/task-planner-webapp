import type { Document } from '../../domain/types';
import type { EditorPort } from '../../usecases/Editor';
import type { EditorStore } from './EditorStore';

export class StoreEditorPort implements EditorPort {
  constructor(private readonly store: EditorStore) {}

  read() {
    return this.store.getState();
  }

  write(document: Document, selectedId = this.store.getState().selectedId): void {
    this.store.setState({ document, selectedId, notice: null });
  }

  select(selectedId: string | null): void {
    this.store.setState({ selectedId });
  }
}
