import { ArrowDown, ArrowRight, MessageSquare, Trash2 } from 'lucide-react';
import { BoardGraph } from '../../domain/BoardGraph';
import { useEditorState, useRuntime } from './context';

export function CardInspector() {
  const { editor } = useRuntime();
  const doc = useEditorState((state) => state.document);
  const selectedId = useEditorState((state) => state.selectedId);
  const busy = useEditorState((state) => state.busy);
  const card = doc.cards.find((item) => item.id === selectedId);
  const graph = new BoardGraph(doc);

  if (!card) {
    return (
      <section className="inspector">
        <p className="muted">Выберите карточку на доске, чтобы описать этап.</p>
      </section>
    );
  }

  return (
    <section className="inspector" aria-label="Редактор карточки">
      <div className="section-heading">
        <span>КАРТОЧКА ЭТАПА</span>
        <span className="count-pill">{String(doc.cards.indexOf(card) + 1).padStart(2, '0')}</span>
      </div>
      <label htmlFor="card-text">Что происходит?</label>
      <textarea
        id="card-text"
        key={card.id}
        value={card.text}
        maxLength={10000}
        disabled={busy}
        placeholder="Например, открытие модального окна"
        rows={4}
        onChange={(event) => editor.update(card.id, { text: event.target.value })}
      />
      <label htmlFor="card-comment" className="comment-label">
        <MessageSquare size={13} />
        Комментарий <span>необязательно</span>
      </label>
      <textarea
        id="card-comment"
        value={card.comment ?? ''}
        disabled={busy}
        maxLength={10000}
        rows={2}
        placeholder="Детали, вопросы и заметки…"
        onChange={(event) => editor.update(card.id, { comment: event.target.value || null })}
      />
      <div className="card-add-actions">
        <button
          disabled={busy || graph.hasNext(card.id, 'NEXT')}
          onClick={() => editor.add(card.id, 'NEXT')}
        >
          <ArrowRight size={14} />
          Следующий этап
        </button>
        <button
          disabled={busy || graph.hasNext(card.id, 'CONDITION')}
          onClick={() => editor.add(card.id, 'CONDITION')}
        >
          <ArrowDown size={14} />
          Условие
        </button>
      </div>
      <div className="card-meta">
        <code title={card.id}>#{card.id.slice(0, 8)}</code>
        <button
          className="text-button danger"
          disabled={busy || doc.cards.length === 1}
          onClick={() => editor.remove(card.id)}
          title="Удалить карточку и её связи"
        >
          <Trash2 size={13} />
          Удалить
        </button>
      </div>
    </section>
  );
}
