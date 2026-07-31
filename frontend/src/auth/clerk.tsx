import React from 'react';
import { ClerkProvider } from '@clerk/clerk-react';

/**
 * Clerk wiring for CraveCache.
 *
 * The publishable key is read from VITE_CLERK_PUBLISHABLE_KEY. When it is
 * absent we deliberately do NOT mount ClerkProvider — mounting it without a
 * key throws and would take the whole app down. Instead the social buttons
 * render disabled and the demo login stays available, so a fresh clone still
 * runs before anyone has set up Clerk.
 */
export const CLERK_PUBLISHABLE_KEY: string | undefined = import.meta.env
  .VITE_CLERK_PUBLISHABLE_KEY;

export const isClerkConfigured = Boolean(CLERK_PUBLISHABLE_KEY);

/** Path Clerk redirects back to after the OAuth round-trip. */
export const SSO_CALLBACK_PATH = '/sso-callback';

export const OAUTH_PROVIDERS = [
  { strategy: 'oauth_google' as const, label: 'Google' },
  { strategy: 'oauth_github' as const, label: 'GitHub' },
  { strategy: 'oauth_microsoft' as const, label: 'Microsoft' },
];

export const ClerkAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!isClerkConfigured) {
    if (import.meta.env.DEV) {
      console.warn(
        '[CraveCache] VITE_CLERK_PUBLISHABLE_KEY is not set — social sign-in is disabled. ' +
          'Add it to .env and restart to enable Google / GitHub / Microsoft login.'
      );
    }
    return <>{children}</>;
  }

  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY!}
      afterSignOutUrl="/"
    >
      {children}
    </ClerkProvider>
  );
};
