import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './index.css';

/**
 * Entry point of the React application.
 *
 * <p>{@code BrowserRouter} gives us the client side routing (URLs such as
 * {@code /login} and {@code /home}) and {@code AuthProvider} makes the
 * authentication state available to every component.
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
