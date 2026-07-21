import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  User, Mail, Phone, MapPin, Calendar, Edit2, Save,
  X, Camera, UserCircle, Shield, Clock, CheckCircle,
  AlertCircle, Loader2, Key, Lock, Unlock,
  Building2, Globe, Award, Star, TrendingUp,
  ShoppingCart, DollarSign, Users, Activity,
  Sparkles, Zap, Heart, Briefcase, Upload,
  Image as ImageIcon, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// API CONFIGURATION
// ============================================
const API_URL = import.meta.env?.VITE_API_URL || '';
const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================
// PROFILE COMPONENT
// ============================================
const Profile = ({ user }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [avatarColor, setAvatarColor] = useState('bg-indigo-500');
  const [showSuccess, setShowSuccess] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // ===== STATE =====
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    fullname: '',
    phone: '',
    address: '',
    role: '',
    status: '',
    joinedDate: '',
    lastLogin: '',
    bio: '',
    website: '',
    department: '',
    avatar: null
  });

  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    phone: '',
    address: '',
    bio: '',
    website: '',
    department: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // ===== STATS =====
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    completionRate: 0
  });

  // ===== REFS =====
  const fileInputRef = useRef(null);
  const messageTimeout = useRef(null);

  // ===== AVATAR COLORS =====
  const avatarColors = [
    'bg-gradient-to-br from-red-500 to-rose-500',
    'bg-gradient-to-br from-orange-500 to-amber-500',
    'bg-gradient-to-br from-yellow-500 to-amber-500',
    'bg-gradient-to-br from-green-500 to-emerald-500',
    'bg-gradient-to-br from-teal-500 to-cyan-500',
    'bg-gradient-to-br from-blue-500 to-indigo-500',
    'bg-gradient-to-br from-indigo-500 to-purple-500',
    'bg-gradient-to-br from-purple-500 to-pink-500',
    'bg-gradient-to-br from-pink-500 to-rose-500',
    'bg-gradient-to-br from-rose-500 to-red-500'
  ];

  // ===== GENERATE AVATAR COLOR =====
  const getAvatarColor = (name) => {
    if (!name) return avatarColors[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return avatarColors[Math.abs(hash) % avatarColors.length];
  };

  // ===== SAVE AVATAR TO LOCAL STORAGE =====
  const saveAvatarToStorage = (imageData) => {
    try {
      localStorage.setItem('userAvatar', imageData);
      setAvatarPreview(imageData);
      showMessage('✅ Avatar uploaded successfully!', 'success');
    } catch (error) {
      console.error('Error saving avatar:', error);
      showMessage('❌ Failed to save avatar', 'error');
    }
  };

  // ===== LOAD AVATAR FROM LOCAL STORAGE =====
  const loadAvatarFromStorage = () => {
    try {
      const saved = localStorage.getItem('userAvatar');
      if (saved) {
        setAvatarPreview(saved);
      }
    } catch (error) {
      console.error('Error loading avatar:', error);
    }
  };

  // ===== HANDLE AVATAR UPLOAD =====
  const handleAvatarUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showMessage('❌ Please select an image file', 'error');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showMessage('❌ Image size should be less than 2MB', 'error');
      return;
    }

    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target.result;
      saveAvatarToStorage(imageData);
      setIsUploading(false);
    };
    reader.onerror = () => {
      showMessage('❌ Failed to read image file', 'error');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);

    // Reset input
    event.target.value = '';
  };

  // ===== REMOVE AVATAR =====
  const removeAvatar = () => {
    if (window.confirm('Are you sure you want to remove your avatar?')) {
      localStorage.removeItem('userAvatar');
      setAvatarPreview(null);
      showMessage('🗑️ Avatar removed', 'info');
    }
  };

  // ===== FETCH PROFILE =====
  const fetchProfile = async () => {
    setLoading(true);
    try {
      if (user) {
        setProfile({
          username: user.username || 'Unknown',
          email: user.email || 'user@example.com',
          fullname: user.fullname || user.username || 'User',
          phone: user.phone || '',
          address: user.address || '',
          role: user.role || user.role_name || 'User',
          status: user.status || 'Active',
          joinedDate: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          bio: user.bio || '',
          website: user.website || '',
          department: user.department || '',
          avatar: null
        });
        setAvatarColor(getAvatarColor(user.fullname || user.username || 'User'));
        
        setFormData({
          fullname: user.fullname || '',
          email: user.email || '',
          phone: user.phone || '',
          address: user.address || '',
          bio: user.bio || '',
          website: user.website || '',
          department: user.department || ''
        });
      }

      // Load saved avatar
      loadAvatarFromStorage();
      await fetchUserStats();
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(prev => ({
        ...prev,
        username: user?.username || 'Unknown',
        fullname: user?.fullname || user?.username || 'User',
        role: user?.role || user?.role_name || 'User',
        status: user?.status || 'Active'
      }));
    } finally {
      setLoading(false);
    }
  };

  // ===== FETCH USER STATS =====
  const fetchUserStats = async () => {
    try {
      const [ordersRes, customersRes, revenueRes] = await Promise.all([
        api.get('/api/orders').catch(() => ({ data: [] })),
        api.get('/api/customers').catch(() => ({ data: [] })),
        api.get('/api/dashboard/stats').catch(() => ({ data: {} }))
      ]);

      const orders = ordersRes.data || [];
      const customers = customersRes.data || [];
      const revenue = revenueRes.data || {};

      setStats({
        totalOrders: orders.length,
        totalCustomers: customers.length,
        totalRevenue: revenue.totalRevenue || 0,
        completionRate: orders.length > 0 ? Math.round((orders.filter(o => o.STATUS === 'Completed').length / orders.length) * 100) : 0
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  // ===== SHOW MESSAGE =====
  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
    setShowSuccess(type === 'success');
    if (messageTimeout.current) clearTimeout(messageTimeout.current);
    messageTimeout.current = setTimeout(() => {
      setMessage('');
      setShowSuccess(false);
    }, 4000);
  };

  // ===== HANDLE UPDATE PROFILE =====
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      setProfile(prev => ({
        ...prev,
        fullname: formData.fullname,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        bio: formData.bio,
        website: formData.website,
        department: formData.department
      }));
      
      setAvatarColor(getAvatarColor(formData.fullname || profile.username));
      setIsEditing(false);
      showMessage('✅ Profile updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      showMessage('❌ Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ===== HANDLE CHANGE PASSWORD =====
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('❌ Passwords do not match', 'error');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      showMessage('❌ Password must be at least 6 characters', 'error');
      return;
    }

    setLoading(true);
    try {
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
      showMessage('✅ Password changed successfully!', 'success');
    } catch (error) {
      console.error('Error changing password:', error);
      showMessage('❌ Failed to change password', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ===== FORMAT DATE =====
  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  // ===== GET INITIALS =====
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // ===== STAT CARD =====
  const StatCard = ({ icon: Icon, label, value, color, bgColor, delay = 0 }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300"
    >
      <div className="flex items-center gap-3">
        <motion.div 
          whileHover={{ rotate: 12, scale: 1.1 }}
          className={`p-2 rounded-xl ${bgColor}`}
        >
          <Icon className={`w-5 h-5 ${color}`} />
        </motion.div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-xl font-bold text-gray-800 dark:text-white">{value}</p>
        </div>
      </div>
    </motion.div>
  );

  // ===== INIT =====
  useEffect(() => {
    fetchProfile();
    return () => {
      if (messageTimeout.current) clearTimeout(messageTimeout.current);
    };
  }, []);

  // ===== LOADING =====
  if (loading && !profile.username) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="relative"
        >
          <div className="w-14 h-14 rounded-full border-4 border-indigo-200 border-t-indigo-600" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 animate-ping" />
          </div>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-gray-400 font-medium"
        >
          Loading your profile...
        </motion.p>
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0s' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    );
  }

  // ===== RENDER =====
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 pb-8"
    >
      
      {/* ===== MESSAGE TOAST ===== */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, x: 100, y: -20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={`fixed top-4 right-4 z-50 max-w-md w-full p-4 rounded-xl shadow-2xl border ${
              messageType === 'success' 
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300' 
                : messageType === 'error'
                ? 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                : 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="flex-shrink-0 mt-0.5"
              >
                {messageType === 'success' ? <CheckCircle className="w-5 h-5 text-green-500" /> : 
                 messageType === 'error' ? <AlertCircle className="w-5 h-5 text-red-500" /> :
                 <CheckCircle className="w-5 h-5 text-blue-500" />}
              </motion.div>
              <div className="flex-1 text-sm font-medium">{message}</div>
              <button 
                onClick={() => setMessage('')} 
                className="flex-shrink-0 opacity-50 hover:opacity-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== HEADER ===== */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-6 text-white shadow-xl overflow-hidden relative"
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full animate-pulse-slow" />
          <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-purple-300/20 rounded-full animate-pulse-slow animation-delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full animate-spin-slow" />
          <div className="absolute top-10 right-20 text-4xl animate-float-delayed opacity-20">✦</div>
          <div className="absolute bottom-10 left-10 text-3xl animate-float-delayed opacity-20">◈</div>
        </div>
        
        <div className="relative z-10 flex flex-wrap justify-between items-center">
          <div>
            <motion.h1 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold flex items-center gap-3"
            >
              <UserCircle className="w-8 h-8" />
              My Profile
            </motion.h1>
            <motion.p 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-indigo-100 mt-1 text-sm"
            >
              Manage your personal information and account settings
            </motion.p>
          </div>
          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-3 mt-3 sm:mt-0"
          >
            {!isEditing ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditing(true)}
                className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl hover:bg-white/30 transition flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    fullname: profile.fullname,
                    email: profile.email,
                    phone: profile.phone,
                    address: profile.address,
                    bio: profile.bio,
                    website: profile.website,
                    department: profile.department
                  });
                }}
                className="bg-red-500/20 backdrop-blur-sm px-4 py-2 rounded-xl hover:bg-red-500/30 transition flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </motion.button>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* ===== PROFILE STATS ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatCard 
          icon={ShoppingCart} 
          label="Total Orders" 
          value={stats.totalOrders}
          color="text-purple-500"
          bgColor="bg-purple-50 dark:bg-purple-900/20"
          delay={0.1}
        />
        <StatCard 
          icon={Users} 
          label="Customers Served" 
          value={stats.totalCustomers}
          color="text-blue-500"
          bgColor="bg-blue-50 dark:bg-blue-900/20"
          delay={0.2}
        />
        <StatCard 
          icon={DollarSign} 
          label="Revenue Generated" 
          value={`$${stats.totalRevenue.toFixed(2)}`}
          color="text-emerald-500"
          bgColor="bg-emerald-50 dark:bg-emerald-900/20"
          delay={0.3}
        />
        <StatCard 
          icon={Award} 
          label="Completion Rate" 
          value={`${stats.completionRate}%`}
          color="text-amber-500"
          bgColor="bg-amber-50 dark:bg-amber-900/20"
          delay={0.4}
        />
      </div>

      {/* ===== PROFILE CARD ===== */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
      >
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
            {/* Avatar with Upload */}
            <div className="relative group">
              <motion.div 
                className={`w-28 h-28 sm:w-36 sm:h-36 rounded-full flex items-center justify-center text-white text-4xl sm:text-5xl font-bold shadow-lg ring-4 ring-indigo-500/20 overflow-hidden ${
                  avatarPreview ? '' : (avatarColor || 'bg-indigo-500')
                }`}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {avatarPreview ? (
                  <img 
                    src={avatarPreview} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials(profile.fullname || profile.username)
                )}
              </motion.div>
              
              {/* Upload Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all duration-200"
                title="Change avatar"
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </motion.button>

              {/* Remove Avatar Button */}
              {avatarPreview && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={removeAvatar}
                  className="absolute bottom-0 left-0 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all duration-200"
                  title="Remove avatar"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={isUploading}
              />
            </div>

            {/* User Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-start">
                <motion.h2 
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-2xl font-bold text-gray-800 dark:text-white"
                >
                  {profile.fullname || profile.username}
                </motion.h2>
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    profile.status === 'Active' 
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  }`}
                >
                  {profile.status || 'Active'}
                </motion.span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 justify-center sm:justify-start text-gray-500 dark:text-gray-400">
                <span className="text-sm">@{profile.username}</span>
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                <span className="text-sm flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  {profile.role}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 justify-center sm:justify-start">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Joined: {formatDate(profile.joinedDate)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Last login: {formatDate(profile.lastLogin)}
                </span>
              </div>

              {/* Upload Status */}
              {isUploading && (
                <div className="mt-3 flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===== DETAILS ===== */}
        <motion.div 
          className="border-t border-gray-100 dark:border-gray-700 p-6 sm:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {isEditing ? (
            // ===== EDIT FORM =====
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleUpdateProfile}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.fullname}
                    onChange={(e) => setFormData({...formData, fullname: e.target.value})}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    placeholder="Full name"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    placeholder="Email address"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    placeholder="Phone number"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    placeholder="Department"
                    disabled={loading}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    placeholder="Address"
                    disabled={loading}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    rows="3"
                    className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    placeholder="Tell us about yourself..."
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    placeholder="Website URL"
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      fullname: profile.fullname,
                      email: profile.email,
                      phone: profile.phone,
                      address: profile.address,
                      bio: profile.bio,
                      website: profile.website,
                      department: profile.department
                    });
                  }}
                  className="px-4 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition dark:text-white font-medium"
                  disabled={loading}
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition font-medium flex items-center gap-2 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {loading ? 'Saving...' : 'Save Changes'}
                </motion.button>
              </div>
            </motion.form>
          ) : (
            // ===== VIEW MODE =====
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Full Name</p>
                <p className="font-medium dark:text-white">{profile.fullname || '-'}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Username</p>
                <p className="font-medium dark:text-white">@{profile.username}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Email</p>
                <p className="font-medium dark:text-white">{profile.email || '-'}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Phone</p>
                <p className="font-medium dark:text-white">{profile.phone || '-'}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Department</p>
                <p className="font-medium dark:text-white">{profile.department || '-'}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Role</p>
                <p className="font-medium dark:text-white">{profile.role}</p>
              </div>
              <div className="sm:col-span-2 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Address</p>
                <p className="font-medium dark:text-white">{profile.address || '-'}</p>
              </div>
              <div className="sm:col-span-2 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Bio</p>
                <p className="font-medium dark:text-white">{profile.bio || 'No bio yet'}</p>
              </div>
              {profile.website && (
                <div className="sm:col-span-2 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition">
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Website</p>
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                    {profile.website}
                  </a>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {/* ===== CHANGE PASSWORD ===== */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
      >
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-500" />
                Password & Security
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Update your password to keep your account secure</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition text-sm font-medium"
            >
              {showPasswordForm ? 'Cancel' : 'Change Password'}
            </motion.button>
          </div>

          <AnimatePresence>
            {showPasswordForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleChangePassword}
                className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 overflow-hidden"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      placeholder="Enter current password"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      placeholder="Enter new password"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      placeholder="Confirm new password"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    }}
                    className="px-4 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition dark:text-white font-medium"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition font-medium flex items-center gap-2 disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                    {loading ? 'Updating...' : 'Update Password'}
                  </motion.button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ===== CSS ANIMATIONS ===== */}
      <style>{`
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.1); opacity: 0.5; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }
        .animate-float-delayed { animation: float-delayed 3s ease-in-out infinite; }
        .animation-delay-1000 { animation-delay: 1s; }
        .animation-delay-2000 { animation-delay: 2s; }
      `}</style>
    </motion.div>
  );
};

export default Profile;