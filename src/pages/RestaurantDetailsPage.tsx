import React, { useEffect, useState } from 'react';
import {
  Star,
  Clock,
  MapPin,
  Phone,
  Search,
  Tag,
  MessageSquare,
  ArrowLeft,
  Share2,
  Heart,
  Plus,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks/reduxHooks';
import { fetchRestaurantDetails } from '../store/slices/restaurantSlice';
import { toggleFavoriteRestaurant } from '../store/slices/wishlistSlice';
import { FoodCard } from '../components/FoodCard';
import { apiFetch } from '../utils/apiBase';

interface RestaurantDetailsPageProps {
  restaurantId: string;
  onBack: () => void;
}

export const RestaurantDetailsPage: React.FC<RestaurantDetailsPageProps> = ({
  restaurantId,
  onBack,
}) => {
  const dispatch = useAppDispatch();
  const {
    currentRestaurant,
    restaurantFoods,
    restaurantReviews,
    detailsLoading,
  } = useAppSelector((state) => state.restaurants);

  const wishlistRestaurantIds = useAppSelector((state) => state.wishlist.restaurantIds);
  const isFavorite = currentRestaurant ? wishlistRestaurantIds.includes(currentRestaurant.id) : false;

  const [menuSearch, setMenuSearch] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  useEffect(() => {
    if (restaurantId) {
      dispatch(fetchRestaurantDetails(restaurantId));
    }
  }, [dispatch, restaurantId]);

  if (detailsLoading || !currentRestaurant) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-bold text-slate-600">Loading Restaurant Menu...</p>
      </div>
    );
  }

  // Filter foods
  const filteredFoods = restaurantFoods.filter((f) => {
    if (vegOnly && !f.isVeg) return false;
    if (menuSearch) {
      const q = menuSearch.toLowerCase();
      return f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q);
    }
    return true;
  });

  // Group by category
  const categories = Array.from(new Set(restaurantFoods.map((f) => f.category)));

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    await apiFetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurantId: currentRestaurant.id,
        rating: newRating,
        comment: newComment,
      }),
    });

    setIsReviewModalOpen(false);
    setNewComment('');
    dispatch(fetchRestaurantDetails(restaurantId));
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Back Button & Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 py-2 px-3 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Restaurants</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => dispatch(toggleFavoriteRestaurant(currentRestaurant.id))}
            className={`p-2 rounded-xl border transition-all ${
              isFavorite
                ? 'bg-rose-500 text-white border-rose-500'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Hero Banner Card */}
      <div className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-md">
        
        <div className="relative h-60 sm:h-72 bg-slate-900">
          <img
            src={currentRestaurant.bannerImage || currentRestaurant.image}
            alt={currentRestaurant.name}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          {/* Offer Tag */}
          {currentRestaurant.discountOffer && (
            <div className="absolute top-4 left-4 bg-orange-600 text-white font-black text-xs px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              <span>{currentRestaurant.discountOffer}</span>
            </div>
          )}
        </div>

        {/* Restaurant Header Details */}
        <div className="p-6 sm:p-8 -mt-12 relative z-10 bg-white rounded-3xl mx-4 sm:mx-6 shadow-xl border border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                {currentRestaurant.name}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                {currentRestaurant.cuisine.join(', ')} • {currentRestaurant.address}, {currentRestaurant.city}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1.5 rounded-xl font-bold text-sm shadow-xs">
                <Star className="w-4 h-4 fill-current" />
                <span>{currentRestaurant.rating}</span>
                <span className="text-emerald-200 text-xs">({currentRestaurant.reviewCount})</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-700 font-medium">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-orange-600" />
              <span>Delivery: <strong>{currentRestaurant.deliveryTimeMinutes} Mins</strong></span>
            </div>

            <div className="flex items-center gap-1.5">
              <span>Cost for Two: <strong>₹{currentRestaurant.priceForTwo}</strong></span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-500">
              <Phone className="w-4 h-4" />
              <span>{currentRestaurant.phone}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Search & Filters Bar */}
      <div className="sticky top-20 z-30 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={menuSearch}
            onChange={(e) => setMenuSearch(e.target.value)}
            placeholder="Search menu items..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-orange-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between">
          <button
            onClick={() => setVegOnly(!vegOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
              vegOnly
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            🌱 Pure Veg Only
          </button>

          <button
            onClick={() => setIsReviewModalOpen(true)}
            className="py-2 px-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Write Review</span>
          </button>
        </div>
      </div>

      {/* Menu Items Grouped By Category */}
      <div className="space-y-8">
        {categories.map((cat) => {
          const categoryFoods = filteredFoods.filter((f) => f.category === cat);
          if (categoryFoods.length === 0) return null;

          return (
            <div key={cat} className="space-y-4">
              <h3 className="text-lg font-black text-slate-900 border-b border-slate-200 pb-2">
                {cat} <span className="text-xs text-slate-400 font-normal">({categoryFoods.length})</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categoryFoods.map((food) => (
                  <FoodCard key={food.id} foodItem={food} />
                ))}
              </div>
            </div>
          );
        })}

        {filteredFoods.length === 0 && (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200">
            <p className="text-xs font-bold text-slate-600">No dishes match your menu search query.</p>
          </div>
        )}
      </div>

      {/* Restaurant Customer Reviews */}
      <div className="p-6 bg-white rounded-3xl border border-slate-200 space-y-4">
        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-orange-600" /> Customer Ratings & Reviews
        </h3>

        {restaurantReviews.length === 0 ? (
          <p className="text-xs text-slate-500">No reviews yet. Be the first to review this kitchen!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {restaurantReviews.map((rev) => (
              <div key={rev.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={rev.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                      alt={rev.userName}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                    <span className="font-bold text-xs text-slate-900">{rev.userName}</span>
                  </div>
                  <div className="flex items-center text-amber-500 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-current" /> {rev.rating}
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed italic">"{rev.comment}"</p>
                <span className="text-[10px] text-slate-400 block">{new Date(rev.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Review Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-4">Rate & Review {currentRestaurant.name}</h3>

            <form onSubmit={handleAddReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className={`p-2 rounded-xl text-lg font-bold border ${
                        newRating >= star ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-50 text-slate-400'
                      }`}
                    >
                      ★ {star}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Review</label>
                <textarea
                  required
                  rows={3}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Tell us about the food quality, taste, and packaging..."
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold border border-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-xl"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
