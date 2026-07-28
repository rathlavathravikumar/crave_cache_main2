import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import {
  INITIAL_RESTAURANTS,
  INITIAL_FOOD_ITEMS,
  INITIAL_COUPONS,
  INITIAL_USERS,
  INITIAL_REVIEWS,
} from './src/data/initialData';
import {
  Restaurant,
  FoodItem,
  Coupon,
  User,
  Order,
  Review,
  OrderStatus,
} from './src/types';

// In-Memory Database Store
let dbRestaurants: Restaurant[] = [...INITIAL_RESTAURANTS];
let dbFoodItems: FoodItem[] = [...INITIAL_FOOD_ITEMS];
let dbCoupons: Coupon[] = [...INITIAL_COUPONS];
let dbUsers: User[] = [...INITIAL_USERS];
let dbReviews: Review[] = [...INITIAL_REVIEWS];
let dbOrders: Order[] = [
  {
    id: 'ord_1001',
    userId: 'usr_customer_1',
    userName: 'Alex Johnson',
    userEmail: 'alex@example.com',
    restaurantId: 'rest_1',
    restaurantName: 'Pizza Maestro',
    items: [
      {
        cartItemId: 'item_1',
        foodItem: dbFoodItems[0], // Truffle Mushroom
        quantity: 1,
        customizations: [
          {
            groupTitle: 'Choose Crust Size',
            selectedOptions: [{ name: 'Large (12")', price: 80 }],
          },
        ],
        itemTotalPrice: 429,
      },
      {
        cartItemId: 'item_2',
        foodItem: dbFoodItems[2], // Garlic bread
        quantity: 1,
        itemTotalPrice: 149,
      },
    ],
    deliveryAddress: dbUsers[0].addresses[0],
    itemTotal: 578,
    deliveryFee: 40,
    taxAndPackaging: 35,
    discountAmount: 150,
    couponCode: 'CRAVE50',
    totalAmount: 503,
    status: 'Out for Delivery',
    paymentMethod: 'Credit/Debit Card',
    paymentStatus: 'Paid',
    stripePaymentIntentId: 'pi_3MtwB2LkdOwZnY2g1O214R9w',
    deliveryDriver: {
      name: 'Marcus Vance',
      phone: '+91 98765 12345',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    },
    timeline: [
      { status: 'Placed', timestamp: new Date(Date.now() - 25 * 60000).toISOString(), message: 'Order received by restaurant.' },
      { status: 'Confirmed', timestamp: new Date(Date.now() - 22 * 60000).toISOString(), message: 'Restaurant accepted your order.' },
      { status: 'Preparing', timestamp: new Date(Date.now() - 15 * 60000).toISOString(), message: 'Chef is preparing fresh ingredients.' },
      { status: 'Out for Delivery', timestamp: new Date(Date.now() - 5 * 60000).toISOString(), message: 'Driver Marcus Vance is en route to your address.' },
    ],
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60000).toISOString(),
  },
];

