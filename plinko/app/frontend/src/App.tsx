import { Component, type ReactNode } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import AuthCallback from './pages/AuthCallback';
import AuthError from './pages/AuthError';
// MODULE_IMPORTS_START
// MODULE_IMPORTS_END

const queryClient = new QueryClient();

// Error Boundary to prevent white screen crashes
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error?.message || 'Unknown error' };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error('App crash:', error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#06000f', color: 'white', fontFamily: 'system-ui', padding: '20px', textAlign: 'center',
        }}>
          <div>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎱</div>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: '#a855f7' }}>
              Щось пішло не так
            </h1>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginBottom: '16px', maxWidth: '300px' }}>
              {this.state.error}
            </p>
            <button
              onClick={() => {
                // Clear caches and reload
                if ('caches' in window) {
                  caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
                }
                localStorage.removeItem('plinko_session');
                window.location.reload();
              }}
              style={{
                padding: '12px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                background: 'linear-gradient(to right, #f59e0b, #eab308)', color: '#78350f',
                fontWeight: 'bold', fontSize: '14px',
              }}
            >
              🔄 Перезавантажити
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      {/* MODULE_PROVIDERS_START */}
      {/* MODULE_PROVIDERS_END */}
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/error" element={<AuthError />} />
            {/* MODULE_ROUTES_START */}
            {/* MODULE_ROUTES_END */}
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      {/* MODULE_PROVIDERS_CLOSE */}
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;