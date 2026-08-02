import React, { useState, useEffect } from 'react';
import {
  Store,
  Utensils,
  ShoppingBag,
  BarChart3,
  Bell,
  Settings,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Star,
  Flame,
  AlertTriangle,
  Search,
  Filter,
  Check,
  RefreshCw,
  Phone,
  MapPin,
  Image as ImageIcon,
  Power,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { Restaurant, FoodItem, Order, OrderStatus, Review } from '../types';
import { useAppSelector } from '../hooks/reduxHooks';
import { confirm } from '../components/ui';
import { apiFetch } from '../utils/apiBase';

export const OwnerPortalPage: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);

  const [activeTab, setActiveTab] = useState<'overview' | 'menu' | 'orders' | 'profile' | 'analytics' | 'notifications'>('overview');
  
  // Data state
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Modals
  const [foodSearch, setFoodSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('All');

  // Food Form Modal
  const [isFoodModalOpen, setIsFoodModalOpen] = useState<boolean>(false);
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);
  const [foodForm, setFoodForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Pizzas',
    isVeg: true,
    isSpicy: false,
    isBestseller: false,
    image: '',
    calories: '',
  });

  // Profile Form
  const [profileForm, setProfileForm] = useState({
    name: '',
    description: '',
    cuisine: '',
    phone: '',
    address: '',
    city: '',
    openingHours: '',
    deliveryRadiusKm: 10,
    image: '',
    bannerImage: '',
    discountOffer: '',
    isOpen: true,
  });

  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const loadPortalData = async () => {
    setLoading(true);
    const ownerId = user?.id || 'usr_owner_1';
    try {
      const [restRes, foodsRes, ordersRes, analyticsRes, notifRes] = await Promise.all([
        apiFetch(`/api/owner/my-restaurant?ownerId=${ownerId}`),
        apiFetch(`/api/owner/foods?ownerId=${ownerId}`),
        apiFetch(`/api/owner/orders?ownerId=${ownerId}`),
        apiFetch(`/api/owner/analytics?ownerId=${ownerId}`),
        apiFetch(`/api/owner/notifications?ownerId=${ownerId}`),
      ]);

      const restData = await restRes.json();
      const foodsData = await foodsRes.json();
      const ordersData = await ordersRes.json();
      const analyticsData = await analyticsRes.json();
      const notifData = await notifRes.json();

      setRestaurant(restData);
      setFoods(foodsData || []);
      setOrders(ordersData || []);
      setAnalytics(analyticsData);
      setNotifications(notifData || []);

      if (restData) {
        setProfileForm({
          name: restData.name || '',
          description: restData.description || '',
          cuisine: Array.isArray(restData.cuisine) ? restData.cuisine.join(', ') : '',
          phone: restData.phone || '',
          address: restData.address || '',
          city: restData.city || '',
          openingHours: restData.openingHours || '10:00 AM - 11:30 PM',
          deliveryRadiusKm: restData.deliveryRadiusKm || 10,
          image: restData.image || '',
          bannerImage: restData.bannerImage || '',
          discountOffer: restData.discountOffer || '',
          isOpen: restData.isOpen ?? true,
        });
      }
    } catch (err) {
      console.error('Failed to load owner portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortalData();
  }, [user?.id]);

  // Toggle Restaurant Open/Closed Status
  const handleToggleStoreOpen = async () => {
    if (!restaurant) return;
    const updatedStatus = !restaurant.isOpen;
    try {
      const res = await apiFetch('/api/owner/my-restaurant', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: restaurant.id, isOpen: updatedStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setRestaurant(updated);
        setProfileForm((prev) => ({ ...prev, isOpen: updatedStatus }));
      }
    } catch (err) {
      console.error('Error toggling store status:', err);
    }
  };

  // Save Restaurant Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;
    setSavingProfile(true);
    setSaveSuccessMsg(null);
    try {
      const res = await apiFetch('/api/owner/my-restaurant', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: restaurant.id,
          ...profileForm,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setRestaurant(updated);
        setSaveSuccessMsg('Restaurant profile saved successfully!');
        setTimeout(() => setSaveSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setSavingProfile(false);
    }
  };

  // Open Add/Edit Food Modal
  const handleOpenFoodModal = (food?: FoodItem) => {
    if (food) {
      setEditingFood(food);
      setFoodForm({
        name: food.name,
        description: food.description,
        price: String(food.price),
        category: food.category,
        isVeg: food.isVeg,
        isSpicy: Boolean(food.isSpicy),
        isBestseller: Boolean(food.isBestseller),
        image: food.image,
        calories: food.calories ? String(food.calories) : '',
      });
    } else {
      setEditingFood(null);
      setFoodForm({
        name: '',
        description: '',
        price: '',
        category: 'Pizzas',
        isVeg: true,
        isSpicy: false,
        isBestseller: false,
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
        calories: '',
      });
    }
    setIsFoodModalOpen(true);
  };

  // Submit Food Form (Create / Edit)
  const handleSaveFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;
    try {
      if (editingFood) {
        const res = await apiFetch(`/api/owner/foods/${editingFood.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(foodForm),
        });
        if (res.ok) {
          const updatedFood = await res.json();
          setFoods((prev) => prev.map((f) => (f.id === updatedFood.id ? updatedFood : f)));
        }
      } else {
        const res = await apiFetch('/api/owner/foods', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurantId: restaurant.id,
            ...foodForm,
          }),
        });
        if (res.ok) {
          const newFood = await res.json();
          setFoods((prev) => [newFood, ...prev]);
        }
      }
      setIsFoodModalOpen(false);
    } catch (err) {
      console.error('Error saving food item:', err);
    }
  };

  // Delete Food Item
  const handleDeleteFood = async (foodId: string) => {
    const ok = await confirm({
      title: 'Remove this dish from your menu?',
      description: 'It will stop appearing to customers straight away. This cannot be undone.',
      confirmLabel: 'Remove dish',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      const res = await apiFetch(`/api/owner/foods/${foodId}`, { method: 'DELETE' });
      if (res.ok) {
        setFoods((prev) => prev.filter((f) => f.id !== foodId));
      }
    } catch (err) {
      console.error('Error deleting food item:', err);
    }
  };

  // Toggle Food Availability
  const handleToggleFoodAvailability = async (food: FoodItem) => {
    try {
      const res = await apiFetch(`/api/owner/foods/${food.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !food.isAvailable }),
      });
      if (res.ok) {
        const updated = await res.json();
        setFoods((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      }
    } catch (err) {
      console.error('Error toggling availability:', err);
    }
  };

  // Update Order Status
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const res = await apiFetch(`/api/owner/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updatedOrder = await res.json();
        setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
      }
    } catch (err) {
      console.error('Error updating order status:', err);
    }
  };

  // Categories extracted from foods
  const categories = ['All', ...Array.from(new Set(foods.map((f) => f.category)))];

  const filteredFoods = foods.filter((f) => {
    const matchesCategory = selectedCategory === 'All' || f.category === selectedCategory;
    const matchesSearch = f.name.toLowerCase().includes(foodSearch.toLowerCase()) || f.description.toLowerCase().includes(foodSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter === 'All') return true;
    return o.status === orderStatusFilter;
  });

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-brand-500 animate-spin" />
        <p className="text-[13px] font-semibold text-ink-600 uppercase tracking-widest">
          Loading Restaurant Owner Portal...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-panel p-6 border border-surface-line shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-4">
          <img
            src={restaurant?.image || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=200&q=80'}
            alt={restaurant?.name}
            className="w-16 h-16 rounded-card object-cover ring-4 ring-brand-50 shrink-0"
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[12px] font-bold uppercase tracking-wider">
                Restaurant Owner Portal
              </span>
              <span className="text-[13px] text-ink-400 font-bold">• ID: {restaurant?.id}</span>
            </div>
            <h1 className="text-2xl font-bold text-ink-900 tracking-tight mt-0.5">
              {restaurant?.name}
            </h1>
            <p className="text-[13px] text-ink-500 flex items-center gap-2 mt-0.5">
              <span>📍 {restaurant?.address}, {restaurant?.city}</span>
              <span>• 🕒 {restaurant?.openingHours || '10:00 AM - 11:30 PM'}</span>
            </p>
          </div>
        </div>

        {/* Store Open / Closed Status Quick Switcher */}
        <div className="flex items-center gap-3 bg-surface-sunken p-2.5 rounded-card border border-surface-line w-full md:w-auto justify-between">
          <div className="text-left">
            <span className="text-[12px] font-bold text-ink-400 uppercase block leading-none">Store Status</span>
            <span className={`text-[13px] font-bold ${restaurant?.isOpen ? 'text-emerald-600' : 'text-rose-600'}`}>
              {restaurant?.isOpen ? '● ACCEPTING ORDERS' : '○ CLOSED FOR ORDERS'}
            </span>
          </div>

          <button
            onClick={handleToggleStoreOpen}
            className={`px-4 py-2 rounded-control text-[13px] font-bold transition-all flex items-center gap-1.5 shadow-card ${
              restaurant?.isOpen
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-rose-600 hover:bg-rose-700 text-white'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{restaurant?.isOpen ? 'Close Kitchen' : 'Open Kitchen'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-line pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: 'Dashboard Overview', icon: BarChart3 },
          { id: 'orders', label: `Live Orders (${orders.length})`, icon: ShoppingBag },
          { id: 'menu', label: `Menu Items (${foods.length})`, icon: Utensils },
          { id: 'profile', label: 'Restaurant Settings', icon: Settings },
          { id: 'analytics', label: 'Analytics & Reviews', icon: TrendingUp },
          { id: 'notifications', label: `Alerts (${notifications.length})`, icon: Bell },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-control text-[13px] font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                  : 'bg-white text-ink-600 hover:bg-surface-sunken border border-surface-line/80'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW DASHBOARD */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-card border border-surface-line shadow-card space-y-2">
              <span className="text-[13px] font-bold text-ink-500 uppercase tracking-wider block">Today's Revenue</span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-ink-900">₹{analytics?.totalRevenue || 3840}</span>
                <span className="p-2 rounded-control bg-emerald-50 text-emerald-600 font-bold text-[13px]">+18% vs yesterday</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-card border border-surface-line shadow-card space-y-2">
              <span className="text-[13px] font-bold text-ink-500 uppercase tracking-wider block">Today's Orders</span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-ink-900">{orders.length}</span>
                <span className="p-2 rounded-control bg-brand-50 text-brand-600 font-bold text-[13px]">Live Active</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-card border border-surface-line shadow-card space-y-2">
              <span className="text-[13px] font-bold text-ink-500 uppercase tracking-wider block">Avg Order Value</span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-ink-900">₹{analytics?.averageOrderValue || 420}</span>
                <span className="p-2 rounded-control bg-purple-50 text-purple-600 font-bold text-[13px]">Per Order</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-card border border-surface-line shadow-card space-y-2">
              <span className="text-[13px] font-bold text-ink-500 uppercase tracking-wider block">Customer Rating</span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-ink-900 flex items-center gap-1">
                  ⭐ {restaurant?.rating}
                </span>
                <span className="text-[13px] text-ink-500 font-semibold">{restaurant?.reviewCount} reviews</span>
              </div>
            </div>
          </div>

          {/* Quick Action Banner */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Live Orders Queue */}
            <div className="lg:col-span-2 bg-white rounded-panel p-6 border border-surface-line shadow-card space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-ink-900 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-brand-500" /> Recent Customer Orders
                </h3>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-[13px] font-bold text-brand-600 hover:underline flex items-center gap-1"
                >
                  View All ({orders.length}) <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {orders.length === 0 ? (
                <p className="text-[13px] text-ink-500 py-6 text-center">No orders received yet today.</p>
              ) : (
                <div className="space-y-3">
                  {orders.slice(0, 3).map((ord) => (
                    <div key={ord.id} className="p-4 rounded-card bg-surface-sunken border border-surface-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-ink-900">#{ord.id}</span>
                          <span className="px-2 py-0.5 rounded-md bg-brand-100 text-brand-700 text-[12px] font-bold">
                            {ord.status}
                          </span>
                        </div>
                        <p className="text-[13px] text-ink-600 font-bold mt-1">
                          {ord.userName} ({ord.items.length} item(s)) • ₹{ord.totalAmount}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {ord.status === 'Placed' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(ord.id, 'Confirmed')}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-control font-bold text-[13px] hover:bg-emerald-700"
                          >
                            Accept Order
                          </button>
                        )}
                        {ord.status === 'Confirmed' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(ord.id, 'Preparing')}
                            className="px-3 py-1.5 bg-purple-600 text-white rounded-control font-bold text-[13px] hover:bg-purple-700"
                          >
                            Start Preparing
                          </button>
                        )}
                        {ord.status === 'Preparing' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(ord.id, 'Out for Delivery')}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-control font-bold text-[13px] hover:bg-blue-700"
                          >
                            Dispatch Driver
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Menu Overview */}
            <div className="bg-white rounded-panel p-6 border border-surface-line shadow-card space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-ink-900 flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-brand-600" /> Menu Summary
                </h3>
                <button
                  onClick={() => handleOpenFoodModal()}
                  className="p-1.5 bg-brand-500 text-white rounded-control font-bold text-[13px] hover:bg-brand-600 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add Food
                </button>
              </div>

              <div className="space-y-2">
                {foods.slice(0, 4).map((f) => (
                  <div key={f.id} className="p-2.5 rounded-control border border-surface-line flex items-center justify-between bg-surface-sunken">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img src={f.image} alt={f.name} className="w-9 h-9 rounded-lg object-cover shrink-0" />
                      <div className="truncate">
                        <span className="text-[13px] font-bold text-ink-800 block truncate">{f.name}</span>
                        <span className="text-[13px] font-bold text-ink-900">₹{f.price}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleFoodAvailability(f)}
                      className={`px-2 py-1 rounded-lg text-[12px] font-bold uppercase ${
                        f.isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {f.isAvailable ? 'In Stock' : 'Out of Stock'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: MENU & FOOD MANAGEMENT */}
      {activeTab === 'menu' && (
        <div className="bg-white rounded-panel p-6 border border-surface-line shadow-card space-y-6">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-surface-line pb-4">
            <div>
              <h2 className="text-lg font-bold text-ink-900">Menu & Dishes Directory</h2>
              <p className="text-[13px] text-ink-500">Manage prices, descriptions, availability, and tags for your kitchen</p>
            </div>

            <button
              onClick={() => handleOpenFoodModal()}
              className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-[13px] font-semibold rounded-card shadow-md transition-all flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" /> Add New Food Item
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-ink-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={foodSearch}
                onChange={(e) => setFoodSearch(e.target.value)}
                placeholder="Search food by name or ingredient..."
                className="w-full pl-10 pr-4 py-2 text-[13px] font-medium bg-surface-sunken border border-surface-line rounded-control focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-control text-[13px] font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white'
                      : 'bg-surface-sunken text-ink-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Foods Grid */}
          {filteredFoods.length === 0 ? (
            <div className="text-center py-12 bg-surface-sunken rounded-card border border-surface-line">
              <p className="text-[13px] font-bold text-ink-600">No food items found matching your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFoods.map((food) => (
                <div key={food.id} className="p-4 rounded-card border border-surface-line bg-white hover:border-brand-300 transition-all space-y-3 relative group">
                  <div className="flex items-start gap-3">
                    <img src={food.image} alt={food.name} className="w-16 h-16 rounded-control object-cover shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`w-3 h-3 rounded-sm border flex items-center justify-center ${food.isVeg ? 'border-emerald-600' : 'border-rose-600'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${food.isVeg ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                        </span>
                        <span className="text-[12px] font-bold text-ink-400 uppercase">{food.category}</span>
                        {food.isBestseller && (
                          <span className="text-[13px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">Bestseller</span>
                        )}
                      </div>
                      <h4 className="text-sm font-semibold text-ink-900 truncate">{food.name}</h4>
                      <p className="text-[13px] font-bold text-brand-500 mt-0.5">₹{food.price}</p>
                    </div>
                  </div>

                  <p className="text-[13px] text-ink-500 line-clamp-2 leading-relaxed">{food.description}</p>

                  <div className="pt-2 border-t border-surface-line flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleToggleFoodAvailability(food)}
                      className={`px-2.5 py-1 rounded-control text-[12px] font-bold uppercase transition-all ${
                        food.isAvailable
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                      }`}
                    >
                      {food.isAvailable ? 'In Stock' : 'Out of Stock'}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenFoodModal(food)}
                        className="p-1.5 text-ink-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                        title="Edit Food"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteFood(food.id)}
                        className="p-1.5 text-ink-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Food"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* TAB 3: LIVE ORDERS MANAGEMENT */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-panel p-6 border border-surface-line shadow-card space-y-6">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-surface-line pb-4">
            <div>
              <h2 className="text-lg font-bold text-ink-900">Live Customer Orders</h2>
              <p className="text-[13px] text-ink-500">Track and update kitchen workflow in real-time</p>
            </div>

            {/* `w-full sm:w-auto` matches the menu filter bar above. Without it
                the parent is `flex-col items-start` at mobile widths, so this
                row sized to its content and pushed past the viewport instead of
                scrolling within it. */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto min-w-0 text-[13px] font-bold no-scrollbar">
              {['All', 'Placed', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'].map((st) => (
                <button
                  key={st}
                  onClick={() => setOrderStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-control whitespace-nowrap transition-all ${
                    orderStatusFilter === st
                      ? 'bg-brand-500 text-white'
                      : 'bg-surface-sunken text-ink-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 bg-surface-sunken rounded-card border border-surface-line">
              <p className="text-[13px] font-bold text-ink-600">No customer orders matching selected status.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((ord) => (
                <div key={ord.id} className="p-5 rounded-card border border-surface-line bg-white space-y-4 shadow-card">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-line pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-ink-900">Order #{ord.id}</span>
                        <span className="px-2.5 py-0.5 rounded-md bg-brand-100 text-brand-700 text-[12px] font-bold uppercase">
                          {ord.status}
                        </span>
                        <span className="text-[13px] text-ink-400 font-bold">• {new Date(ord.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-[13px] font-bold text-ink-600 mt-0.5">
                        Customer: <span className="text-ink-900">{ord.userName}</span> ({ord.userEmail})
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-bold text-ink-900 block">₹{ord.totalAmount}</span>
                      <span className="text-[12px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {ord.paymentStatus} via {ord.paymentMethod}
                      </span>
                    </div>
                  </div>

                  {/* Address & Contact */}
                  <div className="text-[13px] text-ink-600 bg-surface-sunken p-3 rounded-control border border-surface-line">
                    <p className="font-bold text-ink-800 mb-0.5">📍 Delivery Address:</p>
                    <p>{ord.deliveryAddress?.street}, {ord.deliveryAddress?.city}, {ord.deliveryAddress?.zipCode}</p>
                  </div>

                  {/* Ordered Food Items */}
                  <div className="space-y-2">
                    <span className="text-[13px] font-semibold text-ink-900 block">Items Ordered ({ord.items.length}):</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {ord.items.map((it, idx) => (
                        <div key={idx} className="p-2.5 rounded-control border border-surface-line bg-surface-sunken flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="px-2 py-0.5 bg-slate-900 text-white rounded-md text-[12px] font-bold">
                              x{it.quantity}
                            </span>
                            <span className="text-[13px] font-bold text-ink-800 truncate">{it.foodItem.name}</span>
                          </div>
                          <span className="text-[13px] font-bold text-ink-900">₹{it.itemTotalPrice || it.foodItem.price * it.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Status Action Buttons */}
                  <div className="pt-3 border-t border-surface-line flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[13px] font-bold text-ink-400">Update Status:</span>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleUpdateOrderStatus(ord.id, 'Confirmed')}
                        className={`px-3 py-1.5 rounded-control font-semibold text-[13px] transition-all ${
                          ord.status === 'Confirmed' ? 'bg-emerald-600 text-white' : 'bg-surface-sunken text-ink-600 hover:bg-slate-200'
                        }`}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleUpdateOrderStatus(ord.id, 'Preparing')}
                        className={`px-3 py-1.5 rounded-control font-semibold text-[13px] transition-all ${
                          ord.status === 'Preparing' ? 'bg-purple-600 text-white' : 'bg-surface-sunken text-ink-600 hover:bg-slate-200'
                        }`}
                      >
                        Preparing
                      </button>
                      <button
                        onClick={() => handleUpdateOrderStatus(ord.id, 'Out for Delivery')}
                        className={`px-3 py-1.5 rounded-control font-semibold text-[13px] transition-all ${
                          ord.status === 'Out for Delivery' ? 'bg-blue-600 text-white' : 'bg-surface-sunken text-ink-600 hover:bg-slate-200'
                        }`}
                      >
                        Out for Delivery
                      </button>
                      <button
                        onClick={() => handleUpdateOrderStatus(ord.id, 'Delivered')}
                        className={`px-3 py-1.5 rounded-control font-semibold text-[13px] transition-all ${
                          ord.status === 'Delivered' ? 'bg-emerald-700 text-white' : 'bg-surface-sunken text-ink-600 hover:bg-slate-200'
                        }`}
                      >
                        Delivered
                      </button>
                      <button
                        onClick={() => handleUpdateOrderStatus(ord.id, 'Cancelled')}
                        className={`px-3 py-1.5 rounded-control font-semibold text-[13px] transition-all ${
                          ord.status === 'Cancelled' ? 'bg-rose-600 text-white' : 'bg-surface-sunken text-ink-600 hover:bg-rose-100 text-rose-700'
                        }`}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* TAB 4: RESTAURANT SETTINGS */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-panel p-6 sm:p-8 border border-surface-line shadow-card space-y-6">
          
          <div className="border-b border-surface-line pb-4">
            <h2 className="text-lg font-bold text-ink-900">Restaurant Configuration</h2>
            <p className="text-[13px] text-ink-500">Update restaurant details, operating hours, delivery radius, and branding</p>
          </div>

          {saveSuccessMsg && (
            <div className="p-4 rounded-card bg-emerald-50 border border-emerald-200 text-emerald-800 text-[13px] font-bold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div>
                <label className="text-[13px] font-semibold text-ink-600 block mb-1">Restaurant Name</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 text-[13px] font-medium bg-surface-sunken border border-surface-line rounded-control focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[13px] font-semibold text-ink-600 block mb-1">Cuisines (comma separated)</label>
                <input
                  type="text"
                  value={profileForm.cuisine}
                  onChange={(e) => setProfileForm({ ...profileForm, cuisine: e.target.value })}
                  placeholder="e.g. Italian, Pizzas, Pasta"
                  className="w-full px-3.5 py-2.5 text-[13px] font-medium bg-surface-sunken border border-surface-line rounded-control focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[13px] font-semibold text-ink-600 block mb-1">Description</label>
                <textarea
                  value={profileForm.description}
                  onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-3.5 py-2.5 text-[13px] font-medium bg-surface-sunken border border-surface-line rounded-control focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[13px] font-semibold text-ink-600 block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-[13px] font-medium bg-surface-sunken border border-surface-line rounded-control focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[13px] font-semibold text-ink-600 block mb-1">Opening Hours</label>
                <input
                  type="text"
                  value={profileForm.openingHours}
                  onChange={(e) => setProfileForm({ ...profileForm, openingHours: e.target.value })}
                  placeholder="e.g. 10:00 AM - 11:30 PM"
                  className="w-full px-3.5 py-2.5 text-[13px] font-medium bg-surface-sunken border border-surface-line rounded-control focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[13px] font-semibold text-ink-600 block mb-1">Street Address</label>
                <input
                  type="text"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-[13px] font-medium bg-surface-sunken border border-surface-line rounded-control focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[13px] font-semibold text-ink-600 block mb-1">City</label>
                <input
                  type="text"
                  value={profileForm.city}
                  onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-[13px] font-medium bg-surface-sunken border border-surface-line rounded-control focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[13px] font-semibold text-ink-600 block mb-1">Logo Image URL</label>
                <input
                  type="url"
                  value={profileForm.image}
                  onChange={(e) => setProfileForm({ ...profileForm, image: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-[13px] font-medium bg-surface-sunken border border-surface-line rounded-control focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[13px] font-semibold text-ink-600 block mb-1">Banner Image URL</label>
                <input
                  type="url"
                  value={profileForm.bannerImage}
                  onChange={(e) => setProfileForm({ ...profileForm, bannerImage: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-[13px] font-medium bg-surface-sunken border border-surface-line rounded-control focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[13px] font-semibold text-ink-600 block mb-1">Promotional Offer Banner</label>
                <input
                  type="text"
                  value={profileForm.discountOffer}
                  onChange={(e) => setProfileForm({ ...profileForm, discountOffer: e.target.value })}
                  placeholder="e.g. 50% OFF up to ₹150 with CRAVE50"
                  className="w-full px-3.5 py-2.5 text-[13px] font-medium bg-surface-sunken border border-surface-line rounded-control focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                />
              </div>

            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-[13px] rounded-control shadow-md transition-all flex items-center gap-2"
              >
                {savingProfile ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Save Changes</span>
              </button>
            </div>
          </form>

        </div>
      )}

      {/* TAB 5: ANALYTICS & REVIEWS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="bg-white rounded-panel p-6 border border-surface-line shadow-card space-y-4">
            <h2 className="text-lg font-bold text-ink-900">Weekly Revenue & Performance</h2>
            {/* Seven fixed columns collapse to ~27px each at 320px, which is
                narrower than the "₹4200" label — the amounts then overlap their
                neighbours. Below ~470px the chart scrolls sideways instead, so
                every bar keeps a legible column. */}
            <div className="overflow-x-auto no-scrollbar">
            <div className="grid grid-cols-7 gap-2 pt-4 min-w-[420px]">
              {analytics?.salesTrend?.map((item: any) => (
                <div key={item.day} className="flex flex-col items-center gap-2">
                  <span className="text-[12px] font-semibold text-ink-900">₹{item.revenue}</span>
                  <div
                    className="w-full bg-brand-500 rounded-control transition-all"
                    style={{ height: `${Math.max(20, (item.revenue / 4200) * 120)}px` }}
                  />
                  <span className="text-[13px] font-bold text-ink-500">{item.day}</span>
                </div>
              ))}
            </div>
            </div>
          </div>

          <div className="bg-white rounded-panel p-6 border border-surface-line shadow-card space-y-4">
            <h3 className="text-base font-semibold text-ink-900">Customer Reviews ({analytics?.recentReviews?.length || 0})</h3>
            <div className="space-y-3">
              {analytics?.recentReviews?.map((rev: Review) => (
                <div key={rev.id} className="p-4 rounded-card bg-surface-sunken border border-surface-line space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-bold text-ink-900">{rev.userName}</span>
                    <span className="text-[13px] font-bold text-amber-500">⭐ {rev.rating}/5</span>
                  </div>
                  <p className="text-[13px] text-ink-600 leading-relaxed">{rev.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-panel p-6 border border-surface-line shadow-card space-y-4">
          <h2 className="text-lg font-bold text-ink-900">Kitchen Alerts & Notifications</h2>
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div key={notif.id} className="p-4 rounded-card bg-brand-50/60 border border-brand-100 flex items-start gap-3">
                <Bell className="w-5 h-5 text-brand-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[13px] font-semibold text-ink-900">{notif.title}</h4>
                  <p className="text-[13px] text-ink-600 font-medium mt-0.5">{notif.message}</p>
                  <span className="text-[12px] font-bold text-ink-400 mt-1 block">{notif.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Food Add / Edit Modal */}
      {isFoodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-panel shadow-2xl max-w-lg w-full p-6 border border-surface-line max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-surface-line pb-3">
              <h3 className="text-base font-semibold text-ink-900">
                {editingFood ? 'Edit Food Item' : 'Add New Food Item'}
              </h3>
              <button
                onClick={() => setIsFoodModalOpen(false)}
                className="p-1 text-ink-400 hover:text-ink-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveFood} className="space-y-3">
              <div>
                <label className="text-[13px] font-bold text-ink-600 block mb-1">Item Name *</label>
                <input
                  type="text"
                  value={foodForm.name}
                  onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-[13px] font-medium bg-surface-sunken border border-surface-line rounded-control focus:bg-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[13px] font-bold text-ink-600 block mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    value={foodForm.price}
                    onChange={(e) => setFoodForm({ ...foodForm, price: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-[13px] font-medium bg-surface-sunken border border-surface-line rounded-control focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-[13px] font-bold text-ink-600 block mb-1">Category</label>
                  <select
                    value={foodForm.category}
                    onChange={(e) => setFoodForm({ ...foodForm, category: e.target.value })}
                    className="w-full px-3 py-2 text-[13px] font-medium bg-surface-sunken border border-surface-line rounded-control focus:bg-white outline-none"
                  >
                    <option value="Pizzas">Pizzas</option>
                    <option value="Pasta">Pasta</option>
                    <option value="Garlic Bread">Garlic Bread</option>
                    <option value="Burgers">Burgers</option>
                    <option value="Sides">Sides</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Desserts">Desserts</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[13px] font-bold text-ink-600 block mb-1">Description</label>
                <textarea
                  value={foodForm.description}
                  onChange={(e) => setFoodForm({ ...foodForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 text-[13px] font-medium bg-surface-sunken border border-surface-line rounded-control focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="text-[13px] font-bold text-ink-600 block mb-1">Image URL</label>
                <input
                  type="url"
                  value={foodForm.image}
                  onChange={(e) => setFoodForm({ ...foodForm, image: e.target.value })}
                  className="w-full px-3 py-2 text-[13px] font-medium bg-surface-sunken border border-surface-line rounded-control focus:bg-white outline-none"
                />
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-[13px] font-bold text-ink-600">
                  <input
                    type="checkbox"
                    checked={foodForm.isVeg}
                    onChange={(e) => setFoodForm({ ...foodForm, isVeg: e.target.checked })}
                    className="accent-emerald-600 w-4 h-4"
                  />
                  Pure Veg
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-[13px] font-bold text-ink-600">
                  <input
                    type="checkbox"
                    checked={foodForm.isSpicy}
                    onChange={(e) => setFoodForm({ ...foodForm, isSpicy: e.target.checked })}
                    className="accent-rose-600 w-4 h-4"
                  />
                  Spicy
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-[13px] font-bold text-ink-600">
                  <input
                    type="checkbox"
                    checked={foodForm.isBestseller}
                    onChange={(e) => setFoodForm({ ...foodForm, isBestseller: e.target.checked })}
                    className="accent-amber-500 w-4 h-4"
                  />
                  Bestseller
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFoodModalOpen(false)}
                  className="px-4 py-2 bg-surface-sunken text-ink-600 font-bold text-[13px] rounded-control"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold text-[13px] rounded-control shadow-md"
                >
                  {editingFood ? 'Save Item' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
