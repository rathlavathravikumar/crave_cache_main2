import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  Sparkles,
  Search,
  ShieldCheck,
  Bike,
  Clock,
  Star,
  ArrowRight,
  CheckCircle2,
  Smartphone,
  MapPin,
  Heart,
  ChevronRight,
  Store,
  LayoutDashboard,
  UserCheck,
  Zap,
  Award,
  Lock,
  Smile,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Restaurant, FoodItem } from '../types';
import { showToast } from '../utils/toast';
import { apiFetch } from '../utils/apiBase';

interface LandingPageProps {
  onOpenAuth: (role: 'customer' | 'owner' | 'admin', mode: 'login' | 'register') => void;
  onSelectRestaurant?: (restaurantId: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [trendingFoods, setTrendingFoods] = useState<FoodItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    // Fetch restaurants and foods for display
    apiFetch('/api/restaurants')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setRestaurants(data);
          // Set curated trending foods
          setTrendingFoods([
            {
              id: 'tf_1',
              restaurantId: 'rest_1',
              name: 'Woodfired Pepperoni Pizza',
              description: 'Classic Italian pepperoni with hot honey drizzle',
              price: 349,
              category: 'Pizza',
              image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=400&q=80',
              isAvailable: true,
              isVeg: false,
              rating: 4.8,
            },
            {
              id: 'tf_2',
              restaurantId: 'rest_2',
              name: 'Truffle Smash Burger',
              description: 'Double beef patty, aged cheddar, truffle mayo',
              price: 299,
              category: 'Burgers',
              image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80',
              isAvailable: true,
              isVeg: false,
              rating: 4.7,
            },
            {
              id: 'tf_3',
              restaurantId: 'rest_3',
              name: 'Avocado Quinoa Salad',
              description: 'Fresh organic greens, avocado, quinoa, lemon vinaigrette',
              price: 249,
              category: 'Healthy',
              image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80',
              isAvailable: true,
              isVeg: true,
              rating: 4.5,
            },
            {
              id: 'tf_4',
              restaurantId: 'rest_4',
              name: 'Spicy Kung Pao Noodles',
              description: 'Wok-tossed noodles with peanuts and scallions',
              price: 279,
              category: 'Chinese',
              image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400&q=80',
              isAvailable: true,
              isVeg: true,
              rating: 4.6,
            },
            {
              id: 'tf_5',
              restaurantId: 'rest_5',
              name: 'Butter Chicken & Naan',
              description: 'Tender tandoori chicken in rich creamy tomato gravy',
              price: 399,
              category: 'Indian',
              image: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=400&q=80',
              isAvailable: true,
              isVeg: false,
              rating: 4.9,
            },
            {
              id: 'tf_6',
              restaurantId: 'rest_6',
              name: 'Fresh Mango Smoothie',
              description: 'Alphonso mango blended with Greek yogurt and honey',
              price: 180,
              category: 'Drinks',
              image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=400&q=80',
              isAvailable: true,
              isVeg: true,
              rating: 4.4,
            },
          ]);
        }
      })
      .catch((err) => console.error('Failed to load landing data:', err));
  }, []);

  /* Photo tiles rather than emoji — see the same rail on HomePage. */
  const categories = [
    { label: 'All', image: 'photo-1504674900247-0877df9cc836' },
    { label: 'Pizza', image: 'photo-1513104890138-7c749659a591' },
    { label: 'Burgers', image: 'photo-1568901346375-23c9450c58cd' },
    { label: 'Healthy', image: 'photo-1512621776951-a57141f2eefd' },
    { label: 'Chinese', image: 'photo-1585032226651-759b368d7246' },
    { label: 'Indian', image: 'photo-1585937421612-70a008356fbe' },
    { label: 'Desserts', image: 'photo-1551024506-0bccd828d307' },
  ];

  return (
    <div className="min-h-screen bg-surface-sunken text-ink-900 selection:bg-brand-500 selection:text-white">
      
      {/* 1. PROFESSIONAL STICKY HEADER */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-surface-line/80 shadow-card">
        <div className="container-app h-20 flex items-center justify-between">
          
          {/* Logo. Scales down below sm: at full size the logo plus the action
              buttons are wider than a 320px viewport, which pushed the
              "Get Started" CTA off-screen entirely. `shrink-0` (not `min-w-0`)
              is deliberate — letting this box shrink just spills the wordmark
              under the buttons instead of keeping the row honest. */}
          <div className="flex items-center gap-2 sm:gap-2.5 cursor-pointer shrink-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 shrink-0 rounded-card bg-gradient-to-tr from-brand-500 to-accent-gold flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
              <UtensilsCrossed className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <span className="text-base sm:text-2xl font-bold tracking-tight text-ink-900 whitespace-nowrap">
                Crave<span className="text-brand-500">Cache</span>
              </span>
              <span className="hidden sm:block text-[12px] font-semibold tracking-widest uppercase text-ink-400">
                AI Food Platform
              </span>
            </div>
          </div>

          {/* Navigation Links. Held back to lg: at md the five links appeared
              while the action buttons were still full width, overflowing the
              header. */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-semibold text-ink-600">
            <a href="#home" className="hover:text-brand-500 transition-colors">Home</a>
            <a href="#restaurants" className="hover:text-brand-500 transition-colors">Restaurants</a>
            <a href="#features" className="hover:text-brand-500 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-brand-500 transition-colors">How It Works</a>
            <a href="#testimonials" className="hover:text-brand-500 transition-colors">Testimonials</a>
          </nav>

          {/* Action Buttons for 3 Roles. The owner/admin shortcuts wait for xl
              — at lg they shared the row with the nav links and overflowed. */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => onOpenAuth('owner', 'login')}
              className="hidden xl:flex items-center gap-1.5 py-2 px-3.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[13px] rounded-control transition-all border border-amber-200/60"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Owner Portal</span>
            </button>

            <button
              onClick={() => onOpenAuth('admin', 'login')}
              className="hidden xl:flex items-center gap-1.5 py-2 px-3.5 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-[13px] rounded-control transition-all border border-purple-200/60"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>

            {/* Hidden below sm: the logo plus both buttons cannot fit 320px.
                Sign-in stays reachable — the auth screen this CTA opens has an
                "Already have an account?" toggle. */}
            <button
              onClick={() => onOpenAuth('customer', 'login')}
              className="hidden sm:block py-2.5 px-4 text-ink-600 hover:text-ink-900 font-bold text-[13px] transition-colors whitespace-nowrap"
            >
              Sign In
            </button>

            <button
              onClick={() => onOpenAuth('customer', 'register')}
              className="py-2.5 px-3 sm:px-5 bg-brand-500 hover:bg-brand-700 text-white font-semibold text-[13px] rounded-control shadow-lg shadow-brand-500/25 transition-all flex items-center gap-2 whitespace-nowrap"
            >
              <span>Get Started</span>
              <ArrowRight className="hidden sm:block w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section id="home" className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32 bg-gradient-to-b from-brand-50/50 via-white to-surface-sunken">
        <div className="container-app">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7 space-y-6 text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-100 text-brand-700 text-[13px] font-semibold tracking-wide uppercase shadow-card">
                <Sparkles className="w-4 h-4 text-brand-500 animate-pulse" />
                <span>Lightning Fast Delivery in 30 Minutes</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-bold text-ink-900 tracking-tight leading-tight">
                Delicious Food <span className="text-brand-500">Delivered</span> to Your Doorstep
              </h1>

              <p className="text-base sm:text-lg text-ink-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Discover the best local restaurants, order your favorite meals, enjoy AI-powered food recommendations, and experience fast, secure delivery.
              </p>

              {/* Search Bar Quick Input */}
              <div className="bg-white p-2.5 rounded-card shadow-xl shadow-slate-200/70 border border-surface-line flex flex-col sm:flex-row items-center gap-2 max-w-xl mx-auto lg:mx-0">
                <div className="flex items-center gap-2 px-3 py-2 w-full bg-surface-sunken rounded-control">
                  <MapPin className="w-5 h-5 text-brand-500 shrink-0" />
                  <input
                    type="text"
                    placeholder="Enter delivery location (e.g. Springfield)"
                    className="w-full bg-transparent text-[13px] sm:text-sm font-medium text-ink-800 outline-none"
                  />
                </div>
                <button
                  onClick={() => onOpenAuth('customer', 'login')}
                  className="w-full sm:w-auto py-3 px-8 bg-brand-500 hover:bg-brand-700 text-white font-bold text-[13px] sm:text-sm rounded-control transition-all shadow-md shrink-0 flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  <span>Find Food</span>
                </button>
              </div>

              {/* Stats badges */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-surface-line/60 max-w-lg mx-auto lg:mx-0">
                <div>
                  <h4 className="text-2xl font-bold text-ink-900">500+</h4>
                  <p className="text-[13px] text-ink-500 font-medium">Partner Restaurants</p>
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-ink-900">30 min</h4>
                  <p className="text-[13px] text-ink-500 font-medium">Average Delivery</p>
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-ink-900">4.9 ★</h4>
                  <p className="text-[13px] text-ink-500 font-medium">User Rating</p>
                </div>
              </div>
            </motion.div>

            {/* Right Hero Image / Illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-5 relative"
            >
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="absolute -inset-1 rounded-panel bg-gradient-to-tr from-brand-500 to-accent-gold opacity-30 blur-2xl" />
                <div className="relative bg-white rounded-panel p-4 shadow-2xl border border-surface-line overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80"
                    alt="Delicious Food Spread"
                    className="rounded-card w-full h-[380px] object-cover"
                  />
                  <div className="absolute bottom-8 left-8 right-8 bg-white/95 backdrop-blur-md p-4 rounded-card shadow-lg border border-surface-line flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-control bg-brand-100 text-brand-500 flex items-center justify-center font-bold">
                        <Bike className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-ink-900">Express Delivery</p>
                        <p className="text-[13px] text-emerald-600 font-semibold">Live GPS Tracking Active</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-brand-50 text-brand-500 font-semibold text-[13px] rounded-full">
                      Free Delivery
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 3. SEARCH & CATEGORY CHIPS */}
      <section className="py-12 bg-white border-y border-surface-line/80">
        <div className="container-app">
          <div className="text-center max-w-xl mx-auto mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-ink-900">What's on your mind?</h2>
            <p className="text-[13px] sm:text-sm text-ink-500 mt-1">Explore top cuisines and categories</p>
          </div>

          <div className="flex items-start justify-start sm:justify-center gap-5 sm:gap-8 overflow-x-auto pb-2 no-scrollbar">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.label;
              return (
                <button
                  key={cat.label}
                  onClick={() => setActiveCategory(cat.label)}
                  aria-pressed={isActive}
                  className="group shrink-0 w-[88px] text-center"
                >
                  <div
                    className={`w-[88px] h-[88px] rounded-full overflow-hidden mb-2 transition-all ${
                      isActive
                        ? 'ring-2 ring-brand-500 ring-offset-2'
                        : 'ring-1 ring-surface-line group-hover:ring-ink-400'
                    }`}
                  >
                    <img
                      src={`https://images.unsplash.com/${cat.image}?auto=format&fit=crop&w=240&q=70`}
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <p
                    className={`text-[13px] font-semibold ${
                      isActive ? 'text-brand-600' : 'text-ink-900'
                    }`}
                  >
                    {cat.label}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. WHY CHOOSE CRAVECACHE */}
      <section id="features" className="py-20 bg-surface-sunken">
        <div className="container-app">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[13px] font-semibold uppercase tracking-wider text-brand-500 bg-brand-100 px-3.5 py-1 rounded-full">
              Why Choose Us
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-ink-900 mt-3 mb-4">
              Engineered for the Ultimate Food Experience
            </h2>
            <p className="text-sm text-ink-600">
              Everything you need to satisfy your cravings instantly, securely, and intelligently.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Sparkles className="w-6 h-6 text-brand-500" />,
                title: 'AI Food Ordering Assistant',
                desc: 'Chat with our intelligent AI agent to get personalized food pairings and build your cart instantly.',
              },
              {
                icon: <Bike className="w-6 h-6 text-amber-600" />,
                title: 'Lightning Fast Delivery',
                desc: 'Our delivery network ensures piping hot meals arrive at your doorstep in under 30 minutes.',
              },
              {
                icon: <ShieldCheck className="w-6 h-6 text-emerald-600" />,
                title: 'Secure Online Payments',
                desc: 'Integrated with Stripe for bulletproof payment security, instant refunds, and coupon savings.',
              },
              {
                icon: <Clock className="w-6 h-6 text-blue-600" />,
                title: 'Live Order Tracking',
                desc: 'Watch your delivery partner move in real-time on our interactive map from kitchen to door.',
              },
              {
                icon: <Award className="w-6 h-6 text-purple-600" />,
                title: 'Trusted Restaurants',
                desc: 'Handpicked local favorites, 5-star hygiene rated kitchens, and authentic culinary masters.',
              },
              {
                icon: <Smile className="w-6 h-6 text-rose-600" />,
                title: 'Personalized Recommendations',
                desc: 'Smart taste profiling adapts to your preferences, past orders, and dietary requirements.',
              },
            ].map((feat, idx) => (
              <div
                key={idx}
                className="bg-white rounded-panel p-8 shadow-xl shadow-slate-200/50 border border-surface-line hover:border-brand-100 transition-all hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-card bg-brand-50 flex items-center justify-center mb-6 shadow-inner">
                  {feat.icon}
                </div>
                <h3 className="text-lg font-bold text-ink-900 mb-2">{feat.title}</h3>
                <p className="text-[13px] text-ink-600 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. POPULAR RESTAURANTS */}
      <section id="restaurants" className="py-20 bg-white">
        <div className="container-app">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-[13px] font-semibold uppercase tracking-wider text-brand-500 bg-brand-100 px-3.5 py-1 rounded-full">
                Top Rated
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-ink-900 mt-3">Popular Restaurants Near You</h2>
            </div>
            <button
              onClick={() => onOpenAuth('customer', 'login')}
              className="text-[13px] font-bold text-brand-500 hover:underline flex items-center gap-1"
            >
              <span>View All Restaurants</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {restaurants.slice(0, 6).map((restaurant) => (
              <div
                key={restaurant.id}
                className="bg-white rounded-panel overflow-hidden border border-surface-line/80 shadow-md hover:shadow-xl transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={restaurant.image}
                      alt={restaurant.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-[13px] font-bold text-ink-900 shadow-md flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>{restaurant.rating}</span>
                    </div>
                    {restaurant.isVegOnly && (
                      <span className="absolute top-4 left-4 bg-emerald-600 text-white text-[12px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                        Pure Veg
                      </span>
                    )}
                  </div>

                  <div className="p-6 space-y-2">
                    <h3 className="text-lg font-bold text-ink-900">{restaurant.name}</h3>
                    <p className="text-[13px] text-ink-500 font-medium">{restaurant.cuisine.join(', ')}</p>
                    <div className="flex items-center justify-between text-[13px] font-bold text-ink-600 pt-2 border-t border-surface-line">
                      <span className="flex items-center gap-1 text-ink-600">
                        <Clock className="w-3.5 h-3.5 text-brand-500" /> {restaurant.deliveryTimeMinutes} mins
                      </span>
                      <span className="text-ink-900 font-semibold">{restaurant.costTier}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0">
                  <button
                    onClick={() => onOpenAuth('customer', 'login')}
                    className="w-full py-3 bg-slate-900 hover:bg-brand-500 text-white font-bold text-[13px] rounded-card transition-colors shadow-card flex items-center justify-center gap-2"
                  >
                    <span>View Menu & Order</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. TRENDING FOOD */}
      <section className="py-20 bg-surface-sunken">
        <div className="container-app">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[13px] font-semibold uppercase tracking-wider text-brand-500 bg-brand-100 px-3.5 py-1 rounded-full">
              Crave Favorites
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-ink-900 mt-3 mb-4">Trending Food Items</h2>
            <p className="text-sm text-ink-600">Most ordered dishes by food lovers this week.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {trendingFoods.slice(0, 6).map((food, idx) => (
              <div
                key={idx}
                className="bg-white rounded-panel p-5 border border-surface-line/80 shadow-md hover:shadow-xl transition-all flex gap-4 items-center"
              >
                <img
                  src={food.image}
                  alt={food.name}
                  className="w-24 h-24 rounded-card object-cover shrink-0 shadow-sm"
                />
                <div className="space-y-1.5 flex-1">
                  <span className="text-[12px] font-semibold text-brand-500 uppercase tracking-wider bg-brand-50 px-2 py-0.5 rounded-md">
                    {food.category}
                  </span>
                  <h4 className="font-semibold text-ink-900 text-sm line-clamp-1">{food.name}</h4>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-ink-900 text-sm">₹{food.price}</span>
                    <button
                      onClick={() => onOpenAuth('customer', 'login')}
                      className="py-1.5 px-3 bg-brand-50 hover:bg-brand-500 text-brand-500 hover:text-white font-bold text-[13px] rounded-control transition-all"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. HOW IT WORKS */}
      <section id="how-it-works" className="py-20 bg-white border-y border-surface-line/80">
        <div className="container-app">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[13px] font-semibold uppercase tracking-wider text-brand-500 bg-brand-100 px-3.5 py-1 rounded-full">
              Simple 5-Step Process
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-ink-900 mt-3 mb-4">How CraveCache Works</h2>
            <p className="text-sm text-ink-600">From craving to doorstep in minutes.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              { step: '01', title: 'Choose Restaurant', desc: 'Browse top-rated local spots.' },
              { step: '02', title: 'Select Food', desc: 'Pick your favorite meals & customize.' },
              { step: '03', title: 'Secure Payment', desc: 'Pay safely via Stripe or apply coupons.' },
              { step: '04', title: 'Live Tracking', desc: 'Watch your delivery partner in real-time.' },
              { step: '05', title: 'Enjoy Meal', desc: 'Dig in and rate your experience!' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-surface-sunken rounded-panel p-6 border border-surface-line/80 text-center relative hover:bg-brand-50/50 transition-all"
              >
                <div className="w-12 h-12 rounded-card bg-brand-500 text-white font-bold text-base flex items-center justify-center mx-auto mb-4 shadow-md shadow-brand-500/25">
                  {item.step}
                </div>
                <h4 className="font-semibold text-ink-900 text-sm mb-1">{item.title}</h4>
                <p className="text-[13px] text-ink-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. AI FEATURES SECTION */}
      <section className="py-20 bg-gradient-to-tr from-slate-900 to-slate-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,107,53,0.15),transparent_50%)]" />
        <div className="container-app relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/20 text-accent-gold text-[13px] font-semibold tracking-wide uppercase border border-brand-500/30">
                <Zap className="w-4 h-4 text-accent-gold" />
                <span>Powered by Advanced AI</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight">
                Meet Your Personal <span className="text-brand-500">AI Food Assistant</span>
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Too lazy to browse menus? Simply type what you're craving in natural language. Our AI agent instantly understands your taste, checks restaurant availability, applies discount coupons, and builds your cart.
              </p>
              <div className="p-4 bg-slate-800/80 rounded-card border border-slate-700/80 font-mono text-[13px] text-brand-200">
                "I want a spicy pepperoni pizza under ₹400 with extra cheese from Pizza Maestro."
              </div>
              <button
                onClick={() => onOpenAuth('customer', 'login')}
                className="py-3 px-8 bg-brand-500 hover:bg-brand-700 text-white font-semibold text-[13px] sm:text-sm rounded-control shadow-lg shadow-brand-500/30 transition-all inline-flex items-center gap-2"
              >
                <span>Try AI Assistant Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="lg:col-span-6 bg-slate-800/90 rounded-panel p-8 border border-slate-700 shadow-2xl space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-700 pb-4">
                <div className="w-10 h-10 rounded-control bg-brand-500 text-white flex items-center justify-center font-bold">
                  🤖
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">CraveCache AI Concierge</h4>
                  <p className="text-[13px] text-emerald-400 font-semibold">Online & Ready to Order</p>
                </div>
              </div>

              <div className="space-y-4 text-[13px]">
                <div className="bg-slate-700/60 p-3.5 rounded-card max-w-[85%] text-slate-200">
                  Hi Alex! What are you craving today? I can find top dishes or build your custom meal combo.
                </div>
                <div className="bg-brand-500/20 border border-brand-500/40 p-3.5 rounded-card max-w-[85%] ml-auto text-brand-100 font-medium">
                  Find me a healthy salad and fresh juice under ₹500.
                </div>
                <div className="bg-slate-700/60 p-3.5 rounded-card max-w-[85%] text-slate-200 space-y-2">
                  <p className="font-bold text-white">Found 2 perfect matches:</p>
                  <p>1. Caesar Green Salad (₹320) + Orange Zest Juice (₹140)</p>
                  <span className="inline-block px-2 py-1 bg-emerald-500/20 text-emerald-300 font-bold rounded-lg text-[12px]">
                    Coupon CRAVE50 Applied (-₹50)
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 9. CUSTOMER TESTIMONIALS */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="container-app">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[13px] font-semibold uppercase tracking-wider text-brand-500 bg-brand-100 px-3.5 py-1 rounded-full">
              Testimonials
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-ink-900 mt-3 mb-4">Loved by 50,000+ Foodies</h2>
            <p className="text-sm text-ink-600">See what our community has to say about CraveCache.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Sarah Jenkins',
                role: 'Verified Customer',
                comment: 'The AI food assistant is an absolute game-changer! Ordered dinner in less than 10 seconds and it arrived piping hot.',
                rating: 5,
                avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
              },
              {
                name: 'David Miller',
                role: 'Food Blogger',
                comment: 'Fastest delivery in town and the live GPS order tracking is super accurate. CraveCache is my go-to food app.',
                rating: 5,
                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
              },
              {
                name: 'Priya Sharma',
                role: 'Regular Customer',
                comment: 'Amazing discount coupons and stellar restaurant variety. The checkout with Stripe is effortless!',
                rating: 5,
                avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
              },
            ].map((testi, idx) => (
              <div
                key={idx}
                className="bg-surface-sunken rounded-panel p-8 border border-surface-line/80 shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-4 h-4 text-amber-500 fill-amber-500" />
                    ))}
                  </div>
                  <p className="text-[13px] sm:text-sm text-ink-600 italic leading-relaxed">"{testi.comment}"</p>
                </div>

                <div className="flex items-center gap-3 pt-6 mt-6 border-t border-surface-line/60">
                  <img
                    src={testi.avatar}
                    alt={testi.name}
                    className="w-12 h-12 rounded-full object-cover shadow-card"
                  />
                  <div>
                    <h4 className="font-bold text-ink-900 text-[13px] sm:text-sm">{testi.name}</h4>
                    <p className="text-[13px] text-ink-500">{testi.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. DOWNLOAD APP SECTION */}
      <section className="py-16 bg-brand-50 border-y border-brand-100/60">
        <div className="container-app text-center max-w-3xl space-y-6">
          <div className="w-14 h-14 rounded-card bg-brand-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-brand-500/25">
            <Smartphone className="w-7 h-7" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-ink-900">Experience CraveCache on the Go</h2>
          <p className="text-sm text-ink-600 leading-relaxed">
            Download our mobile app for exclusive discounts, push notification order updates, and lightning-fast one-tap reordering.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => showToast.info('App Store download link coming soon!')}
              className="py-3 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[13px] rounded-card shadow-md transition-all flex items-center gap-2"
            >
              <span>🍎 Download on App Store</span>
            </button>
            <button
              onClick={() => showToast.info('Google Play download link coming soon!')}
              className="py-3 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[13px] rounded-card shadow-md transition-all flex items-center gap-2"
            >
              <span>🤖 Get it on Google Play</span>
            </button>
          </div>
        </div>
      </section>

      {/* 11. PROFESSIONAL FOOTER */}
      <footer className="bg-slate-900 text-ink-400 text-[13px] border-t border-slate-800 py-16">
        <div className="container-app grid grid-cols-1 md:grid-cols-4 gap-10">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-control bg-brand-500 flex items-center justify-center text-white font-bold">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white">CraveCache</span>
            </div>
            <p className="text-ink-400 leading-relaxed">
              Next-generation multi-role food ordering platform with strict role isolation & AI food curation.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white text-[13px] uppercase tracking-wider mb-4">Company</h4>
            <ul className="space-y-2.5">
              <li><a href="#home" className="hover:text-brand-300 transition-colors">About Us</a></li>
              <li><a href="#home" className="hover:text-brand-300 transition-colors">Careers</a></li>
              <li><a href="#home" className="hover:text-brand-300 transition-colors">Press & Media</a></li>
              <li><a href="#home" className="hover:text-brand-300 transition-colors">Blog</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white text-[13px] uppercase tracking-wider mb-4">Legal & Support</h4>
            <ul className="space-y-2.5">
              <li><a href="#home" className="hover:text-brand-300 transition-colors">Privacy Policy</a></li>
              <li><a href="#home" className="hover:text-brand-300 transition-colors">Terms & Conditions</a></li>
              <li><a href="#home" className="hover:text-brand-300 transition-colors">Cookie Policy</a></li>
              <li><a href="#home" className="hover:text-brand-300 transition-colors">Contact Support</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white text-[13px] uppercase tracking-wider mb-4">Independent Portals</h4>
            <ul className="space-y-2.5">
              <li>
                <button onClick={() => onOpenAuth('customer', 'login')} className="hover:text-brand-300 transition-colors">
                  Customer Sign In
                </button>
              </li>
              <li>
                <button onClick={() => onOpenAuth('owner', 'login')} className="hover:text-brand-300 transition-colors">
                  Restaurant Owner Portal
                </button>
              </li>
              <li>
                <button onClick={() => onOpenAuth('admin', 'login')} className="hover:text-brand-300 transition-colors">
                  Super Admin Center
                </button>
              </li>
            </ul>
          </div>

        </div>

        <div className="container-app border-t border-slate-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-ink-500">
          <p>© 2026 CraveCache Technologies Inc. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-white cursor-pointer">Twitter</span>
            <span className="hover:text-white cursor-pointer">Instagram</span>
            <span className="hover:text-white cursor-pointer">LinkedIn</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
