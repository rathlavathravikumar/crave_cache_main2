import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { FoodItem } from '../../types';

interface FoodState {
  allFoods: FoodItem[];
  loading: boolean;
  error: string | null;
}

const initialState: FoodState = {
  allFoods: [],
  loading: false,
  error: null,
};

export const fetchAllFoods = createAsyncThunk(
  'food/fetchAllFoods',
  async (
    filters:
      | {
          search?: string;
          category?: string;
          isVeg?: boolean;
        }
      | void,
    { rejectWithValue }
  ) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        if (filters.search) queryParams.append('search', filters.search);
        if (filters.category) queryParams.append('category', filters.category);
        if (filters.isVeg) queryParams.append('isVeg', 'true');
      }

      const res = await fetch(`/api/food-items?${queryParams.toString()}`);
      const data = await res.json();
      if (!res.ok) return rejectWithValue('Failed to fetch food items');
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Network error');
    }
  }
);

const foodSlice = createSlice({
  name: 'food',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllFoods.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllFoods.fulfilled, (state, action) => {
        state.loading = false;
        state.allFoods = action.payload;
      })
      .addCase(fetchAllFoods.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default foodSlice.reducer;
