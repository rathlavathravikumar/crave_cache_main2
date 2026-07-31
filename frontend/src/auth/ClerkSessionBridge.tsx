import React, { useEffect, useRef } from 'react';
import { useAuth, useUser, AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import { useAppDispatch, useAppSelector } from '../hooks/reduxHooks';
import { authenticateWithClerk } from '../store/slices/authSlice';
import { showToast } from '../utils/toast';
import { SSO_CALLBACK_PATH, isClerkConfigured } from './clerk';

const ROLE_LABEL: Record<string, string> = {
  customer: 'Customer',
  owner: 'Restaurant Owner',
  admin: 'Super Admin',
};

/**
 * Keeps the Clerk session and the CraveCache redux session in step.
 *
 * - Clerk signs in  -> exchange the session token for a CraveCache user
 * - App logs out    -> end the Clerk session too, so the next visit isn't
 *                      silently signed straight back in
 */
const Bridge: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isLoaded, isSignedIn, getToken, signOut } = useAuth();
  const { user: clerkUser } = useUser();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const appToken = useAppSelector((state) => state.auth.token);

  // Guards against StrictMode's double effect and repeated exchanges.
  const exchangingFor = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !clerkUser) return;
    if (exchangingFor.current === clerkUser.id) return;

    const email = clerkUser.primaryEmailAddress?.emailAddress;
    if (!email) {
      showToast.error('That account has no email address, so a role cannot be assigned.');
      return;
    }

    exchangingFor.current = clerkUser.id;

    (async () => {
      try {
        const sessionToken = await getToken();
        if (!sessionToken) {
          exchangingFor.current = null;
          return;
        }

        const result = await dispatch(
          authenticateWithClerk({
            sessionToken,
            profile: {
              email,
              name: clerkUser.fullName || clerkUser.username || undefined,
              avatar: clerkUser.imageUrl || undefined,
              provider: clerkUser.externalAccounts?.[0]?.provider,
            },
          })
        );

        if (authenticateWithClerk.fulfilled.match(result)) {
          const role = result.payload.user.role as string;
          showToast.success(`Signed in as ${ROLE_LABEL[role] || role}`);
        } else {
          showToast.error(String(result.payload || 'Clerk sign-in failed'));
          exchangingFor.current = null;
        }
      } catch (err: any) {
        showToast.error(err?.message || 'Clerk sign-in failed');
        exchangingFor.current = null;
      }
    })();
  }, [isLoaded, isSignedIn, clerkUser, dispatch, getToken]);

  // App-side logout should also drop the Clerk session.
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    if (!isAuthenticated && !appToken) {
      exchangingFor.current = null;
      signOut().catch(() => {
        /* already gone — nothing to do */
      });
    }
  }, [isLoaded, isSignedIn, isAuthenticated, appToken, signOut]);

  return null;
};

/** Mounted once near the app root. A no-op until Clerk keys are configured. */
export const ClerkSessionBridge: React.FC = () => {
  if (!isClerkConfigured) return null;
  return <Bridge />;
};

/**
 * Landing spot for the OAuth round-trip. This app has no router, so App checks
 * the pathname and renders this instead of the normal shell.
 */
export const isSsoCallbackRoute = () =>
  isClerkConfigured && window.location.pathname === SSO_CALLBACK_PATH;

export const SsoCallbackScreen: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#F4F5F7] p-6">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FF5200] text-xl font-black text-white shadow-lg shadow-[#FF5200]/25">
      CC
    </div>
    <div className="text-center">
      <p className="text-sm font-black tracking-tight text-[#1F2937]">Completing sign-in…</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">Verifying your account with CraveCache</p>
    </div>
    <div className="h-1 w-40 overflow-hidden rounded-full bg-slate-200">
      <div className="h-full w-1/2 animate-pulse rounded-full bg-[#FF5200]" />
    </div>
    <AuthenticateWithRedirectCallback signInFallbackRedirectUrl="/" signUpFallbackRedirectUrl="/" />
  </div>
);
