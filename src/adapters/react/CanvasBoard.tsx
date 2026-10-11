import { useEffect, useRef, useState } from 'react';
import { CircleHelp, Focus, Hand, Minus, MousePointer2, Plus, Route } from 'lucide-react';
import { CanvasRenderer } from '../../infrastructure/canvas/CanvasRenderer';
import { CanvasInteraction } from '../../infrastructure/canvas/CanvasInteraction';
import { Viewport } from '../../infrastructure/canvas/Viewport';
import { useEditorState, useRuntime } from './context';

export function CanvasBoard() {
  const runtime = useRuntime();
  const canvas = useRef<HTMLCanvasElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const controls = useRef<{ fit: () => void; zoom: (factor: number) => void } | null>(null);
  const [help, setHelp] = useState(false);
  const doc = useEditorState((state) => state.document);
  const zoom = useEditorState((state) => state.zoom);
  const empty = doc.cards.length === 1 && !doc.cards[0].text;

  useEffect(() => {
    const element = canvas.current!;
    const container = frame.current!;
    const viewport = new Viewport();
    const renderer = new CanvasRenderer(element, viewport);
    let animation = 0;
    const draw = () => {
      cancelAnimationFrame(animation);
      animation = requestAnimationFrame(() => {
        const state = runtime.store.getState();
        renderer.draw(state.document, state.selectedId);
      });
      runtime.store.setState({ zoom: viewport.zoom });
    };
    const resize = new ResizeObserver(([entry]) => {
      renderer.resize(entry.contentRect.width, entry.contentRect.height);

      viewport.fit(runtime.store.getState().document.cards);

      draw();
    });
    resize.observe(container);
    document.fonts.addEventListener('loadingdone', draw);
    const interaction = new CanvasInteraction(
      element,
      viewport,
      runtime.editor,
      () => runtime.store.getState(),
      draw,
      () => document.getElementById('card-text')?.focus(),
    );
    const unsubscribe = runtime.store.subscribe((state, previous) => {
      if (state.document !== previous.document || state.selectedId !== previous.selectedId) {
        if (
          state.document.id !== previous.document.id &&
          state.document.savedTitle === previous.document.savedTitle
        ) {
          viewport.fit(state.document.cards);
        }

        draw();
      }
    });
    controls.current = {
      fit: () => {
        viewport.fit(runtime.store.getState().document.cards);
        draw();
      },
      zoom: (factor) => {
        viewport.zoomAt(factor, { x: viewport.width / 2, y: viewport.height / 2 });
        draw();
      },
    };

    return () => {
      resize.disconnect();
      document.fonts.removeEventListener('loadingdone', draw);
      interaction.dispose();
      unsubscribe();
      cancelAnimationFrame(animation);
      controls.current = null;
    };
  }, [runtime]);

  return (
    <div className="canvas-frame" ref={frame}>
      <canvas
        ref={canvas}
        tabIndex={0}
        aria-label="Доска сценария. Перетаскивайте карточки. Плюс справа добавляет этап, снизу — условие. Для управления с клавиатуры используйте боковую панель."
      >
        Ваш браузер не поддерживает Canvas. Карточки доступны в боковой панели.
      </canvas>
      <div className="canvas-label">
        <Route size={14} />
        <span>ДОСКА СЦЕНАРИЯ</span>
      </div>
      <button
        className="canvas-help icon-button"
        aria-label="Помощь по управлению доской"
        aria-expanded={help}
        onClick={() => setHelp(!help)}
      >
        <CircleHelp size={18} />
      </button>
      {help && (
        <div className="help-popover">
          <strong>Всё под рукой</strong>
          <p>Перетащите карточку, чтобы переместить её.</p>
          <p>Колесо мыши — масштаб. Фон или пробел + перетаскивание — перемещение доски.</p>
          <p>Двойной клик — редактирование. ⌘/Ctrl + S — сохранить.</p>
        </div>
      )}
      {empty && (
        <div className="canvas-intro">
          <span className="eyebrow">ОТ ИДЕИ К ЛОГИКЕ</span>
          <h2>Начните с первого действия</h2>
          <p>
            Опишите этап и добавьте продолжение с помощью <span>+</span>
          </p>
        </div>
      )}
      <div className="canvas-legend">
        <span>
          <i className="line-solid" />
          Следующий этап
        </span>
        <span>
          <i className="line-dashed" />
          Условие
        </span>
      </div>
      <div className="zoom-controls">
        <button aria-label="Уменьшить масштаб" onClick={() => controls.current?.zoom(1 / 1.2)}>
          <Minus size={15} />
        </button>
        <span>{Math.round(zoom * 100)}%</span>
        <button aria-label="Увеличить масштаб" onClick={() => controls.current?.zoom(1.2)}>
          <Plus size={15} />
        </button>
        <i />
        <button
          aria-label="Показать всю доску"
          title="Показать всю доску"
          onClick={() => controls.current?.fit()}
        >
          <Focus size={17} />
        </button>
      </div>
      <div className="canvas-bottom-hint">
        <Hand size={13} />
        <span>Перетаскивайте доску</span>
        <span className="hint-separator">·</span>
        <MousePointer2 size={13} />
        <span>Выбирайте карточки</span>
      </div>
    </div>
  );
}
