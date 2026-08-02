import React, { useEffect, useState } from 'react';
import {
  Search,
  Sparkles,
  Star,
  Clock,
  ArrowRight,
  Tag,
  ShieldCheck,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks/reduxHooks';
import {
  fetchRestaurants,
  setSelectedCuisine,
  setIsVegOnly,
  setSearchQuery,
  setSortBy,
} from '../store/slices/restaurantSlice';
import { fetchAllFoods } from '../store/slices/foodSlice';
import { toggleAIAssistant } from '../store/slices/aiSlice';
import { RestaurantCard } from '../components/RestaurantCard';
import { FoodCard } from '../components/FoodCard';
import { AIRecommendationEngine } from '../components/AIRecommendationEngine';
import { Stagger, StaggerItem } from '../components/ui';

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
    searchQuery,
  } = useAppSelector((state) => state.restaurants);

  const { allFoods, loading: foodLoading } = useAppSelector((state) => state.food);

  useEffect(() => {
    dispatch(fetchRestaurants());
    dispatch(fetchAllFoods());
  }, [dispatch]);

  /*
   * Cuisine rail. Photography instead of emoji: emoji in navigation chrome is
   * the quickest way for an interface to read as unfinished, and a real dish
   * photo is also a far better affordance for "browse this cuisine".
   */
  const categories = [
    { name: 'All', image: 'photo-1504674900247-0877df9cc836' },
    { name: 'Italian', image: 'photo-1513104890138-7c749659a591' },
    { name: 'Burgers', image: 'photo-1568901346375-23c9450c58cd' },
    { name: 'Indian', image: 'photo-1585937421612-70a008356fbe' },
    { name: 'Japanese', image: 'photo-1579871494447-9811cf80d66c' },
    { name: 'Healthy', image: 'photo-1512621776951-a57141f2eefd' },
    { name: 'Mexican', image: 'photo-1565299585323-38d6b0865b47' },
    { name: 'Desserts', image: 'photo-1551024506-0bccd828d307' },
  ];

  const cuisineImage = (id: string) =>
    `https://images.unsplash.com/${id}?auto=format&fit=crop&w=240&q=70`;

  const filteredRestaurants = restaurants.filter((r) => {
    if (selectedCuisine !== 'All' && !r.cuisine.includes(selectedCuisine)) return false;
    if (isVegOnly && !r.isVegOnly) return false;
    return true;
  });

  // Real counts, so the rail isn't advertising numbers the catalogue can't back.
  const countForCuisine = (name: string) =>
    name === 'All'
      ? restaurants.length
      : restaurants.filter((r) => r.cuisine.includes(name)).length;

  const scrollToRestaurants = () => {
    document.getElementById('restaurants')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-12 pb-16">

      {/* Hero */}
      <section className="relative overflow-hidden rounded-panel bg-surface-warm border border-brand-100">
        <div className="grid lg:grid-cols-[1.1fr_1fr] items-center">
          <div className="p-7 sm:p-10 lg:py-12">
            <h1 className="text-[32px] sm:text-[40px] font-bold text-ink-900 leading-[1.12] tracking-[-0.02em]">
              Delicious food,
              <br />
              delivered to your door
            </h1>

            <p className="mt-3.5 text-[15px] text-ink-600 leading-relaxed max-w-md">
              Order from the best local kitchens, get AI-powered recommendations and
              track every order to your doorstep.
            </p>

            {/* Search. Wired to the same restaurant filter the header search
                drives, so the two controls can't disagree. */}
            <div className="mt-6 flex flex-col sm:flex-row gap-2.5 max-w-lg">
              <div className="relative flex-1">
                <Search className="w-[18px] h-[18px] text-ink-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    dispatch(setSearchQuery(e.target.value));
                    dispatch(fetchRestaurants({ search: e.target.value }));
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && scrollToRestaurants()}
                  placeholder="Search for a dish or restaurant"
                  aria-label="Search for a dish or restaurant"
                  className="field pl-11 py-3"
                />
              </div>
              <button onClick={scrollToRestaurants} className="btn btn-primary btn-lg">
                Find food
              </button>
            </div>

            <button
              onClick={() => dispatch(toggleAIAssistant(true))}
              className="mt-3.5 inline-flex items-center gap-2 text-[14px] font-semibold text-brand-600 hover:text-brand-700 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Or describe your craving to the AI assistant
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Trust strip */}
            <div className="mt-8 pt-6 border-t border-brand-100 grid grid-cols-2 sm:grid-cols-4 gap-5">
              {[
                { icon: Clock, label: 'Fast delivery', sub: '30–40 mins' },
                { icon: Tag, label: 'Best offers', sub: 'Daily deals' },
                { icon: Star, label: 'Top rated', sub: 'Verified kitchens' },
                { icon: ShieldCheck, label: 'Secure payments', sub: 'Stripe protected' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex items-start gap-2.5">
                  <Icon className="w-[18px] h-[18px] text-brand-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-ink-900 leading-tight">{label}</p>
                    <p className="text-[12px] text-ink-500 leading-tight mt-0.5">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:block relative h-full min-h-[380px]">
            <img
              src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80"
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-surface-warm to-transparent" />
          </div>
        </div>
      </section>

      {/* Cuisine rail */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="section-title">Popular cuisines</h2>
            <p className="section-sub">Pick a cuisine to filter the restaurants below</p>
          </div>
          {selectedCuisine !== 'All' && (
            <button
              onClick={() => dispatch(setSelectedCuisine('All'))}
              className="text-[13px] font-semibold text-brand-600 hover:text-brand-700 shrink-0"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => {
            const isSelected = selectedCuisine === cat.name;
            const count = countForCuisine(cat.name);
            return (
              <button
                key={cat.name}
                onClick={() => dispatch(setSelectedCuisine(cat.name))}
                aria-pressed={isSelected}
                className="group shrink-0 w-[92px] text-center"
              >
                <div
                  className={`w-[92px] h-[92px] rounded-full overflow-hidden mb-2 transition-all ${
                    isSelected
                      ? 'ring-2 ring-brand-500 ring-offset-2'
                      : 'ring-1 ring-surface-line group-hover:ring-ink-400'
                  }`}
                >
                  <img
                    src={cuisineImage(cat.image)}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <p
                  className={`text-[13px] font-semibold leading-tight truncate ${
                    isSelected ? 'text-brand-600' : 'text-ink-900'
                  }`}
                >
                  {cat.name}
                </p>
                <p className="text-[12px] text-ink-500 leading-tight tnum">
                  {count} {count === 1 ? 'place' : 'places'}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Promo band */}
      <section className="rounded-panel bg-surface-warm border border-brand-100 px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-control bg-brand-500 flex items-center justify-center shrink-0">
            <Tag className="w-[18px] h-[18px] text-white" />
          </div>
          <div>
            <h3 className="text-[17px] font-bold text-ink-900 tracking-tight">
              50% off up to ₹150 on your first order
            </h3>
            <p className="text-[13px] text-ink-600 mt-0.5">
              Apply code{' '}
              <span className="font-semibold text-ink-900 tracking-wide">CRAVE50</span> at checkout.
            </p>
          </div>
        </div>

        <button
          onClick={() => dispatch(toggleAIAssistant(true))}
          className="btn btn-secondary shrink-0"
        >
          Build an order with AI
        </button>
      </section>

      {/* Feature 3: AI Personalized Food Recommendation Engine */}
      <section>
        <AIRecommendationEngine />
      </section>

      {/* Restaurants Section */}
      <section id="restaurants" className="scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
          <div>
            <h2 className="section-title">
              {selectedCuisine === 'All' ? 'All restaurants' : `${selectedCuisine} restaurants`}
              <span className="ml-2 text-[15px] font-medium text-ink-500 tnum">
                {filteredRestaurants.length}
              </span>
            </h2>
            <p className="section-sub">Handpicked kitchens delivering near you</p>
          </div>

          {/* Quick Filter Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => dispatch(setIsVegOnly(!isVegOnly))}
              aria-pressed={isVegOnly}
              className={`chip ${isVegOnly ? 'chip-active' : ''}`}
            >
              <span
                className={`diet-mark scale-75 -ml-1 ${isVegOnly ? 'diet-veg' : 'text-ink-400'}`}
                aria-hidden
              />
              Pure veg
            </button>

            <select
              value={sortBy}
              onChange={(e) => dispatch(setSortBy(e.target.value as any))}
              aria-label="Sort restaurants"
              className="field w-auto py-[7px] text-[13px] font-medium cursor-pointer"
            >
              <option value="relevance">Relevance</option>
              <option value="rating">Top rated</option>
              <option value="deliveryTime">Fastest delivery</option>
              <option value="costLow">Cost: low to high</option>
              <option value="costHigh">Cost: high to low</option>
            </select>
          </div>
        </div>

        {restLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-64 rounded-card skeleton" />
            ))}
          </div>
        ) : filteredRestaurants.length > 0 ? (
          /* Keyed on the active filter so changing cuisine replays the reveal
             rather than swapping cards in place with no feedback. The item
             wrapper needs `h-full`: RestaurantCard stretches to the grid row,
             and without it the wrapper would collapse to content height and
             break the equal-height row. */
          <Stagger
            key={`${selectedCuisine}-${isVegOnly}`}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {filteredRestaurants.map((restaurant) => (
              <StaggerItem key={restaurant.id} className="h-full">
                <RestaurantCard
                  restaurant={restaurant}
                  onClick={() => onSelectRestaurant(restaurant.id)}
                />
              </StaggerItem>
            ))}
          </Stagger>
        ) : (
          <div className="text-center py-14 rounded-card border border-surface-line bg-surface-sunken">
            <p className="text-[15px] font-semibold text-ink-900">
              No restaurants match these filters
            </p>
            <p className="section-sub">Try a different cuisine or clear the veg filter.</p>
            <button
              onClick={() => {
                dispatch(setSelectedCuisine('All'));
                dispatch(setIsVegOnly(false));
              }}
              className="btn btn-secondary btn-sm mt-4"
            >
              Reset filters
            </button>
          </div>
        )}
      </section>

      {/* Trending Dishes Spotlight */}
      <section>
        <div className="mb-5">
          <h2 className="section-title">Trending dishes near you</h2>
          <p className="section-sub">Most ordered in Springfield this week</p>
        </div>

        {foodLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-32 rounded-card skeleton" />
            ))}
          </div>
        ) : (
          <Stagger className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allFoods.slice(0, 6).map((food) => (
              <StaggerItem key={food.id}>
                <FoodCard foodItem={food} />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </section>

    </div>
  );
};
