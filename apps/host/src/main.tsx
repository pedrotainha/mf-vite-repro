import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import App from './App/App';
import { config } from './config';

import './index.css';

const bootstrap = async () => {
  if (config.USE_MOCKS) {
    const { setupWorker } = await import('msw/browser');
    const worker = setupWorker();
    await worker.start({ onUnhandledRequest: 'bypass' });
    window.__mswWorker = worker;
  }

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 5 * 60 * 1000,
      },
    },
  });

  const root = document.querySelector('#root');
  if (root) {
    createRoot(root).render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </QueryClientProvider>
      </StrictMode>,
    );
  }
};

void bootstrap();
