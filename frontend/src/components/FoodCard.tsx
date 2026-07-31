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
      <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-2xs hover:shadow-md transition-all flex gap-4 relative group">
        
        {/* Left Side: Text Info */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            {/* Badges & Tags */}
            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
              {/* Veg / Non-Veg Indicator Dot */}
              <div
                className={`w-4 h-4 border flex items-center justify-center rounded-sm shrink-0 ${
                  foodItem.isVeg ? 'border-emerald-600' : 'border-rose-600'
                }`}
                title={foodItem.isVeg ? 'Pure Vegetarian' : 'Non-Vegetarian'}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    foodItem.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}
                />
              </div>

              {foodItem.matchScore && (
                <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 text-[10px] font-black tracking-wide flex items-center gap-1 border border-orange-200">
                  <Sparkles className="w-3 h-3 text-[#FF5200]" />
                  {foodItem.matchScore}% Match
                </span>
              )}

              {foodItem.isBestseller && (
                <span className="px-2 py-0.5 rounded-md bg-[#ECFDF5] text-[#059669] text-[10px] font-extrabold uppercase tracking-wide">
                  ⭐ Bestseller
                </span>
              )}

              {foodItem.isSpicy && (
                <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-0.5">
                  <Flame className="w-3 h-3 text-rose-600" /> Spicy
                </span>
              )}
            </div>

            {foodItem.recommendationReason && (
              <p className="text-[10px] font-bold text-orange-600/90 mb-1 flex items-center gap-1 bg-orange-50/80 px-2 py-0.5 rounded-md w-fit">
                <span>💡</span> {foodItem.recommendationReason}
              </p>
            )}

            <h4 className="text-sm font-extrabold text-[#1F2937] group-hover:text-[#FF5200] transition-colors">
              {foodItem.name}
            </h4>

            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-black text-[#1F2937]">
                ₹{foodItem.price}
              </span>
              {foodItem.calories && (
                <span className="text-[11px] text-slate-400 font-medium">
                  • {foodItem.calories} kcal
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
              {foodItem.description}
            </p>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => dispatch(toggleFavoriteFood(foodItem.id))}
              className={`text-xs font-semibold flex items-center gap-1 transition-colors ${
                isFavorite ? 'text-rose-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
              <span>{isFavorite ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </div>

        {/* Right Side: Image & Add Button */}
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden shrink-0 bg-slate-100">
          <img
            src={foodItem.image}
            alt={foodItem.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />

          {/* ADD / Quantity Counter Button Overlay.
              Ordering is a customer capability — owner/admin see saved dishes
              without a cart control they could never complete. */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-10">
            {!canOrder ? null : totalQty > 0 ? (
              <div className="flex items-center gap-2 px-2 py-1.5 bg-[#1F2937] text-white rounded-xl shadow-lg border border-slate-700 text-xs font-black">
                <button
                  onClick={handleDecrement}
                  className="hover:text-[#FF5200] transition-colors px-1"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-4 text-center">{totalQty}</span>
                <button
                  onClick={handleIncrement}
                  className="hover:text-[#FF5200] transition-colors px-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleAddClick}
                className="px-4 py-1.5 bg-white hover:bg-[#FF5200] text-[#FF5200] hover:text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md border border-orange-200 transition-all duration-200 active:scale-95 whitespace-nowrap"
              >
                ADD {foodItem.customizationGroups?.length ? '+' : ''}
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
