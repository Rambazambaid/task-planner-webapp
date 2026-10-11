import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, FolderOpen, LoaderCircle, X } from 'lucide-react';
import type { BoardSummary } from '../../domain/types';
import { useRuntime } from './context';

export function BoardPicker({ close, open }: { close: () => void; open: (id: string) => void }) {
  const { session } = useRuntime();
  const dialog = useRef<HTMLDialogElement>(null);
  const [boards, setBoards] = useState<BoardSummary[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    dialog.current?.showModal();
    let active = true;
    void session.repository
      .list()
      .then((items) => {
        if (active) setBoards(items);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Ошибка загрузки');
      });

    return () => {
      active = false;
    };
  }, [session]);

  return (
    <dialog className="board-dialog" ref={dialog} onCancel={close} aria-labelledby="picker-title">
      <div className="dialog-heading">
        <span className="dialog-symbol">
          <FolderOpen size={22} />
        </span>
        <button className="icon-button" aria-label="Закрыть список досок" onClick={close}>
          <X size={18} />
        </button>
      </div>
      <h2 id="picker-title">Мои сценарии</h2>
      <p className="muted">Доски, сохранённые на сервере</p>
      {error ? (
        <p className="dialog-error">{error}</p>
      ) : !boards ? (
        <p className="loading">
          <LoaderCircle size={16} className="spin" />
          Загружаем доски…
        </p>
      ) : boards.length === 0 ? (
        <p className="empty-list">Здесь появятся ваши сохранённые сценарии.</p>
      ) : (
        <div className="board-items">
          {boards.map((board) => (
            <button key={board.id} onClick={() => open(board.id)}>
              <span>{board.title}</span>
              <ArrowUpRight size={16} />
            </button>
          ))}
        </div>
      )}
      {boards?.length === 100 && <p className="muted">Показаны первые 100 досок.</p>}
    </dialog>
  );
}
