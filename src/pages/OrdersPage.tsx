import React, { useEffect, useState } from 'react';
import { Clock, Bike, CheckCircle2, RefreshCw, Eye, ArrowRight, ShoppingBag, Star, MessageSquare } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks/reduxHooks';
import { fetchUserOrders, setOrderReview } from '../store/slices/orderSlice';
import { addToCart } from '../store/slices/cartSlice';
import { OrderTrackerModal } from '../components/OrderTrackerModal';
import { Order } from '../types';
import { showToast } from '../utils/toast';
import { apiFetch } from '../utils/apiBase';

interface OrdersPageProps {
  onNavigateHome: () => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({ onNavigateHome }) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const { orders, loading } = useAppSelector((state) => state.orders);

  const [selectedTrackOrder, setSelectedTrackOrder] = useState<Order | null>(null);
  const [reviewModalOrder, setReviewModalOrder] = useState<Order | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    dispatch(fetchUserOrders(user?.id || 'usr_customer_1'));
  }, [dispatch, user]);

  const handleReorder = (order: Order) => {
    order.items.forEach((item) => {
      dispatch(
        addToCart({
          foodItem: item.foodItem,
          quantity: item.quantity,
          customizations: item.customizations,
        })
      );
    });
    showToast.success('Items added back to your cart!');
  };

  const handleOpenReview = (order: Order) => {
    setReviewModalOrder(order);
    setRating(order.rating || 5);
    setComment(order.reviewComment || '');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalOrder || !comment.trim()) return;

    setSubmittingReview(true);
    try {
      await apiFetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || 'usr_customer_1',
          userName: user?.name || 'Valued Customer',
          userAvatar: user?.avatar,
          restaurantId: reviewModalOrder.restaurantId,
          rating,
          comment,
        }),
      });

      dispatch(
        setOrderReview({
          orderId: reviewModalOrder.id,
          rating,
          reviewComment: comment,
        })
      );

      setReviewModalOrder(null);
      setComment('');
      showToast.success('Thank you! Your review has been submitted successfully.');
    } catch (err) {
      console.error('Failed to submit review:', err);
      showToast.error('Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      
      <div className="flex items-center justify-between border-b border-surface-line pb-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 flex items-center gap-2">
            <Clock className="w-6 h-6 text-brand-600" /> My Food Orders
          </h1>
          <p className="text-[13px] text-ink-500">Track active deliveries, reorder favorites, and rate your meals</p>
        </div>

        <button
          onClick={onNavigateHome}
          className="py-2 px-4 bg-brand-500 hover:bg-brand-700 text-white font-bold text-[13px] rounded-control transition-all shadow-card"
        >
          Order Food Now
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 bg-slate-200 rounded-card animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-surface-sunken rounded-panel border border-surface-line space-y-3">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-ink-900">No Orders Placed Yet</h3>
          <p className="text-[13px] text-ink-500 max-w-sm mx-auto">
            You haven't ordered any food yet. Ask our AI Assistant or explore top restaurants!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-panel p-5 border border-surface-line/80 shadow-card hover:shadow-md transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-line pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-ink-900 text-base">{order.restaurantName}</h3>
                    <span className="text-[13px] text-ink-400 font-mono">#{order.id}</span>
                  </div>
                  <span className="text-[13px] text-ink-500 block">
                    {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-[13px] font-bold ${
                      order.status === 'Delivered'
                        ? 'bg-emerald-100 text-emerald-800'
                        : order.status === 'Cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800 animate-pulse'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>

              {/* Items List Summary */}
              <div className="space-y-1.5 text-[13px] text-ink-600">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="font-semibold text-ink-800">
                      {item.quantity}x {item.foodItem.name}
                    </span>
                    <span className="font-bold text-ink-900">
                      ₹{item.itemTotalPrice * item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              {/* Submitted Review Display (if reviewed) */}
              {order.reviewed && order.rating && (
                <div className="bg-amber-50/70 border border-amber-200/70 rounded-card p-3.5 space-y-1 text-[13px]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= (order.rating || 0)
                              ? 'text-amber-500 fill-amber-500'
                              : 'text-slate-300'
                          }`}
                        />
                      ))}
                      <span className="font-bold text-amber-900 ml-1">{order.rating}.0 / 5.0</span>
                    </div>
                    <button
                      onClick={() => handleOpenReview(order)}
                      className="text-brand-600 font-bold hover:underline text-[13px]"
                    >
                      Edit Review
                    </button>
                  </div>
                  {order.reviewComment && (
                    <p className="text-ink-600 italic">"{order.reviewComment}"</p>
                  )}
                </div>
              )}

              {/* Order Footer Actions */}
              <div className="pt-3 border-t border-surface-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-[13px] font-bold text-ink-900">
                  Total Paid: <span className="text-brand-600 text-sm">₹{order.totalAmount}</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {order.status === 'Delivered' && !order.reviewed && (
                    <button
                      onClick={() => handleOpenReview(order)}
                      className="py-2 px-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[13px] rounded-control transition-all flex items-center gap-1.5 shadow-card"
                    >
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>Rate & Review</span>
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedTrackOrder(order)}
                    className="py-2 px-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[13px] rounded-control transition-all flex items-center gap-1.5 shadow-card"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    <span>Track Live Progress</span>
                  </button>

                  <button
                    onClick={() => handleReorder(order)}
                    className="py-2 px-3.5 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-100 font-bold text-[13px] rounded-control transition-all flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reorder</span>
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Tracker Modal */}
      {selectedTrackOrder && (
        <OrderTrackerModal
          order={selectedTrackOrder}
          onClose={() => setSelectedTrackOrder(null)}
        />
      )}

      {/* Review & Star Rating Modal */}
      {reviewModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-panel max-w-md w-full p-6 shadow-2xl border border-surface-line space-y-5 animate-popIn">
            <div className="flex items-center justify-between border-b border-surface-line pb-3">
              <div>
                <h3 className="text-base font-semibold text-ink-900">Rate & Review Meal</h3>
                <p className="text-[13px] text-ink-500">{reviewModalOrder.restaurantName} (Order #{reviewModalOrder.id})</p>
              </div>
              <button
                onClick={() => setReviewModalOrder(null)}
                className="w-8 h-8 rounded-full bg-surface-sunken hover:bg-slate-200 flex items-center justify-center text-ink-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-[13px] font-bold text-ink-600 mb-2">Overall Star Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`p-2.5 rounded-control text-lg font-bold border transition-all flex items-center gap-1 ${
                        rating >= star
                          ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : 'bg-surface-sunken text-ink-400 border-surface-line hover:bg-surface-sunken'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${rating >= star ? 'fill-current' : ''}`} />
                      <span>{star}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-ink-600 mb-1">Your Detailed Feedback</label>
                <textarea
                  required
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="How was the food taste, packaging quality, and delivery speed?"
                  className="w-full p-3 text-[13px] bg-surface-sunken border border-surface-line rounded-control outline-none focus:border-brand-500 text-ink-800"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalOrder(null)}
                  className="flex-1 py-2.5 text-[13px] font-semibold border border-surface-line rounded-control hover:bg-surface-sunken text-ink-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="flex-1 py-2.5 text-[13px] font-bold bg-brand-500 hover:bg-brand-700 text-white rounded-control shadow-card transition-all disabled:opacity-50"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
