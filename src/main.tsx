import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Hack to prevent Firestore/Auth from failing when fetch is read-only
if (typeof window !== 'undefined') {
  try {
    const descriptor = Object.getOwnPropertyDescriptor(window, 'fetch');
    // If it's already writable or not configurable, don't try to define it again
    if (!descriptor || descriptor.configurable) {
      const originalFetch = window.fetch;
      Object.defineProperty(window, 'fetch', {
        value: originalFetch,
        writable: true,
        configurable: true,
        enumerable: true
      });
    }
  } catch (e) {
    console.warn('Failed to define fetch as writable. Firebase may have issues.');
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
