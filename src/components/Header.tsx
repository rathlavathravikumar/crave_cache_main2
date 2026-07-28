import React, { useState } from 'react';
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
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks/reduxHooks';
import { logout, setSelectedAddress } from '../store/slices/authSlice';
import { toggleCartDrawer } from '../store/slices/cartSlice';
import { toggleAIAssistant } from '../store/slices/aiSlice';
import { setSearchQuery, fetchRestaurants } from '../store/slices/restaurantSlice';
import { AuthModal } from './AuthModal';

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

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const wishlistTotal = wishlistRestaurantIds.length + wishlistFoodIds.length;

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
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-4">
            
            {/* Logo & Location */}
            <div className="flex items-center gap-6">
              <button
                onClick={() => onNavigate('home')}
                className="flex items-center gap-2.5 text-left group focus:outline-none"
              >
                <div className="w-10 h-10 rounded-xl bg-[#FF5200] flex items-center justify-center text-white font-black shadow-md shadow-[#FF5200]/20 group-hover:scale-105 transition-transform">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-xl font-black tracking-tight text-[#1F2937] group-hover:text-[#FF5200] transition-colors">
                      Crave<span className="text-[#FF5200]">Cache</span>
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-[#FF5200] tracking-wider uppercase block -mt-0.5">
                    AI Food Engine
                  </span>
                </div>
              </button>

              {/* Location Picker */}
              <button
                onClick={() => setIsLocationModalOpen(true)}
                className="hidden md:flex items-center gap-2 py-2 px-3.5 rounded-xl bg-[#F3F4F6] hover:bg-slate-200/70 border border-[#E5E7EB] transition-colors text-left"
              >
                <MapPin className="w-4 h-4 text-[#FF5200] shrink-0" />
                <div className="text-xs max-w-[160px] truncate">
                  <span className="font-bold text-[#1F2937] block truncate">
                    {selectedAddress?.title || 'Deliver To'}
                  </span>
                  <span className="text-slate-500 truncate block">
                    {selectedAddress ? `${selectedAddress.street}, ${selectedAddress.city}` : 'Select Address'}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
              </button>
            </div>

            {/* Global Search Bar */}
            <div className="hidden lg:flex flex-1 max-w-md items-center relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search restaurants, cuisines, dishes..."
                className="w-full pl-10 pr-4 py-2 text-xs font-medium bg-[#F3F4F6] hover:bg-slate-100/90 focus:bg-white border border-[#E5E7EB] rounded-xl focus:ring-2 focus:ring-[#FF5200]/20 focus:border-[#FF5200] outline-none transition-all"
              />
            </div>

            {/* Right Action Icons */}
            <div className="flex items-center gap-2 sm:gap-3">
              
              {/* AI Food Assistant Trigger */}
              <button
                onClick={() => dispatch(toggleAIAssistant(true))}
                className="flex items-center gap-2 py-2 px-3.5 rounded-xl bg-[#FF5200] hover:bg-[#e04800] text-white text-xs font-bold shadow-md shadow-[#FF5200]/20 hover:scale-105 active:scale-95 transition-all"
              >
                <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" />
                <span className="hidden sm:inline">AI Assistant</span>
              </button>

              {/* Wishlist */}
              <button
                onClick={() => onNavigate('wishlist')}
                className="relative p-2.5 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Wishlist"
              >
                <Heart className="w-5 h-5" />
                {wishlistTotal > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                    {wishlistTotal}
                  </span>
                )}
              </button>

              {/* Cart Drawer Toggle */}
              <button
                onClick={() => dispatch(toggleCartDrawer(true))}
                className="relative flex items-center gap-2 py-2 px-3.5 rounded-xl bg-[#FFF5F0] hover:bg-orange-100/80 text-[#FF5200] border border-orange-200/80 font-bold text-xs transition-colors"
              >
                <ShoppingBag className="w-4 h-4 text-[#FF5200]" />
                <span className="hidden sm:inline">Cart</span>
                <span className="px-2 py-0.5 rounded-full bg-[#FF5200] text-white text-[11px] font-extrabold ml-0.5">
                  {totalCartCount}
                </span>
              </button>

              {/* User Account / Profile Menu */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
                  >
                    <img
                      src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                      alt={user?.name}
                      className="w-8 h-8 rounded-lg object-cover ring-2 ring-orange-500/20"
                    />
                    <div className="hidden md:block text-left text-xs">
                      <span className="font-bold text-slate-800 block leading-tight">{user?.name}</span>
                      <span className="text-[10px] text-slate-500 capitalize">{user?.role}</span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileMenuOpen && (
                    <div
                      onMouseLeave={() => setIsProfileMenuOpen(false)}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-fadeIn"
                    >
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-900">{user?.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                        {user?.role === 'admin' && (
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-extrabold">
                            ADMIN ACCESS
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
                            className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <Clock className="w-4 h-4 text-slate-500" />
                            My Orders
                          </button>

                          <button
                            onClick={() => {
                              setIsProfileMenuOpen(false);
                              onNavigate('profile');
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <UserIcon className="w-4 h-4 text-slate-500" />
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
                          className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#FF5200] hover:bg-orange-50 transition-colors"
                        >
                          <Store className="w-4 h-4 text-[#FF5200]" />
                          Restaurant Owner Portal
                        </button>
                      )}

                      {user?.role === 'admin' && (
                        <button
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            onNavigate('admin');
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-50 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-purple-600" />
                          Admin Dashboard
                        </button>
                      )}

                      <div className="my-1 border-t border-slate-100" />

                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          dispatch(logout());
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-sm"
                >
                  Sign In
                </button>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Address Picker Modal */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-600" /> Select Delivery Address
              </h3>
              <button
                onClick={() => setIsLocationModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {user?.addresses && user.addresses.length > 0 ? (
                user.addresses.map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => {
                      dispatch(setSelectedAddress(addr));
                      setIsLocationModalOpen(false);
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      selectedAddress?.id === addr.id
                        ? 'border-orange-500 bg-orange-50/50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">{addr.title}</span>
                      <span className="text-xs text-slate-600">
                        {addr.street}, {addr.city}, {addr.state} {addr.zipCode}
                      </span>
                    </div>
                    {selectedAddress?.id === addr.id && (
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-600" />
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">No saved addresses. Sign in or edit profile to add one.</p>
              )}
            </div>

            <button
              onClick={() => {
                setIsLocationModalOpen(false);
                onNavigate('profile');
              }}
              className="mt-4 w-full py-2 text-xs font-semibold text-orange-600 hover:bg-orange-50 rounded-xl transition-colors text-center block"
            >
              + Manage Saved Addresses in Profile
            </button>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
};
