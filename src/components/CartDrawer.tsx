import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
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

  const closeDrawer = () => dispatch(toggleCartDrawer(false));

  // Escape closes the drawer, and the page behind it stops scrolling while it
  // is open — both expected of a slide-over, neither previously wired up.
  useEffect(() => {
    if (!isCartOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dispatch(toggleCartDrawer(false));
    };

    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isCartOpen, dispatch]);

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
    <AnimatePresence>
      {isCartOpen && (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={closeDrawer}
        className="absolute inset-0 bg-ink-900/40 backdrop-blur-xs"
        aria-hidden="true"
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Your order"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 420, damping: 40 }}
        className="relative w-full max-w-md bg-white h-full shadow-overlay flex flex-col"
      >

        {/* Header */}
        <div className="px-5 py-4 bg-white border-b border-surface-line flex items-center justify-between">
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold text-ink-900">Your order</h2>
            {restaurantName && (
              <p className="text-[13px] text-ink-500 truncate max-w-[220px]">
                From {restaurantName}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1">
            {items.length > 0 && (
              <button
                onClick={() => dispatch(clearCart())}
                className="text-[13px] font-medium text-ink-500 hover:text-danger-500 px-2 py-1 rounded-md hover:bg-surface-sunken transition-colors"
                title="Clear cart"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => dispatch(toggleCartDrawer(false))}
              aria-label="Close cart"
              className="p-1.5 rounded-lg text-ink-400 hover:text-ink-900 hover:bg-surface-sunken transition-colors"
            >
              <X className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>

        {/* Cart Contents */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-surface-sunken text-ink-400 flex items-center justify-center mb-4">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <h3 className="text-[17px] font-semibold text-ink-900 mb-1">Your cart is empty</h3>
            <p className="text-[13px] text-ink-500 max-w-xs mb-6 leading-relaxed">
              Browse nearby restaurants or describe a craving to the AI assistant.
            </p>
            <button
              onClick={() => dispatch(toggleCartDrawer(false))}
              className="btn btn-primary"
            >
              Browse restaurants
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-surface-sunken">
            
            {/* Delivery Address Pill */}
            <div className="p-3 bg-white rounded-card border border-surface-line flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <MapPin className="w-[18px] h-[18px] text-brand-500 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[13px] font-semibold text-ink-900 block truncate">
                    Deliver to {selectedAddress?.title || 'Home'}
                  </span>
                  <span className="text-[12px] text-ink-500 truncate block">
                    {selectedAddress
                      ? `${selectedAddress.street}, ${selectedAddress.city}`
                      : 'Select an address'}
                  </span>
                </div>
              </div>
              <span className="text-[12px] font-medium text-ink-600 shrink-0 tnum">25 mins</span>
            </div>

            {/* Cart Items List */}
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.cartItemId}
                  className="p-3 bg-white rounded-card border border-surface-line flex gap-3 items-center"
                >
                  <img
                    src={item.foodItem.image}
                    alt=""
                    loading="lazy"
                    className="w-14 h-14 rounded-control object-cover shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-[14px] font-medium text-ink-900 truncate">
                        {item.foodItem.name}
                      </h4>
                      <button
                        onClick={() => dispatch(removeFromCart(item.cartItemId))}
                        aria-label={`Remove ${item.foodItem.name}`}
                        className="text-ink-400 hover:text-danger-500 p-0.5 shrink-0 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-[12px] text-ink-500 mt-0.5 tnum">
                      ₹{item.itemTotalPrice} each
                    </div>

                    {/* Customizations summary tags */}
                    {item.customizations && item.customizations.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.customizations.flatMap((c) =>
                          c.selectedOptions.map((opt, i) => (
                            <span
                              key={i}
                              className="text-[11px] text-ink-500 bg-surface-sunken px-1.5 py-0.5 rounded"
                            >
                              + {opt.name}
                            </span>
                          ))
                        )}
                      </div>
                    )}

                    {/* Quantity Controls */}
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 border border-surface-line rounded-lg px-2 py-1 text-[13px] font-semibold text-ink-900">
                        <button
                          onClick={() =>
                            dispatch(
                              updateCartQuantity({
                                cartItemId: item.cartItemId,
                                quantity: item.quantity - 1,
                              })
                            )
                          }
                          aria-label="Decrease quantity"
                          className="hover:text-brand-600 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="tnum w-3 text-center">{item.quantity}</span>
                        <button
                          onClick={() =>
                            dispatch(
                              updateCartQuantity({
                                cartItemId: item.cartItemId,
                                quantity: item.quantity + 1,
                              })
                            )
                          }
                          aria-label="Increase quantity"
                          className="hover:text-brand-600 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="text-[14px] font-semibold text-ink-900 tnum">
                        ₹{item.itemTotalPrice * item.quantity}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Coupons Section */}
            <div className="p-4 bg-white rounded-card border border-surface-line space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-semibold text-ink-900 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-brand-500" /> Coupons &amp; offers
                </span>
                {appliedCoupon && (
                  <button
                    onClick={() => dispatch(removeCoupon())}
                    className="text-[13px] font-medium text-danger-500 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>

              {appliedCoupon ? (
                <div className="p-3 bg-success-50 rounded-control text-success-600 flex items-center gap-2.5">
                  <CheckCircle2 className="w-[18px] h-[18px] shrink-0" />
                  <div>
                    <span className="text-[13px] font-semibold block">
                      {appliedCoupon.code} applied
                    </span>
                    <span className="text-[12px] tnum">You saved ₹{discountAmount}</span>
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
                    placeholder="Enter coupon code"
                    aria-label="Coupon code"
                    className="field flex-1 uppercase"
                  />
                  <button
                    type="submit"
                    disabled={couponLoading || !couponInput.trim()}
                    className="btn btn-secondary shrink-0"
                  >
                    Apply
                  </button>
                </form>
              )}

              {couponMessage && !appliedCoupon && (
                <p className="text-[13px] text-danger-500 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {couponMessage}
                </p>
              )}

              {/* Sample Coupons Chips */}
              {!appliedCoupon && (
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {availableCoupons.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => handleApplyCoupon(c.code)}
                      title={c.title}
                      className="chip shrink-0"
                    >
                      <Tag className="w-3.5 h-3.5" />
                      {c.code}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Bill Details Breakdown */}
            <div className="p-4 bg-white rounded-card border border-surface-line space-y-2.5 text-[13px]">
              <h4 className="text-[14px] font-semibold text-ink-900 pb-2 border-b border-surface-line">
                Bill summary
              </h4>

              <div className="flex justify-between text-ink-600">
                <span>Item subtotal</span>
                <span className="tnum">₹{itemTotal}</span>
              </div>

              <div className="flex justify-between text-ink-600">
                <span>Delivery fee</span>
                <span className="tnum">₹{deliveryFee}</span>
              </div>

              <div className="flex justify-between text-ink-600">
                <span>Taxes &amp; packaging</span>
                <span className="tnum">₹{taxAndPackaging}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-success-600 font-medium">
                  <span>Coupon savings</span>
                  <span className="tnum">−₹{discountAmount}</span>
                </div>
              )}

              <div className="pt-2.5 border-t border-surface-line flex justify-between items-center">
                <span className="text-[15px] font-semibold text-ink-900">To pay</span>
                <span className="text-[17px] font-bold text-ink-900 tnum">₹{finalTotal}</span>
              </div>
            </div>

          </div>
        )}

        {/* Footer Checkout Button */}
        {items.length > 0 && (
          <div className="p-4 bg-white border-t border-surface-line">
            <button
              onClick={handleCheckoutClick}
              className="btn btn-primary btn-lg w-full justify-between"
            >
              <span className="text-left">
                <span className="block text-[12px] font-normal text-white/80">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </span>
                <span className="tnum">₹{finalTotal}</span>
              </span>
              <span className="flex items-center gap-1.5">
                Proceed to pay
                <ArrowRight className="w-4 h-4" />
              </span>
            </button>
          </div>
        )}

      </motion.div>
    </div>
      )}
    </AnimatePresence>
  );
};
