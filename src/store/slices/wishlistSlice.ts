import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface WishlistState {
  restaurantIds: string[];
  foodIds: string[];
}

const savedWishlist = localStorage.getItem('cravecache_wishlist');
const parsedWishlist = savedWishlist ? JSON.parse(savedWishlist) : null;

const initialState: WishlistState = {
  restaurantIds: parsedWishlist?.restaurantIds || ['rest_1', 'rest_3'],
  foodIds: parsedWishlist?.foodIds || ['food_101', 'food_301'],
};

function saveWishlist(state: WishlistState) {
  localStorage.setItem('cravecache_wishlist', JSON.stringify(state));
}

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    toggleFavoriteRestaurant(state, action: PayloadAction<string>) {
      const id = action.payload;
      if (state.restaurantIds.includes(id)) {
        state.restaurantIds = state.restaurantIds.filter((item) => item !== id);
      } else {
        state.restaurantIds.push(id);
      }
      saveWishlist(state);
    },
    toggleFavoriteFood(state, action: PayloadAction<string>) {
      const id = action.payload;
      if (state.foodIds.includes(id)) {
        state.foodIds = state.foodIds.filter((item) => item !== id);
      } else {
        state.foodIds.push(id);
      }
      saveWishlist(state);
    },
  },
});

export const { toggleFavoriteRestaurant, toggleFavoriteFood } = wishlistSlice.actions;
export default wishlistSlice.reducer;
