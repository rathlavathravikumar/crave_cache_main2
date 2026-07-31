import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { FoodItem, Restaurant, Coupon } from '../../types';
import { apiFetch } from '../../utils/apiBase';

export interface AIMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  recommendation?: {
    summary: string;
    explanation: string;
    suggestedItems: {
      foodItem: FoodItem;
      restaurant: Restaurant;
      quantity: number;
      reason: string;
    }[];
    suggestedCoupon?: Coupon;
  };
  timestamp: string;
}

interface AIState {
  isAssistantOpen: boolean;
  messages: AIMessage[];
  loading: boolean;
  error: string | null;
  activeRecommendation: {
    summary: string;
    explanation: string;
    suggestedItems: {
      foodItem: FoodItem;
      restaurant: Restaurant;
      quantity: number;
      reason: string;
    }[];
    suggestedCoupon?: Coupon;
  } | null;
  showConfirmModal: boolean;
}

const initialState: AIState = {
  isAssistantOpen: false,
  messages: [
    {
      id: 'msg_welcome',
      sender: 'ai',
      text: 'Hello! I am your AI Crave Assistant ✨. Tell me what you are in the mood for, budget, or dietary needs (e.g. "Spicy vegetarian pizza under $15", "High protein lunch for 2", "Healthy smoothie & salad"). I will find the best items and apply discounts!',
      timestamp: new Date().toISOString(),
    },
  ],
  loading: false,
  error: null,
  activeRecommendation: null,
  showConfirmModal: false,
};

export const queryAIAssistant = createAsyncThunk(
  'ai/queryAIAssistant',
  async (userPrompt: string, { rejectWithValue }) => {
    try {
      const res = await apiFetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userPrompt }),
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.error || 'Failed to get recommendation');
      return { userPrompt, data };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Network error');
    }
  }
);

const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    toggleAIAssistant(state, action: PayloadAction<boolean | undefined>) {
      state.isAssistantOpen = action.payload !== undefined ? action.payload : !state.isAssistantOpen;
    },
    clearAIMessages(state) {
      state.messages = [
        {
          id: `msg_${Date.now()}`,
          sender: 'ai',
          text: 'Chat history cleared. What would you like to order today?',
          timestamp: new Date().toISOString(),
        },
      ];
      state.activeRecommendation = null;
    },
    openConfirmModal(state, action: PayloadAction<any>) {
      state.activeRecommendation = action.payload;
      state.showConfirmModal = true;
    },
    closeConfirmModal(state) {
      state.showConfirmModal = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(queryAIAssistant.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.messages.push({
          id: `msg_user_${Date.now()}`,
          sender: 'user',
          text: action.meta.arg,
          timestamp: new Date().toISOString(),
        });
      })
      .addCase(queryAIAssistant.fulfilled, (state, action) => {
        state.loading = false;
        const rec = action.payload.data;
        state.activeRecommendation = rec;
        state.messages.push({
          id: `msg_ai_${Date.now()}`,
          sender: 'ai',
          text: rec.summary || 'Here are my top recommendations for you:',
          recommendation: rec,
          timestamp: new Date().toISOString(),
        });
      })
      .addCase(queryAIAssistant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.messages.push({
          id: `msg_err_${Date.now()}`,
          sender: 'ai',
          text: `Sorry, I ran into an issue: ${action.payload || 'Unable to connect to AI server'}. Please try another prompt or browse restaurants directly!`,
          timestamp: new Date().toISOString(),
        });
      });
  },
});

export const { toggleAIAssistant, clearAIMessages, openConfirmModal, closeConfirmModal } =
  aiSlice.actions;

export default aiSlice.reducer;
