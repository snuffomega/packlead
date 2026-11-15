import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { CatalogProvider } from './lib/catalogContext';
import { SessionProvider } from './lib/session';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SessionProvider>
        <CatalogProvider>
          <App />
        </CatalogProvider>
      </SessionProvider>
    </BrowserRouter>
  </StrictMode>,
);

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((e) => console.error('service worker registration failed', e));
  });
}
