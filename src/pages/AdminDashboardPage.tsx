import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  DollarSign,
  ShoppingBag,
  Store,
  Users,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  Tag,
  Search,
  Filter,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks/reduxHooks';
import {
  fetchAdminAnalytics,
  fetchAdminUsers,
  toggleBlockUser,
} from '../store/slices/adminSlice';
import { fetchRestaurants } from '../store/slices/restaurantSlice';
import { fetchAllFoods } from '../store/slices/foodSlice';
import { updateOrderStatusLocal } from '../store/slices/orderSlice';
import { updateProfile } from '../store/slices/authSlice';
import { Restaurant, FoodItem, OrderStatus, User, Role } from '../types';
import { showToast } from '../utils/toast';

export const AdminDashboardPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { analytics, usersList } = useAppSelector((state) => state.admin);
  const { restaurants } = useAppSelector((state) => state.restaurants);
  const { allFoods } = useAppSelector((state) => state.food);
  const { user } = useAppSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState<'orders' | 'restaurants' | 'foods' | 'coupons' | 'users'>('orders');
  const [coupons, setCoupons] = useState<any[]>([]);

  // Add/Edit Restaurant Modal State
  const [showRestModal, setShowRestModal] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [restName, setRestName] = useState('');
  const [restImage, setRestImage] = useState('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80');
  const [restBanner, setRestBanner] = useState('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80');
  const [restCuisine, setRestCuisine] = useState('North Indian, Mughlai');
  const [restPrice, setRestPrice] = useState(450);
  const [restTime, setRestTime] = useState(25);
  const [restAddress, setRestAddress] = useState('Central Plaza, New Delhi');
  const [restIsOpen, setRestIsOpen] = useState(true);

  // Add/Edit Food Item Modal State
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);
  const [foodName, setFoodName] = useState('');
  const [foodPrice, setFoodPrice] = useState(249);
  const [foodCategory, setFoodCategory] = useState('Mains');
  const [foodImage, setFoodImage] = useState('https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=800&q=80');
  const [foodIsVeg, setFoodIsVeg] = useState(true);
  const [foodIsSpicy, setFoodIsSpicy] = useState(false);
  const [foodRestId, setFoodRestId] = useState('');

  // Add Coupon Modal State
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(20);

  // User Management State
  const [userSearch, setUserSearch] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userRole, setUserRole] = useState<Role>('customer');

  useEffect(() => {
    dispatch(fetchAdminAnalytics());
    dispatch(fetchAdminUsers());
    dispatch(fetchRestaurants());
    dispatch(fetchAllFoods());
    loadCoupons();
  }, [dispatch]);

  const loadCoupons = async () => {
    try {
      const res = await fetch('/api/coupons');
      const data = await res.json();
      setCoupons(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSwitchToAdmin = () => {
    if (user) {
      dispatch(updateProfile({ userId: user.id, role: 'admin' }));
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      dispatch(updateOrderStatusLocal({ orderId, status }));
      dispatch(fetchAdminAnalytics());
    } catch (err) {
      console.error(err);
    }
  };

  const openAddRestaurantModal = () => {
    setEditingRestaurant(null);
    setRestName('');
    setRestImage('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80');
    setRestBanner('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80');
    setRestCuisine('North Indian, Mughlai');
    setRestPrice(450);
    setRestTime(25);
    setRestAddress('Central Plaza, New Delhi');
    setRestIsOpen(true);
    setShowRestModal(true);
  };

  const openEditRestaurantModal = (rest: Restaurant) => {
    setEditingRestaurant(rest);
    setRestName(rest.name);
    setRestImage(rest.image);
    setRestBanner(rest.bannerImage || rest.image);
    setRestCuisine(rest.cuisine.join(', '));
    setRestPrice(rest.priceForTwo);
    setRestTime(rest.deliveryTimeMinutes);
    setRestAddress(rest.address);
    setRestIsOpen(rest.isOpen);
    setShowRestModal(true);
  };

  const handleSaveRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: restName,
      image: restImage,
      bannerImage: restBanner,
      cuisine: restCuisine.split(',').map((c) => c.trim()),
      priceForTwo: Number(restPrice),
      deliveryTimeMinutes: Number(restTime),
      address: restAddress,
      city: 'New Delhi',
      isOpen: restIsOpen,
    };

    if (editingRestaurant) {
      // Update
      await fetch(`/api/admin/restaurants/${editingRestaurant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      // Create
      await fetch('/api/admin/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }

    setShowRestModal(false);
    dispatch(fetchRestaurants());
    dispatch(fetchAdminAnalytics());
  };

  const handleDeleteRestaurant = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this restaurant and its menu items?')) return;
    try {
      const res = await fetch(`/api/admin/restaurants/${id}`, { method: 'DELETE' });
      if (res.ok) {
        dispatch(fetchRestaurants());
        dispatch(fetchAllFoods());
        dispatch(fetchAdminAnalytics());
        showToast.success('Restaurant deleted successfully.');
      } else {
        const data = await res.json();
        showToast.error(data.error || 'Failed to delete restaurant.');
      }
    } catch (err) {
      console.error(err);
      showToast.error('Network error while deleting restaurant.');
    }
  };

  const openAddFoodModal = () => {
    setEditingFood(null);
    setFoodName('');
    setFoodPrice(249);
    setFoodCategory('Mains');
    setFoodImage('https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=800&q=80');
    setFoodIsVeg(true);
    setFoodIsSpicy(false);
    setFoodRestId(restaurants[0]?.id || '');
    setShowFoodModal(true);
  };

  const openEditFoodModal = (food: FoodItem) => {
    setEditingFood(food);
    setFoodName(food.name);
    setFoodPrice(food.price);
    setFoodCategory(food.category);
    setFoodImage(food.image);
    setFoodIsVeg(food.isVeg);
    setFoodIsSpicy(food.isSpicy || false);
    setFoodRestId(food.restaurantId);
    setShowFoodModal(true);
  };

  const handleSaveFood = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetRestId = foodRestId || restaurants[0]?.id || 'rest_1';
    const payload = {
      restaurantId: targetRestId,
      name: foodName,
      price: Number(foodPrice),
      category: foodCategory,
      image: foodImage,
      isVeg: Boolean(foodIsVeg),
      isSpicy: Boolean(foodIsSpicy),
      description: 'Prepared fresh with aromatic spices and premium organic ingredients.',
    };

    try {
      let res;
      if (editingFood) {
        res = await fetch(`/api/admin/foods/${editingFood.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/admin/foods', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        setShowFoodModal(false);
        dispatch(fetchAllFoods());
        dispatch(fetchRestaurants());
        showToast.success(editingFood ? 'Food item updated successfully.' : 'Food item added successfully.');
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast.error(errData.error || 'Failed to save food item. Please try again.');
      }
    } catch (err) {
      console.error('Error saving food item:', err);
      showToast.error('Error saving food item. Please check connection.');
    }
  };

  const handleDeleteFood = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this food item?')) return;
    try {
      const res = await fetch(`/api/admin/foods/${id}`, { method: 'DELETE' });
      if (res.ok) {
        dispatch(fetchAllFoods());
        dispatch(fetchRestaurants());
        dispatch(fetchAdminAnalytics());
        showToast.success('Food item deleted successfully.');
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast.error(errData.error || 'Failed to delete food item.');
      }
    } catch (err) {
      console.error('Error deleting food item:', err);
      showToast.error('Error deleting food item. Please check your connection.');
    }
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: couponCode.toUpperCase(),
        discountType: 'percentage',
        discountValue: couponDiscount,
        minOrderValue: 200,
        maxDiscountAmount: 150,
        description: `${couponDiscount}% OFF on orders above ₹200`,
      }),
    });
    setShowCouponModal(false);
    loadCoupons();
  };

  const handleDeleteCoupon = async (id: string) => {
    await fetch(`/api/coupons/${id}`, { method: 'DELETE' });
    loadCoupons();
  };

  const handleSearchUsers = (query: string) => {
    setUserSearch(query);
    dispatch(fetchAdminUsers(query));
  };

  const openAddUserModal = () => {
    setEditingUser(null);
    setUserName('');
    setUserEmail('');
    setUserPhone('+1 (555) ' + Math.floor(100 + Math.random() * 900) + '-' + Math.floor(1000 + Math.random() * 9000));
    setUserRole('customer');
    setShowUserModal(true);
  };

  const openEditUserModal = (usr: User) => {
    setEditingUser(usr);
    setUserName(usr.name);
    setUserEmail(usr.email);
    setUserPhone(usr.phone || '');
    setUserRole(usr.role);
    setShowUserModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: userName,
      email: userEmail,
      phone: userPhone,
      role: userRole,
    };

    try {
      let res;
      if (editingUser) {
        res = await fetch(`/api/admin/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        setShowUserModal(false);
        dispatch(fetchAdminUsers(userSearch));
        dispatch(fetchAdminAnalytics());
        showToast.success(editingUser ? 'User updated successfully.' : 'User created successfully.');
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast.error(errData.error || 'Failed to save user.');
      }
    } catch (err) {
      console.error('Error saving user:', err);
      showToast.error('Error saving user. Please check your connection.');
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete user "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        dispatch(fetchAdminUsers(userSearch));
        dispatch(fetchAdminAnalytics());
        showToast.success('User deleted successfully.');
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast.error(errData.error || 'Failed to delete user.');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      showToast.error('Error deleting user. Please check your connection.');
    }
  };

  const handleToggleBlock = async (usr: User) => {
    await dispatch(toggleBlockUser(usr.id));
    dispatch(fetchAdminAnalytics());
    showToast.info(`User status updated for ${usr.name}.`);
  };

  const handleQuickChangeRole = async (usr: User, newRole: Role) => {
    try {
      const res = await fetch(`/api/admin/users/${usr.id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        dispatch(fetchAdminUsers(userSearch));
        showToast.success(`User role updated to ${newRole}.`);
      } else {
        showToast.error('Failed to update user role.');
      }
    } catch (err) {
      console.error('Error updating role:', err);
      showToast.error('Network error while updating role.');
    }
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Role Notice Banner if not admin */}
      {user?.role !== 'admin' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-900">Current Role: Customer ({user?.name})</p>
              <p className="text-[11px] text-amber-800">Switch to Admin Mode to manage restaurants, menus, orders, and coupons.</p>
            </div>
          </div>
          <button
            onClick={handleSwitchToAdmin}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-xs shrink-0 transition-all"
          >
            Switch to Admin Mode
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900">Admin Control Center</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-extrabold uppercase">
              Super Admin
            </span>
          </div>
          <p className="text-xs text-slate-500">Live platform operations, orders, menu inventory & coupon management</p>
        </div>
      </div>

      {/* Analytics Counter Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Total Platform Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">
            ₹{(analytics?.totalRevenue || 48500).toLocaleString('en-IN')}
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Total Orders Placed</span>
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {analytics?.totalOrders || 42}
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Active Restaurants</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {restaurants.length || 6}
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Registered Customers</span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {usersList.length || 18}
          </p>
        </div>
      </div>

      {/* Admin Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        {[
          { key: 'orders', label: 'Live Orders Queue', icon: ShoppingBag },
          { key: 'restaurants', label: 'Restaurants', icon: Store },
          { key: 'foods', label: 'Food Items', icon: Plus },
          { key: 'coupons', label: 'Coupons & Deals', icon: Tag },
          { key: 'users', label: 'User Directory', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all shrink-0 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Live Orders Table */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-900">
            Live Platform Orders Queue
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Order ID</th>
                  <th className="p-3.5">Restaurant</th>
                  <th className="p-3.5">Total (₹)</th>
                  <th className="p-3.5">Payment</th>
                  <th className="p-3.5">Current Status</th>
                  <th className="p-3.5">Change Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {analytics?.recentOrders?.map((ord: any) => (
                  <tr key={ord.id} className="hover:bg-slate-50/80">
                    <td className="p-3.5 font-bold font-mono">#{ord.id}</td>
                    <td className="p-3.5 font-bold">{ord.restaurantName}</td>
                    <td className="p-3.5 font-black text-orange-600">₹{ord.totalAmount}</td>
                    <td className="p-3.5">{ord.paymentMethod} ({ord.paymentStatus})</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] uppercase">
                        {ord.status}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <select
                        value={ord.status}
                        onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value as OrderStatus)}
                        className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none cursor-pointer"
                      >
                        <option value="Placed">Placed</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Preparing">Preparing</option>
                        <option value="Out for Delivery">Out for Delivery</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Restaurants Management */}
      {activeTab === 'restaurants' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm text-slate-900">Manage Restaurants ({restaurants.length})</h3>
            <button
              onClick={openAddRestaurantModal}
              className="py-2 px-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add New Restaurant
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {restaurants.map((rest) => (
              <div key={rest.id} className="p-4 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex gap-3 items-center">
                  <img src={rest.image} alt={rest.name} className="w-16 h-16 rounded-2xl object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-sm text-slate-900 truncate">{rest.name}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        rest.isOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {rest.isOpen ? 'Open' : 'Closed'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{rest.cuisine.join(', ')}</p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] font-bold">
                      <span className="text-emerald-600">★ {rest.rating}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-700">₹{rest.priceForTwo} for two</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => openEditRestaurantModal(rest)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteRestaurant(rest.id)}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Food Items Management */}
      {activeTab === 'foods' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm text-slate-900">Manage Food Menu Items ({allFoods.length})</h3>
            <button
              onClick={openAddFoodModal}
              className="py-2 px-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Food Item
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allFoods.map((f) => (
              <div key={f.id} className="p-4 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex gap-3 items-center">
                  <img src={f.image} alt={f.name} className="w-16 h-16 rounded-2xl object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className={`w-2.5 h-2.5 rounded-full border ${f.isVeg ? 'bg-emerald-600 border-emerald-700' : 'bg-red-600 border-red-700'}`} />
                      <h4 className="font-extrabold text-sm text-slate-900 truncate">{f.name}</h4>
                    </div>
                    <p className="text-[11px] text-slate-500">{f.category} • {f.restaurantName}</p>
                    <span className="text-xs font-black text-orange-600 block mt-0.5">₹{f.price}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => openEditFoodModal(f)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteFood(f.id)}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Coupons Management */}
      {activeTab === 'coupons' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm text-slate-900">Manage Promotional Coupons</h3>
            <button
              onClick={() => setShowCouponModal(true)}
              className="py-2 px-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Create Coupon
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coupons.map((c) => (
              <div key={c.id} className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="font-mono font-black text-amber-900 text-sm block">{c.code}</span>
                  <span className="text-[11px] text-amber-800">{c.description}</span>
                </div>
                <button
                  onClick={() => handleDeleteCoupon(c.id)}
                  className="p-1.5 text-amber-700 hover:text-red-600 hover:bg-amber-100 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Users Directory */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                User Directory
                <span className="bg-orange-100 text-orange-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  {usersList.length} registered
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">Manage user accounts, roles, access permissions, and profiles.</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search user, email, role..."
                  value={userSearch}
                  onChange={(e) => handleSearchUsers(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-orange-500 bg-slate-50 font-medium"
                />
              </div>
              <button
                onClick={openAddUserModal}
                className="py-2 px-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add User
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">User Details</th>
                    <th className="p-3.5">Contact Phone</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {usersList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400 text-xs font-semibold">
                        No users found matching your search query.
                      </td>
                    </tr>
                  ) : (
                    usersList.map((usr) => (
                      <tr key={usr.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            {usr.avatar ? (
                              <img src={usr.avatar} alt={usr.name} className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center text-xs">
                                {usr.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                {usr.name}
                                {usr.id === user?.id && (
                                  <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.2 rounded-md">You</span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500">{usr.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 text-slate-600 font-mono text-[11px]">{usr.phone || 'N/A'}</td>
                        <td className="p-3.5">
                          <select
                            value={usr.role}
                            onChange={(e) => handleQuickChangeRole(usr, e.target.value as Role)}
                            className={`text-[11px] font-bold px-2 py-1 rounded-lg border outline-none cursor-pointer ${
                              usr.role === 'admin'
                                ? 'bg-purple-100 text-purple-800 border-purple-200'
                                : usr.role === 'owner'
                                ? 'bg-amber-100 text-amber-800 border-amber-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            <option value="customer">Customer</option>
                            <option value="owner">Owner</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="p-3.5">
                          {usr.blocked ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                              <XCircle className="w-3 h-3" /> Blocked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                              <CheckCircle className="w-3 h-3" /> Active
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right space-x-1.5">
                          <button
                            onClick={() => openEditUserModal(usr)}
                            title="Edit User"
                            className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleBlock(usr)}
                            title={usr.blocked ? 'Unblock User' : 'Block User'}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                              usr.blocked
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                            }`}
                          >
                            {usr.blocked ? 'Unblock' : 'Block'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(usr.id, usr.name)}
                            disabled={usr.id === user?.id}
                            title={usr.id === user?.id ? 'Cannot delete your own account' : 'Delete User'}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Restaurant Modal */}
      {showRestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl border border-slate-100">
            <h3 className="font-extrabold text-base text-slate-900">
              {editingRestaurant ? 'Edit Restaurant Details' : 'Add New Restaurant'}
            </h3>
            <form onSubmit={handleSaveRestaurant} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Restaurant Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Punjab Kitchen"
                  value={restName}
                  onChange={(e) => setRestName(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none focus:border-orange-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Cuisines (comma separated)</label>
                  <input
                    type="text"
                    required
                    placeholder="North Indian, Mughlai"
                    value={restCuisine}
                    onChange={(e) => setRestCuisine(e.target.value)}
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Price for Two (₹)</label>
                  <input
                    type="number"
                    required
                    value={restPrice}
                    onChange={(e) => setRestPrice(Number(e.target.value))}
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Image URL</label>
                <input
                  type="text"
                  required
                  value={restImage}
                  onChange={(e) => setRestImage(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  required
                  value={restAddress}
                  onChange={(e) => setRestAddress(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="restIsOpen"
                  checked={restIsOpen}
                  onChange={(e) => setRestIsOpen(e.target.checked)}
                  className="w-4 h-4 accent-orange-600 rounded cursor-pointer"
                />
                <label htmlFor="restIsOpen" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Restaurant Currently Open for Orders
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRestModal(false)}
                  className="flex-1 py-2.5 text-xs border border-slate-200 font-bold rounded-xl text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md transition-all"
                >
                  {editingRestaurant ? 'Update Restaurant' : 'Save Restaurant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Food Item Modal */}
      {showFoodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl border border-slate-100">
            <h3 className="font-extrabold text-base text-slate-900">
              {editingFood ? 'Edit Food Item' : 'Add New Food Item'}
            </h3>
            <form onSubmit={handleSaveFood} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Select Restaurant</label>
                <select
                  value={foodRestId}
                  onChange={(e) => setFoodRestId(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none font-semibold bg-slate-50"
                >
                  {restaurants.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Food Item Name</label>
                <input
                  type="text"
                  required
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={foodPrice}
                    onChange={(e) => setFoodPrice(Number(e.target.value))}
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={foodCategory}
                    onChange={(e) => setFoodCategory(e.target.value)}
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Image URL</label>
                <input
                  type="text"
                  required
                  value={foodImage}
                  onChange={(e) => setFoodImage(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={foodIsVeg}
                    onChange={(e) => setFoodIsVeg(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600 rounded"
                  />
                  Pure Vegetarian
                </label>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={foodIsSpicy}
                    onChange={(e) => setFoodIsSpicy(e.target.checked)}
                    className="w-4 h-4 accent-red-600 rounded"
                  />
                  Spicy
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFoodModal(false)}
                  className="flex-1 py-2.5 text-xs border border-slate-200 font-bold rounded-xl text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md transition-all"
                >
                  {editingFood ? 'Update Food Item' : 'Save Food Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Coupon Modal */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-100">
            <h3 className="font-extrabold text-base text-slate-900">Create Coupon Code</h3>
            <form onSubmit={handleAddCoupon} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Coupon Code (e.g. CRAVE30)"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="w-full p-2.5 text-xs border rounded-xl font-mono uppercase font-bold"
              />
              <input
                type="number"
                required
                placeholder="Discount %"
                value={couponDiscount}
                onChange={(e) => setCouponDiscount(parseInt(e.target.value))}
                className="w-full p-2.5 text-xs border rounded-xl"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCouponModal(false)}
                  className="flex-1 py-2 text-xs border rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs bg-orange-600 text-white font-bold rounded-xl"
                >
                  Create Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-100">
            <h3 className="font-extrabold text-base text-slate-900">
              {editingUser ? 'Edit User Profile' : 'Add New User'}
            </h3>
            <form onSubmit={handleSaveUser} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none focus:border-orange-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="alex@example.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none focus:border-orange-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+1 (555) 000-1111"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Platform Role</label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as 'customer' | 'owner' | 'admin')}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none font-bold bg-slate-50 cursor-pointer"
                >
                  <option value="customer">Customer</option>
                  <option value="owner">Restaurant Owner</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="flex-1 py-2.5 text-xs border border-slate-200 font-bold rounded-xl text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
