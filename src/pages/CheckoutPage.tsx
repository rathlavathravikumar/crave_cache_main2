import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  ShieldCheck,
  MapPin,
  Tag,
  CheckCircle2,
  ArrowRight,
  Lock,
  Sparkles,
  ArrowLeft,
  Zap,
  Wallet,
  Check,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks/reduxHooks';
import { createNewOrder } from '../store/slices/orderSlice';
import { clearCart } from '../store/slices/cartSlice';
import { showToast } from '../utils/toast';
import { apiFetch } from '../utils/apiBase';
import { Button } from '../components/ui';
import { StripeCardForm, isStripeConfigured } from '../payments/StripeCardForm';

interface CheckoutPageProps {
  onBack: () => void;
  onOrderSuccess: (orderId: string) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onBack, onOrderSuccess }) => {
  const dispatch = useAppDispatch();
  const { user, selectedAddress } = useAppSelector((state) => state.auth);
  const { items, restaurantId, restaurantName, appliedCoupon, discountAmount } = useAppSelector(
    (state) => state.cart
  );

  // Online is preselected; cash on delivery is the alternative.
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
  const [isProcessing, setIsProcessing] = useState(false);
  /*
   * null while unknown. The server is the authority on whether Stripe is live:
   * having a publishable key in the client build does not mean the server has a
   * secret key, or that PAYMENT_MODE allows real charges.
   */
  const [stripeLive, setStripeLive] = useState<boolean | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Calculations
  const itemTotal = items.reduce((acc, item) => acc + item.itemTotalPrice * item.quantity, 0);
  const deliveryFee = items.length > 0 ? 40 : 0;
  const taxAndPackaging = items.length > 0 ? Math.round(itemTotal * 0.05 + 25) : 0;
  const finalTotal = Math.max(0, Math.round(itemTotal + deliveryFee + taxAndPackaging - discountAmount));

  // Ask the server which payment processor is active.
  useEffect(() => {
    let cancelled = false;
    apiFetch('/api/payments/config')
      .then((r) => r.json())
      .then((cfg) => {
        if (!cancelled) setStripeLive(Boolean(cfg?.live));
      })
      .catch(() => {
        if (!cancelled) setStripeLive(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Real Stripe needs both halves: a live server and a publishable key here.
  const useStripe = stripeLive === true && isStripeConfigured;

  /**
   * Creates the order record.
   *
   * Payment is no longer performed here. For card orders Stripe has already
   * charged and the server has re-verified the intent by the time this runs, so
   * this only persists the order. `paymentIntentId` is empty for cash orders.
   */
  const finaliseOrder = async (paymentIntentId: string) => {
    if (items.length === 0) return;

    setIsProcessing(true);
    setErrorMsg('');

    try {
      const orderPayload = {
        userId: user?.id || 'usr_guest',
        restaurantId: restaurantId || 'rest_1',
        restaurantName: restaurantName || 'Pizza Maestro',
        items,
        subtotal: itemTotal,
        discountAmount,
        taxAndFees: taxAndPackaging,
        deliveryFee,
        totalAmount: finalTotal,
        deliveryAddress: selectedAddress || {
          id: 'addr_default',
          title: 'Home',
          street: '123 Main Street, Apt 4B',
          city: 'New Delhi',
          state: 'DL',
          zipCode: '110001',
          landmark: 'Near Connaught Place',
        },
        paymentMethod:
          paymentMethod === 'cod' ? 'Cash on Delivery' : 'Credit/Debit Card',
        // The server decides the authoritative status; sent for completeness.
        paymentStatus: paymentMethod === 'cod' ? 'Pending' : 'Paid',
        paymentIntentId,
        couponCode: appliedCoupon?.code,
      };

      const result = await dispatch(createNewOrder(orderPayload));

      if (createNewOrder.fulfilled.match(result)) {
        setPaymentSuccess(true);
        dispatch(clearCart());
        showToast.success(
          paymentMethod === 'cod'
            ? 'Order placed — pay the driver on delivery.'
            : 'Payment successful — order placed!'
        );
        setTimeout(() => {
          onOrderSuccess(result.payload.id);
        }, 1500);
      } else {
        throw new Error('Failed to create order');
      }
    } catch (err: any) {
      const msg = err.message || 'An unexpected error occurred during checkout';
      setErrorMsg(msg);
      showToast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 py-2 px-3 bg-white rounded-control border border-surface-line text-[13px] font-bold text-ink-600 hover:bg-surface-sunken transition-colors shadow-card"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Cart</span>
        </button>

        <div className="flex items-center gap-1 text-[13px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          <ShieldCheck className="w-4 h-4" />
          <span>256-Bit SSL Encrypted Checkout</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Address & Stripe Payment Form */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Delivery Address Card */}
          <div className="bg-white rounded-panel p-6 border border-surface-line/80 shadow-card space-y-3">
            <div className="flex items-center justify-between border-b border-surface-line pb-3">
              <h3 className="text-base font-bold text-ink-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-600" /> Delivery Address
              </h3>
              <span className="text-[13px] font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg">
                Estimated 25 Mins
              </span>
            </div>

            <div className="p-4 bg-surface-sunken rounded-card border border-surface-line text-[13px] space-y-1">
              <div className="font-bold text-ink-900 text-sm">
                {selectedAddress?.title || 'Home'} Address
              </div>
              <p className="text-ink-600 leading-relaxed">
                {selectedAddress
                  ? `${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.state} ${selectedAddress.zipCode}`
                  : '123 Main Street, Apt 4B, Springfield, IL 62701'}
              </p>
              <p className="text-ink-500 font-medium pt-1">
                Contact: {user?.phone || '+1 (555) 234-5678'}
              </p>
            </div>
          </div>

          {/* Payment Method & Stripe Card Simulator */}
          <div className="bg-white rounded-panel p-6 border border-surface-line/80 shadow-card space-y-5">
            <div className="flex items-center justify-between border-b border-surface-line pb-3">
              <h3 className="text-base font-bold text-ink-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-brand-600" /> Payment Options
              </h3>
              <span className="text-[13px] text-ink-400">Powered by Stripe</span>
            </div>

            {/*
              Two methods, online preselected. Which processor handles an online
              payment is decided by the server (GET /api/payments/config):
                stripe -> real Stripe Elements card entry
                demo   -> built-in demo processor, no Stripe account needed
            */}
            <div className="grid gap-2.5 sm:grid-cols-2" role="radiogroup" aria-label="Payment method">
              {([
                {
                  value: 'online' as const,
                  icon: CreditCard,
                  title: useStripe ? 'Pay online by card' : 'Pay online',
                  blurb: useStripe ? 'Secured by Stripe' : 'Instant demo checkout',
                },
                {
                  value: 'cod' as const,
                  icon: Wallet,
                  title: 'Cash on delivery',
                  blurb: 'Pay the driver on arrival',
                },
              ]).map(({ value, icon: Icon, title, blurb }) => {
                const selected = paymentMethod === value;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => {
                      setPaymentMethod(value);
                      setErrorMsg('');
                    }}
                    className={`flex items-start gap-3 rounded-card border p-3.5 text-left transition-all ${
                      selected
                        ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
                        : 'border-surface-line bg-white hover:border-ink-400/50 hover:bg-surface-sunken/60'
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-control transition-colors ${
                        selected ? 'bg-brand-500 text-white' : 'bg-surface-sunken text-ink-500'
                      }`}
                    >
                      <Icon className="h-4 w-4" strokeWidth={2.5} />
                    </span>
                    <span className="min-w-0">
                      <span
                        className={`block text-[13px] font-bold tracking-tight ${
                          selected ? 'text-brand-700' : 'text-ink-900'
                        }`}
                      >
                        {title}
                      </span>
                      <span className="mt-0.5 block text-[13px] font-semibold leading-tight text-ink-500">
                        {blurb}
                      </span>
                    </span>
                    {selected && (
                      <span
                        aria-hidden="true"
                        className="ml-auto flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white"
                      >
                        <Check className="h-2.5 w-2.5" strokeWidth={4} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="space-y-4 pt-2">
              {errorMsg && (
                <div
                  role="alert"
                  className="rounded-control border border-danger-500/25 bg-danger-50 p-3 text-[13px] font-bold text-danger-600"
                >
                  {errorMsg}
                </div>
              )}

              {paymentMethod === 'cod' ? (
                <>
                  <p className="rounded-card border border-surface-line bg-surface-sunken/60 p-3.5 text-[13px] font-semibold leading-relaxed text-ink-600">
                    Please have ₹{finalTotal} ready for the driver. Payment is marked pending until
                    delivery is completed.
                  </p>

                  <Button
                    type="button"
                    size="lg"
                    fullWidth
                    variant="secondary"
                    loading={isProcessing}
                    loadingText="Placing order…"
                    disabled={items.length === 0 || paymentSuccess}
                    onClick={() => finaliseOrder('')}
                    icon={paymentSuccess ? <CheckCircle2 className="h-4 w-4" /> : <Wallet className="h-4 w-4" />}
                  >
                    {paymentSuccess
                      ? 'Order placed — redirecting…'
                      : `Confirm order · ₹${finalTotal} on delivery`}
                  </Button>
                </>
              ) : useStripe ? (
                <StripeCardForm
                  amount={finalTotal}
                  orderRef={restaurantName || undefined}
                  submitLabel={`Pay ₹${finalTotal} & Place Order`}
                  disabled={items.length === 0}
                  onError={(m) => setErrorMsg(m)}
                  onPaid={(paymentIntentId) => finaliseOrder(paymentIntentId)}
                />
              ) : (
                <>
                  <div className="rounded-card border border-surface-line bg-surface-sunken/60 p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-semibold text-ink-500">Amount payable</span>
                      <span className="text-sm font-bold tracking-tight text-ink-900">
                        ₹{finalTotal}
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    size="lg"
                    fullWidth
                    loading={isProcessing}
                    loadingText="Confirming payment…"
                    disabled={items.length === 0 || paymentSuccess}
                    onClick={() => finaliseOrder('')}
                    icon={paymentSuccess ? <CheckCircle2 className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  >
                    {paymentSuccess
                      ? 'Payment confirmed — redirecting…'
                      : `Pay ₹${finalTotal} & Place Order`}
                  </Button>

                  <p className="text-center text-[13px] font-medium text-ink-400">
                    Demo mode — no real money moves and no card is charged.
                  </p>
                </>
              )}
              </div>

          </div>

        </div>

        {/* Right Side: Order Summary */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-panel p-6 border border-surface-line/80 shadow-card space-y-4">
            <h3 className="text-base font-bold text-ink-900 border-b border-surface-line pb-3">
              Order Items ({items.length})
            </h3>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.cartItemId} className="flex gap-3 items-center text-[13px]">
                  <img
                    src={item.foodItem.image}
                    alt={item.foodItem.name}
                    className="w-12 h-12 rounded-control object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-ink-900 truncate">{item.foodItem.name}</h4>
                    <span className="text-ink-500">Qty: {item.quantity}</span>
                  </div>
                  <span className="font-semibold text-ink-900">
                    ₹{item.itemTotalPrice * item.quantity}
                  </span>
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div className="pt-3 border-t border-surface-line space-y-2 text-[13px]">
              <div className="flex justify-between text-ink-600">
                <span>Items Subtotal</span>
                <span>₹{itemTotal}</span>
              </div>

              <div className="flex justify-between text-ink-600">
                <span>Delivery Fee</span>
                <span>₹{deliveryFee}</span>
              </div>

              <div className="flex justify-between text-ink-600">
                <span>Taxes & Service</span>
                <span>₹{taxAndPackaging}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Coupon Discount ({appliedCoupon?.code})</span>
                  <span>-₹{discountAmount}</span>
                </div>
              )}

              <div className="pt-3 border-t border-surface-line flex justify-between items-center text-base font-bold text-ink-900">
                <span>Final Payable</span>
                <span className="text-brand-600">₹{finalTotal}</span>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
