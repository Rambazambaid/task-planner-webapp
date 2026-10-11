import { ArrowUpRight, ChevronRight, Workflow } from 'lucide-react';
import { useEditorState, useRuntime } from './context';
import { BoardGraph } from '../../domain/BoardGraph';

export function Header() {
  const doc = useEditorState((state) => state.document);
  const busy = useEditorState((state) => state.busy);
  const { session } = useRuntime();
  const dirty = new BoardGraph(doc).isDirty();

  return (
    <header className="header">
      <div className="brand" aria-label="Планировщик">
        <span className="brand-mark">
          <Workflow size={21} strokeWidth={1.7} />
        </span>
        <span>
          планировщик<span className="brand-dot">.</span>
        </span>
      </div>
      <div className="breadcrumb">
        <span>Рабочее пространство</span>
        <ChevronRight size={14} />
        <strong>Доска сценария</strong>
      </div>
      <div className="header-actions">
        <span className={`sync-state ${dirty ? 'pending' : ''}`}>
          <i />
          {busy ? 'Сохраняем…' : dirty ? 'Локальный черновик' : 'Все изменения сохранены'}
        </span>
        <button
          className="icon-button export-header"
          title="Экспортировать доску в JSON"
          aria-label="Экспортировать доску в JSON"
          onClick={() => session.export()}
        >
          <ArrowUpRight size={19} />
        </button>
        <span className="avatar" title="Локальное рабочее пространство">
          ЛП
        </span>
      </div>
    </header>
  );
}
