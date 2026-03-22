import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import { ToastProvider } from './hooks/useToast';
import ErrorBoundary from './components/common/ErrorBoundary';
import './styles/globals.css';
import '@xterm/xterm/css/xterm.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
