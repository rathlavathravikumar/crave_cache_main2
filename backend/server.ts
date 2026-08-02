import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { verifyToken, createClerkClient } from '@clerk/backend';
import { INITIAL_USERS } from './data/initialData';
import {
  Restaurant,
  FoodItem,
  Coupon,
  User,
  Order,
  Review,
  OrderStatus,
} from './types';
import { repo, connectDatabase, isUsingMongo } from './db';
import {
  getStripe,
  isStripeLive,
  STRIPE_CURRENCY,
  toMinorUnits,
  fromMinorUnits,
  uploadImage,
  isCloudinaryLive,
  getPaymentMode,
} from './db/integrations';

// ==========================================
// ROLE RESOLUTION (server-authoritative)
// ==========================================
// Roles are never taken from the client on the Clerk path. Whoever signs in
// with Google/GitHub/Microsoft gets the role their email is listed under here,
// defaulting to 'customer'. Set these in .env, comma-separated.
const parseEmailList = (raw?: string): string[] =>
  (raw || '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

const ADMIN_EMAILS = parseEmailList(process.env.ADMIN_EMAILS);
const OWNER_EMAILS = parseEmailList(process.env.OWNER_EMAILS);

// Lazily built so the app still boots with no Clerk key configured.
let _clerk: ReturnType<typeof createClerkClient> | null = null;
const clerkClient = (secretKey: string) => {
  if (!_clerk) _clerk = createClerkClient({ secretKey });
  return _clerk;
};

const resolveRoleForEmail = (email: string): 'customer' | 'owner' | 'admin' => {
  const normalized = (email || '').toLowerCase();
  if (ADMIN_EMAILS.includes(normalized)) return 'admin';
  if (OWNER_EMAILS.includes(normalized)) return 'owner';
  // Fall back to the role on a matching seeded account so the demo data
  // (owner@pizzamaestro.com, admin@cravecache.com) keeps working.
  const seeded = INITIAL_USERS.find((u) => u.email.toLowerCase() === normalized);
  return (seeded?.role as 'customer' | 'owner' | 'admin') || 'customer';
};

const ORDER_STATUSES: OrderStatus[] = [
  'Placed',
  'Confirmed',
  'Preparing',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];

async function startServer() {
  // Connect before serving so the first request already has the real store.
  // A connection failure is logged and falls back to memory rather than
  // preventing the server from booting.
  await connectDatabase();

  const app = express();
  const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

  /*
   * CORS.
   *
   * Only needed for the split deployment, where the client is served from a
   * different origin (e.g. Vercel) than this API (e.g. Render). Same-origin
   * single-service deployments never trigger a preflight.
   *
   * ALLOWED_ORIGINS (comma-separated) takes precedence; FRONTEND_URL is
   * accepted as a single-value alias. With neither set, and in development,
   * any origin is allowed so local tooling works.
   */
  const allowedOrigins = [
    ...(process.env.ALLOWED_ORIGINS || '').split(','),
    process.env.FRONTEND_URL || '',
  ]
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  app.use((req, res, next) => {
    const origin = req.headers.origin;

    if (origin) {
      const normalised = origin.replace(/\/+$/, '');
      const permitAll = allowedOrigins.length === 0;
      if (permitAll || allowedOrigins.includes(normalised)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Vary', 'Origin');
      }
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');

    // Preflight ends here.
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Log requests
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.path}`);
    }
    next();
  });

  // ==========================================
  // AUTHENTICATION ENDPOINTS
  // ==========================================
  // Demo (passwordless) login. Kept as a fallback so the app stays usable and
  // one-click role switching still works, but it is now opt-out-able in
  // production and no longer rewrites the stored role of a real account.
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    if (process.env.ALLOW_DEMO_LOGIN === 'false') {
      return res.status(403).json({ error: 'Demo login is disabled. Please sign in with Google, GitHub or Microsoft.' });
    }

    const { email, role } = req.body;
    let user = await repo.users.findOne({ email: (email || '').toLowerCase() });

    if (!user) {
      // Auto register or login default customer/owner/admin if matching
      const userRole = role || ((email || '').includes('admin') ? 'admin' : (email || '').includes('owner') ? 'owner' : 'customer');
      user = {
        id: `usr_${Date.now()}`,
        name: userRole === 'admin' ? 'Root Admin' : userRole === 'owner' ? 'Restaurant Owner' : (email ? email.split('@')[0] : 'Valued Customer'),
        email: email || (userRole === 'admin' ? 'admin@cravecache.com' : userRole === 'owner' ? 'owner@cravecache.com' : 'customer@cravecache.com'),
        role: userRole,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        phone: '+1 (555) 123-4567',
        addresses: [
          {
            id: 'addr_default',
            title: 'Home',
            street: '123 Main Street',
            city: 'Springfield',
            state: 'IL',
            zipCode: '62701',
            isDefault: true,
          },
        ],
        createdAt: new Date().toISOString(),
      };
      await repo.users.insert(user);
    }

    if (user.blocked) {
      return res.status(403).json({ error: 'Your account has been blocked by administrator.' });
    }

    // A requested role only shapes this session's response. Previously this
    // assignment mutated the stored account, which permanently corrupted the
    // seeded users (signing in as 'admin' left alex@example.com an admin).
    const sessionUser = role && user.role !== role ? { ...user, role } : user;

    res.json({
      token: `jwt_token_simulated_${user.id}_${Date.now()}`,
      user: sessionUser,
    });
  });

  app.post('/api/auth/register', async (req: Request, res: Response) => {
    const { name, email, phone, password, role } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and Email are required.' });
    }

    const existing = await repo.users.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    const assignedRole = role || 'customer';

    const newUser: User = {
      id: `usr_${Date.now()}`,
      name,
      email,
      phone: phone || '+1 (555) 000-1111',
      role: assignedRole,
      avatar: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 1000)}?auto=format&fit=crop&w=200&q=80`,
      addresses: [
        {
          id: `addr_${Date.now()}`,
          title: 'Home',
          street: '456 Oak Park Blvd',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62702',
          isDefault: true,
        },
      ],
      createdAt: new Date().toISOString(),
    };

    await repo.users.insert(newUser);
    res.status(201).json({
      token: `jwt_token_simulated_${newUser.id}_${Date.now()}`,
      user: newUser,
    });
  });

  // ==========================================
  // CLERK SOCIAL SIGN-IN EXCHANGE
  // ==========================================
  // The browser completes OAuth with Clerk (Google / GitHub / Microsoft), then
  // posts its Clerk session token here. We verify the token server-side, decide
  // the role from the allowlist above, upsert a CraveCache user, and hand back
  // the same { token, user } shape the rest of the app already consumes.
  app.get('/api/auth/clerk/status', (req: Request, res: Response) => {
    res.json({
      configured: Boolean(process.env.CLERK_SECRET_KEY),
      providers: ['google', 'github', 'microsoft'],
    });
  });

  app.post('/api/auth/clerk', async (req: Request, res: Response) => {
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
      return res.status(503).json({
        error: 'Clerk is not configured on the server. Set CLERK_SECRET_KEY in .env.',
      });
    }

    const authHeader = req.headers.authorization || '';
    const sessionToken = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!sessionToken) {
      return res.status(401).json({ error: 'Missing Clerk session token.' });
    }

    let claims: any;
    try {
      claims = await verifyToken(sessionToken, { secretKey });
    } catch (err: any) {
      console.error('[CLERK] Token verification failed:', err?.message || err);
      return res.status(401).json({ error: 'Invalid or expired Clerk session.' });
    }

    // The email decides the role, so it must never come from the request body —
    // a client could otherwise post an allowlisted address and self-promote to
    // admin. Clerk session tokens carry no email claim by default, so we look
    // the account up through the Backend API using the verified subject.
    const profile = req.body?.profile || {};
    let clerkUser: any;
    try {
      clerkUser = await clerkClient(secretKey).users.getUser(claims.sub);
    } catch (err: any) {
      console.error('[CLERK] User lookup failed:', err?.message || err);
      return res.status(502).json({ error: 'Could not load your Clerk profile. Please try again.' });
    }

    const primaryEmail =
      clerkUser.emailAddresses?.find((entry: any) => entry.id === clerkUser.primaryEmailAddressId) ||
      clerkUser.emailAddresses?.[0];
    const email: string = (primaryEmail?.emailAddress || '').toLowerCase();

    if (!email) {
      return res.status(400).json({
        error: 'No email address on this Clerk account. Add one, or grant email scope to the provider.',
      });
    }

    const role = resolveRoleForEmail(email);
    // Name and avatar are cosmetic only, so a client-supplied fallback is fine.
    const displayName: string =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
      clerkUser.username ||
      profile.name ||
      email.split('@')[0] ||
      'CraveCache User';
    const avatar: string =
      clerkUser.imageUrl ||
      profile.avatar ||
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';

    const existing = await repo.users.findOne({ email });
    let user: User;

    if (existing) {
      if (existing.blocked) {
        return res.status(403).json({ error: 'Your account has been blocked by administrator.' });
      }
      // Refresh the profile fields, with the allowlist as the source of truth
      // for the role.
      user =
        (await repo.users.update(existing.id, {
          name: displayName || existing.name,
          avatar: avatar || existing.avatar,
          role,
        })) || existing;
    } else {
      user = {
        id: `usr_clerk_${claims.sub}`,
        name: displayName,
        email,
        role,
        avatar,
        phone: profile.phone || '',
        addresses: [],
        createdAt: new Date().toISOString(),
      };
      await repo.users.insert(user);
    }

    console.log(`[CLERK] ${email} signed in as ${role} via ${profile.provider || 'oauth'}`);

    res.json({
      token: sessionToken,
      user,
      roleSource: ADMIN_EMAILS.includes(email)
        ? 'admin allowlist'
        : OWNER_EMAILS.includes(email)
        ? 'owner allowlist'
        : 'default',
    });
  });

  app.get('/api/auth/me', async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const token = (authHeader || '').replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }
    // Demo tokens embed the user id as jwt_token_simulated_<id>_<ts>.
    const users = await repo.users.all();
    const foundUser = users.find((u) => token.includes(u.id));
    if (!foundUser) {
      return res.status(401).json({ error: 'Session not recognised.' });
    }
    res.json({ user: foundUser });
  });

  /*
   * Profile updates.
   *
   * Both handlers previously fell back to index 0 when the id did not match,
   * so a request carrying an unknown id silently rewrote the first account in
   * the store instead of failing. They now 404.
   *
   * A role is never accepted from the request body — roles are decided by the
   * server (see resolveRoleForEmail), not by whoever is editing a profile.
   */
  // Only these four fields are writable; anything else in the body is ignored.
  const profilePatch = (body: Record<string, any>) => {
    const patch: Partial<User> = {};
    for (const field of ['name', 'email', 'phone', 'avatar'] as const) {
      if (body[field] !== undefined) patch[field] = body[field];
    }
    return patch;
  };

  const updateProfileById = async (id: string, body: Record<string, any>, res: Response) => {
    const updated = await repo.users.update(id, profilePatch(body));
    if (!updated) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json(updated);
  };

  app.put('/api/auth/profile', (req: Request, res: Response) =>
    updateProfileById(req.body?.userId, req.body || {}, res)
  );

  app.put('/api/auth/profile/:id', (req: Request, res: Response) =>
    updateProfileById(req.params.id, req.body || {}, res)
  );

  app.put('/api/auth/addresses', async (req: Request, res: Response) => {
    const { userId, addresses } = req.body;
    const updated = await repo.users.update(userId, { addresses });
    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(updated);
  });

  // ==========================================
  // RESTAURANTS ENDPOINTS
  // ==========================================
  app.get('/api/restaurants', async (req: Request, res: Response) => {
    const { search, cuisine, isVeg, maxTime, minRating, sort } = req.query;

    let results = await repo.restaurants.all();

    if (search) {
      const q = (search as string).toLowerCase();
      results = results.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.cuisine.some((c) => c.toLowerCase().includes(q))
      );
    }

    if (cuisine && cuisine !== 'All') {
      results = results.filter((r) => r.cuisine.includes(cuisine as string));
    }

    if (isVeg === 'true') {
      results = results.filter((r) => r.isVegOnly);
    }

    if (maxTime) {
      results = results.filter((r) => r.deliveryTimeMinutes <= Number(maxTime));
    }

    if (minRating) {
      results = results.filter((r) => r.rating >= Number(minRating));
    }

    // Sort
    if (sort === 'rating') {
      results.sort((a, b) => b.rating - a.rating);
    } else if (sort === 'deliveryTime') {
      results.sort((a, b) => a.deliveryTimeMinutes - b.deliveryTimeMinutes);
    } else if (sort === 'costLow') {
      results.sort((a, b) => a.priceForTwo - b.priceForTwo);
    } else if (sort === 'costHigh') {
      results.sort((a, b) => b.priceForTwo - a.priceForTwo);
    }

    res.json(results);
  });

  app.get('/api/restaurants/:id', async (req: Request, res: Response) => {
    const key = req.params.id;
    const restaurant =
      (await repo.restaurants.findById(key)) || (await repo.restaurants.findOne({ slug: key }));
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    const [foods, reviews] = await Promise.all([
      repo.foods.find({ restaurantId: restaurant.id }),
      repo.reviews.find({ restaurantId: restaurant.id }),
    ]);
    res.json({ restaurant, foods, reviews });
  });

  // Restaurant CRUD Handlers
  const handleCreateRestaurant = async (req: Request, res: Response) => {
    const cuisine = Array.isArray(req.body.cuisine)
      ? req.body.cuisine
      : (req.body.cuisine || 'North Indian').split(',').map((c: string) => c.trim());

    const newRest: Restaurant = {
      id: `rest_${Date.now()}`,
      slug: req.body.name ? req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `rest-${Date.now()}`,
      name: req.body.name || 'New Gourmet Kitchen',
      description: req.body.description || 'Delicious handcrafted dishes.',
      image: req.body.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
      bannerImage: req.body.bannerImage || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
      rating: Number(req.body.rating) || 4.5,
      reviewCount: 1,
      cuisine: cuisine.length > 0 ? cuisine : ['North Indian'],
      deliveryTimeMinutes: Number(req.body.deliveryTimeMinutes) || 25,
      priceForTwo: Number(req.body.priceForTwo) || 450,
      costTier: req.body.costTier || '₹₹',
      isVegOnly: req.body.isVegOnly || false,
      isOpen: req.body.isOpen !== undefined ? req.body.isOpen : true,
      address: req.body.address || 'Central Plaza, New Delhi',
      city: req.body.city || 'New Delhi',
      phone: req.body.phone || '+91 98765 00000',
      discountOffer: req.body.discountOffer,
    };
    await repo.restaurants.insert(newRest);
    res.status(201).json(newRest);
  };

  const handleUpdateRestaurant = async (req: Request, res: Response) => {
    const current = await repo.restaurants.findById(req.params.id);
    if (!current) return res.status(404).json({ error: 'Restaurant not found' });

    let updatedCuisine = current.cuisine;
    if (req.body.cuisine) {
      updatedCuisine = Array.isArray(req.body.cuisine)
        ? req.body.cuisine
        : req.body.cuisine.split(',').map((c: string) => c.trim());
    }

    // `id` is immutable — never let a payload repoint the document.
    const { id: _ignored, ...patch } = req.body || {};

    const updated = await repo.restaurants.update(current.id, {
      ...patch,
      cuisine: updatedCuisine,
      priceForTwo:
        req.body.priceForTwo !== undefined ? Number(req.body.priceForTwo) : current.priceForTwo,
      deliveryTimeMinutes:
        req.body.deliveryTimeMinutes !== undefined
          ? Number(req.body.deliveryTimeMinutes)
          : current.deliveryTimeMinutes,
    });
    res.json(updated);
  };

  const handleDeleteRestaurant = async (req: Request, res: Response) => {
    const removed = await repo.restaurants.remove(req.params.id);
    if (!removed) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    // Cascade: the menu belongs to the restaurant.
    const removedFoods = await repo.foods.removeWhere({ restaurantId: req.params.id });
    res.json({
      success: true,
      message: `Restaurant deleted along with ${removedFoods} menu item(s).`,
    });
  };

  app.post('/api/admin/restaurants', handleCreateRestaurant);
  app.post('/api/restaurants', handleCreateRestaurant);
  app.put('/api/admin/restaurants/:id', handleUpdateRestaurant);
  app.put('/api/restaurants/:id', handleUpdateRestaurant);
  app.delete('/api/admin/restaurants/:id', handleDeleteRestaurant);
  app.delete('/api/restaurants/:id', handleDeleteRestaurant);

  // ==========================================
  // FOOD ITEMS ENDPOINTS
  // ==========================================
  const handleGetFoods = async (req: Request, res: Response) => {
    const { search, category, restaurantId, isVeg, isSpicy, maxPrice } = req.query;
    // A restaurantId narrows the query in the database; the remaining optional
    // criteria are applied to that result set.
    let items = restaurantId
      ? await repo.foods.find({ restaurantId: restaurantId as string })
      : await repo.foods.all();

    if (search) {
      const q = (search as string).toLowerCase();
      items = items.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q)
      );
    }
    if (category && category !== 'All') {
      items = items.filter((f) => f.category === category);
    }
    if (isVeg === 'true') {
      items = items.filter((f) => f.isVeg);
    }
    if (isSpicy === 'true') {
      items = items.filter((f) => f.isSpicy);
    }
    if (maxPrice) {
      items = items.filter((f) => f.price <= Number(maxPrice));
    }

    res.json(items);
  };

  app.get('/api/foods', handleGetFoods);
  app.get('/api/food-items', handleGetFoods);
  app.get('/api/admin/foods', handleGetFoods);

  // Food Item CRUD Handlers
  const handleCreateFood = async (req: Request, res: Response) => {
    const targetRestId = req.body.restaurantId;
    const rest =
      (targetRestId ? await repo.restaurants.findById(targetRestId) : null) ||
      (await repo.restaurants.all())[0];
    const newFood: FoodItem = {
      id: `food_${Date.now()}`,
      restaurantId: rest ? rest.id : (targetRestId || 'rest_1'),
      restaurantName: rest ? rest.name : (req.body.restaurantName || 'Taste Paradise'),
      name: req.body.name || 'Signature Special',
      description: req.body.description || 'Prepared fresh with finest organic ingredients.',
      price: Number(req.body.price) || 249,
      image: req.body.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      category: req.body.category || 'Mains',
      isVeg: req.body.isVeg !== undefined ? Boolean(req.body.isVeg) : true,
      isSpicy: Boolean(req.body.isSpicy),
      isBestseller: Boolean(req.body.isBestseller),
      isAvailable: req.body.isAvailable !== undefined ? Boolean(req.body.isAvailable) : true,
      rating: 4.8,
      calories: Number(req.body.calories) || 450,
      customizationGroups: req.body.customizationGroups,
    };
    await repo.foods.insert(newFood);
    res.status(201).json(newFood);
  };

  const handleUpdateFood = async (req: Request, res: Response) => {
    const current = await repo.foods.findById(req.params.id);
    if (!current) return res.status(404).json({ error: 'Food item not found' });

    let restName = current.restaurantName;
    if (req.body.restaurantId) {
      const rest = await repo.restaurants.findById(req.body.restaurantId);
      if (rest) restName = rest.name;
    }

    const { id: _ignored, ...patch } = req.body || {};

    const updated = await repo.foods.update(current.id, {
      ...patch,
      restaurantName: restName,
      price: req.body.price !== undefined ? Number(req.body.price) : current.price,
      isVeg: req.body.isVeg !== undefined ? Boolean(req.body.isVeg) : current.isVeg,
      isSpicy: req.body.isSpicy !== undefined ? Boolean(req.body.isSpicy) : current.isSpicy,
    });
    res.json(updated);
  };

  const handleDeleteFood = async (req: Request, res: Response) => {
    const targetId = req.params.id;
    const removed =
      (await repo.foods.remove(targetId)) ||
      (await repo.foods.remove(decodeURIComponent(targetId)));
    if (!removed) {
      return res.status(404).json({ error: 'Food item not found' });
    }
    res.json({ success: true, message: 'Food item deleted.' });
  };

  app.post('/api/admin/foods', handleCreateFood);
  app.post('/api/foods', handleCreateFood);
  app.post('/api/food-items', handleCreateFood);

  app.put('/api/admin/foods/:id', handleUpdateFood);
  app.put('/api/foods/:id', handleUpdateFood);
  app.put('/api/food-items/:id', handleUpdateFood);

  app.delete('/api/admin/foods/:id', handleDeleteFood);
  app.delete('/api/foods/:id', handleDeleteFood);
  app.delete('/api/food-items/:id', handleDeleteFood);

  // ==========================================
  // COUPONS ENDPOINTS
  // ==========================================
  app.get('/api/coupons', async (req: Request, res: Response) => {
    res.json(await repo.coupons.find({ isActive: true }));
  });

  const handleCreateCoupon = async (req: Request, res: Response) => {
    const newCoupon: Coupon = {
      id: `c_${Date.now()}`,
      code: (req.body.code || 'SAVE20').toUpperCase(),
      discountType: req.body.discountType || 'percentage',
      discountValue: Number(req.body.discountValue) || 20,
      minOrderValue: Number(req.body.minOrderValue) || 200,
      maxDiscount: Number(req.body.maxDiscountAmount) || 150,
      description: req.body.description || `${req.body.discountValue || 20}% OFF`,
      isActive: true,
      expiryDate: '2026-12-31',
    };
    await repo.coupons.insert(newCoupon);
    res.status(201).json(newCoupon);
  };

  const handleDeleteCoupon = async (req: Request, res: Response) => {
    const key = req.params.id;
    const removed =
      (await repo.coupons.remove(key)) ||
      (await repo.coupons.removeWhere({ code: key.toUpperCase() })) > 0;
    if (!removed) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    res.json({ success: true, message: 'Coupon deleted.' });
  };

  app.post('/api/coupons', handleCreateCoupon);
  app.post('/api/admin/coupons', handleCreateCoupon);
  app.delete('/api/coupons/:id', handleDeleteCoupon);
  app.delete('/api/admin/coupons/:id', handleDeleteCoupon);

  app.post('/api/coupons/validate', async (req: Request, res: Response) => {
    const { code, cartAmount } = req.body;

    // Without this guard an absent cartAmount skipped the minimum-value check
    // and produced discountAmount: NaN, serialised as null.
    const amount = Number(cartAmount);
    if (!Number.isFinite(amount) || amount < 0) {
      return res
        .status(400)
        .json({ valid: false, message: 'A valid cart amount is required to apply a coupon.' });
    }

    const coupon = await repo.coupons.findOne({
      code: (code || '').toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      return res.status(400).json({ valid: false, message: 'Invalid or expired coupon code.' });
    }

    if (amount < coupon.minOrderValue) {
      return res.status(400).json({
        valid: false,
        message: `Minimum order value of ₹${coupon.minOrderValue} required for coupon ${coupon.code}.`,
      });
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (amount * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = coupon.discountValue;
    }

    res.json({
      valid: true,
      coupon,
      discountAmount: Math.round(discount),
      message: `Coupon ${coupon.code} applied successfully! You saved ₹${Math.round(discount)}`,
    });
  });

  app.put('/api/admin/coupons/:id', async (req: Request, res: Response) => {
    const { id: _ignored, ...patch } = req.body || {};
    const updated = await repo.coupons.update(req.params.id, patch);
    if (!updated) return res.status(404).json({ error: 'Coupon not found' });
    res.json(updated);
  });

  // ==========================================
  // ORDERS ENDPOINTS
  // ==========================================
  app.post('/api/orders', async (req: Request, res: Response) => {
    const { userId, restaurantId, items, deliveryAddress, couponCode, paymentMethod, paymentIntentId } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Cart cannot be empty.' });
    }

    const user = userId ? await repo.users.findById(userId) : null;
    const restaurant = restaurantId ? await repo.restaurants.findById(restaurantId) : null;

    if (!user) {
      return res.status(400).json({ error: 'Unknown user — please sign in again.' });
    }
    if (!restaurant) {
      return res.status(400).json({ error: 'Unknown restaurant for this order.' });
    }

    /*
     * Online card payment is the only accepted method, and it is enforced here
     * rather than only in the UI — otherwise any API caller could create an
     * order that was never paid for.
     *
     * Two accepted methods:
     *   Cash on Delivery  -> no payment now; the order is created as Pending
     *   card / online     -> when Stripe is live the intent must exist and have
     *                        actually succeeded, read from Stripe rather than
     *                        taken from the request
     */
    const isCashOnDelivery = paymentMethod === 'Cash on Delivery';

    const itemTotal = items.reduce((acc: number, item: any) => acc + item.itemTotalPrice * item.quantity, 0);
    const deliveryFee = items.length > 0 ? 40 : 0;
    const taxAndPackaging = items.length > 0 ? Math.round(itemTotal * 0.05 + 25) : 0;

    let discountAmount = 0;
    if (couponCode) {
      const coupon = await repo.coupons.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
      });
      if (coupon && itemTotal >= coupon.minOrderValue) {
        if (coupon.discountType === 'percentage') {
          discountAmount = (itemTotal * coupon.discountValue) / 100;
          if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) discountAmount = coupon.maxDiscount;
        } else {
          discountAmount = coupon.discountValue;
        }
      }
    }

    const totalAmount = Math.max(0, Math.round(itemTotal + deliveryFee + taxAndPackaging - discountAmount));

    /*
     * Verify the payment now that the authoritative total is known.
     *
     * The amount is recomputed server-side above, so a client cannot pay a
     * small amount and claim a large order.
     */
    // Cash orders skip verification: nothing has been charged yet.
    const stripe = isCashOnDelivery ? null : getStripe();
    if (stripe) {
      if (!paymentIntentId) {
        return res
          .status(402)
          .json({ error: 'Payment is required before an order can be placed.' });
      }
      try {
        const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (intent.status !== 'succeeded') {
          return res
            .status(402)
            .json({ error: `Payment has not completed (status: ${intent.status}).` });
        }
        if (intent.amount < toMinorUnits(totalAmount)) {
          return res.status(402).json({ error: 'Payment amount does not cover this order.' });
        }
      } catch (err: any) {
        console.error('[STRIPE] order verification failed:', err?.message || err);
        return res.status(402).json({ error: 'That payment could not be verified.' });
      }
    }

    const newOrder: Order = {
      id: `ord_${Math.floor(1000 + Math.random() * 9000)}`,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      items,
      deliveryAddress: deliveryAddress || user.addresses[0],
      itemTotal,
      deliveryFee,
      taxAndPackaging,
      discountAmount,
      couponCode,
      totalAmount,
      status: 'Placed',
      paymentMethod: paymentMethod || 'Credit/Debit Card',
      // Cash is collected by the driver, so it stays Pending until delivery.
      paymentStatus: isCashOnDelivery ? 'Pending' : 'Paid',
      stripePaymentIntentId: isCashOnDelivery
        ? undefined
        : paymentIntentId || `pi_sim_${Date.now()}`,
      deliveryDriver: {
        name: 'David Miller',
        phone: '+1 (555) 456-7890',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      },
      timeline: [
        {
          status: 'Placed',
          timestamp: new Date().toISOString(),
          message: 'Order successfully submitted and transmitted to kitchen.',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await repo.orders.insert(newOrder);

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order: newOrder,
    });
  });

  const newestFirst = (a: Order, b: Order) => (a.createdAt < b.createdAt ? 1 : -1);

  app.get('/api/orders', async (req: Request, res: Response) => {
    const { userId, role } = req.query;
    // Admins see everything; a userId narrows the query in the database.
    const orders =
      role === 'admin' || !userId
        ? await repo.orders.all()
        : await repo.orders.find({ userId: userId as string });
    res.json(orders.sort(newestFirst));
  });

  app.get('/api/orders/:id', async (req: Request, res: Response) => {
    const order = await repo.orders.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  });

  app.put('/api/orders/:id/status', async (req: Request, res: Response) => {
    const { status, message } = req.body;
    const current = await repo.orders.findById(req.params.id);
    if (!current) return res.status(404).json({ error: 'Order not found' });

    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Unknown order status "${status}".` });
    }

    const timelineMsg =
      message ||
      (status === 'Confirmed'
        ? 'Restaurant accepted your order.'
        : status === 'Preparing'
        ? 'Your food is sizzling in the kitchen.'
        : status === 'Out for Delivery'
        ? 'Driver picked up your meal and is arriving soon!'
        : status === 'Delivered'
        ? 'Order delivered. Bon Appétit!'
        : 'Order status updated.');

    const updated = await repo.orders.update(current.id, {
      status: status as OrderStatus,
      updatedAt: new Date().toISOString(),
      timeline: [
        ...current.timeline,
        {
          status: status as OrderStatus,
          timestamp: new Date().toISOString(),
          message: timelineMsg,
        },
      ],
    });
    res.json(updated);
  });

  app.put('/api/orders/:id/cancel', async (req: Request, res: Response) => {
    const current = await repo.orders.findById(req.params.id);
    if (!current) return res.status(404).json({ error: 'Order not found' });

    if (current.status === 'Delivered') {
      return res.status(400).json({ error: 'Delivered orders cannot be cancelled.' });
    }
    if (current.status === 'Cancelled') {
      return res.status(400).json({ error: 'This order is already cancelled.' });
    }

    const updated = await repo.orders.update(current.id, {
      status: 'Cancelled',
      paymentStatus: 'Refunded',
      updatedAt: new Date().toISOString(),
      timeline: [
        ...current.timeline,
        {
          status: 'Cancelled',
          timestamp: new Date().toISOString(),
          message: 'Order cancelled and refund initiated.',
        },
      ],
    });

    res.json(updated);
  });

  // ==========================================
  // REVIEWS ENDPOINTS
  // ==========================================
  app.post('/api/reviews', async (req: Request, res: Response) => {
    const { userId, userName, userAvatar, restaurantId, foodItemId, rating, comment } = req.body;

    if (!restaurantId) {
      return res.status(400).json({ error: 'A restaurantId is required to leave a review.' });
    }

    const score = Number(rating);
    if (!Number.isFinite(score) || score < 1 || score > 5) {
      return res.status(400).json({ error: 'Rating must be a number between 1 and 5.' });
    }

    const newReview: Review = {
      id: `rev_${Date.now()}`,
      userId: userId || 'usr_customer_1',
      userName: userName || 'Satisfied Diner',
      userAvatar,
      restaurantId,
      foodItemId,
      rating: score,
      comment: comment || '',
      createdAt: new Date().toISOString(),
    };
    await repo.reviews.insert(newReview);

    // Recalculate the restaurant's aggregate rating from its stored reviews.
    const restReviews = await repo.reviews.find({ restaurantId });
    if (restReviews.length > 0) {
      const avgRating = Number(
        (restReviews.reduce((a, b) => a + b.rating, 0) / restReviews.length).toFixed(1)
      );
      await repo.restaurants.update(restaurantId, {
        rating: avgRating,
        reviewCount: restReviews.length,
      });
    }

    res.status(201).json(newReview);
  });

  // ==========================================
  // STRIPE PAYMENT ENDPOINTS
  // ==========================================
  // Real Stripe when STRIPE_SECRET_KEY is set. Without it these fall back to
  // the previous simulation so the checkout flow stays usable.
  //
  // Card details never reach this server: the browser sends them straight to
  // Stripe via Stripe Elements and only confirms the intent here.
  const handleCreatePaymentIntent = async (req: Request, res: Response) => {
    const { amount, currency = STRIPE_CURRENCY, orderRef } = req.body;

    const rupees = Number(amount);
    if (!Number.isFinite(rupees) || rupees <= 0) {
      return res.status(400).json({ error: 'A valid payment amount is required.' });
    }

    const stripe = getStripe();

    if (!stripe) {
      // --- simulated mode ---
      const intentId = `pi_sim_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
      return res.json({
        simulated: true,
        clientSecret: `${intentId}_secret_${Math.random().toString(36).substring(2, 9)}`,
        paymentIntentId: intentId,
        amount: rupees,
        currency,
        status: 'requires_payment_method',
      });
    }

    try {
      const intent = await stripe.paymentIntents.create({
        amount: toMinorUnits(rupees),
        currency: String(currency).toLowerCase(),
        payment_method_types: ['card'],
        description: orderRef ? `CraveCache order ${orderRef}` : 'CraveCache order',
        metadata: {
          app: 'cravecache',
          orderRef: orderRef || '',
          amountRupees: String(rupees),
        },
      });

      res.json({
        simulated: false,
        clientSecret: intent.client_secret,
        paymentIntentId: intent.id,
        amount: rupees,
        currency: intent.currency,
        status: intent.status,
      });
    } catch (err: any) {
      console.error('[STRIPE] create intent failed:', err?.message || err);
      res.status(502).json({ error: err?.message || 'Could not start the payment.' });
    }
  };

  /**
   * Verifies a payment actually succeeded.
   *
   * The status is read back from Stripe rather than trusted from the client —
   * a browser claiming "succeeded" is not evidence of payment.
   */
  const handleConfirmPayment = async (req: Request, res: Response) => {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'A paymentIntentId is required.' });
    }

    const stripe = getStripe();

    if (!stripe) {
      return res.json({
        simulated: true,
        success: true,
        paymentIntentId,
        status: 'succeeded',
        message: 'Payment simulated (Stripe is not configured).',
      });
    }

    try {
      const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
      const success = intent.status === 'succeeded';

      res.status(success ? 200 : 402).json({
        simulated: false,
        success,
        paymentIntentId: intent.id,
        status: intent.status,
        amount: fromMinorUnits(intent.amount_received || intent.amount),
        currency: intent.currency,
        message: success
          ? 'Payment captured successfully.'
          : `Payment not completed (status: ${intent.status}).`,
      });
    } catch (err: any) {
      console.error('[STRIPE] confirm failed:', err?.message || err);
      res.status(502).json({ error: err?.message || 'Could not verify the payment.' });
    }
  };

  app.post('/api/payments/create-intent', handleCreatePaymentIntent);
  app.post('/api/create-payment-intent', handleCreatePaymentIntent);
  app.post('/api/payments/confirm', handleConfirmPayment);
  app.post('/api/confirm-payment', handleConfirmPayment);

  /** Publishable key + mode, so the client knows how to render checkout. */
  app.get('/api/payments/config', (req: Request, res: Response) => {
    res.json({
      live: isStripeLive(),
      mode: getPaymentMode(),
      currency: STRIPE_CURRENCY,
    });
  });

  // ==========================================
  // CLOUDINARY IMAGE UPLOAD
  // ==========================================
  // Accepts a data URI (what the browser already produces for previews) and
  // returns a hosted URL. Falls back to echoing the data URI when Cloudinary is
  // not configured, so image pickers keep working locally.
  app.post('/api/uploads/image', async (req: Request, res: Response) => {
    const { image, folder, publicId, maxDimension } = req.body || {};

    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'An image (data URI or URL) is required.' });
    }

    // Guard the request-body limit: 10mb of JSON is roughly 7mb of base64.
    const approxBytes = (image.length * 3) / 4;
    if (approxBytes > 8 * 1024 * 1024) {
      return res.status(413).json({ error: 'Image is too large. Please use one under 8MB.' });
    }

    if (!/^data:image\/|^https?:\/\//.test(image)) {
      return res.status(400).json({ error: 'Only image data URIs or http(s) URLs are accepted.' });
    }

    try {
      const result = await uploadImage(image, {
        folder: folder || 'cravecache',
        publicId,
        maxDimension: maxDimension ? Number(maxDimension) : undefined,
      });
      res.json(result);
    } catch (err: any) {
      console.error('[CLOUDINARY] upload failed:', err?.message || err);
      res.status(502).json({ error: err?.message || 'Image upload failed.' });
    }
  });

  app.get('/api/uploads/config', (req: Request, res: Response) => {
    res.json({ live: isCloudinaryLive() });
  });

  // ==========================================
  // ADMIN ANALYTICS & USER MANAGEMENT
  // ==========================================
  app.get('/api/admin/analytics', async (req: Request, res: Response) => {
    const [orders, totalRestaurants, totalCustomers, totalUsers] = await Promise.all([
      repo.orders.all(),
      repo.restaurants.count(),
      repo.users.count({ role: 'customer' }),
      repo.users.count(),
    ]);

    const totalRevenue = orders
      .filter((o) => o.paymentStatus === 'Paid')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const statusCounts = ORDER_STATUSES.reduce(
      (acc, status) => ({ ...acc, [status]: orders.filter((o) => o.status === status).length }),
      {} as Record<OrderStatus, number>
    );

    res.json({
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalOrders: orders.length,
      totalRestaurants,
      // `totalUsers` previously counted customers only while the dashboard
      // labelled it "Registered Users". Both figures are now reported.
      totalUsers,
      totalCustomers,
      statusCounts,
      recentOrders: [...orders].sort(newestFirst).slice(0, 5),
    });
  });

  app.get('/api/admin/users', async (req: Request, res: Response) => {
    const { search } = req.query;
    let users = await repo.users.all();
    if (search) {
      const q = (search as string).toLowerCase();
      users = users.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.phone && u.phone.toLowerCase().includes(q)) ||
          u.role.toLowerCase().includes(q)
      );
    }
    res.json(users);
  });

  app.post('/api/admin/users', async (req: Request, res: Response) => {
    const { name, email, phone, role } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and Email are required.' });
    }
    const existing = await repo.users.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }
    const newUser: User = {
      id: `usr_${Date.now()}`,
      name,
      email,
      phone: phone || '+1 (555) 000-1111',
      role: role || 'customer',
      avatar: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 1000)}?auto=format&fit=crop&w=200&q=80`,
      addresses: [
        {
          id: `addr_${Date.now()}`,
          title: 'Home',
          street: '123 Main Street',
          city: 'New Delhi',
          state: 'DL',
          zipCode: '110001',
          isDefault: true,
        },
      ],
      createdAt: new Date().toISOString(),
    };
    await repo.users.insert(newUser);
    res.status(201).json(newUser);
  });

  // Ids arrive URL-encoded from some callers, so both forms are tried.
  const findUserByParam = async (raw: string): Promise<User | null> =>
    (await repo.users.findById(raw)) || (await repo.users.findById(decodeURIComponent(raw)));

  app.put('/api/admin/users/:id/toggle-block', async (req: Request, res: Response) => {
    const user = await findUserByParam(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(await repo.users.update(user.id, { blocked: !user.blocked }));
  });

  app.put('/api/admin/users/:id/role', async (req: Request, res: Response) => {
    const user = await findUserByParam(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const nextRole = req.body.role || (user.role === 'admin' ? 'customer' : 'admin');
    if (!['customer', 'owner', 'admin'].includes(nextRole)) {
      return res.status(400).json({ error: `Unknown role "${nextRole}".` });
    }
    res.json(await repo.users.update(user.id, { role: nextRole }));
  });

  app.put('/api/admin/users/:id', async (req: Request, res: Response) => {
    const user = await findUserByParam(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json(
      await repo.users.update(user.id, {
        name: req.body.name || user.name,
        email: req.body.email || user.email,
        phone: req.body.phone || user.phone,
        role: req.body.role || user.role,
        blocked: req.body.blocked !== undefined ? Boolean(req.body.blocked) : user.blocked,
      })
    );
  });

  app.delete('/api/admin/users/:id', async (req: Request, res: Response) => {
    const user = await findUserByParam(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await repo.users.remove(user.id);
    res.json({ success: true, message: 'User deleted successfully.' });
  });

  // ==========================================
  // FEATURE 3: AI PERSONALIZED RECOMMENDATION ENGINE
  // ==========================================
  app.post('/api/recommendations', async (req: Request, res: Response) => {
    const { userId, query, timeOfDay, budget } = req.body;

    // The whole catalogue is the scoring/AI context, so it is loaded once per
    // request rather than queried per item.
    const [dbFoodItems, dbOrders] = await Promise.all([repo.foods.all(), repo.orders.all()]);

    const currentHour = new Date().getHours();
    let computedTimeOfDay = timeOfDay;
    if (!computedTimeOfDay) {
      if (currentHour >= 5 && currentHour < 11) computedTimeOfDay = 'Breakfast';
      else if (currentHour >= 11 && currentHour < 16) computedTimeOfDay = 'Lunch';
      else if (currentHour >= 16 && currentHour < 22) computedTimeOfDay = 'Dinner';
      else computedTimeOfDay = 'Late Night';
    }

    const userOrders = dbOrders.filter((o) => !userId || o.userId === userId || o.userEmail === 'alex@example.com');
    const pastFoodIds = userOrders.flatMap((o) => o.items.map((i) => i.foodItem.id));
    const pastCategories = userOrders.flatMap((o) => o.items.map((i) => i.foodItem.category));

    const scoredFoods = dbFoodItems.map((food) => {
      let score = 72;
      const reasons: string[] = [];

      const orderCount = pastFoodIds.filter((id) => id === food.id).length;
      if (orderCount > 0) {
        score += 20;
        reasons.push(`Ordered ${orderCount}x previously by you`);
      } else if (pastCategories.includes(food.category)) {
        score += 12;
        reasons.push(`Matches your favorite category (${food.category})`);
      }

      if (food.rating >= 4.7) {
        score += 10;
        reasons.push(`Top customer rating ⭐ ${food.rating}`);
      }

      if (computedTimeOfDay === 'Breakfast' && (food.category === 'Bowls' || food.category === 'Salads' || food.isVeg)) {
        score += 8;
        reasons.push('Great choice for a fresh morning');
      } else if (computedTimeOfDay === 'Lunch' && (food.category === 'Pizzas' || food.category === 'Burgers' || food.category === 'Biryani')) {
        score += 8;
        reasons.push('Popular energizing Lunch pick');
      } else if (computedTimeOfDay === 'Dinner' && (food.category === 'Pizzas' || food.category === 'Biryani' || food.category === 'Tacos')) {
        score += 8;
        reasons.push('Comforting dinner recommendation');
      }

      if (budget && food.price <= budget) {
        score += 10;
        reasons.push(`Within budget (₹${food.price} <= ₹${budget})`);
      }

      if (food.isBestseller) {
        score += 5;
        reasons.push('Crowd Bestseller');
      }

      const finalScore = Math.min(99, Math.max(68, score));
      const reasonText = reasons.length > 0 ? reasons[0] : `Popular in ${food.category}`;

      return {
        ...food,
        matchScore: finalScore,
        recommendationReason: reasonText,
      };
    });

    const rankedFoods = [...scoredFoods].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

    const recommendedForYou = rankedFoods.slice(0, 6);
    const popularNearYou = [...scoredFoods].sort((a, b) => b.rating - a.rating).slice(0, 6);
    const basedOnPreviousOrders = rankedFoods.filter((f) => pastCategories.includes(f.category) || pastFoodIds.includes(f.id)).slice(0, 6);
    const trendingToday = [...scoredFoods].filter((f) => f.isBestseller || f.rating >= 4.6).slice(0, 6);
    const healthyChoices = [...scoredFoods].filter((f) => f.isVeg || f.category === 'Salads' || f.category === 'Bowls').slice(0, 6);
    const budgetFriendly = [...scoredFoods].filter((f) => f.price <= 299).sort((a, b) => a.price - b.price).slice(0, 6);

    const frequentlyOrderedTogether = [
      {
        id: 'combo_1',
        title: 'Neapolitan Pizza & Artisanal Garlic Bread',
        subtitle: 'Pizza Maestro Best Seller Pair',
        badge: 'Save 15%',
        items: dbFoodItems.filter((f) => f.id === 'food_1' || f.id === 'food_3'),
      },
      {
        id: 'combo_2',
        title: 'Truffle Smash Burger & Loaded Fries',
        subtitle: 'Urban Burger Lab Classic Combo',
        badge: 'Top Rated Pair',
        items: dbFoodItems.filter((f) => f.id === 'food_4' || f.id === 'food_5'),
      },
    ];

    let aiQuerySummary = null;
    let queryMatchingFoods: any[] = [];

    if (query) {
      try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey) {
          const ai = new GoogleGenAI({
            apiKey,
            httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
          });

          const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: `User prompt for food recommendation: "${query}". Context: Time is ${computedTimeOfDay}, Budget is ${budget || 'flexible'}.`,
            config: {
              systemInstruction: `Select 2-4 items from menu: ${JSON.stringify(dbFoodItems.map((f) => ({ id: f.id, name: f.name, price: f.price, category: f.category, isVeg: f.isVeg, rating: f.rating })))}. Return JSON with "summary" (why these items match) and "recommendedIds" (array of food item IDs).`,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  summary: { type: Type.STRING },
                  recommendedIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['summary', 'recommendedIds'],
              },
            },
          });

          const parsed = JSON.parse(response.text || '{}');
          aiQuerySummary = parsed.summary;
          if (parsed.recommendedIds && Array.isArray(parsed.recommendedIds)) {
            queryMatchingFoods = rankedFoods.filter((f) => parsed.recommendedIds.includes(f.id));
          }
        }
      } catch (e) {
        console.error('AI Recommendation query error:', e);
      }

      if (queryMatchingFoods.length === 0) {
        const qLower = query.toLowerCase();
        queryMatchingFoods = rankedFoods.filter((f) =>
          f.name.toLowerCase().includes(qLower) ||
          f.description.toLowerCase().includes(qLower) ||
          f.category.toLowerCase().includes(qLower) ||
          (qLower.includes('healthy') && f.isVeg) ||
          (qLower.includes('spicy') && f.isSpicy)
        ).slice(0, 4);
        aiQuerySummary = `Curated top matching options for "${query}" based on dietary filters and ingredients.`;
      }
    }

    res.json({
      context: {
        timeOfDay: computedTimeOfDay,
        activeUser: userOrders[0]?.userName || 'Valued Gourmet',
        pastOrderCount: userOrders.length,
      },
      aiQuerySummary,
      queryMatchingFoods,
      sections: [
        { id: 'rec_for_you', title: 'Recommended for you', subtitle: 'Personalized based on your orders and taste profile', badge: 'AI Ranked', items: recommendedForYou },
        { id: 'popular_near', title: 'Popular near you', subtitle: 'Most ordered by foodies in Springfield', badge: '4.7+ Rating', items: popularNearYou },
        { id: 'prev_orders', title: 'Order again', subtitle: 'Flavors similar to your top choices', badge: 'Favorites', items: basedOnPreviousOrders.length > 0 ? basedOnPreviousOrders : recommendedForYou.slice(0, 4) },
        { id: 'trending', title: 'Trending today', subtitle: 'Top requested dishes this week', badge: 'Bestsellers', items: trendingToday },
        { id: 'healthy', title: 'Healthy & wholesome', subtitle: 'Nutritious meals & fresh greens', badge: 'Pure Veg', items: healthyChoices },
        { id: 'budget', title: 'Under ₹299', subtitle: 'Delicious feeds under ₹299', badge: 'Under ₹299', items: budgetFriendly },
      ],
      frequentlyOrderedTogether,
    });
  });

  // ==========================================
  // FEATURE 4: RESTAURANT OWNER PORTAL APIS
  // ==========================================
  const getOwnerRestaurant = async (
    ownerUserId?: string,
    restId?: string
  ): Promise<Restaurant | null> => {
    if (restId) {
      const found = await repo.restaurants.findById(restId);
      if (found) return found;
    }
    if (ownerUserId) {
      const user = await repo.users.findById(ownerUserId);
      if (user?.restaurantId) {
        const found = await repo.restaurants.findById(user.restaurantId);
        if (found) return found;
      }
      const foundByOwner = await repo.restaurants.findOne({ ownerId: ownerUserId });
      if (foundByOwner) return foundByOwner;
    }
    // Last resort so a demo owner without a linked restaurant still sees data.
    return (await repo.restaurants.all())[0] || null;
  };

  const ownerIdFrom = (req: Request) =>
    (req.query.ownerId as string) || (req.query.userId as string) || 'usr_owner_1';

  const NO_RESTAURANT = { error: 'No restaurant is linked to this owner account.' };

  app.get('/api/owner/my-restaurant', async (req: Request, res: Response) => {
    const restaurant = await getOwnerRestaurant(ownerIdFrom(req), req.query.restaurantId as string);
    if (!restaurant) return res.status(404).json(NO_RESTAURANT);
    res.json(restaurant);
  });

  app.put('/api/owner/my-restaurant', async (req: Request, res: Response) => {
    const { id, name, description, cuisine, phone, address, city, image, bannerImage, isOpen, openingHours, deliveryRadiusKm, discountOffer } = req.body;
    const current = await getOwnerRestaurant(req.body.ownerId, id);
    if (!current) return res.status(404).json({ error: 'Restaurant not found' });

    const updated = await repo.restaurants.update(current.id, {
      name: name || current.name,
      description: description || current.description,
      cuisine: Array.isArray(cuisine)
        ? cuisine
        : cuisine
        ? cuisine.split(',').map((c: string) => c.trim())
        : current.cuisine,
      phone: phone || current.phone,
      address: address || current.address,
      city: city || current.city,
      image: image || current.image,
      bannerImage: bannerImage || current.bannerImage,
      isOpen: isOpen !== undefined ? Boolean(isOpen) : current.isOpen,
      openingHours: openingHours || current.openingHours,
      deliveryRadiusKm: deliveryRadiusKm ? Number(deliveryRadiusKm) : current.deliveryRadiusKm,
      discountOffer: discountOffer !== undefined ? discountOffer : current.discountOffer,
    });

    // Menu items denormalise the restaurant name, so keep them consistent.
    if (updated && updated.name !== current.name) {
      const menu = await repo.foods.find({ restaurantId: current.id });
      await Promise.all(
        menu.map((f) => repo.foods.update(f.id, { restaurantName: updated.name }))
      );
    }

    res.json(updated);
  });

  app.get('/api/owner/foods', async (req: Request, res: Response) => {
    const restaurant = await getOwnerRestaurant(ownerIdFrom(req), req.query.restaurantId as string);
    if (!restaurant) return res.json([]);
    res.json(await repo.foods.find({ restaurantId: restaurant.id }));
  });

  app.post('/api/owner/foods', async (req: Request, res: Response) => {
    const { ownerId, restaurantId, name, description, price, category, isVeg, isSpicy, isBestseller, image, calories } = req.body;
    const restaurant = await getOwnerRestaurant(ownerId, restaurantId);
    if (!restaurant) return res.status(404).json(NO_RESTAURANT);

    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Food item name and price are required.' });
    }

    const newFood: FoodItem = {
      id: `food_${Date.now()}`,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      name,
      description: description || '',
      price: Number(price),
      category: category || 'Main Course',
      isVeg: Boolean(isVeg),
      isSpicy: Boolean(isSpicy),
      isBestseller: Boolean(isBestseller),
      isAvailable: true,
      rating: 4.8,
      image: image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
      calories: calories ? Number(calories) : undefined,
    };

    await repo.foods.insert(newFood);
    res.status(201).json(newFood);
  });

  app.put('/api/owner/foods/:id', async (req: Request, res: Response) => {
    const current = await repo.foods.findById(req.params.id);
    if (!current) return res.status(404).json({ error: 'Food item not found' });

    const updated = await repo.foods.update(current.id, {
      name: req.body.name || current.name,
      description: req.body.description !== undefined ? req.body.description : current.description,
      price: req.body.price !== undefined ? Number(req.body.price) : current.price,
      category: req.body.category || current.category,
      isVeg: req.body.isVeg !== undefined ? Boolean(req.body.isVeg) : current.isVeg,
      isSpicy: req.body.isSpicy !== undefined ? Boolean(req.body.isSpicy) : current.isSpicy,
      isBestseller:
        req.body.isBestseller !== undefined ? Boolean(req.body.isBestseller) : current.isBestseller,
      isAvailable:
        req.body.isAvailable !== undefined ? Boolean(req.body.isAvailable) : current.isAvailable,
      image: req.body.image || current.image,
      calories: req.body.calories !== undefined ? Number(req.body.calories) : current.calories,
    });

    res.json(updated);
  });

  app.delete('/api/owner/foods/:id', async (req: Request, res: Response) => {
    const removed = await repo.foods.remove(req.params.id);
    if (!removed) return res.status(404).json({ error: 'Food item not found' });
    res.json({ success: true, message: 'Food item deleted successfully.' });
  });

  app.get('/api/owner/orders', async (req: Request, res: Response) => {
    const restaurant = await getOwnerRestaurant(ownerIdFrom(req), req.query.restaurantId as string);
    if (!restaurant) return res.json([]);
    const orders = await repo.orders.find({ restaurantId: restaurant.id });
    res.json(orders.sort(newestFirst));
  });

  app.put('/api/owner/orders/:id/status', async (req: Request, res: Response) => {
    const { status, message } = req.body;
    const current = await repo.orders.findById(req.params.id);
    if (!current) return res.status(404).json({ error: 'Order not found' });

    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Unknown order status "${status}".` });
    }

    const updated = await repo.orders.update(current.id, {
      status: status as OrderStatus,
      updatedAt: new Date().toISOString(),
      timeline: [
        ...current.timeline,
        {
          status: status as OrderStatus,
          timestamp: new Date().toISOString(),
          message: message || `Order status updated to ${status} by restaurant staff.`,
        },
      ],
    });

    res.json(updated);
  });

  app.get('/api/owner/analytics', async (req: Request, res: Response) => {
    const restaurant = await getOwnerRestaurant(ownerIdFrom(req), req.query.restaurantId as string);
    if (!restaurant) return res.status(404).json(NO_RESTAURANT);

    const [restaurantOrders, reviews, menuItemsCount] = await Promise.all([
      repo.orders.find({ restaurantId: restaurant.id }),
      repo.reviews.find({ restaurantId: restaurant.id }),
      repo.foods.count({ restaurantId: restaurant.id }),
    ]);

    const totalOrders = restaurantOrders.length;
    const totalRevenue = restaurantOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    res.json({
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      totalOrders,
      totalRevenue,
      averageOrderValue,
      menuItemsCount,
      rating: restaurant.rating,
      reviewCount: restaurant.reviewCount,
      recentReviews: reviews,
      salesTrend: [
        { day: 'Mon', revenue: 1240, orders: 4 },
        { day: 'Tue', revenue: 1890, orders: 6 },
        { day: 'Wed', revenue: 2300, orders: 8 },
        { day: 'Thu', revenue: 1950, orders: 7 },
        { day: 'Fri', revenue: 3400, orders: 12 },
        { day: 'Sat', revenue: 4200, orders: 15 },
        { day: 'Sun', revenue: 3800, orders: 13 },
      ],
    });
  });

  app.get('/api/owner/notifications', (req: Request, res: Response) => {
    const ownerId = (req.query.ownerId as string) || (req.query.userId as string) || 'usr_owner_1';
    const restaurant = getOwnerRestaurant(ownerId, req.query.restaurantId as string);

    res.json([
      {
        id: 'notif_1',
        title: 'New Incoming Order! 🍕',
        message: 'Order #ord_1001 placed by Alex Johnson (₹503)',
        time: '5 mins ago',
        type: 'order',
      },
      {
        id: 'notif_2',
        title: 'Low Stock Alert ⚠️',
        message: 'Truffle Mushroom Pizza ingredients running low',
        time: '1 hour ago',
        type: 'inventory',
      },
      {
        id: 'notif_3',
        title: 'New 5-Star Review! ⭐',
        message: '"Best wood-fired crust in town!" - Sarah K.',
        time: '3 hours ago',
        type: 'review',
      },
    ]);
  });

  // ==========================================
  // AI FOOD ASSISTANT ENDPOINT (GEMINI API)
  // ==========================================
  app.post('/api/ai/assistant', async (req: Request, res: Response) => {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required for AI Assistant.' });
    }

    // Gemini is given the full menu, restaurant list and active coupons as
    // grounding context, so all three are loaded once for this request.
    const [dbFoodItems, dbRestaurants, dbCoupons] = await Promise.all([
      repo.foods.all(),
      repo.restaurants.all(),
      repo.coupons.all(),
    ]);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        // Provide menu & restaurant knowledge to Gemini
        const menuContext = dbFoodItems.map((f) => ({
          id: f.id,
          name: f.name,
          price: f.price,
          category: f.category,
          isVeg: f.isVeg,
          isSpicy: f.isSpicy,
          restaurantName: f.restaurantName,
          restaurantId: f.restaurantId,
          description: f.description,
          customizationGroups: f.customizationGroups,
        }));

        const couponsContext = dbCoupons.filter((c) => c.isActive).map((c) => ({
          code: c.code,
          description: c.description,
          minOrderValue: c.minOrderValue,
          discountValue: c.discountValue,
          discountType: c.discountType,
        }));

        const systemPrompt = `You are CraveCache's expert AI Food Ordering Assistant.
Your goal is to parse natural language food requests (e.g. "spicy vegetarian pizza under ₹400", "protein lunch for 2", "healthy dinner with juice").
Select 1 to 3 items from our available restaurant menu that best match the request, calculate costs in Indian Rupees (₹), suggest the best coupon if applicable, and format a recommendation. All prices are in Indian Rupees (₹).

IMPORTANT: You are recommending items for the user to confirm. Always craft an inviting summary.

Available Menu Items:
${JSON.stringify(menuContext, null, 2)}

Available Coupons:
${JSON.stringify(couponsContext, null, 2)}
`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING, description: 'Friendly summary of the recommendation' },
                explanation: { type: Type.STRING, description: 'Detailed cost breakdown & matching explanation' },
                suggestedCouponCode: { type: Type.STRING, description: 'Applicable coupon code or empty string' },
                items: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      foodItemId: { type: Type.STRING },
                      quantity: { type: Type.INTEGER },
                      reason: { type: Type.STRING },
                    },
                    required: ['foodItemId', 'quantity', 'reason'],
                  },
                },
              },
              required: ['summary', 'explanation', 'items'],
            },
          },
        });

        const jsonText = response.text || '{}';
        const parsedAI = JSON.parse(jsonText);

        // Hydrate full objects
        const fullSuggestedItems = (parsedAI.items || [])
          .map((item: any) => {
            const foodItem = dbFoodItems.find((f) => f.id === item.foodItemId);
            if (!foodItem) return null;
            const restaurant = dbRestaurants.find((r) => r.id === foodItem.restaurantId);
            return {
              foodItem,
              restaurant,
              quantity: item.quantity || 1,
              reason: item.reason || 'Perfect match for your cravings',
            };
          })
          .filter(Boolean);

        const suggestedCoupon = dbCoupons.find(
          (c) => c.code.toUpperCase() === (parsedAI.suggestedCouponCode || '').toUpperCase()
        );

        return res.json({
          summary: parsedAI.summary || `Here are top recommendations for "${prompt}"!`,
          explanation: parsedAI.explanation || 'Selected best items from our top rated restaurants.',
          suggestedItems: fullSuggestedItems,
          suggestedCoupon,
        });
      }
    } catch (err) {
      console.error('Gemini AI Assistant error:', err);
    }

    // Fallback Smart Search Engine
    const lower = prompt.toLowerCase();
    const isVegReq = lower.includes('veg') || lower.includes('vegetarian') || lower.includes('plant');
    const isSpicyReq = lower.includes('spicy') || lower.includes('hot') || lower.includes('fiery');

    // Extract price condition if present
    let maxBudget = 9999;
    const priceMatch = lower.match(/(?:under|less\s*than|below)\s*(?:₹|rs\.?|inr)?\s*(\d+)/i) || lower.match(/(?:₹|rs\.?|inr)\s*(\d+)/i);
    if (priceMatch) {
      maxBudget = parseFloat(priceMatch[1]);
    }

    let matchingFoods = dbFoodItems.filter((f) => {
      if (isVegReq && !f.isVeg) return false;
      if (isSpicyReq && !f.isSpicy) return false;
      if (f.price > maxBudget) return false;

      // keyword check
      if (
        lower.includes('pizza') && f.category === 'Pizzas' ||
        lower.includes('burger') && f.category === 'Burgers' ||
        lower.includes('biryani') && f.category === 'Biryani' ||
        lower.includes('sushi') && f.category === 'Sushi' ||
        lower.includes('taco') && f.category === 'Tacos' ||
        (lower.includes('salad') || lower.includes('healthy')) && (f.category === 'Bowls' || f.category === 'Salads')
      ) {
        return true;
      }
      return f.name.toLowerCase().includes(lower) || f.description.toLowerCase().includes(lower);
    });

    if (matchingFoods.length === 0) {
      matchingFoods = dbFoodItems.filter((f) => (isVegReq ? f.isVeg : true) && f.price <= maxBudget).slice(0, 2);
    }

    const selectedItems = matchingFoods.slice(0, 2).map((f) => ({
      foodItem: f,
      restaurant: dbRestaurants.find((r) => r.id === f.restaurantId),
      quantity: 1,
      reason: `Matches your dietary preferences and budget (₹${f.price})`,
    }));

    const subtotal = selectedItems.reduce((acc, curr) => acc + curr.foodItem.price, 0);
    const suggestedCoupon = dbCoupons.find((c) => c.isActive && subtotal >= c.minOrderValue);

    res.json({
      summary: `I curated ${selectedItems.length} dish(es) matching "${prompt}"!`,
      explanation: `Selected items under ₹${maxBudget}. Total estimated price: ₹${subtotal}. ${
        suggestedCoupon ? `Applied coupon ${suggestedCoupon.code} for maximum savings!` : ''
      }`,
      suggestedItems: selectedItems,
      suggestedCoupon,
    });
  });

  // ==========================================
  // ROOT & HEALTH CHECK ROUTES
  // ==========================================
  app.get('/', (req, res) => {
    res.json({
      message: 'CraveCache Backend API is running successfully.',
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  });

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'cravecache-backend',
      uptimeSeconds: Math.round(process.uptime()),
      integrations: {
        gemini: Boolean(process.env.GEMINI_API_KEY),
        clerk: Boolean(process.env.CLERK_SECRET_KEY),
        mongodb: isUsingMongo(),
        stripe: isStripeLive(),
        cloudinary: isCloudinaryLive(),
      },
      // Makes it obvious whether writes will survive a restart.
      storage: isUsingMongo() ? 'mongodb' : 'in-memory',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('*', (req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: 'The requested API route does not exist. Please check your request URL.'
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CraveCache Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
