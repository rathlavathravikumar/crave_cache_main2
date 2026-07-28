import React, { useState } from 'react';
import { X, Check, Plus, ShoppingBag } from 'lucide-react';
import { FoodItem, FoodCustomizationOption, CartCustomizationSelection } from '../types';

interface FoodCustomizerModalProps {
  foodItem: FoodItem;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (customizations: CartCustomizationSelection[], specialInstructions: string) => void;
}

export const FoodCustomizerModal: React.FC<FoodCustomizerModalProps> = ({
  foodItem,
  isOpen,
  onClose,
  onAddToCart,
}) => {
  const [selections, setSelections] = useState<Record<string, FoodCustomizationOption[]>>(() => {
    const initial: Record<string, FoodCustomizationOption[]> = {};
    foodItem.customizationGroups?.forEach((group) => {
      if (group.required && group.options.length > 0) {
        initial[group.title] = [group.options[0]];
      } else {
        initial[group.title] = [];
      }
    });
    return initial;
  });

  const [instructions, setInstructions] = useState('');

  if (!isOpen) return null;

  const handleOptionToggle = (groupTitle: string, option: FoodCustomizationOption, isRequired: boolean) => {
    setSelections((prev) => {
      const current = prev[groupTitle] || [];
      if (isRequired) {
        return { ...prev, [groupTitle]: [option] };
      } else {
        const exists = current.some((o) => o.name === option.name);
        if (exists) {
          return { ...prev, [groupTitle]: current.filter((o) => o.name !== option.name) };
        } else {
          return { ...prev, [groupTitle]: [...current, option] };
        }
      }
    });
  };

  // Calculate customized total price
  let basePrice = foodItem.price;
  (Object.values(selections) as FoodCustomizationOption[][]).forEach((opts) => {
    opts.forEach((o) => {
      basePrice += o.price;
    });
  });

  const handleConfirm = () => {
    const formatted: CartCustomizationSelection[] = (
      Object.entries(selections) as [string, FoodCustomizationOption[]][]
    )
      .filter(([_, opts]) => opts.length > 0)
      .map(([groupTitle, selectedOptions]) => ({
        groupTitle,
        selectedOptions,
      }));

    onAddToCart(formatted, instructions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100">
        
        {/* Modal Header */}
        <div className="relative h-44 bg-slate-100">
          <img src={foodItem.image} alt={foodItem.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <h3 className="text-lg font-extrabold">{foodItem.name}</h3>
            <p className="text-xs text-slate-200 line-clamp-1">{foodItem.description}</p>
          </div>
        </div>

        {/* Options List */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          {foodItem.customizationGroups?.map((group) => (
            <div key={group.id} className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  {group.title}
                </h4>
                {group.required ? (
                  <span className="text-[10px] font-bold text-red-600 uppercase bg-red-50 px-2 py-0.5 rounded">
                    Required
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-400">Optional</span>
                )}
              </div>

              <div className="space-y-1.5">
                {group.options.map((opt, i) => {
                  const isSelected = (selections[group.title] || []).some((o) => o.name === opt.name);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleOptionToggle(group.title, opt, group.required)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50/60 text-orange-950 shadow-2xs'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-orange-600 bg-orange-600 text-white' : 'border-slate-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span>{opt.name}</span>
                      </div>
                      <span className="text-slate-500">
                        {opt.price > 0 ? `+₹${opt.price}` : 'Free'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Special Cooking Instructions */}
          <div>
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
              Special Instructions
            </label>
            <input
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Less spicy, extra napkins, cut into slices..."
              className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Price</span>
            <span className="text-lg font-black text-slate-900">₹{basePrice}</span>
          </div>

          <button
            onClick={handleConfirm}
            className="flex-1 py-3 px-5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Add Customization to Cart</span>
          </button>
        </div>

      </div>
    </div>
  );
};
