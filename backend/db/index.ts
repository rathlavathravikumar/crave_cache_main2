/**
 * Data access for CraveCache.
 *
 * Exposes one async repository interface with two interchangeable drivers:
 *
 *   - Mongo driver   — used when MONGODB_URI is set. Real Mongoose queries.
 *   - Memory driver  — the previous in-memory arrays, so a fresh clone with no
 *                      database still runs. Same semantics, same call sites.
 *
 * Handlers only ever touch `repo`, so they contain no branching on which
 * driver is active and no duplicated filtering logic.
 */
import mongoose from 'mongoose';
import type { Model } from 'mongoose';
import {
  UserModel,
  RestaurantModel,
  FoodItemModel,
  OrderModel,
  ReviewModel,
  CouponModel,
  PROJECTION,
} from './models';
import {
  INITIAL_RESTAURANTS,
  INITIAL_FOOD_ITEMS,
  INITIAL_COUPONS,
  INITIAL_USERS,
  INITIAL_REVIEWS,
} from '../data/initialData';
import { INITIAL_ORDERS } from './seedOrders';
import type { Restaurant, FoodItem, Coupon, User, Order, Review } from '../types';

/** Simple equality filter, e.g. { restaurantId: 'rest_1' }. */
export type Filter<T> = Partial<Record<keyof T, unknown>>;

export interface Repository<T extends { id: string }> {
  all(): Promise<T[]>;
  find(filter: Filter<T>): Promise<T[]>;
  findOne(filter: Filter<T>): Promise<T | null>;
  findById(id: string): Promise<T | null>;
  insert(doc: T): Promise<T>;
  /** Shallow merge onto the stored document. Returns null when id is unknown. */
  update(id: string, patch: Partial<T>): Promise<T | null>;
  remove(id: string): Promise<boolean>;
  removeWhere(filter: Filter<T>): Promise<number>;
  count(filter?: Filter<T>): Promise<number>;
}

/* -------------------------------------------------------------------------- */
/* Mongo driver                                                               */
/* -------------------------------------------------------------------------- */

const mongoRepo = <T extends { id: string }>(mdl: Model<any>): Repository<T> => ({
  all: () => mdl.find({}, PROJECTION).lean<T[]>().exec(),
  find: (filter) => mdl.find(filter as any, PROJECTION).lean<T[]>().exec(),
  findOne: (filter) => mdl.findOne(filter as any, PROJECTION).lean<T>().exec(),
  findById: (id) => mdl.findOne({ id }, PROJECTION).lean<T>().exec(),
  insert: async (doc) => {
    const created = await mdl.create(doc);
    const { _id, __v, ...plain } = created.toObject();
    return plain as T;
  },
  update: (id, patch) =>
    mdl
      .findOneAndUpdate({ id }, { $set: patch as any }, { new: true, projection: PROJECTION })
      .lean<T>()
      .exec(),
  remove: async (id) => {
    const { deletedCount } = await mdl.deleteOne({ id });
    return (deletedCount ?? 0) > 0;
  },
  removeWhere: async (filter) => {
    const { deletedCount } = await mdl.deleteMany(filter as any);
    return deletedCount ?? 0;
  },
  count: (filter = {}) => mdl.countDocuments(filter as any).exec(),
});

/* -------------------------------------------------------------------------- */
/* Memory driver                                                              */
/* -------------------------------------------------------------------------- */

const matches = <T>(doc: T, filter: Filter<T>) =>
  Object.entries(filter).every(([key, value]) => (doc as any)[key] === value);

