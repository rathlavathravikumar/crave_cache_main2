import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Order, OrderStatus } from '../../types';
import { apiFetch } from '../../utils/apiBase';

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  loading: boolean;
  placingOrder: boolean;
  error: string | null;
  activeTrackOrderId: string | null;
}

const initialState: OrderState = {
  orders: [],
  currentOrder: null,
  loading: false,
  placingOrder: false,
  error: null,
  activeTrackOrderId: null,
};

export const fetchUserOrders = createAsyncThunk(
  'orders/fetchUserOrders',
  async (userId: string, { rejectWithValue }) => {
    try {
      const res = await apiFetch(`/api/orders?userId=${userId}`);
      const data = await res.json();
      if (!res.ok) return rejectWithValue('Failed to fetch orders');
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Network error');
    }
  }
);

export const fetchOrderById = createAsyncThunk(
  'orders/fetchOrderById',
  async (orderId: string, { rejectWithValue }) => {
    try {
      const res = await apiFetch(`/api/orders/${orderId}`);
      const data = await res.json();
      if (!res.ok) return rejectWithValue('Failed to fetch order details');
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Network error');
    }
  }
);

export const createNewOrder = createAsyncThunk(
  'orders/createNewOrder',
  async (orderPayload: any, { rejectWithValue }) => {
    try {
      const res = await apiFetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.error || 'Failed to place order');
      return data.order;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Network error');
    }
  }
);

export const cancelOrder = createAsyncThunk(
  'orders/cancelOrder',
  async (orderId: string, { rejectWithValue }) => {
    try {
      const res = await apiFetch(`/api/orders/${orderId}/cancel`, {
        method: 'PUT',
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.error || 'Failed to cancel order');
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Network error');
    }
  }
);

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setActiveTrackOrderId(state, action: PayloadAction<string | null>) {
      state.activeTrackOrderId = action.payload;
    },
    updateOrderStatusLocal(state, action: PayloadAction<{ orderId: string; status: OrderStatus; message?: string }>) {
      const { orderId, status, message } = action.payload;
      const index = state.orders.findIndex((o) => o.id === orderId);
      if (index !== -1) {
        state.orders[index].status = status;
        state.orders[index].timeline.push({
          status,
          timestamp: new Date().toISOString(),
          message: message || `Status updated to ${status}`,
        });
      }
      if (state.currentOrder && state.currentOrder.id === orderId) {
        state.currentOrder.status = status;
        state.currentOrder.timeline.push({
          status,
          timestamp: new Date().toISOString(),
          message: message || `Status updated to ${status}`,
        });
      }
    },
    setOrderReview(state, action: PayloadAction<{ orderId: string; rating: number; reviewComment: string }>) {
      const { orderId, rating, reviewComment } = action.payload;
      const order = state.orders.find((o) => o.id === orderId);
      if (order) {
        order.reviewed = true;
        order.rating = rating;
        order.reviewComment = reviewComment;
      }
      if (state.currentOrder && state.currentOrder.id === orderId) {
        state.currentOrder.reviewed = true;
        state.currentOrder.rating = rating;
        state.currentOrder.reviewComment = reviewComment;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchUserOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.currentOrder = action.payload;
      })
      .addCase(createNewOrder.pending, (state) => {
        state.placingOrder = true;
        state.error = null;
      })
      .addCase(createNewOrder.fulfilled, (state, action) => {
        state.placingOrder = false;
        state.orders.unshift(action.payload);
        state.currentOrder = action.payload;
        state.activeTrackOrderId = action.payload.id;
      })
      .addCase(createNewOrder.rejected, (state, action) => {
        state.placingOrder = false;
        state.error = action.payload as string;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        const index = state.orders.findIndex((o) => o.id === action.payload.id);
        if (index !== -1) state.orders[index] = action.payload;
        if (state.currentOrder?.id === action.payload.id) state.currentOrder = action.payload;
      });
  },
});

export const { setActiveTrackOrderId, updateOrderStatusLocal, setOrderReview } = orderSlice.actions;
export default orderSlice.reducer;
