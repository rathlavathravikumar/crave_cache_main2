import React from 'react';
import { Star, Clock, Heart, Tag } from 'lucide-react';
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
      className={`group relative bg-white rounded-card overflow-hidden border border-surface-line shadow-card flex flex-col h-full ${
        onClick ? 'card-hover cursor-pointer' : ''
      }`}
    >
      {/* Image Container */}
      <div className="relative aspect-16/10 overflow-hidden bg-surface-sunken">
        <img
          src={restaurant.image}
          alt={restaurant.name}
          className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
          loading="lazy"
        />

        {/* Offer ribbon. Sits along the bottom edge over a short scrim rather
            than floating as a pill — the pattern every delivery app uses, and
            it keeps the image itself unobscured. */}
        {restaurant.discountOffer && (
          <>
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/75 to-transparent" />
            <span className="absolute bottom-2.5 left-3 right-3 flex items-center gap-1.5 text-white text-sm font-bold tracking-tight drop-shadow-sm">
              <Tag className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{restaurant.discountOffer}</span>
            </span>
          </>
        )}

        <button
          onClick={handleFavoriteClick}
          aria-label={isFavorite ? 'Remove from favourites' : 'Save to favourites'}
          className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-sm transition-colors ${
            isFavorite
              ? 'bg-white text-danger-500'
              : 'bg-black/25 text-white hover:bg-white hover:text-danger-500'
          }`}
          title={isFavorite ? 'Remove from favourites' : 'Save to favourites'}
        >
          <Heart className={`w-[18px] h-[18px] ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Card Content Details */}
      <div className="p-3.5 flex-1 flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[15px] font-semibold text-ink-900 leading-snug truncate">
            {restaurant.name}
          </h3>
          <span className="rating-pill shrink-0 mt-0.5">
            <Star className="w-3 h-3 fill-current" />
            {restaurant.rating}
          </span>
        </div>

        <p className="text-[13px] text-ink-500 truncate">
          {restaurant.cuisine.join(', ')}
        </p>

        <div className="mt-auto pt-2.5 flex items-center gap-1.5 text-[13px] text-ink-500 tnum">
          <Clock className="w-3.5 h-3.5 text-ink-400 shrink-0" />
          <span>{restaurant.deliveryTimeMinutes} mins</span>
          <span aria-hidden className="text-ink-400">·</span>
          <span>₹{restaurant.priceForTwo} for two</span>
          {restaurant.isVegOnly && (
            <span className="ml-auto inline-flex items-center gap-1 text-[12px] font-medium text-[#0F8A4C]">
              <span className="diet-mark diet-veg scale-90" aria-hidden />
              Pure veg
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
