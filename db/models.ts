/**
 * Mongoose schemas for CraveCache.
 *
 * Design note on identifiers: the application uses its own readable string ids
 * ('usr_customer_1', 'rest_1', 'food_101'), and those ids appear in seed data,
 * order records and the client. Rather than migrate everything to ObjectIds,
 * `id` is kept as the canonical unique-indexed field and Mongo's `_id` is
 * ignored. Every read projects `_id` and `__v` away, so documents come back
 * matching the interfaces in src/types.ts exactly.
 */
import { Schema, model, type Model } from 'mongoose';
import type {
  Restaurant,
  FoodItem,
  Coupon,
  User,
  Order,
  Review,
  UserCredential,
} from '../src/types';

/** Applied to every schema: readable id, no version key, no _id in output. */
const baseOptions = {
  versionKey: false,
  // Subdocuments are plain value objects here; suppressing their _id keeps
  // responses byte-identical to what the in-memory store used to return.
  id: false,
} as const;

const AddressSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, default: '' },
    zipCode: { type: String, default: '' },
    landmark: String,
    isDefault: Boolean,
  },
  { _id: false, versionKey: false }
);

const CustomizationOptionSchema = new Schema(
  { name: { type: String, required: true }, price: { type: Number, default: 0 } },
  { _id: false, versionKey: false }
);

const CustomizationGroupSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    required: { type: Boolean, default: false },
    maxSelection: Number,
    options: [CustomizationOptionSchema],
  },
  { _id: false, versionKey: false }
);

/* ------------------------------------------------------------------ users */

const UserSchema = new Schema<User>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    // Lower-cased so the many case-insensitive email lookups become plain
    // indexed queries instead of full scans.
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    role: { type: String, enum: ['customer', 'owner', 'admin'], default: 'customer', index: true },
    restaurantId: String,
    avatar: String,
    phone: String,
    addresses: { type: [AddressSchema], default: [] },
    blocked: { type: Boolean, default: false },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  baseOptions
);

/* ------------------------------------------------------------ restaurants */

const RestaurantSchema = new Schema<Restaurant>(
  {
    id: { type: String, required: true, unique: true, index: true },
    ownerId: { type: String, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    bannerImage: { type: String, default: '' },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    cuisine: { type: [String], default: [] },
    deliveryTimeMinutes: { type: Number, default: 30 },
    priceForTwo: { type: Number, default: 0 },
    costTier: { type: String, default: '₹₹' },
    isVegOnly: Boolean,
    isFeatured: Boolean,
    isOpen: { type: Boolean, default: true },
    openingHours: String,
    deliveryRadiusKm: Number,
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    phone: { type: String, default: '' },
    discountOffer: String,
  },
  baseOptions
);

/* ------------------------------------------------------------- food items */

const FoodItemSchema = new Schema<FoodItem>(
  {
    id: { type: String, required: true, unique: true, index: true },
    restaurantId: { type: String, required: true, index: true },
    restaurantName: String,
    name: { type: String, required: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true },
    image: { type: String, default: '' },
    category: { type: String, default: 'General', index: true },
    isVeg: { type: Boolean, default: false },
    isSpicy: Boolean,
    isBestseller: Boolean,
    isAvailable: { type: Boolean, default: true },
    rating: Number,
    calories: Number,
    customizationGroups: { type: [CustomizationGroupSchema], default: undefined },
  },
  baseOptions
);

/* ----------------------------------------------------------------- orders */

const CartItemSchema = new Schema(
  {
    cartItemId: { type: String, required: true },
    // Stored as a snapshot: an order must keep the dish exactly as bought, even
    // if the restaurant later edits or deletes it.
    foodItem: { type: Schema.Types.Mixed, required: true },
    quantity: { type: Number, default: 1 },
    customizations: { type: Schema.Types.Mixed },
    specialInstructions: String,
    itemTotalPrice: { type: Number, default: 0 },
  },
  { _id: false, versionKey: false }
);

const TimelineSchema = new Schema(
  {
    status: { type: String, required: true },
    timestamp: { type: String, required: true },
    message: { type: String, default: '' },
  },
  { _id: false, versionKey: false }
);

const OrderSchema = new Schema<Order>(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    userName: { type: String, default: '' },
    userEmail: { type: String, default: '' },
    restaurantId: { type: String, required: true, index: true },
    restaurantName: { type: String, default: '' },
    items: { type: [CartItemSchema], default: [] },
    deliveryAddress: { type: Schema.Types.Mixed },
    itemTotal: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    taxAndPackaging: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    couponCode: String,
    totalAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Placed', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'],
      default: 'Placed',
      index: true,
    },
    paymentMethod: { type: String, default: 'Cash on Delivery' },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
      default: 'Pending',
      index: true,
    },
    stripePaymentIntentId: String,
    deliveryDriver: { type: Schema.Types.Mixed },
    timeline: { type: [TimelineSchema], default: [] },
    reviewed: Boolean,
    rating: Number,
    reviewComment: String,
    createdAt: { type: String, default: () => new Date().toISOString() },
    updatedAt: { type: String, default: () => new Date().toISOString() },
  },
  baseOptions
);

