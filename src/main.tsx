import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './adapters/react/App';
import { RuntimeContext } from './adapters/react/context';
import { createRuntime } from './infrastructure/runtime';
import '@fontsource-variable/manrope';
import './styles.css';

const runtime = createRuntime();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RuntimeContext.Provider value={runtime}>
      <App />
    </RuntimeContext.Provider>
  </StrictMode>,
);
