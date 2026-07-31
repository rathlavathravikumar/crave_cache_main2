import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Restaurant, FoodItem, Review } from '../../types';
import { apiFetch } from '../../utils/apiBase';

interface RestaurantState {
  restaurants: Restaurant[];
  currentRestaurant: Restaurant | null;
  restaurantFoods: FoodItem[];
  restaurantReviews: Review[];
  loading: boolean;
  detailsLoading: boolean;
  error: string | null;
  searchQuery: string;
  selectedCuisine: string;
  isVegOnly: boolean;
  maxDeliveryTime: number;
  sortBy: 'rating' | 'deliveryTime' | 'costLow' | 'costHigh' | 'relevance';
}

const initialState: RestaurantState = {
  restaurants: [],
  currentRestaurant: null,
  restaurantFoods: [],
  restaurantReviews: [],
  loading: false,
  detailsLoading: false,
  error: null,
  searchQuery: '',
  selectedCuisine: 'All',
  isVegOnly: false,
  maxDeliveryTime: 60,
  sortBy: 'relevance',
};

export const fetchRestaurants = createAsyncThunk(
  'restaurants/fetchRestaurants',
  async (
    filters:
      | {
          search?: string;
          cuisine?: string;
          isVeg?: boolean;
          maxDeliveryTime?: number;
          sortBy?: string;
        }
      | void,
    { rejectWithValue }
  ) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        if (filters.search) queryParams.append('search', filters.search);
        if (filters.cuisine && filters.cuisine !== 'All') queryParams.append('cuisine', filters.cuisine);
        if (filters.isVeg) queryParams.append('isVeg', 'true');
        if (filters.maxDeliveryTime) queryParams.append('maxDeliveryTime', String(filters.maxDeliveryTime));
        if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
      }

      const res = await apiFetch(`/api/restaurants?${queryParams.toString()}`);
      const data = await res.json();
      if (!res.ok) return rejectWithValue('Failed to fetch restaurants');
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Network error');
    }
  }
);

export const fetchRestaurantDetails = createAsyncThunk(
  'restaurants/fetchRestaurantDetails',
  async (restaurantId: string, { rejectWithValue }) => {
    try {
      const res = await apiFetch(`/api/restaurants/${restaurantId}`);
      const data = await res.json();
      if (!res.ok) return rejectWithValue('Failed to fetch restaurant details');
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Network error');
    }
  }
);

const restaurantSlice = createSlice({
  name: 'restaurants',
  initialState,
  reducers: {
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    setSelectedCuisine(state, action: PayloadAction<string>) {
      state.selectedCuisine = action.payload;
    },
    setIsVegOnly(state, action: PayloadAction<boolean>) {
      state.isVegOnly = action.payload;
    },
    setMaxDeliveryTime(state, action: PayloadAction<number>) {
      state.maxDeliveryTime = action.payload;
    },
    setSortBy(state, action: PayloadAction<RestaurantState['sortBy']>) {
      state.sortBy = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch list
      .addCase(fetchRestaurants.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRestaurants.fulfilled, (state, action) => {
        state.loading = false;
        state.restaurants = action.payload;
      })
      .addCase(fetchRestaurants.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch details
      .addCase(fetchRestaurantDetails.pending, (state) => {
        state.detailsLoading = true;
      })
      .addCase(fetchRestaurantDetails.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.currentRestaurant = action.payload.restaurant;
        state.restaurantFoods = action.payload.foods;
        state.restaurantReviews = action.payload.reviews;
      })
      .addCase(fetchRestaurantDetails.rejected, (state, action) => {
        state.detailsLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setSearchQuery,
  setSelectedCuisine,
  setIsVegOnly,
  setMaxDeliveryTime,
  setSortBy,
} = restaurantSlice.actions;

export default restaurantSlice.reducer;
