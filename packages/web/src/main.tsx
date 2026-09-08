import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Sentry } from './sentry';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function ErrorFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-50 px-6">
      <div className="max-w-md rounded-xl border border-gray-100 bg-white px-8 py-10 text-center shadow-lg">
        <h1 className="font-serif text-xl text-navy">Something went wrong</h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">
          Please refresh the page. If the problem persists, contact{' '}
          <a
            href="mailto:michael@evertonconsultingservices.org"
            className="text-accent hover:underline"
          >
            michael@evertonconsultingservices.org
          </a>
        </p>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <QueryClientProvider client={queryClient}>
        <App />
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
