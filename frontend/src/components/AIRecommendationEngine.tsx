import React, { useState, useEffect } from 'react';
import { Sparkles, Search, RefreshCw } from 'lucide-react';
import { RecommendationSection, FoodItem } from '../types';
import { FoodCard } from './FoodCard';
import { useAppSelector } from '../hooks/reduxHooks';
import { apiFetch } from '../utils/apiBase';

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
      const res = await apiFetch('/api/recommendations', {
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
    <section className="space-y-6">

      {/* Section header + natural-language prompt */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div>
          <h2 className="section-title">
            Recommended for {user?.name?.split(' ')[0] || 'you'}
          </h2>
          <p className="section-sub flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-500 shrink-0" />
            Curated from your orders, diet preferences and the {timeOfDay.toLowerCase()} menu
          </p>
        </div>

        {/* Natural Language Prompt Search Bar */}
        <div className="w-full lg:max-w-md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (query.trim()) fetchRecommendations(query);
            }}
            className="relative flex items-center"
          >
            <Search className="w-[18px] h-[18px] text-ink-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask AI: something healthy under ₹300"
              aria-label="Ask the AI for a recommendation"
              className="field pl-11 pr-[86px]"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="btn btn-primary btn-sm absolute right-1.5"
            >
              {isSearching ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Ask
            </button>
          </form>

          {/* Quick Prompt Pills */}
          <div className="flex items-center gap-2 mt-2.5 overflow-x-auto pb-1 no-scrollbar">
            {['Healthy choices', 'Dinner under ₹300', 'Spicy veg', 'Best rated biryani'].map(
              (pill) => (
                <button
                  key={pill}
                  onClick={() => handleQuickPrompt(pill)}
                  className="chip shrink-0"
                >
                  {pill}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* AI Prompt Query Result View */}
      {aiQueryResult.summary && (
        <div className="rounded-card border border-brand-100 bg-brand-50 p-5 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm text-ink-800 leading-relaxed flex-1">
              <Sparkles className="w-4 h-4 text-brand-500 inline-block mr-1.5 -mt-0.5" />
              {aiQueryResult.summary}
            </p>
            <button
              onClick={() => setAiQueryResult({ summary: null, foods: [] })}
              className="text-[13px] font-medium text-ink-500 hover:text-ink-900 shrink-0"
            >
              Clear
            </button>
          </div>

          {aiQueryResult.foods.length > 0 && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pt-1">
              {aiQueryResult.foods.map((food) => (
                <FoodCard key={food.id} foodItem={food} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div
        role="tablist"
        aria-label="Recommendation categories"
        className="flex items-center gap-6 overflow-x-auto border-b border-surface-line no-scrollbar"
      >
        {sections.map((section) => {
          const isActive = activeTab === section.id;
          return (
            <button
              key={section.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(section.id)}
              className={`relative pb-3 text-sm whitespace-nowrap transition-colors ${
                isActive
                  ? 'font-semibold text-brand-600'
                  : 'font-medium text-ink-500 hover:text-ink-900'
              }`}
            >
              {section.title}
              {isActive && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-brand-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Section Content Display */}
      {loading ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-36 rounded-card skeleton" />
          ))}
        </div>
      ) : currentSection ? (
        <div className="space-y-4">
          <p className="text-[13px] text-ink-500">{currentSection.subtitle}</p>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {currentSection.items.map((food) => (
              <FoodCard key={food.id} foodItem={food} />
            ))}
          </div>
        </div>
      ) : null}

      {/* Frequently Ordered Together Pairings */}
      {combos.length > 0 && (
        <div className="pt-6 border-t border-surface-line space-y-4">
          <div>
            <h3 className="text-[17px] font-bold text-ink-900 tracking-tight">
              Frequently ordered together
            </h3>
            <p className="section-sub">Pairings that save on multi-item orders</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {combos.map((combo) => (
              <div key={combo.id} className="card p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-sm font-semibold text-ink-900 block truncate">
                      {combo.title}
                    </span>
                    <span className="text-[13px] text-ink-500">{combo.subtitle}</span>
                  </div>
                  <span className="shrink-0 px-2 py-0.5 rounded-md bg-success-50 text-success-600 text-[12px] font-semibold">
                    {combo.badge}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {combo.items.map((item: FoodItem) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2.5 p-2 rounded-control bg-surface-sunken"
                    >
                      <img
                        src={item.image}
                        alt=""
                        loading="lazy"
                        className="w-10 h-10 rounded-lg object-cover shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-[13px] font-medium text-ink-900 block truncate">
                          {item.name}
                        </span>
                        <span className="text-[13px] font-semibold text-ink-900 tnum">
                          ₹{item.price}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </section>
  );
};
