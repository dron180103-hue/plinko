import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Render immediately - don't block on config loading
const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<App />);
} else {
  console.error('Root element not found');
}

// Load runtime config in background (non-blocking)
import('./lib/config.ts')
  .then(({ loadRuntimeConfig }) => loadRuntimeConfig())
  .catch(() => console.warn('Config module failed to load, using defaults'));