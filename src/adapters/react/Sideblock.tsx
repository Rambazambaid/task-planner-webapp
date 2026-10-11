import { Download, FolderOpen, Plus, Save, Shapes, Sparkles } from 'lucide-react';
import { useEditorState, useRuntime } from './context';
import { BoardGraph } from '../../domain/BoardGraph';
import { CardInspector } from './CardInspector';

export function Sideblock({ onOpen, onNew }: { onOpen: () => void; onNew: () => void }) {
  const { editor, session } = useRuntime();
  const doc = useEditorState((state) => state.document);
  const busy = useEditorState((state) => state.busy);
  const selected = useEditorState((state) => state.selectedId);
  const dirty = new BoardGraph(doc).isDirty();

  return (
    <aside className="sideblock" aria-label="Управление доской">
      <div className="side-scroll">
        <div className="workspace-label">ВАШЕ ПРОСТРАНСТВО</div>
        <button className="nav-active" onClick={onOpen} disabled={busy}>
          <Shapes size={17} />
          <span>Мои сценарии</span>
          <FolderOpen size={15} />
        </button>
        <button className="new-board" onClick={onNew} disabled={busy}>
          <Plus size={16} />
          Новая доска
        </button>
        <div className="divider" />
        <section className="board-settings">
          <div className="section-heading">
            <span>НАСТРОЙКИ ДОСКИ</span>
            <span className="tiny-dot" />
          </div>
          <label htmlFor="board-title">Название</label>
          <input
            id="board-title"
            value={doc.title}
            maxLength={200}
            disabled={busy}
            onChange={(event) => editor.rename(event.target.value)}
          />
          <button
            className="button primary save-button"
            disabled={busy || !dirty}
            onClick={() => void session.save()}
          >
            <Save size={16} />
            <span>{busy ? 'Сохраняем…' : 'Сохранить доску'}</span>
            <kbd>⌘ S</kbd>
          </button>
          <button className="button secondary" onClick={() => session.export()}>
            <Download size={15} />
            Экспортировать JSON
          </button>
        </section>
        <div className="divider" />
        <CardInspector />
        <details className="card-list">
          <summary>
            Карточки на доске <span>{doc.cards.length}</span>
          </summary>
          <div>
            {doc.cards.map((card, index) => (
              <button
                key={card.id}
                aria-pressed={card.id === selected}
                disabled={busy}
                onClick={() => editor.select(card.id)}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                {card.text || 'Пустая карточка'}
              </button>
            ))}
          </div>
        </details>
      </div>
      <div className="side-footer">
        <Sparkles size={16} />
        <p>
          От первого действия
          <br />
          <strong>до понятного сценария.</strong>
        </p>
        <span>v0.1</span>
      </div>
    </aside>
  );
}
