import React, { useState } from 'react';
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
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks/reduxHooks';
import { createNewOrder } from '../store/slices/orderSlice';
import { clearCart } from '../store/slices/cartSlice';
import { showToast } from '../utils/toast';

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

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState(user?.name || 'Alex Johnson');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Calculations
  const itemTotal = items.reduce((acc, item) => acc + item.itemTotalPrice * item.quantity, 0);
  const deliveryFee = items.length > 0 ? 40 : 0;
  const taxAndPackaging = items.length > 0 ? Math.round(itemTotal * 0.05 + 25) : 0;
  const finalTotal = Math.max(0, Math.round(itemTotal + deliveryFee + taxAndPackaging - discountAmount));

  const handleFillDemoCard = () => {
    setCardNumber('4242 •••• •••• 4242');
    setCardExpiry('12/28');
    setCardCvc('123');
    setCardName(user?.name || 'Alex Johnson');
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setIsProcessing(true);
    setErrorMsg('');

    try {
      let stripePaymentIntentId = '';

      if (paymentMethod === 'card') {
        if (!cardNumber || !cardExpiry || !cardCvc || !cardName) {
          throw new Error('Please fill in all credit/debit card details.');
        }

        // Step 1: Create Payment Intent on Server
        const intentRes = await fetch('/api/payments/create-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: finalTotal, currency: 'inr' }),
        });
        const intentData = await intentRes.json();

        if (!intentRes.ok) throw new Error(intentData.error || 'Payment initialization failed');

        stripePaymentIntentId = intentData.paymentIntentId;

        // Step 2: Confirm Payment Intent on Server
        const confirmRes = await fetch('/api/payments/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentIntentId: intentData.paymentIntentId }),
        });
        const confirmData = await confirmRes.json();

        if (!confirmRes.ok || confirmData.status !== 'succeeded') {
          throw new Error(confirmData.error || 'Card authorization failed. Please check details.');
        }
      }

      // Step 3: Create Order Record
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
        paymentMethod: paymentMethod === 'card' ? 'Credit/Debit Card' : 'Cash on Delivery',
        paymentStatus: paymentMethod === 'card' ? 'Paid' : 'Pending',
        paymentIntentId: stripePaymentIntentId,
        couponCode: appliedCoupon?.code,
      };

      const result = await dispatch(createNewOrder(orderPayload));

      if (createNewOrder.fulfilled.match(result)) {
        setPaymentSuccess(true);
        dispatch(clearCart());
        showToast.success('Payment Successful & Order Placed!');
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
          className="flex items-center gap-2 py-2 px-3 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Cart</span>
        </button>

        <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          <ShieldCheck className="w-4 h-4" />
          <span>256-Bit SSL Encrypted Checkout</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Address & Stripe Payment Form */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Delivery Address Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-600" /> Delivery Address
              </h3>
              <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg">
                Estimated 25 Mins
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-900 text-sm">
                {selectedAddress?.title || 'Home'} Address
              </div>
              <p className="text-slate-600 leading-relaxed">
                {selectedAddress
                  ? `${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.state} ${selectedAddress.zipCode}`
                  : '123 Main Street, Apt 4B, Springfield, IL 62701'}
              </p>
              <p className="text-slate-500 font-medium pt-1">
                Contact: {user?.phone || '+1 (555) 234-5678'}
              </p>
            </div>
          </div>

          {/* Payment Method & Stripe Card Simulator */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-orange-600" /> Payment Options
              </h3>
              <span className="text-xs text-slate-400">Powered by Stripe</span>
            </div>

            {/* Payment Method Tabs */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  paymentMethod === 'card'
                    ? 'border-orange-500 bg-orange-50/60 text-orange-950 shadow-2xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-4 h-4 text-orange-600" />
                <span>Credit / Debit Card</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cod')}
                className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  paymentMethod === 'cod'
                    ? 'border-orange-500 bg-orange-50/60 text-orange-950 shadow-2xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                💵 <span>Cash on Delivery</span>
              </button>
            </div>

            {paymentMethod === 'card' && (
              <form onSubmit={handlePlaceOrder} className="space-y-4 pt-2">
                
                {/* Stripe Quick Demo Filler Button */}
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-amber-900 font-medium">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Test Payment Integration Mode</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleFillDemoCard}
                    className="py-1 px-2.5 bg-amber-600 text-white font-bold rounded-lg text-[11px] shadow-2xs hover:bg-amber-700 transition-colors"
                  >
                    Auto-Fill Test Card
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cardholder Name</label>
                  <input
                    type="text"
                    required
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="Alex Johnson"
                    className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-orange-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Card Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4242 4242 4242 4242"
                      className="w-full p-3 pl-10 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-orange-500 font-mono font-bold"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Expiry (MM/YY)</label>
                    <input
                      type="text"
                      required
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="12/28"
                      className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-orange-500 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">CVC Code</label>
                    <input
                      type="password"
                      required
                      maxLength={4}
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      placeholder="123"
                      className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-orange-500 font-mono font-bold"
                    />
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 font-medium">
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isProcessing || items.length === 0}
                  className="w-full py-4 px-6 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-black text-sm rounded-2xl shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Zap className="w-5 h-5 animate-spin text-amber-200" />
                      <span>Authorizing Stripe Payment...</span>
                    </>
                  ) : paymentSuccess ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                      <span>Payment Confirmed! Redirecting...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Pay ₹{finalTotal} & Place Order</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {paymentMethod === 'cod' && (
              <div className="space-y-4 pt-2">
                <p className="text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-200 leading-relaxed">
                  Please keep exact cash ready upon delivery. Our driver will carry a wireless card machine as well.
                </p>

                <button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing || items.length === 0}
                  className="w-full py-4 px-6 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm rounded-2xl shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isProcessing ? 'Placing Order...' : `Confirm Order for ₹${finalTotal} (Cash)`}
                </button>
              </div>
            )}

          </div>

        </div>

        {/* Right Side: Order Summary */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3">
              Order Items ({items.length})
            </h3>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.cartItemId} className="flex gap-3 items-center text-xs">
                  <img
                    src={item.foodItem.image}
                    alt={item.foodItem.name}
                    className="w-12 h-12 rounded-xl object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 truncate">{item.foodItem.name}</h4>
                    <span className="text-slate-500">Qty: {item.quantity}</span>
                  </div>
                  <span className="font-extrabold text-slate-900">
                    ₹{item.itemTotalPrice * item.quantity}
                  </span>
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div className="pt-3 border-t border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal</span>
                <span>₹{itemTotal}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Delivery Fee</span>
                <span>₹{deliveryFee}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Taxes & Service</span>
                <span>₹{taxAndPackaging}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Coupon Discount ({appliedCoupon?.code})</span>
                  <span>-₹{discountAmount}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-base font-black text-slate-900">
                <span>Final Payable</span>
                <span className="text-orange-600">₹{finalTotal}</span>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
