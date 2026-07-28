import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { User } from '../../types';

interface AdminState {
  analytics: {
    totalRevenue: number;
    totalOrders: number;
    totalRestaurants: number;
    totalUsers: number;
    statusCounts: Record<string, number>;
    recentOrders: any[];
  } | null;
  usersList: User[];
  loading: boolean;
  error: string | null;
}

const initialState: AdminState = {
  analytics: null,
  usersList: [],
  loading: false,
  error: null,
};

export const fetchAdminAnalytics = createAsyncThunk(
  'admin/fetchAdminAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch('/api/admin/analytics');
      const data = await res.json();
      if (!res.ok) return rejectWithValue('Failed to fetch admin analytics');
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Network error');
    }
  }
);

export const fetchAdminUsers = createAsyncThunk(
  'admin/fetchAdminUsers',
  async (search: string | void, { rejectWithValue }) => {
    try {
      const q = search || '';
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) return rejectWithValue('Failed to fetch user list');
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Network error');
    }
  }
);

export const toggleBlockUser = createAsyncThunk(
  'admin/toggleBlockUser',
  async (userId: string, { rejectWithValue }) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-block`, {
        method: 'PUT',
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue('Failed to update user status');
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Network error');
    }
  }
);

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminAnalytics.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAdminAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.analytics = action.payload;
      })
      .addCase(fetchAdminAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        state.usersList = action.payload;
      })
      .addCase(toggleBlockUser.fulfilled, (state, action) => {
        const index = state.usersList.findIndex((u) => u.id === action.payload.id);
        if (index !== -1) state.usersList[index] = action.payload;
      });
  },
});

export default adminSlice.reducer;