// Order history is always listed newest-first per user.
OrderSchema.index({ userId: 1, createdAt: -1 });

/* ---------------------------------------------------------------- reviews */

const ReviewSchema = new Schema<Review>(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    userName: { type: String, default: '' },
    userAvatar: String,
    restaurantId: { type: String, required: true, index: true },
    foodItemId: String,
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '' },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  baseOptions
);

/* ---------------------------------------------------------------- coupons */

const CouponSchema = new Schema<Coupon>(
  {
    id: { type: String, required: true, unique: true, index: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    description: { type: String, default: '' },
    discountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
    discountValue: { type: Number, required: true },
    minOrderValue: { type: Number, default: 0 },
    maxDiscount: Number,
    isActive: { type: Boolean, default: true, index: true },
    expiryDate: { type: String, default: '' },
  },
  baseOptions
);

/* ------------------------------------------------------------ credentials */

/*
 * Password hashes and reset tokens live in their OWN collection, deliberately
 * not on the user document.
 *
 * The repository projects only `_id`/`__v` away, so any field added to
 * UserSchema is returned by `repo.users.*` and flows straight out of the eight
 * handlers that serialise a user — including `GET /api/admin/users`, which
 * would then ship every account's bcrypt hash to the browser. Keeping secrets
 * in a sibling collection means no existing endpoint can leak them and no
 * future one can leak them by forgetting to sanitise.
 *
 * `userId` is the app's readable id ('usr_...'), matching how every other
 * relation in this schema file is expressed.
 */
const UserCredentialSchema = new Schema<UserCredential>(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, unique: true, index: true },

    /** bcrypt hash. Absent for OAuth-only accounts that never set a password. */
    passwordHash: { type: String, default: null },

    /*
     * SHA-256 of the reset token, never the token itself. The raw token exists
     * only in the email we send: a leaked database dump therefore cannot be
     * used to reset anyone's password. Indexed because lookup is by hash.
     */
    resetTokenHash: { type: String, default: null, index: true },
    resetTokenExpires: { type: Number, default: null },

    /*
     * Set when a reset completes. Any reset link issued before this instant is
     * refused, so the older of two concurrently-requested links cannot be
     * replayed after the newer one has been used.
     */
    passwordChangedAt: { type: Number, default: null },

    /** Throttling counters for per-account reset abuse (see rateLimiter.ts). */
    resetRequestCount: { type: Number, default: 0 },
    resetRequestWindowStart: { type: Number, default: null },
  },
  baseOptions
);

export const UserModel: Model<User> = model<User>('User', UserSchema);
export const UserCredentialModel: Model<UserCredential> = model<UserCredential>(
  'UserCredential',
  UserCredentialSchema
);
export const RestaurantModel: Model<Restaurant> = model<Restaurant>('Restaurant', RestaurantSchema);
export const FoodItemModel: Model<FoodItem> = model<FoodItem>('FoodItem', FoodItemSchema);
export const OrderModel: Model<Order> = model<Order>('Order', OrderSchema);
export const ReviewModel: Model<Review> = model<Review>('Review', ReviewSchema);
export const CouponModel: Model<Coupon> = model<Coupon>('Coupon', CouponSchema);

/** Fields stripped from every response so payloads match src/types.ts. */
export const PROJECTION = { _id: 0, __v: 0 } as const;
