import React, { useState } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  Tag,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  AlertCircle,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks/reduxHooks';
import {
  toggleCartDrawer,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  applyCouponCode,
  removeCoupon,
} from '../store/slices/cartSlice';

interface CartDrawerProps {
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onProceedToCheckout }) => {
  const dispatch = useAppDispatch();
  const {
    items,
    restaurantName,
    appliedCoupon,
    discountAmount,
    couponMessage,
    isCartOpen,
    couponLoading,
  } = useAppSelector((state) => state.cart);
  const selectedAddress = useAppSelector((state) => state.auth.selectedAddress);

  const [couponInput, setCouponInput] = useState('');

  if (!isCartOpen) return null;

  // Calculations
  const itemTotal = items.reduce((acc, item) => acc + item.itemTotalPrice * item.quantity, 0);
  const deliveryFee = items.length > 0 ? 40 : 0;
  const taxAndPackaging = items.length > 0 ? Math.round(itemTotal * 0.05 + 25) : 0;
  const finalTotal = Math.max(0, Math.round(itemTotal + deliveryFee + taxAndPackaging - discountAmount));

  const handleApplyCoupon = (codeToApply?: string) => {
    const code = codeToApply || couponInput;
    if (!code.trim()) return;
    dispatch(applyCouponCode({ code, cartAmount: itemTotal }));
    if (!codeToApply) setCouponInput('');
  };

  const handleCheckoutClick = () => {
    dispatch(toggleCartDrawer(false));
    onProceedToCheckout();
  };

  const availableCoupons = [
    { code: 'CRAVE50', title: '50% OFF up to ₹150', min: 250 },
    { code: 'WELCOME20', title: '20% OFF above ₹400', min: 400 },
    { code: 'FREESHIP', title: 'Flat ₹50 OFF', min: 200 },
    { code: 'VEGGIE15', title: '15% OFF Healthy & Veg', min: 150 },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-fadeIn">
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-100">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#1F2937] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#FF5200]" />
            <div>
              <h2 className="text-base font-bold">Your Order</h2>
              {restaurantName && (
                <p className="text-xs text-amber-400 truncate max-w-[200px]">
                  From {restaurantName}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={() => dispatch(clearCart())}
                className="text-xs text-slate-400 hover:text-red-400 p-1.5 rounded hover:bg-slate-800 transition-colors"
                title="Clear Cart"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => dispatch(toggleCartDrawer(false))}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cart Contents */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50">
            <div className="w-20 h-20 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-4 shadow-inner">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mb-1">Your Cart is Empty</h3>
            <p className="text-xs text-slate-500 max-w-xs mb-6">
              Good food is always waiting for you. Browse top restaurants or ask our AI Assistant!
            </p>
            <button
              onClick={() => dispatch(toggleCartDrawer(false))}
              className="py-2.5 px-6 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              Browse Nearby Restaurants
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            
            {/* Delivery Address Pill */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-600 shrink-0" />
                <div className="truncate max-w-[220px]">
                  <span className="font-bold text-slate-900 block truncate">
                    Deliver to {selectedAddress?.title || 'Home'}
                  </span>
                  <span className="text-slate-500 truncate block text-[11px]">
                    {selectedAddress ? `${selectedAddress.street}, ${selectedAddress.city}` : 'Select Address'}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                25 mins
              </span>
            </div>

            {/* Cart Items List */}
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.cartItemId}
                  className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex gap-3 items-center"
                >
                  <img
                    src={item.foodItem.image}
                    alt={item.foodItem.name}
                    className="w-14 h-14 rounded-xl object-cover shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-bold text-slate-900 text-xs truncate">
                        {item.foodItem.name}
                      </h4>
                      <button
                        onClick={() => dispatch(removeFromCart(item.cartItemId))}
                        className="text-slate-400 hover:text-red-500 p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-500 mt-0.5">
                      ₹{item.itemTotalPrice} each
                    </div>

                    {/* Customizations summary tags */}
                    {item.customizations && item.customizations.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.customizations.flatMap((c) =>
                          c.selectedOptions.map((opt, i) => (
                            <span
                              key={i}
                              className="text-[9px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded"
                            >
                              + {opt.name}
                            </span>
                          ))
                        )}
                      </div>
                    )}

                    {/* Quantity Controls */}
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-2 py-1 text-xs font-bold">
                        <button
                          onClick={() =>
                            dispatch(
                              updateCartQuantity({
                                cartItemId: item.cartItemId,
                                quantity: item.quantity - 1,
                              })
                            )
                          }
                          className="hover:text-orange-600"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() =>
                            dispatch(
                              updateCartQuantity({
                                cartItemId: item.cartItemId,
                                quantity: item.quantity + 1,
                              })
                            )
                          }
                          className="hover:text-orange-600"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="font-extrabold text-slate-900 text-xs">
                        ₹{item.itemTotalPrice * item.quantity}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Coupons Section */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-orange-600" /> Coupons & Offers
                </span>
                {appliedCoupon && (
                  <button
                    onClick={() => dispatch(removeCoupon())}
                    className="text-[10px] text-red-600 font-bold uppercase hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>

              {appliedCoupon ? (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-extrabold block">Coupon '{appliedCoupon.code}' Applied</span>
                      <span className="text-[10px] text-emerald-700">Saved ₹{discountAmount}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleApplyCoupon();
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Enter Coupon Code"
                    className="flex-1 py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-orange-500 uppercase font-bold"
                  />
                  <button
                    type="submit"
                    disabled={couponLoading || !couponInput.trim()}
                    className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors disabled:opacity-40"
                  >
                    Apply
                  </button>
                </form>
              )}

              {couponMessage && !appliedCoupon && (
                <p className="text-[11px] text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {couponMessage}
                </p>
              )}

              {/* Sample Coupons Chips */}
              {!appliedCoupon && (
                <div className="space-y-1.5 pt-1">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Available Deals:</p>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {availableCoupons.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => handleApplyCoupon(c.code)}
                        className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200 text-[10px] font-bold text-orange-800 hover:bg-orange-100 transition-colors"
                      >
                        🎟️ {c.code} ({c.title})
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bill Details Breakdown */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <h4 className="font-bold text-slate-900 pb-1 border-b border-slate-100">
                Bill Summary
              </h4>

              <div className="flex justify-between text-slate-600">
                <span>Item Subtotal</span>
                <span>₹{itemTotal}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Delivery Partner Fee</span>
                <span>₹{deliveryFee}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Taxes & Packaging</span>
                <span>₹{taxAndPackaging}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Coupon Savings</span>
                  <span>-₹{discountAmount}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-black text-slate-900">
                <span>To Pay</span>
                <span className="text-orange-600 text-base">₹{finalTotal}</span>
              </div>
            </div>

          </div>
        )}

        {/* Footer Checkout Button */}
        {items.length > 0 && (
          <div className="p-4 bg-white border-t border-[#E5E7EB]">
            <button
              onClick={handleCheckoutClick}
              className="w-full py-3.5 px-5 bg-[#FF5200] hover:bg-[#e04800] text-white font-extrabold rounded-xl shadow-md transition-all flex items-center justify-between text-xs sm:text-sm"
            >
              <div>
                <span className="block text-[10px] text-orange-100 font-normal uppercase">
                  {items.length} {items.length === 1 ? 'Item' : 'Items'} Selected
                </span>
                <span>Total: ₹{finalTotal}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>Proceed to Payment</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
