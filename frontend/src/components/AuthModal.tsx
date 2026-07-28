import React, { useState } from 'react';
import { X, Mail, Lock, User, Phone, ShieldCheck, Sparkles, Store, LayoutDashboard, UserCheck } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks/reduxHooks';
import { loginUser, registerUser, clearAuthError } from '../store/slices/authSlice';
import { showToast } from '../utils/toast';
import { Role } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: Role;
  defaultMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultRole = 'customer',
  defaultMode = 'login',
}) => {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);

  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [role, setRole] = useState<Role>(defaultRole);
  const [email, setEmail] = useState(
    defaultRole === 'admin'
      ? 'admin@cravecache.com'
      : defaultRole === 'owner'
      ? 'owner@cravecache.com'
      : 'alex@example.com'
  );
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState(
    defaultRole === 'admin'
      ? 'Root Admin'
      : defaultRole === 'owner'
      ? 'Restaurant Owner'
      : 'Alex Johnson'
  );
  const [phone, setPhone] = useState('+1 (555) 234-5678');

  // If role changes to admin, force mode to login
  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    if (newRole === 'admin') {
      setMode('login');
      setEmail('admin@cravecache.com');
      setName('Root Admin');
    } else if (newRole === 'owner') {
      setEmail('owner@cravecache.com');
      setName('Restaurant Owner');
    } else {
      setEmail('alex@example.com');
      setName('Alex Johnson');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearAuthError());

    if (mode === 'login') {
      const res = await dispatch(loginUser({ email, role }));
      if (loginUser.fulfilled.match(res)) {
        showToast.success('Login Successful');
        onClose();
      } else {
        showToast.error('Invalid Credentials');
      }
    } else {
      const res = await dispatch(registerUser({ name, email, phone, password, role }));
      if (registerUser.fulfilled.match(res)) {
        showToast.success('Registration Successful');
        onClose();
      } else {
        showToast.error('Registration Failed');
      }
    }
  };

  const setDemoUser = (userType: 'customer' | 'owner' | 'admin') => {
    handleRoleChange(userType);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-amber-200" />
            <span className="text-xs font-semibold tracking-wider uppercase text-amber-100">Welcome to CraveCache</span>
          </div>
          <h2 className="text-2xl font-bold">
            {mode === 'login' ? `Sign In as ${role === 'admin' ? 'Super Admin' : role === 'owner' ? 'Restaurant Owner' : 'Customer'}` : 'Create Your Account'}
          </h2>
          <p className="text-xs text-orange-100 mt-1">
            {mode === 'login'
              ? 'Enter credentials for your role'
              : 'Register as Customer or Restaurant Owner'}
          </p>
        </div>

        <div className="p-6">
          {/* Demo Quick Logins for 3 Roles */}
          <div className="mb-5 p-3 bg-amber-50 rounded-xl border border-amber-200/60">
            <p className="text-xs font-medium text-amber-800 mb-2 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-amber-600" /> Quick Demo Login (3 Independent Roles):
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setDemoUser('customer')}
                className={`py-1.5 px-2 text-[11px] font-bold rounded-lg transition-all flex flex-col items-center gap-0.5 ${
                  role === 'customer'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'bg-white text-amber-900 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Customer</span>
              </button>
              <button
                type="button"
                onClick={() => setDemoUser('owner')}
                className={`py-1.5 px-2 text-[11px] font-bold rounded-lg transition-all flex flex-col items-center gap-0.5 ${
                  role === 'owner'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'bg-white text-amber-900 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Owner</span>
              </button>
              <button
                type="button"
                onClick={() => setDemoUser('admin')}
                className={`py-1.5 px-2 text-[11px] font-bold rounded-lg transition-all flex flex-col items-center gap-0.5 ${
                  role === 'admin'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'bg-white text-amber-900 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Root Admin</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection Tabs */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Role</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleRoleChange('customer')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                    role === 'customer'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Customer
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleChange('owner')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                    role === 'owner'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Owner
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleChange('admin')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                    role === 'admin'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Root Admin
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 mt-2"
            >
              {loading ? 'Processing...' : mode === 'login' ? `Sign In as ${role.toUpperCase()}` : `Create ${role.toUpperCase()} Account`}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-slate-600">
            {mode === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="font-semibold text-orange-600 hover:underline"
                >
                  Register Now
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="font-semibold text-orange-600 hover:underline"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

