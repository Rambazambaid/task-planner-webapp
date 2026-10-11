import { createContext, useContext } from 'react';
import { useStore } from 'zustand';
import type { Runtime } from '../../infrastructure/runtime';
import type { EditorState } from '../state/EditorStore';

export const RuntimeContext = createContext<Runtime | null>(null);

export function useRuntime(): Runtime {
  const runtime = useContext(RuntimeContext);

  if (!runtime) {
    throw new Error('Runtime provider is missing');
  }

  return runtime;
}

export function useEditorState<T>(selector: (state: EditorState) => T): T {
  return useStore(useRuntime().store, selector);
}
