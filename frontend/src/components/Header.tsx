import React, { useEffect, useRef, useState } from 'react';
import {
  UtensilsCrossed,
  MapPin,
  Search,
  Sparkles,
  ShoppingBag,
  Heart,
  User as UserIcon,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  Clock,
  ChevronRight,
  Store,
  X,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks/reduxHooks';
import { logout, setSelectedAddress } from '../store/slices/authSlice';
import { toggleCartDrawer } from '../store/slices/cartSlice';
import { toggleAIAssistant } from '../store/slices/aiSlice';
import { setSearchQuery, fetchRestaurants } from '../store/slices/restaurantSlice';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, selectedAddress } = useAppSelector((state) => state.auth);
  const cartItems = useAppSelector((state) => state.cart.items);
  const wishlistRestaurantIds = useAppSelector((state) => state.wishlist.restaurantIds);
  const wishlistFoodIds = useAppSelector((state) => state.wishlist.foodIds);
  const searchQuery = useAppSelector((state) => state.restaurants.searchQuery);

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Publish the real header height so fixed overlays (notifications) can sit
  // clear of it instead of covering the nav, cart and profile controls.
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const publish = () => {
      document.documentElement.style.setProperty(
        '--app-header-height',
        `${Math.round(el.getBoundingClientRect().height)}px`
      );
    };

    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(el);

    return () => {
      observer.disconnect();
      document.documentElement.style.setProperty('--app-header-height', '0px');
    };
  }, []);

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const wishlistTotal = wishlistRestaurantIds.length + wishlistFoodIds.length;

  // Cart, search and the AI assistant are customer capabilities: their drawers
  // are only mounted for customers, so showing them to owner/admin produced
  // buttons that could never do anything.
  const isCustomer = user?.role === 'customer';

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    dispatch(setSearchQuery(val));
    dispatch(fetchRestaurants({ search: val }));
    if (currentView !== 'home') {
      onNavigate('home');
    }
  };

  return (
    <>
      <header
        ref={headerRef}
        className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-surface-line"
      >
        <div className="container-app">
          <div className="flex items-center h-16 gap-3 sm:gap-5">

            {/* Logo & Location */}
            <div className="flex items-center gap-4 sm:gap-6 shrink-0">
              <button
                onClick={() => onNavigate('home')}
                className="flex items-center gap-2 text-left focus:outline-none"
              >
                <div className="w-9 h-9 rounded-[10px] bg-brand-500 flex items-center justify-center text-white">
                  <UtensilsCrossed className="w-[18px] h-[18px]" />
                </div>
                <span className="text-[17px] font-bold tracking-tight text-ink-900">
                  Crave<span className="text-brand-500">Cache</span>
                </span>
              </button>

              {/* Location Picker */}
              <button
                onClick={() => setIsLocationModalOpen(true)}
                className="hidden md:flex items-center gap-1.5 text-left group"
              >
                <MapPin className="w-4 h-4 text-brand-500 shrink-0" />
                <div className="max-w-[170px]">
                  <span className="block text-[11px] font-medium text-ink-500 leading-tight">
                    Deliver to
                  </span>
                  <span className="block text-[13px] font-semibold text-ink-900 truncate leading-tight group-hover:text-brand-600 transition-colors">
                    {selectedAddress
                      ? `${selectedAddress.title} · ${selectedAddress.city}`
                      : 'Select address'}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-ink-400 shrink-0" />
              </button>
            </div>

            {/* Global Search Bar — searches the customer catalogue only */}
            {isCustomer && (
              <div className="hidden lg:flex flex-1 max-w-xl items-center relative">
                <Search className="w-[18px] h-[18px] text-ink-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search for restaurants, cuisines or dishes"
                  aria-label="Search restaurants, cuisines and dishes"
                  className="field pl-11 bg-surface-sunken"
                />
              </div>
            )}

            {/* Right Action Icons */}
            <div className="flex items-center gap-1 sm:gap-2 ml-auto">

              {/* AI Food Assistant Trigger */}
              {isCustomer && (
                <button
                  onClick={() => dispatch(toggleAIAssistant(true))}
                  className="flex items-center gap-1.5 py-2 px-2.5 rounded-[10px] text-[13px] font-medium text-ink-600 hover:text-ink-900 hover:bg-surface-sunken transition-colors"
                >
                  <Sparkles className="w-[18px] h-[18px] text-brand-500" />
                  <span className="hidden lg:inline">AI Assistant</span>
                </button>
              )}

              {/* Favourites — available to every role */}
              <button
                onClick={() => onNavigate('wishlist')}
                aria-label={`Saved favourites${wishlistTotal > 0 ? ` (${wishlistTotal})` : ''}`}
                className="flex items-center gap-1.5 py-2 px-2.5 rounded-[10px] text-[13px] font-medium text-ink-600 hover:text-ink-900 hover:bg-surface-sunken transition-colors"
                title="Saved favourites"
              >
                {/* Badge anchors to the icon, not the button: anchored to the
                    button it lands on top of the label at lg and up. */}
                <span className="relative flex">
                  <Heart className="w-[18px] h-[18px]" />
                  {wishlistTotal > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-1 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center tnum">
                      {wishlistTotal}
                    </span>
                  )}
                </span>
                <span className="hidden lg:inline">Favourites</span>
              </button>

              {/* Cart Drawer Toggle */}
              {isCustomer && (
                <button
                  onClick={() => dispatch(toggleCartDrawer(true))}
                  aria-label={`Open cart (${totalCartCount} items)`}
                  className="flex items-center gap-1.5 py-2 px-2.5 rounded-[10px] text-[13px] font-medium text-ink-600 hover:text-ink-900 hover:bg-surface-sunken transition-colors"
                >
                  <span className="relative flex">
                    <ShoppingBag className="w-[18px] h-[18px]" />
                    {totalCartCount > 0 && (
                      <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-1 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center tnum">
                        {totalCartCount}
                      </span>
                    )}
                  </span>
                  <span className="hidden lg:inline">Cart</span>
                </button>
              )}

              {/* User Account / Profile Menu */}
              {isAuthenticated ? (
                <div className="relative ml-1">
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center gap-2 p-1 pr-2 rounded-[10px] hover:bg-surface-sunken transition-colors"
                  >
                    <img
                      src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                      alt={user?.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="hidden md:block text-left">
                      <span className="block text-[13px] font-semibold text-ink-900 leading-tight">
                        {user?.name}
                      </span>
                      <span className="block text-[11px] text-ink-500 capitalize leading-tight">
                        {user?.role}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-ink-400 hidden md:block" />
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileMenuOpen && (
                    <div
                      onMouseLeave={() => setIsProfileMenuOpen(false)}
                      className="absolute right-0 mt-2 w-60 bg-white rounded-panel shadow-overlay border border-surface-line py-1.5 z-50"
                    >
                      <div className="px-4 py-2.5 border-b border-surface-line">
                        <p className="text-sm font-semibold text-ink-900">{user?.name}</p>
                        <p className="text-xs text-ink-500 truncate">{user?.email}</p>
                        {user?.role === 'admin' && (
                          <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[11px] font-semibold">
                            Admin access
                          </span>
                        )}
                      </div>

                      {/* Role-specific menu items with ZERO cross-role switching */}
                      {user?.role === 'customer' && (
                        <>
                          <button
                            onClick={() => {
                              setIsProfileMenuOpen(false);
                              onNavigate('orders');
                            }}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-ink-800 hover:bg-surface-sunken transition-colors"
                          >
                            <Clock className="w-[18px] h-[18px] text-ink-400" />
                            My Orders
                          </button>

                          <button
                            onClick={() => {
                              setIsProfileMenuOpen(false);
                              onNavigate('profile');
                            }}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-ink-800 hover:bg-surface-sunken transition-colors"
                          >
                            <UserIcon className="w-[18px] h-[18px] text-ink-400" />
                            Profile Settings
                          </button>
                        </>
                      )}

                      {user?.role === 'owner' && (
                        <button
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            onNavigate('owner');
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-brand-600 hover:bg-brand-50 transition-colors"
                        >
                          <Store className="w-[18px] h-[18px]" />
                          Restaurant Owner Portal
                        </button>
                      )}

                      {user?.role === 'admin' && (
                        <button
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            onNavigate('admin');
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-purple-700 hover:bg-purple-50 transition-colors"
                        >
                          <LayoutDashboard className="w-[18px] h-[18px]" />
                          Admin Dashboard
                        </button>
                      )}

                      {/* Account screens are available to every role, not just
                          customers — owner/admin previously had no way to edit
                          their own profile at all. */}
                      {!isCustomer && (
                        <>
                          <button
                            onClick={() => {
                              setIsProfileMenuOpen(false);
                              onNavigate('profile');
                            }}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-ink-800 hover:bg-surface-sunken transition-colors"
                          >
                            <UserIcon className="w-[18px] h-[18px] text-ink-400" />
                            Profile Settings
                          </button>

                          <button
                            onClick={() => {
                              setIsProfileMenuOpen(false);
                              onNavigate('wishlist');
                            }}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-ink-800 hover:bg-surface-sunken transition-colors"
                          >
                            <Heart className="w-[18px] h-[18px] text-ink-400" />
                            Saved Favourites
                          </button>
                        </>
                      )}

                      <div className="my-1.5 border-t border-surface-line" />

                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          dispatch(logout());
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-danger-500 hover:bg-danger-50 transition-colors"
                      >
                        <LogOut className="w-[18px] h-[18px]" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

          </div>
        </div>
      </header>

      {/* Address Picker Modal */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-panel shadow-overlay max-w-md w-full p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-ink-900 tracking-tight">Delivery address</h3>
                <p className="text-[13px] text-ink-500 mt-0.5">
                  Choose where this order should arrive.
                </p>
              </div>
              <button
                onClick={() => setIsLocationModalOpen(false)}
                aria-label="Close"
                className="p-1.5 -mr-1.5 rounded-lg text-ink-400 hover:text-ink-900 hover:bg-surface-sunken transition-colors"
              >
                <X className="w-[18px] h-[18px]" />
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {user?.addresses && user.addresses.length > 0 ? (
                user.addresses.map((addr) => {
                  const isSelected = selectedAddress?.id === addr.id;
                  return (
                    <button
                      key={addr.id}
                      onClick={() => {
                        dispatch(setSelectedAddress(addr));
                        setIsLocationModalOpen(false);
                      }}
                      className={`w-full p-3.5 rounded-control border text-left transition-colors flex items-start gap-3 ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50'
                          : 'border-surface-line hover:border-ink-400'
                      }`}
                    >
                      <MapPin
                        className={`w-[18px] h-[18px] mt-0.5 shrink-0 ${
                          isSelected ? 'text-brand-500' : 'text-ink-400'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-semibold text-ink-900 block">
                          {addr.title}
                        </span>
                        <span className="text-[13px] text-ink-500 block leading-snug">
                          {addr.street}, {addr.city}, {addr.state} {addr.zipCode}
                        </span>
                      </div>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-brand-500 mt-2 shrink-0" />
                      )}
                    </button>
                  );
                })
              ) : (
                <p className="text-[13px] text-ink-500 py-4 text-center">
                  No saved addresses yet.
                </p>
              )}
            </div>

            <button
              onClick={() => {
                setIsLocationModalOpen(false);
                onNavigate('profile');
              }}
              className="btn btn-secondary w-full mt-4"
            >
              Manage addresses
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </>
  );
};
