import React, { useEffect, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
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
      <MotionConfig reducedMotion="user">
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
      </MotionConfig>
    );
  }

  return (
    /* `reducedMotion="user"` makes every motion component below defer to the
       OS "reduce motion" setting, so the transitions never fight an
       accessibility preference. */
    <MotionConfig reducedMotion="user">
    <div className="min-h-screen bg-surface-page flex flex-col font-sans text-ink-800 antialiased selection:bg-brand-500 selection:text-white">
      <ToastHost />
      <ConfirmDialogHost />
      <ClerkSessionBridge />

      {/* Top Header Navigation (Only shown when authenticated) */}
      {isAuthenticated && <Header currentView={effectiveView} onNavigate={handleNavigate} />}

      {/* Main Content Body.
          Keyed on the resolved view so switching screens cross-fades instead of
          snapping. `mode="wait"` lets the outgoing screen finish before the
          incoming one mounts, which avoids the two stacking and doubling the
          page height mid-transition. */}
      <main className="flex-1 container-app pt-6">
        <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={effectiveView}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
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
        </motion.div>
        </AnimatePresence>
      </main>

      {/* Global Slide-Over Drawers & Modals */}
      {isAuthenticated && user?.role === 'customer' && (
        <>
          <CartDrawer onProceedToCheckout={() => handleNavigate('checkout')} />
          <AIFoodAssistant onNavigateCheckout={() => handleNavigate('checkout')} />
        </>
      )}

      {/* Global Footer */}
      <footer className="bg-ink-900 text-slate-400 border-t border-slate-800 mt-20">
        <div className="container-app py-14">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 pb-10 border-b border-white/10">

            {/* Brand Column */}
            <div className="col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-[10px] bg-brand-500 flex items-center justify-center text-white">
                  <UtensilsCrossed className="w-[18px] h-[18px]" />
                </div>
                <span className="text-[17px] font-bold text-white tracking-tight">
                  Crave<span className="text-brand-500">Cache</span>
                </span>
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-slate-400 max-w-xs">
                AI-assisted food ordering with separate portals for customers, restaurant
                owners and administrators.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-[13px] font-semibold text-white mb-3.5">Portals</h4>
              <ul className="space-y-2.5 text-[13px]">
                <li>
                  <button
                    onClick={() => openAuth('customer', 'login')}
                    className="hover:text-white transition-colors"
                  >
                    Customer
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => openAuth('owner', 'login')}
                    className="hover:text-white transition-colors"
                  >
                    Restaurant owner
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => openAuth('admin', 'login')}
                    className="hover:text-white transition-colors"
                  >
                    Super admin
                  </button>
                </li>
              </ul>
            </div>

            {/* AI Assistant Features */}
            <div>
              <h4 className="text-[13px] font-semibold text-white mb-3.5">AI features</h4>
              <ul className="space-y-2.5 text-[13px]">
                <li>Natural-language ordering</li>
                <li>Personalised recommendations</li>
                <li>Automatic coupon matching</li>
              </ul>
            </div>

            {/* Payment & Security */}
            <div>
              <h4 className="text-[13px] font-semibold text-white mb-3.5">Security</h4>
              <p className="text-[13px] leading-relaxed mb-3">
                Card details are entered in Stripe's own iframe and never touch our servers.
              </p>
              <div className="inline-flex items-center gap-2 text-[13px] font-medium text-emerald-400">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Stripe secured</span>
              </div>
            </div>

          </div>

          <div className="pt-7 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-slate-500">
            <p>© 2026 CraveCache. All rights reserved.</p>
            <div className="flex gap-5">
              <button className="hover:text-slate-300 transition-colors">Privacy</button>
              <button className="hover:text-slate-300 transition-colors">Terms</button>
              <button className="hover:text-slate-300 transition-colors">Security</button>
            </div>
          </div>
        </div>
      </footer>

    </div>
    </MotionConfig>
  );
}

