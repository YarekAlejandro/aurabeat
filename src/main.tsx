import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './styles/globals.css';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy'}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
