import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Sparkles,
  X,
  Send,
  ShoppingBag,
  Bot,
  User,
  Tag,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks/reduxHooks';
import {
  toggleAIAssistant,
  queryAIAssistant,
  clearAIMessages,
} from '../store/slices/aiSlice';
import { addToCart, applyCouponCode, toggleCartDrawer } from '../store/slices/cartSlice';

interface AIFoodAssistantProps {
  onNavigateCheckout: () => void;
}

export const AIFoodAssistant: React.FC<AIFoodAssistantProps> = ({ onNavigateCheckout }) => {
  const dispatch = useAppDispatch();
  const { isAssistantOpen, messages, loading } = useAppSelector((state) => state.ai);

  const [input, setInput] = useState('');
  const [confirmingRec, setConfirmingRec] = useState<any>(null);

  // Escape closes the panel and the page behind it stops scrolling, matching
  // the cart drawer. Escape is ignored while the confirm dialog is stacked on
  // top so the first press dismisses that dialog rather than the whole panel.
  useEffect(() => {
    if (!isAssistantOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (confirmingRec) {
        setConfirmingRec(null);
        return;
      }
      dispatch(toggleAIAssistant(false));
    };

    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isAssistantOpen, confirmingRec, dispatch]);

  const handleSend = (promptText?: string) => {
    const query = promptText || input;
    if (!query.trim() || loading) return;
    dispatch(queryAIAssistant(query));
    if (!promptText) setInput('');
  };

  const handleConfirmOrder = async (rec: any) => {
    if (!rec || !rec.suggestedItems || rec.suggestedItems.length === 0) return;

    // Add suggested items to cart
    rec.suggestedItems.forEach((item: any) => {
      dispatch(
        addToCart({
          foodItem: item.foodItem,
          quantity: item.quantity || 1,
          customizations: item.customization,
        })
      );
    });

    // Apply coupon if recommended
    if (rec.suggestedCoupon) {
      const subtotal = rec.suggestedItems.reduce(
        (sum: number, i: any) => sum + i.foodItem.price * (i.quantity || 1),
        0
      );
      dispatch(
        applyCouponCode({
          code: rec.suggestedCoupon.code,
          cartAmount: subtotal,
        })
      );
    }

    setConfirmingRec(null);
    dispatch(toggleAIAssistant(false));
    dispatch(toggleCartDrawer(true));
  };

  const samplePrompts = [
    'Spicy vegetarian pizza under ₹350',
    'High protein lunch for 2 people',
    'Comfort food with dessert',
    'Healthy organic bowl & green juice',
  ];

  return (
    <AnimatePresence>
      {isAssistantOpen && (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={() => dispatch(toggleAIAssistant(false))}
        className="absolute inset-0 bg-ink-900/40 backdrop-blur-xs"
        aria-hidden="true"
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="AI food assistant"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 420, damping: 40 }}
        className="relative w-full max-w-lg bg-white h-full shadow-overlay flex flex-col"
      >

        {/* Drawer Header */}
        <div className="px-5 py-4 bg-white border-b border-surface-line flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-control bg-brand-500 flex items-center justify-center text-white shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-ink-900">AI food assistant</h2>
              <p className="text-[13px] text-ink-500">Describe a craving in your own words</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => dispatch(clearAIMessages())}
              className="text-[13px] font-medium text-ink-500 hover:text-ink-900 px-2 py-1 rounded-md hover:bg-surface-sunken transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() => dispatch(toggleAIAssistant(false))}
              aria-label="Close assistant"
              className="p-1.5 rounded-lg text-ink-400 hover:text-ink-900 hover:bg-surface-sunken transition-colors"
            >
              <X className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-sunken">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-card p-3.5 text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-ink-900 text-white rounded-br-sm'
                    : 'bg-white border border-surface-line text-ink-800 rounded-bl-sm'
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>

                {/* AI Structured Recommendation Card */}
                {msg.recommendation && (
                  <div className="mt-3 pt-3 border-t border-surface-line space-y-3">

                    <p className="text-[13px] text-ink-600 bg-surface-sunken p-2.5 rounded-control leading-relaxed">
                      {msg.recommendation.explanation}
                    </p>

                    {/* Suggested Items */}
                    <div className="space-y-2">
                      {msg.recommendation.suggestedItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex gap-3 p-2.5 rounded-control border border-surface-line items-center"
                        >
                          <img
                            src={item.foodItem.image}
                            alt={item.foodItem.name}
                            className="w-14 h-14 rounded-lg object-cover shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="text-[13px] font-semibold text-ink-900 truncate">
                                {item.foodItem.name}
                              </h4>
                              <span className="text-[13px] font-semibold text-ink-900 tnum shrink-0">
                                ₹{item.foodItem.price}
                              </span>
                            </div>
                            <p className="text-[12px] text-ink-500 truncate">
                              {item.restaurant?.name || item.foodItem.restaurantName}
                            </p>
                            <p className="text-[12px] text-brand-600 mt-0.5 truncate">
                              {item.reason}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Coupon Badge */}
                    {msg.recommendation.suggestedCoupon && (
                      <div className="flex items-center gap-2 p-2.5 bg-success-50 text-success-600 rounded-control text-[13px]">
                        <Tag className="w-4 h-4 shrink-0" />
                        <span>
                          Coupon <strong className="font-semibold">{msg.recommendation.suggestedCoupon.code}</strong>{' '}
                          — {msg.recommendation.suggestedCoupon.description}
                        </span>
                      </div>
                    )}

                    {/* Action Button: Review & Confirm */}
                    <div className="pt-1">
                      <button
                        onClick={() => setConfirmingRec(msg.recommendation)}
                        className="btn btn-primary w-full"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        Review selection
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-full bg-ink-800 text-white flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center">
              <div className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white p-3 rounded-card border border-surface-line text-[13px] text-ink-600 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-brand-500 animate-spin shrink-0" />
                <span>Searching menus and matching offers…</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Sample Chips */}
        <div className="px-4 pt-3 bg-white border-t border-surface-line">
          <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar">
            {samplePrompts.map((prompt, i) => (
              <button key={i} onClick={() => handleSend(prompt)} className="chip shrink-0">
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-surface-line">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. spicy pizza under ₹350"
              aria-label="Message the AI assistant"
              className="field flex-1"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send"
              className="btn btn-primary px-3 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </motion.div>

      {/* Confirmation Modal (Ensures user explicitly confirms before items enter checkout) */}
      {confirmingRec && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-ink-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-panel max-w-md w-full shadow-overlay p-6 relative animate-popIn">
            <button
              onClick={() => setConfirmingRec(null)}
              aria-label="Close"
              className="absolute top-4 right-4 p-1.5 rounded-lg text-ink-400 hover:text-ink-900 hover:bg-surface-sunken transition-colors"
            >
              <X className="w-[18px] h-[18px]" />
            </button>

            <h3 className="text-lg font-bold text-ink-900 tracking-tight pr-8">Confirm your selection</h3>
            <p className="text-[13px] text-ink-500 mt-1 mb-4">
              These items match your request. Confirm to add them to your cart.
            </p>

            <div className="space-y-2 max-h-56 overflow-y-auto mb-4 pr-1">
              {confirmingRec.suggestedItems.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="flex justify-between items-center gap-3 p-3 rounded-control border border-surface-line"
                >
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-ink-900 block truncate">
                      {item.foodItem.name}
                    </span>
                    <span className="text-[13px] text-ink-500">
                      Qty {item.quantity || 1} · {item.restaurant?.name}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-ink-900 tnum shrink-0">
                    ₹{item.foodItem.price * (item.quantity || 1)}
                  </span>
                </div>
              ))}
            </div>

            {confirmingRec.suggestedCoupon && (
              <div className="mb-4 p-3 bg-success-50 rounded-control text-[13px] text-success-600 flex justify-between items-center">
                <span>
                  Coupon <strong className="font-semibold">{confirmingRec.suggestedCoupon.code}</strong>
                </span>
                <span className="font-semibold">Applied</span>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setConfirmingRec(null)} className="btn btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={() => handleConfirmOrder(confirmingRec)}
                className="btn btn-primary flex-1"
              >
                Add to cart
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
      )}
    </AnimatePresence>
  );
};
