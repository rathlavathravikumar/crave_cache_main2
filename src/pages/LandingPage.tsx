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
    fetch('/api/restaurants')
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

  const categories = [
    { label: 'All', icon: '🍽️' },
    { label: 'Pizza', icon: '🍕' },
    { label: 'Burgers', icon: '🍔' },
    { label: 'Healthy', icon: '🥗' },
    { label: 'Chinese', icon: '🍜' },
    { label: 'Indian', icon: '🍛' },
    { label: 'Drinks', icon: '🥤' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-[#FF6B35] selection:text-white">
      
      {/* 1. PROFESSIONAL STICKY HEADER */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#FF6B35] to-[#FFD166] flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-slate-900">
                Crave<span className="text-[#FF6B35]">Cache</span>
              </span>
              <span className="block text-[10px] font-extrabold tracking-widest uppercase text-slate-400">
                AI Food Platform
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#home" className="hover:text-[#FF6B35] transition-colors">Home</a>
            <a href="#restaurants" className="hover:text-[#FF6B35] transition-colors">Restaurants</a>
            <a href="#features" className="hover:text-[#FF6B35] transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-[#FF6B35] transition-colors">How It Works</a>
            <a href="#testimonials" className="hover:text-[#FF6B35] transition-colors">Testimonials</a>
          </nav>

          {/* Action Buttons for 3 Roles */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenAuth('owner', 'login')}
              className="hidden lg:flex items-center gap-1.5 py-2 px-3.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl transition-all border border-amber-200/60"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Owner Portal</span>
            </button>

            <button
              onClick={() => onOpenAuth('admin', 'login')}
              className="hidden lg:flex items-center gap-1.5 py-2 px-3.5 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs rounded-xl transition-all border border-purple-200/60"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>

            <button
              onClick={() => onOpenAuth('customer', 'login')}
              className="py-2.5 px-4 text-slate-700 hover:text-slate-900 font-bold text-xs transition-colors"
            >
              Sign In
            </button>

            <button
              onClick={() => onOpenAuth('customer', 'register')}
              className="py-2.5 px-5 bg-[#FF6B35] hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-orange-500/25 transition-all flex items-center gap-2"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section id="home" className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32 bg-gradient-to-b from-orange-50/50 via-white to-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7 space-y-6 text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-orange-800 text-xs font-extrabold tracking-wide uppercase shadow-xs">
                <Sparkles className="w-4 h-4 text-[#FF6B35] animate-pulse" />
                <span>Lightning Fast Delivery in 30 Minutes</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight">
                Delicious Food <span className="text-[#FF6B35]">Delivered</span> to Your Doorstep
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Discover the best local restaurants, order your favorite meals, enjoy AI-powered food recommendations, and experience fast, secure delivery.
              </p>

              {/* Search Bar Quick Input */}
              <div className="bg-white p-2.5 rounded-2xl shadow-xl shadow-slate-200/70 border border-slate-200 flex flex-col sm:flex-row items-center gap-2 max-w-xl mx-auto lg:mx-0">
                <div className="flex items-center gap-2 px-3 py-2 w-full bg-slate-50 rounded-xl">
                  <MapPin className="w-5 h-5 text-[#FF6B35] shrink-0" />
                  <input
                    type="text"
                    placeholder="Enter delivery location (e.g. Springfield)"
                    className="w-full bg-transparent text-xs sm:text-sm font-medium text-slate-800 outline-none"
                  />
                </div>
                <button
                  onClick={() => onOpenAuth('customer', 'login')}
                  className="w-full sm:w-auto py-3 px-8 bg-[#FF6B35] hover:bg-orange-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shrink-0 flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  <span>Find Food</span>
                </button>
              </div>

              {/* Stats badges */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-200/60 max-w-lg mx-auto lg:mx-0">
                <div>
                  <h4 className="text-2xl font-black text-slate-900">500+</h4>
                  <p className="text-xs text-slate-500 font-medium">Partner Restaurants</p>
                </div>
                <div>
                  <h4 className="text-2xl font-black text-slate-900">30 min</h4>
                  <p className="text-xs text-slate-500 font-medium">Average Delivery</p>
                </div>
                <div>
                  <h4 className="text-2xl font-black text-slate-900">4.9 ★</h4>
                  <p className="text-xs text-slate-500 font-medium">User Rating</p>
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
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-[#FF6B35] to-[#FFD166] opacity-30 blur-2xl" />
                <div className="relative bg-white rounded-3xl p-4 shadow-2xl border border-slate-100 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80"
                    alt="Delicious Food Spread"
                    className="rounded-2xl w-full h-[380px] object-cover"
                  />
                  <div className="absolute bottom-8 left-8 right-8 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-orange-100 text-[#FF6B35] flex items-center justify-center font-bold">
                        <Bike className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Express Delivery</p>
                        <p className="text-[11px] text-emerald-600 font-semibold">Live GPS Tracking Active</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-orange-50 text-[#FF6B35] font-extrabold text-xs rounded-full">
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
      <section className="py-12 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">What's on your mind?</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Explore top cuisines and categories</p>
          </div>

          <div className="flex items-center justify-center gap-3 overflow-x-auto pb-4 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.label}
                onClick={() => setActiveCategory(cat.label)}
                className={`flex items-center gap-2 py-3 px-6 rounded-2xl font-bold text-xs sm:text-sm transition-all shrink-0 ${
                  activeCategory === cat.label
                    ? 'bg-[#FF6B35] text-white shadow-lg shadow-orange-500/25 scale-105'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span className="text-base">{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 4. WHY CHOOSE CRAVECACHE */}
      <section id="features" className="py-20 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#FF6B35] bg-orange-100 px-3.5 py-1 rounded-full">
              Why Choose Us
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-3 mb-4">
              Engineered for the Ultimate Food Experience
            </h2>
            <p className="text-sm text-slate-600">
              Everything you need to satisfy your cravings instantly, securely, and intelligently.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Sparkles className="w-6 h-6 text-[#FF6B35]" />,
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
                className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 hover:border-orange-200 transition-all hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center mb-6 shadow-inner">
                  {feat.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{feat.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. POPULAR RESTAURANTS */}
      <section id="restaurants" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#FF6B35] bg-orange-100 px-3.5 py-1 rounded-full">
                Top Rated
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-3">Popular Restaurants Near You</h2>
            </div>
            <button
              onClick={() => onOpenAuth('customer', 'login')}
              className="text-xs font-bold text-[#FF6B35] hover:underline flex items-center gap-1"
            >
              <span>View All Restaurants</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {restaurants.slice(0, 6).map((restaurant) => (
              <div
                key={restaurant.id}
                className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-md hover:shadow-xl transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={restaurant.image}
                      alt={restaurant.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black text-slate-900 shadow-md flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>{restaurant.rating}</span>
                    </div>
                    {restaurant.isVegOnly && (
                      <span className="absolute top-4 left-4 bg-emerald-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                        Pure Veg
                      </span>
                    )}
                  </div>

                  <div className="p-6 space-y-2">
                    <h3 className="text-lg font-black text-slate-900">{restaurant.name}</h3>
                    <p className="text-xs text-slate-500 font-medium">{restaurant.cuisine.join(', ')}</p>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 pt-2 border-t border-slate-100">
                      <span className="flex items-center gap-1 text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-[#FF6B35]" /> {restaurant.deliveryTimeMinutes} mins
                      </span>
                      <span className="text-slate-900 font-extrabold">{restaurant.costTier}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0">
                  <button
                    onClick={() => onOpenAuth('customer', 'login')}
                    className="w-full py-3 bg-slate-900 hover:bg-[#FF6B35] text-white font-bold text-xs rounded-2xl transition-colors shadow-xs flex items-center justify-center gap-2"
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
      <section className="py-20 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#FF6B35] bg-orange-100 px-3.5 py-1 rounded-full">
              Crave Favorites
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-3 mb-4">Trending Food Items</h2>
            <p className="text-sm text-slate-600">Most ordered dishes by food lovers this week.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {trendingFoods.slice(0, 6).map((food, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-md hover:shadow-xl transition-all flex gap-4 items-center"
              >
                <img
                  src={food.image}
                  alt={food.name}
                  className="w-24 h-24 rounded-2xl object-cover shrink-0 shadow-sm"
                />
                <div className="space-y-1.5 flex-1">
                  <span className="text-[10px] font-extrabold text-[#FF6B35] uppercase tracking-wider bg-orange-50 px-2 py-0.5 rounded-md">
                    {food.category}
                  </span>
                  <h4 className="font-extrabold text-slate-900 text-sm line-clamp-1">{food.name}</h4>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900 text-sm">₹{food.price}</span>
                    <button
                      onClick={() => onOpenAuth('customer', 'login')}
                      className="py-1.5 px-3 bg-orange-50 hover:bg-[#FF6B35] text-[#FF6B35] hover:text-white font-bold text-xs rounded-xl transition-all"
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
      <section id="how-it-works" className="py-20 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#FF6B35] bg-orange-100 px-3.5 py-1 rounded-full">
              Simple 5-Step Process
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-3 mb-4">How CraveCache Works</h2>
            <p className="text-sm text-slate-600">From craving to doorstep in minutes.</p>
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
                className="bg-[#F8FAFC] rounded-3xl p-6 border border-slate-200/80 text-center relative hover:bg-orange-50/50 transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#FF6B35] text-white font-black text-base flex items-center justify-center mx-auto mb-4 shadow-md shadow-orange-500/25">
                  {item.step}
                </div>
                <h4 className="font-extrabold text-slate-900 text-sm mb-1">{item.title}</h4>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. AI FEATURES SECTION */}
      <section className="py-20 bg-gradient-to-tr from-slate-900 to-slate-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,107,53,0.15),transparent_50%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/20 text-[#FFD166] text-xs font-extrabold tracking-wide uppercase border border-orange-500/30">
                <Zap className="w-4 h-4 text-[#FFD166]" />
                <span>Powered by Advanced AI</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                Meet Your Personal <span className="text-[#FF6B35]">AI Food Assistant</span>
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Too lazy to browse menus? Simply type what you're craving in natural language. Our AI agent instantly understands your taste, checks restaurant availability, applies discount coupons, and builds your cart.
              </p>
              <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80 font-mono text-xs text-orange-300">
                "I want a spicy pepperoni pizza under ₹400 with extra cheese from Pizza Maestro."
              </div>
              <button
                onClick={() => onOpenAuth('customer', 'login')}
                className="py-3 px-8 bg-[#FF6B35] hover:bg-orange-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-orange-500/30 transition-all inline-flex items-center gap-2"
              >
                <span>Try AI Assistant Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="lg:col-span-6 bg-slate-800/90 rounded-3xl p-8 border border-slate-700 shadow-2xl space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-700 pb-4">
                <div className="w-10 h-10 rounded-xl bg-[#FF6B35] text-white flex items-center justify-center font-bold">
                  🤖
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">CraveCache AI Concierge</h4>
                  <p className="text-[11px] text-emerald-400 font-semibold">Online & Ready to Order</p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div className="bg-slate-700/60 p-3.5 rounded-2xl max-w-[85%] text-slate-200">
                  Hi Alex! What are you craving today? I can find top dishes or build your custom meal combo.
                </div>
                <div className="bg-[#FF6B35]/20 border border-[#FF6B35]/40 p-3.5 rounded-2xl max-w-[85%] ml-auto text-orange-200 font-medium">
                  Find me a healthy salad and fresh juice under ₹500.
                </div>
                <div className="bg-slate-700/60 p-3.5 rounded-2xl max-w-[85%] text-slate-200 space-y-2">
                  <p className="font-bold text-white">Found 2 perfect matches:</p>
                  <p>1. Caesar Green Salad (₹320) + Orange Zest Juice (₹140)</p>
                  <span className="inline-block px-2 py-1 bg-emerald-500/20 text-emerald-300 font-bold rounded-lg text-[10px]">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#FF6B35] bg-orange-100 px-3.5 py-1 rounded-full">
              Testimonials
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-3 mb-4">Loved by 50,000+ Foodies</h2>
            <p className="text-sm text-slate-600">See what our community has to say about CraveCache.</p>
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
                className="bg-[#F8FAFC] rounded-3xl p-8 border border-slate-200/80 shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-4 h-4 text-amber-500 fill-amber-500" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed">"{testi.comment}"</p>
                </div>

                <div className="flex items-center gap-3 pt-6 mt-6 border-t border-slate-200/60">
                  <img
                    src={testi.avatar}
                    alt={testi.name}
                    className="w-12 h-12 rounded-full object-cover shadow-xs"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{testi.name}</h4>
                    <p className="text-[11px] text-slate-500">{testi.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. DOWNLOAD APP SECTION */}
      <section className="py-16 bg-orange-50 border-y border-orange-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-[#FF6B35] text-white flex items-center justify-center mx-auto shadow-lg shadow-orange-500/25">
            <Smartphone className="w-7 h-7" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900">Experience CraveCache on the Go</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Download our mobile app for exclusive discounts, push notification order updates, and lightning-fast one-tap reordering.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => showToast.info('App Store download link coming soon!')}
              className="py-3 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl shadow-md transition-all flex items-center gap-2"
            >
              <span>🍎 Download on App Store</span>
            </button>
            <button
              onClick={() => showToast.info('Google Play download link coming soon!')}
              className="py-3 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl shadow-md transition-all flex items-center gap-2"
            >
              <span>🤖 Get it on Google Play</span>
            </button>
          </div>
        </div>
      </section>

      {/* 11. PROFESSIONAL FOOTER */}
      <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-[#FF6B35] flex items-center justify-center text-white font-bold">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <span className="text-xl font-black text-white">CraveCache</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Next-generation multi-role food ordering platform with strict role isolation & AI food curation.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-4">Company</h4>
            <ul className="space-y-2.5">
              <li><a href="#home" className="hover:text-orange-400 transition-colors">About Us</a></li>
              <li><a href="#home" className="hover:text-orange-400 transition-colors">Careers</a></li>
              <li><a href="#home" className="hover:text-orange-400 transition-colors">Press & Media</a></li>
              <li><a href="#home" className="hover:text-orange-400 transition-colors">Blog</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-4">Legal & Support</h4>
            <ul className="space-y-2.5">
              <li><a href="#home" className="hover:text-orange-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#home" className="hover:text-orange-400 transition-colors">Terms & Conditions</a></li>
              <li><a href="#home" className="hover:text-orange-400 transition-colors">Cookie Policy</a></li>
              <li><a href="#home" className="hover:text-orange-400 transition-colors">Contact Support</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-4">Independent Portals</h4>
            <ul className="space-y-2.5">
              <li>
                <button onClick={() => onOpenAuth('customer', 'login')} className="hover:text-orange-400 transition-colors">
                  Customer Sign In
                </button>
              </li>
              <li>
                <button onClick={() => onOpenAuth('owner', 'login')} className="hover:text-orange-400 transition-colors">
                  Restaurant Owner Portal
                </button>
              </li>
              <li>
                <button onClick={() => onOpenAuth('admin', 'login')} className="hover:text-orange-400 transition-colors">
                  Super Admin Center
                </button>
              </li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
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
