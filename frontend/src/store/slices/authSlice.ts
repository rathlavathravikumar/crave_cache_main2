import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, Address } from '../../types';
import { apiFetch } from '../../utils/apiBase';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  selectedAddress: Address | null;
}

const savedUser = localStorage.getItem('cravecache_user');
const savedToken = localStorage.getItem('cravecache_token');

const parsedSavedUser: any = savedUser ? JSON.parse(savedUser) : null;
// One-time migration: earlier builds seeded the mock session with an id
// ('usr_alex') that never matched the backend's seed user ('usr_customer_1'),
// which made profile updates and order history silently fail.
if (parsedSavedUser && parsedSavedUser.id === 'usr_alex') {
  parsedSavedUser.id = 'usr_customer_1';
  localStorage.setItem('cravecache_user', JSON.stringify(parsedSavedUser));
}

const initialUser: User | null = parsedSavedUser
  ? parsedSavedUser
  : {
      id: 'usr_customer_1',
      name: 'Alex Johnson',
      email: 'alex@example.com',
      role: 'customer',
      phone: '+1 (555) 234-5678',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      addresses: [
        {
          id: 'addr_1',
          title: 'Home',
          street: '123 Main Street, Apt 4B',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62701',
          landmark: 'Near Central Park',
          isDefault: true,
        },
        {
          id: 'addr_2',
          title: 'Office',
          street: '456 Innovation Blvd, Suite 200',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62702',
          isDefault: false,
        },
      ],
    };

const initialState: AuthState = {
  user: initialUser,
  token: savedToken || 'mock_jwt_token_alex_123',
  isAuthenticated: true,
  loading: false,
  error: null,
  selectedAddress: initialUser?.addresses?.[0] || null,
};

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (
    credentials: { email: string; password?: string; role?: 'customer' | 'owner' | 'admin' },
    { rejectWithValue }
  ) => {
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.error || 'Login failed');
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Network error');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (
    userData: { name: string; email: string; phone?: string; password?: string; role?: 'customer' | 'owner' | 'admin' },
    { rejectWithValue }
  ) => {
    try {
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.error || 'Registration failed');
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Network error');
    }
  }
);

/**
 * Trades a verified Clerk session for a CraveCache user record.
 *
 * The role is decided by the server from its email allowlist — we intentionally
 * never send a role from the browser on this path, so a user can't grant
 * themselves owner/admin.
 */
export const authenticateWithClerk = createAsyncThunk(
  'auth/authenticateWithClerk',
  async (
    payload: {
      sessionToken: string;
      profile: { email: string; name?: string; avatar?: string; provider?: string };
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await apiFetch('/api/auth/clerk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${payload.sessionToken}`,
        },
        body: JSON.stringify({ profile: payload.profile }),
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.error || 'Clerk sign-in failed');
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Network error');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (
    profileData: { userId?: string; name?: string; email?: string; phone?: string; avatar?: string; role?: 'customer' | 'owner' | 'admin' },
    { getState, rejectWithValue }
  ) => {
    try {
      const state: any = getState();
      // No hardcoded fallback id here: the server 404s on an unknown id rather
      // than editing whichever account happens to be first in the store.
      const userId = profileData.userId || state.auth.user?.id;
      if (!userId) return rejectWithValue('You need to be signed in to update your profile.');
      const res = await apiFetch(`/api/auth/profile/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.error || 'Failed to update profile');
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Network error');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.selectedAddress = null;
      localStorage.removeItem('cravecache_user');
      localStorage.removeItem('cravecache_token');
    },
    setSelectedAddress(state, action: PayloadAction<Address>) {
      state.selectedAddress = action.payload;
    },
    addAddress(state, action: PayloadAction<Address>) {
      if (state.user) {
        if (!state.user.addresses) state.user.addresses = [];
        state.user.addresses.push(action.payload);
        if (!state.selectedAddress) state.selectedAddress = action.payload;
        localStorage.setItem('cravecache_user', JSON.stringify(state.user));
      }
    },
    removeAddress(state, action: PayloadAction<string>) {
      if (state.user && state.user.addresses) {
        state.user.addresses = state.user.addresses.filter((a) => a.id !== action.payload);
        if (state.selectedAddress?.id === action.payload) {
          state.selectedAddress = state.user.addresses[0] || null;
        }
        localStorage.setItem('cravecache_user', JSON.stringify(state.user));
      }
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.selectedAddress = action.payload.user.addresses?.[0] || null;
        localStorage.setItem('cravecache_user', JSON.stringify(action.payload.user));
        localStorage.setItem('cravecache_token', action.payload.token);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(authenticateWithClerk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(authenticateWithClerk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.selectedAddress = action.payload.user.addresses?.[0] || null;
        localStorage.setItem('cravecache_user', JSON.stringify(action.payload.user));
        localStorage.setItem('cravecache_token', action.payload.token);
      })
      .addCase(authenticateWithClerk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.selectedAddress = action.payload.user.addresses?.[0] || null;
        localStorage.setItem('cravecache_user', JSON.stringify(action.payload.user));
        localStorage.setItem('cravecache_token', action.payload.token);
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        localStorage.setItem('cravecache_user', JSON.stringify(action.payload));
      });
  },
});

export const { logout, setSelectedAddress, addAddress, removeAddress, clearAuthError } =
  authSlice.actions;

export default authSlice.reducer;
