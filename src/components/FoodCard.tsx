import React, { useState } from 'react';
import { Star, Flame, Plus, Minus, Heart, Sparkles } from 'lucide-react';
import { FoodItem, CartCustomizationSelection } from '../types';
import { useAppDispatch, useAppSelector } from '../hooks/reduxHooks';
import { addToCart, updateCartQuantity } from '../store/slices/cartSlice';
import { toggleFavoriteFood } from '../store/slices/wishlistSlice';
import { FoodCustomizerModal } from './FoodCustomizerModal';

interface FoodCardProps {
  foodItem: FoodItem;
}

export const FoodCard: React.FC<FoodCardProps> = ({ foodItem }) => {
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector((state) => state.cart.items);
  const wishlistFoodIds = useAppSelector((state) => state.wishlist.foodIds);
  const role = useAppSelector((state) => state.auth.user?.role);

  const canOrder = role === 'customer';

  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  const isFavorite = wishlistFoodIds.includes(foodItem.id);

  // Find total quantity of this food in cart
  const cartEntries = cartItems.filter((i) => i.foodItem.id === foodItem.id);
  const totalQty = cartEntries.reduce((sum, i) => sum + i.quantity, 0);

  const handleAddClick = () => {
    if (foodItem.customizationGroups && foodItem.customizationGroups.length > 0) {
      setIsCustomizerOpen(true);
    } else {
      dispatch(addToCart({ foodItem, quantity: 1 }));
    }
  };

  const handleIncrement = () => {
    if (foodItem.customizationGroups && foodItem.customizationGroups.length > 0) {
      setIsCustomizerOpen(true);
    } else if (cartEntries.length > 0) {
      dispatch(
        updateCartQuantity({
          cartItemId: cartEntries[0].cartItemId,
          quantity: cartEntries[0].quantity + 1,
        })
      );
    } else {
      dispatch(addToCart({ foodItem, quantity: 1 }));
    }
  };

  const handleDecrement = () => {
    if (cartEntries.length > 0) {
      dispatch(
        updateCartQuantity({
          cartItemId: cartEntries[cartEntries.length - 1].cartItemId,
          quantity: cartEntries[cartEntries.length - 1].quantity - 1,
        })
      );
    }
  };

  const handleCustomizedAdd = (
    customizations: CartCustomizationSelection[],
    specialInstructions: string
  ) => {
    dispatch(
      addToCart({
        foodItem,
        quantity: 1,
        customizations,
        specialInstructions,
      })
    );
  };

  return (
    <>
      <div className="bg-white rounded-card p-4 border border-surface-line shadow-card hover:shadow-raised transition-shadow flex gap-4 relative group">

        {/* Left Side: Text Info */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Badges & Tags */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className={`diet-mark ${foodItem.isVeg ? 'diet-veg' : 'diet-nonveg'}`}
              title={foodItem.isVeg ? 'Vegetarian' : 'Non-vegetarian'}
            />

            {foodItem.isBestseller && (
              <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand-600">
                <Star className="w-3 h-3 fill-current" />
                Bestseller
              </span>
            )}

            {foodItem.isSpicy && (
              <span className="inline-flex items-center gap-1 text-[12px] font-medium text-danger-500">
                <Flame className="w-3 h-3" />
                Spicy
              </span>
            )}

            {foodItem.matchScore && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-brand-50 text-brand-600 text-[11px] font-semibold tnum">
                <Sparkles className="w-3 h-3" />
                {foodItem.matchScore}% match
              </span>
            )}
          </div>

          <h4 className="text-[15px] font-semibold text-ink-900 leading-snug">
            {foodItem.name}
          </h4>

          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-[15px] font-semibold text-ink-900 tnum">₹{foodItem.price}</span>
            {foodItem.calories && (
              <span className="text-[12px] text-ink-400 tnum">{foodItem.calories} kcal</span>
            )}
          </div>

          <p className="text-[13px] text-ink-500 mt-1.5 line-clamp-2 leading-relaxed">
            {foodItem.description}
          </p>

          {foodItem.recommendationReason && (
            <p className="mt-2 text-[12px] text-brand-600 leading-snug">
              {foodItem.recommendationReason}
            </p>
          )}

          <div className="mt-auto pt-3">
            <button
              onClick={() => dispatch(toggleFavoriteFood(foodItem.id))}
              className={`text-[13px] font-medium inline-flex items-center gap-1.5 transition-colors ${
                isFavorite ? 'text-danger-500' : 'text-ink-400 hover:text-ink-600'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              {isFavorite ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>

        {/* Right Side: Image & Add Button */}
        <div className="relative w-28 sm:w-32 shrink-0">
          <div className="w-full aspect-square rounded-control overflow-hidden bg-surface-sunken">
            <img
              src={foodItem.image}
              alt={foodItem.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </div>

          {/* ADD / Quantity Counter Button Overlay.
              Ordering is a customer capability — owner/admin see saved dishes
              without a cart control they could never complete. */}
          <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 z-10 w-[86%]">
            {!canOrder ? null : totalQty > 0 ? (
              <div className="flex items-center justify-between px-1 h-9 bg-white text-brand-600 rounded-control shadow-raised border border-surface-line">
                <button
                  onClick={handleDecrement}
                  aria-label="Decrease quantity"
                  className="px-2 h-full hover:text-brand-700 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-sm font-semibold tnum">{totalQty}</span>
                <button
                  onClick={handleIncrement}
                  aria-label="Increase quantity"
                  className="px-2 h-full hover:text-brand-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleAddClick}
                className="w-full h-9 bg-white hover:bg-brand-500 text-brand-600 hover:text-white font-semibold text-sm rounded-control shadow-raised border border-surface-line transition-colors"
              >
                ADD{foodItem.customizationGroups?.length ? ' +' : ''}
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Customizer Modal */}
      {foodItem.customizationGroups && (
        <FoodCustomizerModal
          foodItem={foodItem}
          isOpen={isCustomizerOpen}
          onClose={() => setIsCustomizerOpen(false)}
          onAddToCart={handleCustomizedAdd}
        />
      )}
    </>
  );
};
