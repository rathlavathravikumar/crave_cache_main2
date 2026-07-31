import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from './hooks/reduxHooks';
import { ToastHost } from './components/ToastHost';
import { ConfirmDialogHost } from './components/ui';
import { ClerkSessionBridge } from './auth/ClerkSessionBridge';
import { Header } from './components/Header';
import { CartDrawer } from './components/CartDrawer';
import { AIFoodAssistant } from './components/AIFoodAssistant';
import { AuthPage } from './pages/AuthPage';
import { HomePage } from './pages/HomePage';
import { RestaurantDetailsPage } from './pages/RestaurantDetailsPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrdersPage } from './pages/OrdersPage';
import { WishlistPage } from './pages/WishlistPage';
import { ProfilePage } from './pages/ProfilePage';
import { LandingPage } from './pages/LandingPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { OwnerPortalPage } from './pages/OwnerPortalPage';
import {
  UtensilsCrossed,
  ShieldCheck,
  Sparkles,
  Store,
  LayoutDashboard,
  UserCheck,
  ArrowRight,
  ChefHat,
  Lock,
  CheckCircle2,
} from 'lucide-react';

export default function App() {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);

  // Auth is a full-page view rather than an overlay, so the sign-in screen gets
  // the whole viewport instead of a cramped dialog.
  const [authRequest, setAuthRequest] = useState<{
    role: 'customer' | 'owner' | 'admin';
    mode: 'login' | 'register';
  } | null>(null);

  const openAuth = (role: 'customer' | 'owner' | 'admin', mode: 'login' | 'register' = 'login') => {
    setAuthRequest({ role, mode });
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectRestaurant = (restaurantId: string) => {
    setSelectedRestaurantId(restaurantId);
    setCurrentView('restaurant');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOrderSuccess = (orderId: string) => {
    setCurrentView('orders');
  };

  // Clear the pending auth request once signed in, so logging out later returns
  // to the landing page rather than straight back to the sign-in form.
  useEffect(() => {
    if (isAuthenticated) setAuthRequest(null);
  }, [isAuthenticated]);

  /*
   * Views every signed-in role may open, whatever their portal.
   *
   * Previously owner/admin were pinned to their portal unconditionally, so the
   * shared header's "Profile Settings" and favourites buttons dispatched a
   * navigation that was then discarded — the controls looked broken because
   * nothing downstream honoured currentView for those roles.
   */
  const SHARED_VIEWS = ['profile', 'wishlist'];

  const homeViewForRole =
    user?.role === 'owner' ? 'owner' : user?.role === 'admin' ? 'admin' : 'home';

  const effectiveView = !isAuthenticated
    ? 'landing'
    : user?.role === 'customer'
    ? currentView
    : SHARED_VIEWS.includes(currentView)
    ? currentView
    : homeViewForRole;

  // Full-page auth view: deliberately bypasses the app shell (header, centred
  // main, footer) so the split-screen layout owns the whole viewport. The
  // global hosts stay mounted so toasts and the Clerk exchange still work here.
  if (!isAuthenticated && authRequest) {
    return (
      <div className="min-h-screen bg-surface-page font-sans text-ink-800 antialiased selection:bg-brand-500 selection:text-white">
        <ToastHost />
        <ConfirmDialogHost />
        <ClerkSessionBridge />
        <AuthPage
          defaultRole={authRequest.role}
          defaultMode={authRequest.mode}
          onBack={() => setAuthRequest(null)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col font-sans text-slate-800 antialiased selection:bg-[#FF5200] selection:text-white">
      <ToastHost />
      <ConfirmDialogHost />
      <ClerkSessionBridge />
      
      {/* Top Header Navigation (Only shown when authenticated) */}
      {isAuthenticated && <Header currentView={effectiveView} onNavigate={handleNavigate} />}

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {!isAuthenticated ? (
          <LandingPage onOpenAuth={openAuth} />
        ) : (
          /* ========================================================= */
          /* AUTHENTICATED VIEWS (STRICT ROLE ISOLATION)               */
          /* ========================================================= */
          <>
            {user?.role === 'customer' && (
              <>
                {currentView === 'home' && (
                  <HomePage onSelectRestaurant={handleSelectRestaurant} />
                )}

                {currentView === 'restaurant' && selectedRestaurantId && (
                  <RestaurantDetailsPage
                    restaurantId={selectedRestaurantId}
                    onBack={() => handleNavigate('home')}
                  />
                )}

                {currentView === 'checkout' && (
                  <CheckoutPage
                    onBack={() => handleNavigate('home')}
                    onOrderSuccess={handleOrderSuccess}
                  />
                )}

                {currentView === 'orders' && (
                  <OrdersPage onNavigateHome={() => handleNavigate('home')} />
                )}

                {currentView === 'wishlist' && (
                  <WishlistPage onSelectRestaurant={handleSelectRestaurant} />
                )}

                {currentView === 'profile' && <ProfilePage />}
              </>
            )}

            {/* Owner and admin get the same account screens as customers, so
                profile details and saved favourites are editable from their
                portals too. Anything else falls back to their own dashboard. */}
            {user?.role === 'owner' && (
              <>
                {effectiveView === 'profile' && <ProfilePage />}
                {effectiveView === 'wishlist' && <WishlistPage />}
                {effectiveView === 'owner' && <OwnerPortalPage />}
              </>
            )}

            {user?.role === 'admin' && (
              <>
                {effectiveView === 'profile' && <ProfilePage />}
                {effectiveView === 'wishlist' && <WishlistPage />}
                {effectiveView === 'admin' && <AdminDashboardPage />}
              </>
            )}
          </>
        )}
      </main>

      {/* Global Slide-Over Drawers & Modals */}
      {isAuthenticated && user?.role === 'customer' && (
        <>
          <CartDrawer onProceedToCheckout={() => handleNavigate('checkout')} />
          <AIFoodAssistant onNavigateCheckout={() => handleNavigate('checkout')} />
        </>
      )}

      {/* Global Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-800">
            
            {/* Brand Column */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#FF5200] flex items-center justify-center text-white font-black shadow-md">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <span className="text-lg font-black text-white">
                  Crave<span className="text-[#FF5200]">Cache</span>
                </span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Next-generation multi-role food ordering platform with strict role isolation & AI curation.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Independent Portals</h4>
              <ul className="space-y-2 font-medium">
                <li>
                  <button onClick={() => openAuth('customer', 'login')} className="hover:text-orange-400 transition-colors">
                    Customer Portal
                  </button>
                </li>
                <li>
                  <button onClick={() => openAuth('owner', 'login')} className="hover:text-orange-400 transition-colors">
                    Restaurant Owner Portal
                  </button>
                </li>
                <li>
                  <button onClick={() => openAuth('admin', 'login')} className="hover:text-orange-400 transition-colors">
                    Super Admin Center
                  </button>
                </li>
              </ul>
            </div>

            {/* AI Assistant Features */}
            <div>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">AI Curation</h4>
              <ul className="space-y-2 font-medium">
                <li className="flex items-center gap-1.5 text-amber-300">
                  <Sparkles className="w-3.5 h-3.5" /> Natural Language Order Prompt
                </li>
                <li>Instant Coupon Auto-Application</li>
                <li>Dietary Filter (Spicy / Veg / Halal)</li>
              </ul>
            </div>

            {/* Payment & Security */}
            <div>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Security & Trust</h4>
              <p className="text-slate-400 text-xs mb-3">
                100% Secure Checkout powered by Stripe PCI-DSS Level 1 Encryption.
              </p>
              <div className="flex items-center gap-2 font-bold text-emerald-400 bg-emerald-950/50 p-2.5 rounded-xl border border-emerald-800/50">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Verified Merchant & RBAC</span>
              </div>
            </div>

          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
            <p>© 2026 CraveCache Inc. All rights reserved. Built with React 19, Express, Tailwind CSS & Gemini AI SDK.</p>
            <div className="flex gap-4">
              <span className="hover:text-slate-300 cursor-pointer">Privacy Policy</span>
              <span className="hover:text-slate-300 cursor-pointer">Terms of Service</span>
              <span className="hover:text-slate-300 cursor-pointer">Security</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}

