import React from 'react';
import { Star, Clock, Heart, Tag, MapPin } from 'lucide-react';
import { Restaurant } from '../types';
import { useAppDispatch, useAppSelector } from '../hooks/reduxHooks';
import { toggleFavoriteRestaurant } from '../store/slices/wishlistSlice';

interface RestaurantCardProps {
  restaurant: Restaurant;
  /** When omitted the card is presentational — no pointer cue, no dead click. */
  onClick?: () => void;
}

export const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant, onClick }) => {
  const dispatch = useAppDispatch();
  const wishlistIds = useAppSelector((state) => state.wishlist.restaurantIds);
  const isFavorite = wishlistIds.includes(restaurant.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(toggleFavoriteRestaurant(restaurant.id));
  };

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`group relative bg-white rounded-2xl overflow-hidden border border-[#E5E7EB] shadow-2xs transition-all duration-300 flex flex-col h-full ${
        onClick ? 'hover:shadow-lg cursor-pointer' : ''
      }`}
    >
      {/* Image Container */}
      <div className="relative aspect-16/10 overflow-hidden bg-slate-100">
        <img
          src={restaurant.image}
          alt={restaurant.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        
        {/* Dark gradient overlay for bottom text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
          <div className="flex gap-1.5 flex-wrap">
            {restaurant.discountOffer && (
              <span className="px-2.5 py-1 rounded-lg bg-[#FF5200] text-white text-[11px] font-extrabold shadow-xs flex items-center gap-1">
                <Tag className="w-3 h-3" /> {restaurant.discountOffer}
              </span>
            )}
            {restaurant.isVegOnly && (
              <span className="px-2 py-1 rounded-lg bg-[#ECFDF5] text-[#059669] text-[11px] font-extrabold shadow-xs">
                Pure Veg 🌱
              </span>
            )}
          </div>

          <button
            onClick={handleFavoriteClick}
            className={`p-2 rounded-full backdrop-blur-md transition-all ${
              isFavorite
                ? 'bg-rose-500 text-white shadow-md'
                : 'bg-white/80 text-slate-700 hover:bg-white hover:text-rose-500'
            }`}
            title={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Bottom Image Overlay Details */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white z-10">
          <div>
            <h3 className="text-base font-extrabold leading-tight drop-shadow-sm group-hover:text-amber-300 transition-colors">
              {restaurant.name}
            </h3>
            <p className="text-xs text-slate-200 truncate max-w-[200px]">
              {restaurant.cuisine.join(', ')}
            </p>
          </div>

          <div className="flex items-center gap-1 bg-[#ECFDF5] text-[#059669] px-2 py-0.5 rounded-md font-bold text-xs shadow-2xs shrink-0">
            <Star className="w-3 h-3 fill-current" />
            <span>{restaurant.rating} ★</span>
          </div>
        </div>
      </div>

      {/* Card Content Details */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
          {restaurant.description}
        </p>

        <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-slate-600 font-medium">
          <div className="flex items-center gap-1 text-slate-700">
            <Clock className="w-3.5 h-3.5 text-[#FF5200]" />
            <span>{restaurant.deliveryTimeMinutes} mins</span>
          </div>

          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{restaurant.city}</span>
          </div>

          <div className="font-bold text-[#1F2937]">
            ₹{restaurant.priceForTwo} for two
          </div>
        </div>
      </div>
    </div>
  );
};
