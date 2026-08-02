import React, { useEffect } from 'react';
import { Heart, Utensils, Award } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks/reduxHooks';
import { fetchRestaurants } from '../store/slices/restaurantSlice';
import { fetchAllFoods } from '../store/slices/foodSlice';
import { RestaurantCard } from '../components/RestaurantCard';
import { FoodCard } from '../components/FoodCard';
import { Stagger, StaggerItem } from '../components/ui';

interface WishlistPageProps {
  /**
   * Omitted for owner/admin, who have no customer browsing views to navigate
   * into. Cards then render as non-interactive rather than as dead links.
   */
  onSelectRestaurant?: (restaurantId: string) => void;
}

export const WishlistPage: React.FC<WishlistPageProps> = ({ onSelectRestaurant }) => {
  const dispatch = useAppDispatch();
  const { restaurantIds, foodIds } = useAppSelector((state) => state.wishlist);
  const { restaurants } = useAppSelector((state) => state.restaurants);
  const { allFoods } = useAppSelector((state) => state.food);

  useEffect(() => {
    dispatch(fetchRestaurants());
    dispatch(fetchAllFoods());
  }, [dispatch]);

  const favoriteRestaurants = restaurants.filter((r) => restaurantIds.includes(r.id));
  const favoriteFoods = allFoods.filter((f) => foodIds.includes(f.id));

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      
      <div className="border-b border-surface-line pb-4">
        <h1 className="text-2xl font-bold text-ink-900 flex items-center gap-2">
          <Heart className="w-6 h-6 text-rose-600 fill-current" /> Saved Favorites
        </h1>
        <p className="text-[13px] text-ink-500">Your bookmarked kitchens and favorite dishes</p>
      </div>

      {/* Favorite Restaurants */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-ink-900 flex items-center gap-2">
          <Award className="w-5 h-5 text-brand-600" /> Favorite Restaurants ({favoriteRestaurants.length})
        </h2>

        {favoriteRestaurants.length === 0 ? (
          <div className="p-6 bg-surface-sunken rounded-card border border-surface-line text-[13px] text-ink-500">
            No saved restaurants yet. Click the heart icon on any restaurant card to save it here!
          </div>
        ) : (
          <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoriteRestaurants.map((restaurant) => (
              <StaggerItem key={restaurant.id} className="h-full">
                <RestaurantCard
                  restaurant={restaurant}
                  onClick={
                    onSelectRestaurant ? () => onSelectRestaurant(restaurant.id) : undefined
                  }
                />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </div>

      {/* Favorite Foods */}
      <div className="space-y-4 pt-4">
        <h2 className="text-lg font-bold text-ink-900 flex items-center gap-2">
          <Utensils className="w-5 h-5 text-brand-600" /> Favorite Dishes ({favoriteFoods.length})
        </h2>

        {favoriteFoods.length === 0 ? (
          <div className="p-6 bg-surface-sunken rounded-card border border-surface-line text-[13px] text-ink-500">
            No saved dishes yet. Click "Save" on any food card to bookmark it!
          </div>
        ) : (
          <Stagger className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {favoriteFoods.map((food) => (
              <StaggerItem key={food.id}>
                <FoodCard foodItem={food} />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </div>

    </div>
  );
};
