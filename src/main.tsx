import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import App from './App.tsx';
import { ClerkAuthProvider } from './auth/clerk';
import { isSsoCallbackRoute, SsoCallbackScreen } from './auth/ClerkSessionBridge';
import './index.css';

// The OAuth round-trip lands on /sso-callback. This app has no router, so the
// route is resolved once here at the root rather than inside App — that keeps
// App's hook order unconditional.
const Root = () => (isSsoCallbackRoute() ? <SsoCallbackScreen /> : <App />);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkAuthProvider>
      <Provider store={store}>
        <Root />
      </Provider>
    </ClerkAuthProvider>
  </StrictMode>
);
