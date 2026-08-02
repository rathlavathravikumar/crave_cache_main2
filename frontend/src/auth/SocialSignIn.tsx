import React, { useState } from 'react';
import { useSignIn } from '@clerk/clerk-react';
import { Loader2 } from 'lucide-react';
import { showToast } from '../utils/toast';
import { SSO_CALLBACK_PATH, isClerkConfigured } from './clerk';

/* Brand marks — lucide has no Google/Microsoft glyphs, so these are inline. */

const GoogleMark = () => (
  <svg viewBox="0 0 18 18" className="h-4 w-4" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62Z"
    />
    <path
      fill="#34A853"
      d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.34A9 9 0 0 0 9 18Z"
    />
    <path fill="#FBBC05" d="M3.97 10.72a5.41 5.41 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.01-2.34Z" />
    <path
      fill="#EA4335"
      d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.94l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58Z"
    />
  </svg>
);

const GitHubMark = () => (
  <svg viewBox="0 0 16 16" className="h-4 w-4 text-ink-800" fill="currentColor" aria-hidden="true">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.4 7.4 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A7.99 7.99 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
  </svg>
);

const MicrosoftMark = () => (
  <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
    <path fill="#F25022" d="M0 0h7.6v7.6H0z" />
    <path fill="#7FBA00" d="M8.4 0H16v7.6H8.4z" />
    <path fill="#00A4EF" d="M0 8.4h7.6V16H0z" />
    <path fill="#FFB900" d="M8.4 8.4H16V16H8.4z" />
  </svg>
);

const PROVIDERS = [
  { strategy: 'oauth_google' as const, label: 'Google', Mark: GoogleMark },
  { strategy: 'oauth_github' as const, label: 'GitHub', Mark: GitHubMark },
  { strategy: 'oauth_microsoft' as const, label: 'Microsoft', Mark: MicrosoftMark },
];

const Buttons: React.FC<{ onStart?: () => void }> = ({ onStart }) => {
  const { signIn, isLoaded } = useSignIn();
  const [pending, setPending] = useState<string | null>(null);

  const handleClick = async (strategy: (typeof PROVIDERS)[number]['strategy'], label: string) => {
    if (!isLoaded || !signIn) return;
    setPending(strategy);
    onStart?.();
    try {
      // Full-page redirect to the provider; Clerk returns to SSO_CALLBACK_PATH,
      // which also transfers to sign-up automatically for brand-new accounts.
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: SSO_CALLBACK_PATH,
        redirectUrlComplete: '/',
      });
    } catch (err: any) {
      setPending(null);
      const message =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        `Could not start ${label} sign-in.`;
      showToast.error(message);
    }
  };

  return (
    <div className="space-y-2">
      {PROVIDERS.map(({ strategy, label, Mark }) => (
        <button
          key={strategy}
          type="button"
          disabled={!isLoaded || pending !== null}
          onClick={() => handleClick(strategy, label)}
          className="flex w-full items-center justify-center gap-2.5 rounded-control border border-surface-line bg-white py-2.5 px-4 text-[13px] font-bold text-ink-800 transition-all hover:bg-surface-sunken hover:border-slate-300 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pending === strategy ? (
            <Loader2 className="h-4 w-4 animate-spin text-ink-400" />
          ) : (
            <Mark />
          )}
          <span>Continue with {label}</span>
        </button>
      ))}
    </div>
  );
};

/**
 * Renders the OAuth buttons, or an inline setup hint when Clerk keys are
 * missing so the reason is obvious rather than the buttons silently vanishing.
 */
export const SocialSignIn: React.FC<{ onStart?: () => void }> = ({ onStart }) => {
  if (!isClerkConfigured) {
    return (
      <div className="rounded-control border border-dashed border-slate-300 bg-surface-sunken p-3">
        <p className="text-[13px] font-bold text-ink-600">
          Social sign-in is not configured
        </p>
        <p className="mt-0.5 text-[13px] font-medium leading-relaxed text-ink-500">
          Add <code className="font-mono text-[12px] text-brand-500">VITE_CLERK_PUBLISHABLE_KEY</code> to
          your <code className="font-mono text-[12px] text-brand-500">.env</code> and restart to enable
          Google, GitHub and Microsoft.
        </p>
      </div>
    );
  }

  return <Buttons onStart={onStart} />;
};