async function startServer() {
  const app = express();
  const PORT = 3000;

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
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, role } = req.body;
    let user = dbUsers.find((u) => u.email.toLowerCase() === (email || '').toLowerCase());

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
      dbUsers.push(user);
    } else if (role && user.role !== role) {
      // If role specified during login, ensure match or update for convenience
      user.role = role;
    }

    if (user.blocked) {
      return res.status(403).json({ error: 'Your account has been blocked by administrator.' });
    }

    res.json({
      token: `jwt_token_simulated_${user.id}_${Date.now()}`,
      user,
    });
  });

  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { name, email, phone, password, role } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and Email are required.' });
    }

    const existing = dbUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
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

    dbUsers.push(newUser);
    res.status(201).json({
      token: `jwt_token_simulated_${newUser.id}_${Date.now()}`,
      user: newUser,
    });
  });

  app.get('/api/auth/me', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.json({ user: dbUsers[0] }); // Default to customer
    }
    const token = authHeader.replace('Bearer ', '');
    const foundUser = dbUsers.find((u) => token.includes(u.id));
    res.json({ user: foundUser || dbUsers[0] });
  });

  app.put('/api/auth/profile', (req: Request, res: Response) => {
    const { userId, name, email, phone, avatar, role } = req.body;
    const userIndex = dbUsers.findIndex((u) => u.id === userId || (userId && u.id.includes(userId)));
    const index = userIndex !== -1 ? userIndex : 0;

    dbUsers[index] = {
      ...dbUsers[index],
      name: name || dbUsers[index].name,
      email: email || dbUsers[index].email,
      phone: phone || dbUsers[index].phone,
      avatar: avatar || dbUsers[index].avatar,
      role: role || dbUsers[index].role,
    };
    res.json(dbUsers[index]);
  });

  app.put('/api/auth/profile/:id', (req: Request, res: Response) => {
    const userId = req.params.id;
    const { name, email, phone, avatar, role } = req.body;
    const userIndex = dbUsers.findIndex((u) => u.id === userId);
    const index = userIndex !== -1 ? userIndex : 0;

    dbUsers[index] = {
      ...dbUsers[index],
      name: name || dbUsers[index].name,
      email: email || dbUsers[index].email,
      phone: phone || dbUsers[index].phone,
      avatar: avatar || dbUsers[index].avatar,
      role: role || dbUsers[index].role,
    };
    res.json(dbUsers[index]);
  });

  app.put('/api/auth/addresses', (req: Request, res: Response) => {
    const { userId, addresses } = req.body;
    const index = dbUsers.findIndex((u) => u.id === userId);
    if (index === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    dbUsers[index].addresses = addresses;
    res.json(dbUsers[index]);
  });

  // ==========================================
  // RESTAURANTS ENDPOINTS
  // ==========================================
  app.get('/api/restaurants', (req: Request, res: Response) => {
    const { search, cuisine, isVeg, maxTime, minRating, sort } = req.query;

    let results = [...dbRestaurants];

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

  app.get('/api/restaurants/:id', (req: Request, res: Response) => {
    const restaurant = dbRestaurants.find((r) => r.id === req.params.id || r.slug === req.params.id);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    const foods = dbFoodItems.filter((f) => f.restaurantId === restaurant.id);
    const reviews = dbReviews.filter((rv) => rv.restaurantId === restaurant.id);
    res.json({ restaurant, foods, reviews });
  });

  // Restaurant CRUD Handlers
  const handleCreateRestaurant = (req: Request, res: Response) => {
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
    dbRestaurants.unshift(newRest);
    res.status(201).json(newRest);
  };

  const handleUpdateRestaurant = (req: Request, res: Response) => {
    const index = dbRestaurants.findIndex((r) => r.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Restaurant not found' });
    
    let updatedCuisine = dbRestaurants[index].cuisine;
    if (req.body.cuisine) {
      updatedCuisine = Array.isArray(req.body.cuisine)
        ? req.body.cuisine
        : req.body.cuisine.split(',').map((c: string) => c.trim());
    }

    dbRestaurants[index] = {
      ...dbRestaurants[index],
      ...req.body,
      cuisine: updatedCuisine,
      priceForTwo: req.body.priceForTwo !== undefined ? Number(req.body.priceForTwo) : dbRestaurants[index].priceForTwo,
      deliveryTimeMinutes: req.body.deliveryTimeMinutes !== undefined ? Number(req.body.deliveryTimeMinutes) : dbRestaurants[index].deliveryTimeMinutes,
    };
    res.json(dbRestaurants[index]);
  };

  const handleDeleteRestaurant = (req: Request, res: Response) => {
    dbRestaurants = dbRestaurants.filter((r) => r.id !== req.params.id);
    dbFoodItems = dbFoodItems.filter((f) => f.restaurantId !== req.params.id);
    res.json({ success: true, message: 'Restaurant and items deleted.' });
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
  const handleGetFoods = (req: Request, res: Response) => {
    const { search, category, restaurantId, isVeg, isSpicy, maxPrice } = req.query;
    let items = [...dbFoodItems];

    if (restaurantId) {
      items = items.filter((f) => f.restaurantId === restaurantId);
    }
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
  const handleCreateFood = (req: Request, res: Response) => {
    const targetRestId = req.body.restaurantId;
    const rest = dbRestaurants.find((r) => r.id === targetRestId) || dbRestaurants[0];
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
    dbFoodItems.unshift(newFood);
    res.status(201).json(newFood);
  };

  const handleUpdateFood = (req: Request, res: Response) => {
    const index = dbFoodItems.findIndex((f) => f.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Food item not found' });
    
    let restName = dbFoodItems[index].restaurantName;
    if (req.body.restaurantId) {
      const rest = dbRestaurants.find((r) => r.id === req.body.restaurantId);
      if (rest) restName = rest.name;
    }

    dbFoodItems[index] = {
      ...dbFoodItems[index],
      ...req.body,
      restaurantName: restName,
      price: req.body.price !== undefined ? Number(req.body.price) : dbFoodItems[index].price,
      isVeg: req.body.isVeg !== undefined ? Boolean(req.body.isVeg) : dbFoodItems[index].isVeg,
      isSpicy: req.body.isSpicy !== undefined ? Boolean(req.body.isSpicy) : dbFoodItems[index].isSpicy,
    };
    res.json(dbFoodItems[index]);
  };

  const handleDeleteFood = (req: Request, res: Response) => {
    const targetId = req.params.id;
    const decodedId = decodeURIComponent(targetId);
    dbFoodItems = dbFoodItems.filter((f) => f.id !== targetId && f.id !== decodedId);
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
  app.get('/api/coupons', (req: Request, res: Response) => {
    res.json(dbCoupons.filter((c) => c.isActive));
  });

  const handleCreateCoupon = (req: Request, res: Response) => {
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
    dbCoupons.unshift(newCoupon);
    res.status(201).json(newCoupon);
  };

  const handleDeleteCoupon = (req: Request, res: Response) => {
    dbCoupons = dbCoupons.filter((c) => c.id !== req.params.id && c.code !== req.params.id);
    res.json({ success: true, message: 'Coupon deleted.' });
  };

  app.post('/api/coupons', handleCreateCoupon);
  app.post('/api/admin/coupons', handleCreateCoupon);
  app.delete('/api/coupons/:id', handleDeleteCoupon);
  app.delete('/api/admin/coupons/:id', handleDeleteCoupon);

  app.post('/api/coupons/validate', (req: Request, res: Response) => {
    const { code, cartAmount } = req.body;
    const coupon = dbCoupons.find((c) => c.code.toUpperCase() === (code || '').toUpperCase() && c.isActive);

    if (!coupon) {
      return res.status(400).json({ valid: false, message: 'Invalid or expired coupon code.' });
    }

    if (cartAmount < coupon.minOrderValue) {
      return res.status(400).json({
        valid: false,
        message: `Minimum order value of ₹${coupon.minOrderValue} required for coupon ${coupon.code}.`,
      });
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (cartAmount * coupon.discountValue) / 100;
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

  app.post('/api/admin/coupons', (req: Request, res: Response) => {
    const newCoupon: Coupon = {
      id: `coup_${Date.now()}`,
      code: (req.body.code || 'SPECIAL').toUpperCase(),
      description: req.body.description || 'Special discount offer',
      discountType: req.body.discountType || 'percentage',
      discountValue: Number(req.body.discountValue) || 20,
      minOrderValue: Number(req.body.minOrderValue) || 15,
      maxDiscount: req.body.maxDiscount ? Number(req.body.maxDiscount) : undefined,
      isActive: true,
      expiryDate: req.body.expiryDate || '2026-12-31',
    };
    dbCoupons.unshift(newCoupon);
    res.status(201).json(newCoupon);
  });

  app.put('/api/admin/coupons/:id', (req: Request, res: Response) => {
    const index = dbCoupons.findIndex((c) => c.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Coupon not found' });
    dbCoupons[index] = { ...dbCoupons[index], ...req.body };
    res.json(dbCoupons[index]);
  });

  app.delete('/api/admin/coupons/:id', (req: Request, res: Response) => {
    dbCoupons = dbCoupons.filter((c) => c.id !== req.params.id);
    res.json({ success: true });
  });

  // ==========================================
  // ORDERS ENDPOINTS
  // ==========================================
  app.post('/api/orders', (req: Request, res: Response) => {
    const { userId, restaurantId, items, deliveryAddress, couponCode, paymentMethod, paymentIntentId } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Cart cannot be empty.' });
    }

    const user = dbUsers.find((u) => u.id === userId) || dbUsers[0];
    const restaurant = dbRestaurants.find((r) => r.id === restaurantId) || dbRestaurants[0];

    const itemTotal = items.reduce((acc: number, item: any) => acc + item.itemTotalPrice * item.quantity, 0);
    const deliveryFee = items.length > 0 ? 40 : 0;
    const taxAndPackaging = items.length > 0 ? Math.round(itemTotal * 0.05 + 25) : 0;

    let discountAmount = 0;
    if (couponCode) {
      const coupon = dbCoupons.find((c) => c.code.toUpperCase() === couponCode.toUpperCase() && c.isActive);
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
      paymentMethod: paymentMethod || 'Stripe Credit/Debit Card',
      paymentStatus: paymentMethod === 'Cash on Delivery' ? 'Pending' : 'Paid',
      stripePaymentIntentId: paymentIntentId || `pi_sim_${Date.now()}`,
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

    dbOrders.unshift(newOrder);

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order: newOrder,
    });
  });

  app.get('/api/orders', (req: Request, res: Response) => {
    const { userId, role } = req.query;
    if (role === 'admin') {
      return res.json(dbOrders);
    }
    const filtered = dbOrders.filter((o) => o.userId === userId || !userId);
    res.json(filtered);
  });

  app.get('/api/orders/:id', (req: Request, res: Response) => {
    const order = dbOrders.find((o) => o.id === req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  });

  app.put('/api/orders/:id/status', (req: Request, res: Response) => {
    const { status, message } = req.body;
    const index = dbOrders.findIndex((o) => o.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Order not found' });

    const updatedOrder = { ...dbOrders[index] };
    updatedOrder.status = status as OrderStatus;
    updatedOrder.updatedAt = new Date().toISOString();

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

    updatedOrder.timeline.push({
      status: status as OrderStatus,
      timestamp: new Date().toISOString(),
      message: timelineMsg,
    });

    dbOrders[index] = updatedOrder;
    res.json(updatedOrder);
  });

  app.put('/api/orders/:id/cancel', (req: Request, res: Response) => {
    const index = dbOrders.findIndex((o) => o.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Order not found' });

    if (dbOrders[index].status === 'Delivered') {
      return res.status(400).json({ error: 'Delivered orders cannot be cancelled.' });
    }

    dbOrders[index].status = 'Cancelled';
    dbOrders[index].paymentStatus = 'Refunded';
    dbOrders[index].updatedAt = new Date().toISOString();
    dbOrders[index].timeline.push({
      status: 'Cancelled',
      timestamp: new Date().toISOString(),
      message: 'Order cancelled and refund initiated.',
    });

    res.json(dbOrders[index]);
  });

  // ==========================================
  // REVIEWS ENDPOINTS
  // ==========================================
  app.post('/api/reviews', (req: Request, res: Response) => {
    const { userId, userName, userAvatar, restaurantId, foodItemId, rating, comment } = req.body;
    const newReview: Review = {
      id: `rev_${Date.now()}`,
      userId: userId || 'usr_customer_1',
      userName: userName || 'Satisfied Diner',
      userAvatar,
      restaurantId,
      foodItemId,
      rating: Number(rating) || 5,
      comment,
      createdAt: new Date().toISOString(),
    };
    dbReviews.unshift(newReview);

    // Recalculate restaurant rating
    const restReviews = dbReviews.filter((r) => r.restaurantId === restaurantId);
    const avgRating = Number((restReviews.reduce((a, b) => a + b.rating, 0) / restReviews.length).toFixed(1));
    const restIdx = dbRestaurants.findIndex((r) => r.id === restaurantId);
    if (restIdx !== -1) {
      dbRestaurants[restIdx].rating = avgRating;
      dbRestaurants[restIdx].reviewCount = restReviews.length;
    }

    res.status(201).json(newReview);
  });

  // ==========================================
  // STRIPE PAYMENT INTENT ENDPOINTS
  // ==========================================
  const handleCreatePaymentIntent = (req: Request, res: Response) => {
    const { amount, currency = 'inr' } = req.body;
    const intentId = `pi_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
    const clientSecret = `${intentId}_secret_${Math.random().toString(36).substring(2, 9)}`;

    res.json({
      clientSecret,
      paymentIntentId: intentId,
      amount,
      currency,
      status: 'requires_payment_method',
      publishableKey: 'pk_test_simulated_cravecache_stripe_key_2026',
    });
  };

  const handleConfirmPayment = (req: Request, res: Response) => {
    const { paymentIntentId } = req.body;
    res.json({
      success: true,
      paymentIntentId,
      status: 'succeeded',
      message: 'Payment verified and captured successfully via Stripe.',
    });
  };

  app.post('/api/payments/create-intent', handleCreatePaymentIntent);
  app.post('/api/create-payment-intent', handleCreatePaymentIntent);
  app.post('/api/payments/confirm', handleConfirmPayment);
  app.post('/api/confirm-payment', handleConfirmPayment);

  // ==========================================
  // ADMIN ANALYTICS & USER MANAGEMENT
  // ==========================================
  app.get('/api/admin/analytics', (req: Request, res: Response) => {
    const totalRevenue = dbOrders
      .filter((o) => o.paymentStatus === 'Paid')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const totalOrders = dbOrders.length;
    const totalRestaurants = dbRestaurants.length;
    const totalUsers = dbUsers.filter((u) => u.role === 'customer').length;

    const statusCounts = {
      Placed: dbOrders.filter((o) => o.status === 'Placed').length,
      Confirmed: dbOrders.filter((o) => o.status === 'Confirmed').length,
      Preparing: dbOrders.filter((o) => o.status === 'Preparing').length,
      'Out for Delivery': dbOrders.filter((o) => o.status === 'Out for Delivery').length,
      Delivered: dbOrders.filter((o) => o.status === 'Delivered').length,
      Cancelled: dbOrders.filter((o) => o.status === 'Cancelled').length,
    };

    res.json({
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalOrders,
      totalRestaurants,
      totalUsers,
      statusCounts,
      recentOrders: dbOrders.slice(0, 5),
    });
  });

  app.get('/api/admin/users', (req: Request, res: Response) => {
    const { search } = req.query;
    let users = [...dbUsers];
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

  app.post('/api/admin/users', (req: Request, res: Response) => {
    const { name, email, phone, role } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and Email are required.' });
    }
    const existing = dbUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
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
    dbUsers.unshift(newUser);
    res.status(201).json(newUser);
  });

  app.put('/api/admin/users/:id/toggle-block', (req: Request, res: Response) => {
    const targetId = req.params.id;
    const decodedId = decodeURIComponent(targetId);
    const index = dbUsers.findIndex((u) => u.id === targetId || u.id === decodedId);
    if (index === -1) return res.status(404).json({ error: 'User not found' });
    dbUsers[index].blocked = !dbUsers[index].blocked;
    res.json(dbUsers[index]);
  });

  app.put('/api/admin/users/:id/role', (req: Request, res: Response) => {
    const targetId = req.params.id;
    const decodedId = decodeURIComponent(targetId);
    const index = dbUsers.findIndex((u) => u.id === targetId || u.id === decodedId);
    if (index === -1) return res.status(404).json({ error: 'User not found' });
    dbUsers[index].role = req.body.role || (dbUsers[index].role === 'admin' ? 'customer' : 'admin');
    res.json(dbUsers[index]);
  });

  app.put('/api/admin/users/:id', (req: Request, res: Response) => {
    const targetId = req.params.id;
    const decodedId = decodeURIComponent(targetId);
    const index = dbUsers.findIndex((u) => u.id === targetId || u.id === decodedId);
    if (index === -1) return res.status(404).json({ error: 'User not found' });

    dbUsers[index] = {
      ...dbUsers[index],
      name: req.body.name || dbUsers[index].name,
      email: req.body.email || dbUsers[index].email,
      phone: req.body.phone || dbUsers[index].phone,
      role: req.body.role || dbUsers[index].role,
      blocked: req.body.blocked !== undefined ? Boolean(req.body.blocked) : dbUsers[index].blocked,
    };
    res.json(dbUsers[index]);
  });

  app.delete('/api/admin/users/:id', (req: Request, res: Response) => {
    const targetId = req.params.id;
    const decodedId = decodeURIComponent(targetId);
    const index = dbUsers.findIndex((u) => u.id === targetId || u.id === decodedId);
    if (index === -1) return res.status(404).json({ error: 'User not found' });

    dbUsers.splice(index, 1);
    res.json({ success: true, message: 'User deleted successfully.' });
  });

  // ==========================================
  // FEATURE 3: AI PERSONALIZED RECOMMENDATION ENGINE
  // ==========================================
  app.post('/api/recommendations', async (req: Request, res: Response) => {
    const { userId, query, timeOfDay, budget } = req.body;

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
        { id: 'rec_for_you', title: '✨ Recommended For You', subtitle: 'Personalized based on your orders and taste profile', badge: 'AI Ranked', items: recommendedForYou },
        { id: 'popular_near', title: '🔥 Popular Near You', subtitle: 'Most ordered by foodies in Springfield', badge: '4.7+ Rating', items: popularNearYou },
        { id: 'prev_orders', title: '🔁 Based On Previous Orders', subtitle: 'Flavors similar to your top choices', badge: 'Favorites', items: basedOnPreviousOrders.length > 0 ? basedOnPreviousOrders : recommendedForYou.slice(0, 4) },
        { id: 'trending', title: '📈 Trending Today', subtitle: 'Top requested dishes this week', badge: 'Bestsellers', items: trendingToday },
        { id: 'healthy', title: '🥗 Healthy & Wholesome', subtitle: 'Nutritious meals & fresh greens', badge: 'Pure Veg', items: healthyChoices },
        { id: 'budget', title: '💰 Budget Friendly Delights', subtitle: 'Delicious feeds under ₹299', badge: 'Under ₹299', items: budgetFriendly },
      ],
      frequentlyOrderedTogether,
    });
  });

  // ==========================================
  // FEATURE 4: RESTAURANT OWNER PORTAL APIS
  // ==========================================
  const getOwnerRestaurant = (ownerUserId?: string, restId?: string) => {
    if (restId) {
      const found = dbRestaurants.find((r) => r.id === restId);
      if (found) return found;
    }
    if (ownerUserId) {
      const user = dbUsers.find((u) => u.id === ownerUserId);
      if (user && user.restaurantId) {
        const found = dbRestaurants.find((r) => r.id === user.restaurantId);
        if (found) return found;
      }
      const foundByOwner = dbRestaurants.find((r) => r.ownerId === ownerUserId);
      if (foundByOwner) return foundByOwner;
    }
    return dbRestaurants[0];
  };

  app.get('/api/owner/my-restaurant', (req: Request, res: Response) => {
    const ownerId = (req.query.ownerId as string) || (req.query.userId as string) || 'usr_owner_1';
    const restaurant = getOwnerRestaurant(ownerId, req.query.restaurantId as string);
    res.json(restaurant);
  });

  app.put('/api/owner/my-restaurant', (req: Request, res: Response) => {
    const { id, name, description, cuisine, phone, address, city, image, bannerImage, isOpen, openingHours, deliveryRadiusKm, discountOffer } = req.body;
    const targetId = id || 'rest_1';
    const index = dbRestaurants.findIndex((r) => r.id === targetId);
    if (index === -1) return res.status(404).json({ error: 'Restaurant not found' });

    dbRestaurants[index] = {
      ...dbRestaurants[index],
      name: name || dbRestaurants[index].name,
      description: description || dbRestaurants[index].description,
      cuisine: Array.isArray(cuisine) ? cuisine : (cuisine ? cuisine.split(',').map((s: string) => s.trim()) : dbRestaurants[index].cuisine),
      phone: phone || dbRestaurants[index].phone,
      address: address || dbRestaurants[index].address,
      city: city || dbRestaurants[index].city,
      image: image || dbRestaurants[index].image,
      bannerImage: bannerImage || dbRestaurants[index].bannerImage,
      isOpen: isOpen !== undefined ? Boolean(isOpen) : dbRestaurants[index].isOpen,
      openingHours: openingHours || dbRestaurants[index].openingHours,
      deliveryRadiusKm: deliveryRadiusKm ? Number(deliveryRadiusKm) : dbRestaurants[index].deliveryRadiusKm,
      discountOffer: discountOffer !== undefined ? discountOffer : dbRestaurants[index].discountOffer,
    };

    dbFoodItems.forEach((f) => {
      if (f.restaurantId === targetId) {
        f.restaurantName = dbRestaurants[index].name;
      }
    });

    res.json(dbRestaurants[index]);
  });

  app.get('/api/owner/foods', (req: Request, res: Response) => {
    const ownerId = (req.query.ownerId as string) || (req.query.userId as string) || 'usr_owner_1';
    const restaurant = getOwnerRestaurant(ownerId, req.query.restaurantId as string);
    const foods = dbFoodItems.filter((f) => f.restaurantId === restaurant.id);
    res.json(foods);
  });

  app.post('/api/owner/foods', (req: Request, res: Response) => {
    const { ownerId, restaurantId, name, description, price, category, isVeg, isSpicy, isBestseller, image, calories } = req.body;
    const restaurant = getOwnerRestaurant(ownerId, restaurantId);

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

    dbFoodItems.unshift(newFood);
    res.status(201).json(newFood);
  });

  app.put('/api/owner/foods/:id', (req: Request, res: Response) => {
    const targetId = req.params.id;
    const index = dbFoodItems.findIndex((f) => f.id === targetId);
    if (index === -1) return res.status(404).json({ error: 'Food item not found' });

    dbFoodItems[index] = {
      ...dbFoodItems[index],
      name: req.body.name || dbFoodItems[index].name,
      description: req.body.description !== undefined ? req.body.description : dbFoodItems[index].description,
      price: req.body.price !== undefined ? Number(req.body.price) : dbFoodItems[index].price,
      category: req.body.category || dbFoodItems[index].category,
      isVeg: req.body.isVeg !== undefined ? Boolean(req.body.isVeg) : dbFoodItems[index].isVeg,
      isSpicy: req.body.isSpicy !== undefined ? Boolean(req.body.isSpicy) : dbFoodItems[index].isSpicy,
      isBestseller: req.body.isBestseller !== undefined ? Boolean(req.body.isBestseller) : dbFoodItems[index].isBestseller,
      isAvailable: req.body.isAvailable !== undefined ? Boolean(req.body.isAvailable) : dbFoodItems[index].isAvailable,
      image: req.body.image || dbFoodItems[index].image,
      calories: req.body.calories !== undefined ? Number(req.body.calories) : dbFoodItems[index].calories,
    };

    res.json(dbFoodItems[index]);
  });

  app.delete('/api/owner/foods/:id', (req: Request, res: Response) => {
    const targetId = req.params.id;
    const index = dbFoodItems.findIndex((f) => f.id === targetId);
    if (index === -1) return res.status(404).json({ error: 'Food item not found' });

    dbFoodItems.splice(index, 1);
    res.json({ success: true, message: 'Food item deleted successfully.' });
  });

  app.get('/api/owner/orders', (req: Request, res: Response) => {
    const ownerId = (req.query.ownerId as string) || (req.query.userId as string) || 'usr_owner_1';
    const restaurant = getOwnerRestaurant(ownerId, req.query.restaurantId as string);
    const orders = dbOrders.filter((o) => o.restaurantId === restaurant.id);
    res.json(orders);
  });

  app.put('/api/owner/orders/:id/status', (req: Request, res: Response) => {
    const targetId = req.params.id;
    const { status, message } = req.body;
    const order = dbOrders.find((o) => o.id === targetId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    order.status = status as OrderStatus;
    order.updatedAt = new Date().toISOString();
    order.timeline.push({
      status: status as OrderStatus,
      timestamp: new Date().toISOString(),
      message: message || `Order status updated to ${status} by restaurant staff.`,
    });

    res.json(order);
  });

  app.get('/api/owner/analytics', (req: Request, res: Response) => {
    const ownerId = (req.query.ownerId as string) || (req.query.userId as string) || 'usr_owner_1';
    const restaurant = getOwnerRestaurant(ownerId, req.query.restaurantId as string);
    const restaurantOrders = dbOrders.filter((o) => o.restaurantId === restaurant.id);

    const totalOrders = restaurantOrders.length;
    const totalRevenue = restaurantOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const reviews = dbReviews.filter((r) => r.restaurantId === restaurant.id);
    const menuItemsCount = dbFoodItems.filter((f) => f.restaurantId === restaurant.id).length;

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
  // VITE OR STATIC SERVING
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CraveCache Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
