import React, { useState, useEffect } from 'react';
import { User as UserIcon, MapPin, Mail, Phone, Plus, Trash2, Camera, Upload, Check } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks/reduxHooks';
import { updateProfile, addAddress, removeAddress, setSelectedAddress } from '../store/slices/authSlice';
import { Address } from '../types';

const SAMPLE_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
];

export const ProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user, selectedAddress } = useAppSelector((state) => state.auth);

  const [name, setName] = useState(user?.name || 'Alex Johnson');
  const [email, setEmail] = useState(user?.email || 'alex@example.com');
  const [phone, setPhone] = useState(user?.phone || '+91 98765 43210');
  const [avatar, setAvatar] = useState(user?.avatar || SAMPLE_AVATARS[0]);
  const [isSaved, setIsSaved] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Sync state if user changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setAvatar(user.avatar || SAMPLE_AVATARS[0]);
    }
  }, [user]);

  // Address Form State
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [title, setTitle] = useState('Home');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('New Delhi');
  const [state, setState] = useState('DL');
  const [zipCode, setZipCode] = useState('110001');

  // Handle local image file upload
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError('');
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setUploadError('File size should be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const img = new Image();
        img.onload = () => {
          const maxDim = 300;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
            setAvatar(compressedDataUrl);
          } else {
            setAvatar(reader.result as string);
          }
        };
        img.src = reader.result;
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to process image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const res = await dispatch(
      updateProfile({
        userId: user.id,
        name,
        email,
        phone,
        avatar,
      })
    );

    if (updateProfile.fulfilled.match(res)) {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!street.trim()) return;

    const newAddr: Address = {
      id: `addr_${Date.now()}`,
      title,
      street,
      city,
      state,
      zipCode,
      isDefault: false,
    };

    dispatch(addAddress(newAddr));
    setShowAddressForm(false);
    setStreet('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <UserIcon className="w-6 h-6 text-orange-600" /> My Profile & Preferences
        </h1>
        <p className="text-xs text-slate-500">Manage your profile details, avatar picture, and saved addresses</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Side: User Profile Editor */}
        <div className="md:col-span-6 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          
          {/* Avatar Picture & Upload Controls */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative group shrink-0">
                <img
                  src={avatar}
                  alt={name}
                  className="w-20 h-20 rounded-2xl object-cover ring-4 ring-orange-500/20 shadow-md"
                />
                <label className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  <Camera className="w-6 h-6" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <h3 className="text-base font-extrabold text-slate-900">{name}</h3>
                <p className="text-xs text-slate-500">{email}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-extrabold uppercase">
                    Role: {user?.role}
                  </span>
                  <label className="text-[11px] font-bold text-orange-600 hover:underline cursor-pointer flex items-center gap-1">
                    <Upload className="w-3 h-3" /> Upload Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {uploadError && (
              <p className="text-xs font-semibold text-red-600 bg-red-50 p-2 rounded-xl border border-red-200">
                {uploadError}
              </p>
            )}

            {/* Avatar Preset Options */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Or Choose an Avatar Preset:</label>
              <div className="flex gap-2">
                {SAMPLE_AVATARS.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatar(url)}
                    className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition-all ${
                      avatar === url ? 'border-orange-600 ring-2 ring-orange-500/30 scale-105' : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Avatar Image URL Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Avatar Image URL</label>
              <input
                type="text"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-orange-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-orange-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-orange-500 font-semibold"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              {isSaved ? <Check className="w-4 h-4 text-emerald-300" /> : null}
              <span>{isSaved ? 'Profile & Avatar Updated Successfully!' : 'Save Profile Changes'}</span>
            </button>
          </form>
        </div>

        {/* Right Side: Saved Address Book */}
        <div className="md:col-span-6 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-orange-600" /> Saved Addresses
            </h3>
            <button
              onClick={() => setShowAddressForm(!showAddressForm)}
              className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add New
            </button>
          </div>

          {showAddressForm && (
            <form onSubmit={handleAddAddress} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Title (e.g., Home, Work)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="p-2.5 text-xs bg-white border border-slate-200 rounded-xl outline-none font-semibold"
                />
                <input
                  type="text"
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="p-2.5 text-xs bg-white border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <input
                type="text"
                required
                placeholder="Street Address & Apt Number"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl outline-none"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddressForm(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-orange-600 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Save Address
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {user?.addresses && user.addresses.length > 0 ? (
              user.addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                    selectedAddress?.id === addr.id
                      ? 'border-orange-500 bg-orange-50/50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div
                    onClick={() => dispatch(setSelectedAddress(addr))}
                    className="cursor-pointer flex-1"
                  >
                    <span className="text-xs font-bold text-slate-900 block">{addr.title}</span>
                    <span className="text-xs text-slate-500">
                      {addr.street}, {addr.city}, {addr.state} {addr.zipCode}
                    </span>
                  </div>

                  <button
                    onClick={() => dispatch(removeAddress(addr.id))}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">No addresses saved yet.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
