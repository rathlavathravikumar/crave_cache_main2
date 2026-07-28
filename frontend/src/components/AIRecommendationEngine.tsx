import React, { useState, useEffect } from 'react';
import { Sparkles, Compass, Clock, DollarSign, Heart, TrendingUp, Search, RefreshCw, Layers, CheckCircle } from 'lucide-react';
import { RecommendationSection, FoodItem } from '../types';
import { FoodCard } from './FoodCard';
import { useAppSelector } from '../hooks/reduxHooks';

export const AIRecommendationEngine: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);
  
  const [sections, setSections] = useState<RecommendationSection[]>([]);
  const [combos, setCombos] = useState<any[]>([]);
  const [timeOfDay, setTimeOfDay] = useState<string>('Lunch');
  const [activeTab, setActiveTab] = useState<string>('rec_for_you');
  const [loading, setLoading] = useState<boolean>(true);
  const [query, setQuery] = useState<string>('');
  const [aiQueryResult, setAiQueryResult] = useState<{ summary: string | null; foods: FoodItem[] }>({
    summary: null,
    foods: [],
  });
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const fetchRecommendations = async (searchPrompt?: string) => {
    if (searchPrompt) setIsSearching(true);
    else setLoading(true);

    try {
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || 'usr_customer_1',
          query: searchPrompt || '',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSections(data.sections || []);
        setCombos(data.frequentlyOrderedTogether || []);
        setTimeOfDay(data.context?.timeOfDay || 'Lunch');

        if (searchPrompt) {
          setAiQueryResult({
            summary: data.aiQuerySummary || `Top picks for "${searchPrompt}"`,
            foods: data.queryMatchingFoods || [],
          });
        }
      }
    } catch (err) {
      console.error('Failed to load AI recommendations:', err);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [user?.id]);

  const handleQuickPrompt = (promptText: string) => {
    setQuery(promptText);
    fetchRecommendations(promptText);
  };

  const currentSection = sections.find((s) => s.id === activeTab) || sections[0];

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-orange-100 shadow-md space-y-6">
      
      {/* Top Engine Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full bg-orange-100 text-[#FF5200] text-xs font-black tracking-wide flex items-center gap-1.5 uppercase">
              <Sparkles className="w-3.5 h-3.5 text-[#FF5200] animate-pulse" /> AI Curation Engine
            </span>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1">
              <Clock className="w-3 h-3 text-orange-600" /> {timeOfDay} Focus
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Personalized For <span className="text-[#FF5200]">{user?.name?.split(' ')[0] || 'You'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Analyzed {user?.name ? 'your past orders' : 'trending taste profiles'}, diet preferences & time of day
          </p>
        </div>

        {/* Natural Language Prompt Search Bar */}
        <div className="w-full lg:max-w-md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (query.trim()) fetchRecommendations(query);
            }}
            className="flex items-center relative"
          >
            <Search className="w-4 h-4 text-orange-500 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask AI: e.g. 'I want something healthy under ₹300'..."
              className="w-full pl-10 pr-24 py-2.5 text-xs font-medium bg-orange-50/50 hover:bg-orange-50 focus:bg-white border border-orange-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#FF5200]/20 focus:border-[#FF5200] transition-all"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-[#FF5200] hover:bg-[#e04800] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1 shadow-sm"
            >
              {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Ask</span>
            </button>
          </form>

          {/* Quick Prompt Pills */}
          <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 text-[10px] font-bold no-scrollbar">
            <span className="text-slate-400 shrink-0">Try:</span>
            {[
              '🥗 Healthy Choices',
              '💰 Dinner under ₹300',
              '🌶️ Spicy Veg',
              '⭐ Best Rated Biryani',
            ].map((pill, i) => (
              <button
                key={i}
                onClick={() => handleQuickPrompt(pill.replace(/^[^\w]+/, ''))}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-orange-100 text-slate-700 hover:text-orange-900 border border-slate-200 hover:border-orange-200 whitespace-nowrap transition-all"
              >
                {pill}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AI Prompt Query Result View */}
      {aiQueryResult.summary && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/5 border border-orange-200/80 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-black text-orange-900">
              <Sparkles className="w-4 h-4 text-[#FF5200]" />
              <span>AI Curation Summary</span>
            </div>
            <button
              onClick={() => setAiQueryResult({ summary: null, foods: [] })}
              className="text-[11px] font-bold text-slate-400 hover:text-slate-600"
            >
              Clear AI Search
            </button>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed font-medium">
            {aiQueryResult.summary}
          </p>

          {aiQueryResult.foods.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {aiQueryResult.foods.map((food) => (
                <FoodCard key={food.id} foodItem={food} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-100 no-scrollbar">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveTab(section.id)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === section.id
                ? 'bg-[#FF5200] text-white shadow-md shadow-[#FF5200]/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <span>{section.title}</span>
            {section.badge && (
              <span
                className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                  activeTab === section.id
                    ? 'bg-white/20 text-white'
                    : 'bg-orange-100 text-orange-800'
                }`}
              >
                {section.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Section Content Display */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : currentSection ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">{currentSection.title}</h3>
              <p className="text-xs text-slate-500">{currentSection.subtitle}</p>
            </div>
            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg">
              {currentSection.items.length} Curated Items
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentSection.items.map((food) => (
              <FoodCard key={food.id} foodItem={food} />
            ))}
          </div>
        </div>
      ) : null}

      {/* Frequently Ordered Together Pairings */}
      {combos.length > 0 && (
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#FF5200]" /> Frequently Ordered Together
            </h3>
            <p className="text-xs text-slate-500">Perfect pairing suggestions with multi-item savings</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {combos.map((combo) => (
              <div
                key={combo.id}
                className="p-4 rounded-2xl bg-orange-50/50 border border-orange-200/60 flex flex-col justify-between gap-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-extrabold text-slate-900 block">{combo.title}</span>
                    <span className="text-[11px] font-medium text-slate-500">{combo.subtitle}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black">
                    {combo.badge}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {combo.items.map((item: FoodItem) => (
                    <div key={item.id} className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center gap-2">
                      <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-slate-800 block truncate">{item.name}</span>
                        <span className="text-[11px] font-extrabold text-slate-900">₹{item.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
