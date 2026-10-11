import { useEffect, useState } from 'react';
import { Check, Circle, GitBranch, Layers2, X } from 'lucide-react';
import { BoardGraph } from '../../domain/BoardGraph';
import { useEditorState, useRuntime } from './context';
import { Header } from './Header';
import { Sideblock } from './Sideblock';
import { CanvasBoard } from './CanvasBoard';
import { BoardPicker } from './BoardPicker';
import { formatCount } from './formatCount';

export function App() {
  const runtime = useRuntime();
  const state = useEditorState((value) => value);
  const [picker, setPicker] = useState(false);
  const [canvasKey, setCanvasKey] = useState(0);
  const dirty = new BoardGraph(state.document).isDirty();

  useEffect(() => {
    const timer = setTimeout(() => runtime.session.cache(state.document), 250);

    return () => clearTimeout(timer);
  }, [runtime, state.document]);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      runtime.session.cache(runtime.store.getState().document);

      if (new BoardGraph(runtime.store.getState().document).isDirty()) {
        event.preventDefault();
      }
    };
    const keyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void runtime.session.save();
      }
    };
    window.addEventListener('beforeunload', beforeUnload);
    window.addEventListener('keydown', keyDown);

    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      window.removeEventListener('keydown', keyDown);
    };
  }, [runtime]);

  const canReplace = () =>
    !dirty ||
    window.confirm(
      'На доске есть несохранённые изменения. Заменить текущий черновик? При необходимости сначала экспортируйте JSON.',
    );
  const create = () => {
    if (canReplace()) {
      runtime.session.create();
      setCanvasKey((key) => key + 1);
    }
  };
  const open = async (id: string) => {
    if (canReplace()) {
      setPicker(false);

      if (await runtime.session.open(id)) {
        setCanvasKey((key) => key + 1);
      }
    }
  };

  return (
    <div className="app-shell">
      <Header />
      <div className="workspace">
        <Sideblock onOpen={() => setPicker(true)} onNew={create} />
        <main className="main">
          <div className="board-heading">
            <div>
              <div className="board-eyebrow">
                <span className="workspace-badge">ЛИЧНОЕ</span>
                <span>Пользовательский сценарий</span>
              </div>
              <h1>{state.document.title || 'Без названия'}</h1>
              <p>Соединяйте действия. Продумывайте детали.</p>
            </div>
            <div className="board-stats">
              <span>
                <Layers2 size={14} />
                {formatCount(state.document.cards.length, ['карточка', 'карточки', 'карточек'])}
              </span>
              <span>
                <GitBranch size={14} />
                {formatCount(state.document.links.length, ['связь', 'связи', 'связей'])}
              </span>
            </div>
          </div>
          <CanvasBoard key={canvasKey} />
          <footer className="workspace-footer">
            <span>
              <Circle size={7} fill="currentColor" />
              {dirty ? 'Черновик сохраняется в этом браузере' : 'Синхронизировано с сервером'}
            </span>
            <span>Маленькие шаги. Целостная картина.</span>
          </footer>
        </main>
      </div>
      {(state.error || state.notice) && (
        <div
          className={`toast ${state.error ? 'error' : 'success'}`}
          role={state.error ? 'alert' : 'status'}
        >
          {!state.error && <Check size={17} />}
          <span>{state.error || state.notice}</span>
          <button
            className="icon-button"
            aria-label="Закрыть уведомление"
            onClick={() => runtime.store.setState({ error: null, notice: null })}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {picker && <BoardPicker close={() => setPicker(false)} open={(id) => void open(id)} />}
    </div>
  );
}
