import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Send,
  ShoppingBag,
  Bot,
  User,
  CheckCircle2,
  Tag,
  ArrowRight,
  Flame,
  Zap,
  Info,
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

  if (!isAssistantOpen) return null;

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
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-100">
        
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 bg-[#1F2937] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF5200] flex items-center justify-center text-white shadow-md shadow-[#FF5200]/20">
              <Sparkles className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-1.5">
                CraveAI Assistant <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-extrabold uppercase">3.6 Flash</span>
              </h2>
              <p className="text-xs text-slate-300">Natural language food curation & smart savings</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => dispatch(clearAIMessages())}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() => dispatch(toggleAIAssistant(false))}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-slate-900 text-white rounded-br-none shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-xs'
                }`}
              >
                <p className="font-medium whitespace-pre-line">{msg.text}</p>

                {/* AI Structured Recommendation Card */}
                {msg.recommendation && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
                    
                    <p className="text-xs text-slate-600 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200/60 font-normal">
                      💡 <strong>AI Analysis:</strong> {msg.recommendation.explanation}
                    </p>

                    {/* Suggested Items */}
                    <div className="space-y-2">
                      {msg.recommendation.suggestedItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 items-center"
                        >
                          <img
                            src={item.foodItem.image}
                            alt={item.foodItem.name}
                            className="w-14 h-14 rounded-lg object-cover shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="font-bold text-slate-900 text-xs truncate">
                                {item.foodItem.name}
                              </h4>
                              <span className="font-bold text-orange-600 text-xs">
                                ₹{item.foodItem.price}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 truncate">
                              {item.restaurant?.name || item.foodItem.restaurantName}
                            </p>
                            <p className="text-[10px] text-amber-800 mt-0.5 italic truncate">
                              "{item.reason}"
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Coupon Badge */}
                    {msg.recommendation.suggestedCoupon && (
                      <div className="flex items-center gap-2 p-2 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-semibold">
                        <Tag className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Suggested Coupon: <strong>{msg.recommendation.suggestedCoupon.code}</strong> ({msg.recommendation.suggestedCoupon.description})</span>
                      </div>
                    )}

                    {/* Action Button: Review & Confirm */}
                    <div className="pt-1">
                      <button
                        onClick={() => setConfirmingRec(msg.recommendation)}
                        className="w-full py-2.5 px-4 bg-[#FF5200] hover:bg-[#e04800] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>Review & Confirm AI Selection</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center">
              <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white p-3 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-center gap-2 shadow-xs">
                <Zap className="w-4 h-4 text-amber-500 animate-spin" />
                <span>CraveAI is searching restaurants, matching menus & calculating discounts...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Sample Chips */}
        <div className="p-3 bg-white border-t border-slate-100 space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Try Quick Prompts:</p>
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {samplePrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                className="whitespace-nowrap px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-slate-700 border border-slate-200 transition-colors"
              >
                ✨ {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-slate-200">
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
              placeholder="Ask CraveAI (e.g., 'Spicy pizza under ₹350')..."
              className="flex-1 py-2.5 px-4 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 bg-[#FF5200] hover:bg-[#e04800] text-white rounded-xl disabled:opacity-40 transition-colors shadow-2xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>

      {/* Confirmation Modal (Ensures user explicitly confirms before items enter checkout) */}
      {confirmingRec && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 border border-slate-100 relative">
            <button
              onClick={() => setConfirmingRec(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-orange-600 mb-2">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">User Confirmation Required</span>
            </div>

            <h3 className="text-lg font-extrabold text-slate-900 mb-1">Confirm AI Order Selection</h3>
            <p className="text-xs text-slate-500 mb-4">
              CraveAI selected these items matching your prompt. Confirm to add them to your cart and proceed.
            </p>

            <div className="space-y-2 max-h-56 overflow-y-auto mb-4 pr-1">
              {confirmingRec.suggestedItems.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{item.foodItem.name}</span>
                    <span className="text-slate-500">Qty: {item.quantity || 1} • {item.restaurant?.name}</span>
                  </div>
                  <span className="font-bold text-slate-900">₹{item.foodItem.price * (item.quantity || 1)}</span>
                </div>
              ))}
            </div>

            {confirmingRec.suggestedCoupon && (
              <div className="mb-4 p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex justify-between items-center">
                <span>Coupon <strong>{confirmingRec.suggestedCoupon.code}</strong></span>
                <span className="font-bold text-emerald-700">Applied</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmingRec(null)}
                className="flex-1 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmOrder(confirmingRec)}
                className="flex-1 py-2.5 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <span>Add to Cart & Checkout</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
