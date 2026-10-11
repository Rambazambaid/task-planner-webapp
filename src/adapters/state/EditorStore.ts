import { createStore } from 'zustand/vanilla';
import type { Document } from '../../domain/types';

export interface EditorState {
  document: Document;
  selectedId: string | null;
  busy: boolean;
  error: string | null;
  notice: string | null;
  savedAt: string | null;
  zoom: number;
}

export const createEditorStore = (document: Document) =>
  createStore<EditorState>(() => ({
    document,
    selectedId: document.cards[0]?.id ?? null,
    busy: false,
    error: null,
    notice: null,
    savedAt: null,
    zoom: 1,
  }));

export type EditorStore = ReturnType<typeof createEditorStore>;