const memoryRepo = <T extends { id: string }>(seed: T[]): Repository<T> => {
  // Deep-cloned so mutating a returned document can't corrupt the seed module.
  let rows: T[] = JSON.parse(JSON.stringify(seed));
  const clone = (d: T): T => JSON.parse(JSON.stringify(d));

  return {
    all: async () => rows.map(clone),
    find: async (filter) => rows.filter((r) => matches(r, filter)).map(clone),
    findOne: async (filter) => {
      const hit = rows.find((r) => matches(r, filter));
      return hit ? clone(hit) : null;
    },
    findById: async (id) => {
      const hit = rows.find((r) => r.id === id);
      return hit ? clone(hit) : null;
    },
    insert: async (doc) => {
      rows.push(clone(doc));
      return clone(doc);
    },
    update: async (id, patch) => {
      const index = rows.findIndex((r) => r.id === id);
      if (index === -1) return null;
      rows[index] = { ...rows[index], ...patch };
      return clone(rows[index]);
    },
    remove: async (id) => {
      const before = rows.length;
      rows = rows.filter((r) => r.id !== id);
      return rows.length < before;
    },
    removeWhere: async (filter) => {
      const before = rows.length;
      rows = rows.filter((r) => !matches(r, filter));
      return before - rows.length;
    },
    count: async (filter = {}) => rows.filter((r) => matches(r, filter)).length,
  };
};

/* -------------------------------------------------------------------------- */
/* Wiring                                                                     */
/* -------------------------------------------------------------------------- */

export interface Store {
  users: Repository<User>;
  restaurants: Repository<Restaurant>;
  foods: Repository<FoodItem>;
  orders: Repository<Order>;
  reviews: Repository<Review>;
  coupons: Repository<Coupon>;
}

let store: Store = {
  users: memoryRepo<User>(INITIAL_USERS),
  restaurants: memoryRepo<Restaurant>(INITIAL_RESTAURANTS),
  foods: memoryRepo<FoodItem>(INITIAL_FOOD_ITEMS),
  orders: memoryRepo<Order>(INITIAL_ORDERS),
  reviews: memoryRepo<Review>(INITIAL_REVIEWS),
  coupons: memoryRepo<Coupon>(INITIAL_COUPONS),
};

let usingMongo = false;

/** The live repository. Import this in handlers. */
export const repo = new Proxy({} as Store, {
  get: (_target, key: string) => (store as any)[key],
});

export const isUsingMongo = () => usingMongo;

/** Populates any empty collection so a brand-new database still has demo data. */
async function seedIfEmpty(): Promise<string[]> {
  const seeded: string[] = [];

  const tasks: Array<[string, Model<any>, unknown[]]> = [
    ['users', UserModel, INITIAL_USERS],
    ['restaurants', RestaurantModel, INITIAL_RESTAURANTS],
    ['fooditems', FoodItemModel, INITIAL_FOOD_ITEMS],
    ['coupons', CouponModel, INITIAL_COUPONS],
    ['reviews', ReviewModel, INITIAL_REVIEWS],
    ['orders', OrderModel, INITIAL_ORDERS],
  ];

  for (const [label, mdl, rows] of tasks) {
    if ((await mdl.estimatedDocumentCount()) === 0 && rows.length > 0) {
      await mdl.insertMany(rows, { ordered: false });
      seeded.push(`${label}(${rows.length})`);
    }
  }

  return seeded;
}

/**
 * Connects to MongoDB when MONGODB_URI is present.
 *
 * A failure here is deliberately non-fatal: the server logs the reason and
 * keeps serving from memory rather than refusing to boot.
 */
export async function connectDatabase(): Promise<void> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.log('[DB] MONGODB_URI not set — using in-memory store (data resets on restart).');
    return;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      // Named so it is identifiable in Atlas' connection metrics.
      appName: 'cravecache',
    });

    store = {
      users: mongoRepo<User>(UserModel),
      restaurants: mongoRepo<Restaurant>(RestaurantModel),
      foods: mongoRepo<FoodItem>(FoodItemModel),
      orders: mongoRepo<Order>(OrderModel),
      reviews: mongoRepo<Review>(ReviewModel),
      coupons: mongoRepo<Coupon>(CouponModel),
    };
    usingMongo = true;

    const dbName = mongoose.connection.name;
    console.log(`[DB] Connected to MongoDB — database "${dbName}".`);

    const seeded = await seedIfEmpty();
    if (seeded.length > 0) {
      console.log(`[DB] Seeded empty collections: ${seeded.join(', ')}`);
    }
  } catch (err: any) {
    console.error(`[DB] MongoDB connection failed: ${err?.message || err}`);
    console.error('[DB] Falling back to the in-memory store for this run.');
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (usingMongo) await mongoose.disconnect();
}
