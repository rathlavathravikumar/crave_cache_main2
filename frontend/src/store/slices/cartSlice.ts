import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CartItem, FoodItem, CartCustomizationSelection, Coupon } from '../../types';

interface CartState {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
  appliedCoupon: Coupon | null;
  discountAmount: number;
  couponMessage: string | null;
  isCartOpen: boolean;
  couponLoading: boolean;
}

const savedCart = localStorage.getItem('cravecache_cart');
const parsedCart = savedCart ? JSON.parse(savedCart) : null;

const initialState: CartState = {
  items: parsedCart?.items || [],
  restaurantId: parsedCart?.restaurantId || null,
  restaurantName: parsedCart?.restaurantName || null,
  appliedCoupon: parsedCart?.appliedCoupon || null,
  discountAmount: parsedCart?.discountAmount || 0,
  couponMessage: null,
  isCartOpen: false,
  couponLoading: false,
};

function saveCartToStorage(state: CartState) {
  localStorage.setItem(
    'cravecache_cart',
    JSON.stringify({
      items: state.items,
      restaurantId: state.restaurantId,
      restaurantName: state.restaurantName,
      appliedCoupon: state.appliedCoupon,
      discountAmount: state.discountAmount,
    })
  );
}

export const applyCouponCode = createAsyncThunk(
  'cart/applyCouponCode',
  async ({ code, cartAmount }: { code: string; cartAmount: number }, { rejectWithValue }) => {
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, cartAmount }),
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message || 'Invalid coupon');
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Network error');
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart(
      state,
      action: PayloadAction<{
        foodItem: FoodItem;
        quantity?: number;
        customizations?: CartCustomizationSelection[];
        specialInstructions?: string;
      }>
    ) {
      const { foodItem, quantity = 1, customizations = [], specialInstructions } = action.payload;

      // If cart has items from another restaurant, clear first
      if (state.restaurantId && state.restaurantId !== foodItem.restaurantId && state.items.length > 0) {
        state.items = [];
        state.appliedCoupon = null;
        state.discountAmount = 0;
      }

      state.restaurantId = foodItem.restaurantId;
      state.restaurantName = foodItem.restaurantName || null;

      // Calculate unit price including customizations
      let unitPrice = foodItem.price;
      customizations.forEach((c) => {
        c.selectedOptions.forEach((opt) => {
          unitPrice += opt.price;
        });
      });

      // Generate unique item key based on customizations
      const custKey = customizations
        .map((c) => `${c.groupTitle}:${c.selectedOptions.map((o) => o.name).join(',')}`)
        .sort()
        .join('|');
      const cartItemId = `${foodItem.id}_${custKey}`;

      const existingIndex = state.items.findIndex((i) => i.cartItemId === cartItemId);
      if (existingIndex !== -1) {
        state.items[existingIndex].quantity += quantity;
      } else {
        state.items.push({
          cartItemId,
          foodItem,
          quantity,
          customizations,
          specialInstructions,
          itemTotalPrice: Number(unitPrice.toFixed(2)),
        });
      }

      saveCartToStorage(state);
    },

    updateCartQuantity(state, action: PayloadAction<{ cartItemId: string; quantity: number }>) {
      const { cartItemId, quantity } = action.payload;
      const index = state.items.findIndex((i) => i.cartItemId === cartItemId);

      if (index !== -1) {
        if (quantity <= 0) {
          state.items.splice(index, 1);
        } else {
          state.items[index].quantity = quantity;
        }
      }

      if (state.items.length === 0) {
        state.restaurantId = null;
        state.restaurantName = null;
        state.appliedCoupon = null;
        state.discountAmount = 0;
      }

      saveCartToStorage(state);
    },

    removeFromCart(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.cartItemId !== action.payload);
      if (state.items.length === 0) {
        state.restaurantId = null;
        state.restaurantName = null;
        state.appliedCoupon = null;
        state.discountAmount = 0;
      }
      saveCartToStorage(state);
    },

    clearCart(state) {
      state.items = [];
      state.restaurantId = null;
      state.restaurantName = null;
      state.appliedCoupon = null;
      state.discountAmount = 0;
      state.couponMessage = null;
      saveCartToStorage(state);
    },

    removeCoupon(state) {
      state.appliedCoupon = null;
      state.discountAmount = 0;
      state.couponMessage = null;
      saveCartToStorage(state);
    },

    toggleCartDrawer(state, action: PayloadAction<boolean | undefined>) {
      state.isCartOpen = action.payload !== undefined ? action.payload : !state.isCartOpen;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(applyCouponCode.pending, (state) => {
        state.couponLoading = true;
        state.couponMessage = null;
      })
      .addCase(applyCouponCode.fulfilled, (state, action) => {
        state.couponLoading = false;
        state.appliedCoupon = action.payload.coupon;
        state.discountAmount = action.payload.discountAmount;
        state.couponMessage = action.payload.message;
        saveCartToStorage(state);
      })
      .addCase(applyCouponCode.rejected, (state, action) => {
        state.couponLoading = false;
        state.appliedCoupon = null;
        state.discountAmount = 0;
        state.couponMessage = action.payload as string;
        saveCartToStorage(state);
      });
  },
});

export const {
  addToCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  removeCoupon,
  toggleCartDrawer,
} = cartSlice.actions;

export default cartSlice.reducer;
