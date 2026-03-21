import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import { config } from './config';

import './index.css';

const bootstrap = async () => {
  if (config.USE_MOCKS) {
    const { setupWorker } = await import('msw/browser');
    const worker = setupWorker();
    await worker.start({ onUnhandledRequest: 'bypass' });
    window.__mswWorker = worker;
  }

  const root = document.querySelector('#root');
  if (root) {
    createRoot(root).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  }
};

void bootstrap();
