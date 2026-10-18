import { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <Suspense fallback={<div className="min-h-dvh bg-slate-950 text-white flex items-center justify-center" role="status">Spiel wird geladen …</div>}>
      <App />
    </Suspense>
  </ErrorBoundary>,
);
