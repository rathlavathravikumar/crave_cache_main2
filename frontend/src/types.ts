export type Role = 'customer' | 'owner' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  restaurantId?: string;
  avatar?: string;
  phone?: string;
  addresses: Address[];
  blocked?: boolean;
  createdAt: string;
}

export interface Address {
  id: string;
  title: string; // e.g. "Home", "Work", "Other"
  street: string;
  city: string;
  state: string;
  zipCode: string;
  landmark?: string;
  isDefault?: boolean;
}

export interface Restaurant {
  id: string;
  ownerId?: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  bannerImage: string;
  rating: number;
  reviewCount: number;
  cuisine: string[];
  deliveryTimeMinutes: number;
  priceForTwo: number;
  costTier: '₹' | '₹₹' | '₹₹₹' | '₹₹₹₹' | '$' | '$$' | '$$$' | '$$$$';
  isVegOnly?: boolean;
  isFeatured?: boolean;
  isOpen: boolean;
  openingHours?: string;
  deliveryRadiusKm?: number;
  address: string;
  city: string;
  phone: string;
  discountOffer?: string; // e.g. "50% OFF up to $10"
}

export interface FoodCustomizationOption {
  name: string;
  price: number;
}

export interface FoodCustomizationGroup {
  id: string;
  title: string; // e.g., "Choose Size", "Select Spice Level", "Add Extra Toppings"
  required: boolean;
  maxSelection?: number;
  options: FoodCustomizationOption[];
}

export interface FoodItem {
  id: string;
  restaurantId: string;
  restaurantName?: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isVeg: boolean;
  isSpicy?: boolean;
  isBestseller?: boolean;
  isAvailable: boolean;
  rating?: number;
  calories?: number;
  customizationGroups?: FoodCustomizationGroup[];
  matchScore?: number;
  recommendationReason?: string;
  trendingScore?: number;
}

export interface RecommendationSection {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  items: FoodItem[];
}

export interface CartCustomizationSelection {
  groupTitle: string;
  selectedOptions: FoodCustomizationOption[];
}

export interface CartItem {
  cartItemId: string; // unique ID representing item + specific customizations
  foodItem: FoodItem;
  quantity: number;
  customizations?: CartCustomizationSelection[];
  specialInstructions?: string;
  itemTotalPrice: number; // calculated per unit including customizations
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number; // e.g. 20 for 20%, or 5 for $5 off
  minOrderValue: number;
  maxDiscount?: number;
  isActive: boolean;
  expiryDate: string;
}

export type OrderStatus =
  | 'Placed'
  | 'Confirmed'
  | 'Preparing'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export interface OrderTimeline {
  status: OrderStatus;
  timestamp: string;
  message: string;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  restaurantId: string;
  restaurantName: string;
  items: CartItem[];
  deliveryAddress: Address;
  itemTotal: number;
  deliveryFee: number;
  taxAndPackaging: number;
  discountAmount: number;
  couponCode?: string;
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: 'Stripe Credit/Debit Card' | 'Credit/Debit Card' | 'Cash on Delivery';
  paymentStatus: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
  stripePaymentIntentId?: string;
  deliveryDriver?: {
    name: string;
    phone: string;
    avatar: string;
  };
  timeline: OrderTimeline[];
  reviewed?: boolean;
  rating?: number;
  reviewComment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  restaurantId: string;
  foodItemId?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface AIRecommendationResponse {
  summary: string;
  suggestedItems: {
    foodItem: FoodItem;
    restaurant: Restaurant;
    customization?: CartCustomizationSelection[];
    quantity: number;
    reason: string;
  }[];
  suggestedCoupon?: Coupon;
  estimatedTotal: number;
}
