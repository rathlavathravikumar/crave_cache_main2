import React, { useEffect, useState } from 'react';
import {
  Search,
  Sparkles,
  Flame,
  Star,
  Clock,
  Filter,
  ArrowRight,
  TrendingUp,
  Award,
  UtensilsCrossed,
  Tag,
  ChevronRight,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks/reduxHooks';
import {
  fetchRestaurants,
  setSelectedCuisine,
  setIsVegOnly,
  setMaxDeliveryTime,
  setSortBy,
} from '../store/slices/restaurantSlice';
import { fetchAllFoods } from '../store/slices/foodSlice';
import { toggleAIAssistant } from '../store/slices/aiSlice';
import { RestaurantCard } from '../components/RestaurantCard';
import { FoodCard } from '../components/FoodCard';
import { AIRecommendationEngine } from '../components/AIRecommendationEngine';

interface HomePageProps {
  onSelectRestaurant: (restaurantId: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onSelectRestaurant }) => {
  const dispatch = useAppDispatch();
  const {
    restaurants,
    loading: restLoading,
    selectedCuisine,
    isVegOnly,
    sortBy,
  } = useAppSelector((state) => state.restaurants);

  const { allFoods, loading: foodLoading } = useAppSelector((state) => state.food);

  useEffect(() => {
    dispatch(fetchRestaurants());
    dispatch(fetchAllFoods());
  }, [dispatch]);

  const categories = [
    { name: 'All', icon: '🍽️' },
    { name: 'Italian', icon: '🍕' },
    { name: 'Burgers', icon: '🍔' },
    { name: 'Indian', icon: '🍛' },
    { name: 'Japanese', icon: '🍣' },
    { name: 'Healthy', icon: '🥗' },
    { name: 'Mexican', icon: '🌮' },
    { name: 'Desserts', icon: '🍰' },
  ];

  const filteredRestaurants = restaurants.filter((r) => {
    if (selectedCuisine !== 'All' && !r.cuisine.includes(selectedCuisine)) return false;
    if (isVegOnly && !r.isVegOnly) return false;
    return true;
  });

  return (
    <div className="space-y-10 pb-16">
      
      {/* Hero AI Banner Section */}
      <section className="relative overflow-hidden rounded-[20px] ai-gradient-banner text-white shadow-xl border border-slate-800 p-8 sm:p-10">
        
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=80"
            alt="Hero Feast"
            className="w-full h-full object-cover opacity-20 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#111827] via-[#111827]/90 to-transparent" />
        </div>

        <div className="relative z-10 max-w-2xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-white text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-[#FF5200]" />
            <span>✨ AI POWERED AGENT</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight">
            What are you craving today?
          </h1>

          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 text-xs text-slate-300 font-mono italic max-w-lg">
            "Find me a spicy vegetarian pizza under ₹350 with fast delivery"
          </div>

          {/* AI Trigger Big Button */}
          <div className="pt-1 flex flex-wrap items-center gap-4">
            <button
              onClick={() => dispatch(toggleAIAssistant(true))}
              className="py-3 px-6 rounded-xl bg-[#FF5200] hover:bg-[#e04800] text-white font-bold text-xs shadow-lg shadow-[#FF5200]/25 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>Ask Crave Assistant</span>
            </button>
          </div>
        </div>
      </section>

      {/* Categories Horizontal Slider */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#1F2937] flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-[#FF5200]" /> Browse Cuisines
          </h2>
          <span className="text-xs text-slate-500 font-medium">Select to filter menu</span>
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
          {categories.map((cat) => {
            const isSelected = selectedCuisine === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => dispatch(setSelectedCuisine(cat.name))}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all shrink-0 ${
                  isSelected
                    ? 'bg-[#FFF5F0] text-[#FF5200] border-[#FF5200] font-bold shadow-2xs'
                    : 'bg-white text-slate-700 border-[#E5E7EB] hover:border-orange-300 hover:bg-[#FFF5F0]/50'
                }`}
              >
                <span className="text-sm">{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Promoted Coupons Banner */}
      <section className="p-6 rounded-2xl bg-[#FFF5F0] border border-orange-200/80 text-[#1F2937] relative overflow-hidden shadow-2xs">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[#FF5200] text-xs font-bold uppercase tracking-wider">
              <Tag className="w-4 h-4" /> Exclusive Offer
            </div>
            <h3 className="text-xl font-black text-[#1F2937]">Get 50% OFF Up To ₹150</h3>
            <p className="text-xs text-slate-600 max-w-md">
              Use code <strong className="bg-[#FF5200]/10 px-2 py-0.5 rounded text-[#FF5200] font-mono">CRAVE50</strong> on your first order.
            </p>
          </div>

          <button
            onClick={() => dispatch(toggleAIAssistant(true))}
            className="py-2.5 px-5 bg-[#FF5200] text-white hover:bg-[#e04800] font-bold text-xs rounded-xl shadow-md transition-all shrink-0"
          >
            Apply Deal with AI Assistant
          </button>
        </div>
      </section>

      {/* Feature 3: AI Personalized Food Recommendation Engine */}
      <section>
        <AIRecommendationEngine />
      </section>

      {/* Restaurants Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-3">
          <div>
            <h2 className="text-lg font-extrabold text-[#1F2937] flex items-center gap-2">
              <Award className="w-5 h-5 text-[#FF5200]" /> Popular Restaurants
            </h2>
            <p className="text-xs text-slate-500">Handpicked kitchens with fast delivery</p>
          </div>

          {/* Quick Filter Controls */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <button
              onClick={() => dispatch(setIsVegOnly(!isVegOnly))}
              className={`px-3 py-1.5 rounded-xl border font-bold transition-all ${
                isVegOnly
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                  : 'bg-white text-slate-700 border-[#E5E7EB] hover:bg-slate-50'
              }`}
            >
              🌱 Pure Veg
            </button>

            <select
              value={sortBy}
              onChange={(e) => dispatch(setSortBy(e.target.value as any))}
              className="px-3 py-1.5 rounded-xl border border-[#E5E7EB] bg-white text-slate-700 font-semibold outline-none focus:border-[#FF5200]"
            >
              <option value="relevance">Sort: Relevance</option>
              <option value="rating">Sort: Top Rated</option>
              <option value="deliveryTime">Sort: Fastest Delivery</option>
              <option value="costLow">Sort: Cost Low to High</option>
              <option value="costHigh">Sort: Cost High to Low</option>
            </select>
          </div>
        </div>

        {restLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-64 bg-slate-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredRestaurants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRestaurants.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                onClick={() => onSelectRestaurant(restaurant.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200">
            <p className="text-sm font-bold text-slate-700">No restaurants match your selected filters.</p>
            <button
              onClick={() => {
                dispatch(setSelectedCuisine('All'));
                dispatch(setIsVegOnly(false));
              }}
              className="mt-2 text-xs text-orange-600 font-bold hover:underline"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>

      {/* Trending Dishes Spotlight */}
      <section className="space-y-4 pt-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-600" /> Trending Dishes Near You
          </h2>
          <p className="text-xs text-slate-500">Most ordered dishes in Springfield this week</p>
        </div>

        {foodLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-28 bg-slate-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allFoods.slice(0, 6).map((food) => (
              <FoodCard key={food.id} foodItem={food} />
            ))}
          </div>
        )}
      </section>

    </div>
  );
};
