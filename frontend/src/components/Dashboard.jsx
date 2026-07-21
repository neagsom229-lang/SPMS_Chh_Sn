import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Users, Package, ShoppingCart, DollarSign,
  AlertCircle, TrendingUp, TrendingDown,
  Plus, FileText, Clock, Calendar,
  ArrowRight, BarChart3, PieChart,
  ChevronRight, Bell, Search, Filter,
  MoreVertical, Eye, Edit, Trash2,
  Menu, X, Grid3x3, List,
  ChevronDown, Sun, Moon,
  Sparkles, Zap, Activity, Award,
  Target, BarChart as BarChartIcon, Layers, Gift,
  AlertTriangle, CheckCircle, Loader2,
  Shield, Star, Heart, Gem, Rocket
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart,
  PieChart as RePieChart, Pie, Cell,
  ComposedChart, Legend, Scatter,
  RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar
} from 'recharts';

// ============================================
// API CONFIGURATION - FIXED ✅
// ============================================
const API_BASE = import.meta.env?.VITE_API_URL || '';
const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptors for debugging
api.interceptors.request.use(
  config => {
    console.log('📤 API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  error => Promise.reject(error)
);

api.interceptors.response.use(
  response => {
    console.log('📥 API Response:', response.status, response.config.url);
    return response;
  },
  error => {
    console.error('❌ API Error:', error.response?.status, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ============================================
// DASHBOARD COMPONENT
// ============================================
const Dashboard = ({ user }) => {
  const navigate = useNavigate();
  
  // ===== STATE =====
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    lowStockItems: 0,
    pendingOrders: 0,
    growthRate: 0,
    conversionRate: 0,
    avgOrderValue: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [pendingOrdersList, setPendingOrdersList] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [salesDistribution, setSalesDistribution] = useState([]);
  const [radarData, setRadarData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [showNotifications, setShowNotifications] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState([]);
  const [floatingStats, setFloatingStats] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  const [showPendingOrdersModal, setShowPendingOrdersModal] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New order #1234 placed', time: '2 min ago', read: false, type: 'order' },
    { id: 2, title: 'Low stock alert: Product X', time: '1 hour ago', read: false, type: 'alert' },
    { id: 3, title: 'Payment received $450', time: '3 hours ago', read: true, type: 'payment' },
    { id: 4, title: 'New customer registered', time: '5 hours ago', read: true, type: 'customer' },
  ]);
  const headerRef = useRef(null);

  // ===== GENERATE MOCK LOW STOCK PRODUCTS =====
  const generateMockLowStock = () => {
    return [
      { PRODUCT_ID: 1, NAME_EN: 'Laptop Pro', NAME_KH: 'កុំព្យូទ័រយួរដៃ', QtyAvailable: 3, QTY_ALERT: 10, SALEOUT_PRICE: 1299.99 },
      { PRODUCT_ID: 2, NAME_EN: 'Smartphone X', NAME_KH: 'ទូរស័ព្ទ X', QtyAvailable: 5, QTY_ALERT: 10, SALEOUT_PRICE: 899.99 },
      { PRODUCT_ID: 3, NAME_EN: 'Tablet Plus', NAME_KH: 'ថេប្លេត Plus', QtyAvailable: 2, QTY_ALERT: 10, SALEOUT_PRICE: 499.99 },
      { PRODUCT_ID: 4, NAME_EN: 'USB-C Hub', NAME_KH: 'USB-C Hub', QtyAvailable: 8, QTY_ALERT: 10, SALEOUT_PRICE: 49.99 },
    ];
  };

  // ===== GENERATE MOCK PENDING ORDERS =====
  const generateMockPendingOrders = () => {
    return [
      { OR_ID: 1, ORDER_NO: 'ORD-2024-001', FIRST_NAME: 'John', LAST_NAME: 'Doe', AMOUNT_US: 1299.99, ORDER_DATE: new Date().toISOString(), STATUS: 'Pending' },
      { OR_ID: 2, ORDER_NO: 'ORD-2024-002', FIRST_NAME: 'Jane', LAST_NAME: 'Smith', AMOUNT_US: 899.99, ORDER_DATE: new Date(Date.now() - 3600000).toISOString(), STATUS: 'Pending' },
      { OR_ID: 3, ORDER_NO: 'ORD-2024-003', FIRST_NAME: 'Robert', LAST_NAME: 'Johnson', AMOUNT_US: 499.99, ORDER_DATE: new Date(Date.now() - 7200000).toISOString(), STATUS: 'Processing' },
      { OR_ID: 4, ORDER_NO: 'ORD-2024-004', FIRST_NAME: 'Mary', LAST_NAME: 'Williams', AMOUNT_US: 1299.99, ORDER_DATE: new Date(Date.now() - 10800000).toISOString(), STATUS: 'Pending' },
      { OR_ID: 5, ORDER_NO: 'ORD-2024-005', FIRST_NAME: 'David', LAST_NAME: 'Brown', AMOUNT_US: 79.99, ORDER_DATE: new Date(Date.now() - 14400000).toISOString(), STATUS: 'Pending' },
      { OR_ID: 6, ORDER_NO: 'ORD-2024-006', FIRST_NAME: 'Sarah', LAST_NAME: 'Wilson', AMOUNT_US: 34.99, ORDER_DATE: new Date(Date.now() - 18000000).toISOString(), STATUS: 'Processing' },
      { OR_ID: 7, ORDER_NO: 'ORD-2024-007', FIRST_NAME: 'Michael', LAST_NAME: 'Taylor', AMOUNT_US: 24.99, ORDER_DATE: new Date(Date.now() - 21600000).toISOString(), STATUS: 'Pending' },
    ];
  };

  // ===== FETCH DASHBOARD DATA - FIXED ✅ =====
  const fetchDashboardData = async () => {
    try {
      // ✅ FIXED: Removed '/api' prefix from all endpoints
      const [statsRes, ordersRes, lowStockRes, pendingRes] = await Promise.all([
        api.get('/dashboard/stats').catch(() => ({ data: {} })),
        api.get('/orders/recent').catch(() => ({ data: [] })),
        api.get('/stock/low-stock').catch(() => ({ data: null })),
        api.get('/orders/pending').catch(() => ({ data: null }))
      ]);

      setStats(prev => ({ 
        ...prev, 
        ...statsRes.data,
        lowStockItems: lowStockRes.data?.length || 0,
        pendingOrders: pendingRes.data?.length || 0
      }));

      setRecentOrders(ordersRes.data || []);
      setLowStockProducts(lowStockRes.data || generateMockLowStock());
      setPendingOrdersList(pendingRes.data || generateMockPendingOrders());

      // Generate chart data
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      setChartData(months.slice(0, 6).map((m, i) => ({
        name: m,
        revenue: Math.floor(Math.random() * 8000) + 2000,
        orders: Math.floor(Math.random() * 50) + 10,
        profit: Math.floor(Math.random() * 3000) + 500,
        returns: Math.floor(Math.random() * 8) + 1,
        customers: Math.floor(Math.random() * 100) + 20
      })));

      setSalesDistribution([
        { name: 'Electronics', value: 4000 },
        { name: 'Clothing', value: 3000 },
        { name: 'Books', value: 2000 },
        { name: 'Home Goods', value: 2780 },
        { name: 'Other', value: 1890 }
      ]);

      setRadarData([
        { subject: 'Sales', A: 120, B: 110, fullMark: 150 },
        { subject: 'Traffic', A: 98, B: 130, fullMark: 150 },
        { subject: 'Conversion', A: 86, B: 130, fullMark: 150 },
        { subject: 'Retention', A: 99, B: 100, fullMark: 150 },
        { subject: 'Satisfaction', A: 85, B: 90, fullMark: 150 },
        { subject: 'Growth', A: 65, B: 85, fullMark: 150 },
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLowStockProducts(generateMockLowStock());
      setPendingOrdersList(generateMockPendingOrders());
      setLoading(false);
    }
  };

  // ===== NAVIGATION HANDLERS =====
  const handleViewStock = () => navigate('/stock');
  const handleViewOrders = () => navigate('/orders');
  const handleViewOrderDetails = (orderId) => navigate(`/orders/${orderId}`);
  const handleProcessOrder = (orderId) => navigate(`/orders/${orderId}/process`);
  const handleNewOrder = () => navigate('/orders');
  const handleAddCustomer = () => navigate('/customers');
  const handleAddProduct = () => navigate('/products');
  const handleGenerateReport = () => navigate('/reports');

  // ===== GENERATE PARTICLES =====
  const generateParticles = () => {
    const newParticles = [];
    for (let i = 0; i < 30; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 2,
        speed: Math.random() * 2 + 1,
        delay: Math.random() * 5,
        duration: Math.random() * 10 + 10,
        color: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'][Math.floor(Math.random() * 6)]
      });
    }
    setParticles(newParticles);
  };

  // ===== GENERATE FLOATING STATS =====
  const generateFloatingStats = () => {
    const stats = [
      { icon: Users, label: 'Active Users', value: '1,284', change: '+12%', color: '#6366f1' },
      { icon: ShoppingCart, label: 'Conversion', value: '3.8%', change: '+0.6%', color: '#10b981' },
      { icon: DollarSign, label: 'Revenue/User', value: '$48.50', change: '+8%', color: '#f59e0b' },
      { icon: Package, label: 'Items Sold', value: '2,491', change: '+23%', color: '#8b5cf6' },
    ];
    setFloatingStats(stats);
  };

  // ===== TOGGLE DARK MODE =====
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  // ===== COLORS =====
  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  // ===== INITIALIZATION =====
  useEffect(() => {
    fetchDashboardData();
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
    
    generateParticles();
    generateFloatingStats();
    
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      clearInterval(timer);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // ===== LOADING =====
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 sm:gap-6 px-4">
        <div className="relative">
          <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-indigo-500/20 animate-ping" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm sm:text-base text-gray-400 font-medium tracking-wide">Loading your dashboard...</p>
          <div className="mt-2 flex gap-1 justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0s' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
      </div>
    );
  }

  // ===== RENDER =====
  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 pb-8 sm:pb-12 relative">
      
      {/* --- Background Particles --- */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full opacity-30"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              background: particle.color,
              animation: `floatParticle ${particle.duration}s ease-in-out infinite`,
              animationDelay: `${particle.delay}s`,
              boxShadow: `0 0 ${particle.size * 2}px ${particle.color}40`
            }}
          />
        ))}
      </div>

      {/* --- Floating Stats (Background Decoration) --- */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 hidden lg:block">
        {floatingStats.map((stat, index) => (
          <div
            key={index}
            className="absolute bg-white/10 dark:bg-gray-800/20 backdrop-blur-sm rounded-2xl p-3 border border-white/20 dark:border-gray-700/30 animate-float"
            style={{
              left: `${10 + index * 25}%`,
              top: `${15 + Math.sin(index * 1.5) * 20 + 30}%`,
              animationDelay: `${index * 2}s`,
              transform: `rotate(${index * 15 - 20}deg)`
            }}
          >
            <div className="flex items-center gap-2 text-white/70">
              <stat.icon className="w-4 h-4" />
              <span className="text-xs font-medium">{stat.label}</span>
              <span className="text-sm font-bold text-white">{stat.value}</span>
              <span className="text-xs text-emerald-400">{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* --- Header with 3D Tilt Effect --- */}
      <div 
        ref={headerRef}
        className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 text-white overflow-hidden shadow-2xl transition-all duration-300 animate-headerGlow"
        style={{
          transform: `perspective(1000px) rotateX(${(mousePosition.y / window.innerHeight - 0.5) * 2}deg) rotateY(${(mousePosition.x / window.innerWidth - 0.5) * 2}deg)`,
          transition: 'transform 0.1s ease-out'
        }}
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full animate-pulse-slow" />
          <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-purple-300/20 rounded-full animate-pulse-slow animation-delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full animate-spin-slow" />
          
          <div className="absolute top-10 right-20 text-4xl animate-float-delayed opacity-20">✦</div>
          <div className="absolute bottom-10 left-10 text-3xl animate-float-delayed animation-delay-2000 opacity-20">◈</div>
          <div className="absolute top-1/3 right-1/4 text-2xl animate-float-delayed animation-delay-3000 opacity-20">◆</div>
          
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
        </div>

        <div className="relative z-10 flex flex-wrap justify-between items-center">
          <div className="animate-fadeInUp">
            <div className="flex items-center gap-3 mb-1">
              <div className="relative">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                <div className="absolute inset-0 w-3 h-3 rounded-full bg-emerald-400 animate-ping opacity-75" />
              </div>
              <span className="text-xs font-medium text-white/80 tracking-wider uppercase">Live Dashboard</span>
              <span className="text-xs text-white/60">• {currentTime.toLocaleTimeString()}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
              👋 Welcome back, <span className="bg-gradient-to-r from-yellow-200 to-pink-200 bg-clip-text text-transparent">{user?.username || 'User'}</span>
            </h1>
            <p className="text-white/80 mt-1 text-sm sm:text-base flex items-center gap-2 flex-wrap">
              <Sparkles className="w-4 h-4 animate-sparkle" />
              Here's what's happening with your store today
              <span className="text-xs text-white/50 hidden sm:inline">• {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </p>
          </div>
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            <div className="bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-xl text-sm flex items-center gap-2 animate-pulse-slow border border-white/10">
              <Activity className="w-4 h-4 text-white/80 animate-pulse" />
              <span className="font-medium">99.9% uptime</span>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-xl text-sm flex items-center gap-2 border border-white/10">
              <Zap className="w-4 h-4 text-yellow-300 animate-bounce" />
              <span className="font-medium">Live</span>
            </div>
          </div>
        </div>

        {/* Floating Stats Cards inside header */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-5 sm:mt-6">
          {floatingStats.slice(0, 4).map((stat, index) => (
            <div
              key={index}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/10 hover:bg-white/20 transition-all duration-300 group animate-slideUp"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className="flex items-center justify-between">
                <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white/70 group-hover:scale-110 transition-transform duration-300" />
                <span className="text-xs font-medium text-emerald-300 animate-pulse-slow">{stat.change}</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold mt-1">{stat.value}</p>
              <p className="text-[10px] sm:text-xs text-white/60">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* --- Mobile Header --- */}
      <div className="lg:hidden flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
          <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="relative p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[8px] flex items-center justify-center font-bold animate-pulse">
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </button>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-gray-600" /> : <Moon className="w-4 h-4 text-gray-600" />}
          </button>
        </div>
      </div>

      {/* --- Mobile Menu --- */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 space-y-3 shadow-lg animate-slideDown">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-200"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={handleNewOrder} className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 hover:shadow-indigo-500/40 transition-all duration-200">
              <Plus className="w-4 h-4" /> New Order
            </button>
            <button onClick={handleAddCustomer} className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
            <span className="text-sm text-gray-500 dark:text-gray-400">View Mode</span>
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all duration-200 ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
              >
                <Grid3x3 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all duration-200 ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
              >
                <List className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Notifications Dropdown --- */}
      {showNotifications && (
        <div className="absolute right-2 sm:right-4 top-28 sm:top-32 lg:top-36 w-[calc(100%-1rem)] sm:w-80 max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-slideDown">
          <div className="p-3 sm:p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <h4 className="font-semibold text-gray-800 dark:text-white text-sm sm:text-base flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-500" />
              Notifications
            </h4>
            <button className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline transition-all duration-200">
              Mark all read
            </button>
          </div>
          <div className="max-h-60 sm:max-h-72 overflow-y-auto">
            {notifications.map((n, i) => (
              <div
                key={n.id}
                className={`px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-all duration-200 border-l-4 ${
                  !n.read ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10' : 'border-transparent'
                }`}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs sm:text-sm truncate ${!n.read ? 'font-semibold text-gray-800 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                      {n.title}
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">{n.time}</p>
                  </div>
                  {!n.read && <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0 ml-2 animate-pulse" />}
                </div>
              </div>
            ))}
          </div>
          <div className="p-2.5 sm:p-3 border-t border-gray-100 dark:border-gray-700 text-center">
            <button className="text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline transition-all duration-200">
              View all notifications →
            </button>
          </div>
        </div>
      )}

      {/* --- Stats Grid with Continuous Animation --- */}
      <div className={`grid gap-3 sm:gap-4 lg:gap-6 ${
        viewMode === 'grid' 
          ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4' 
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
      }`}>
        
        {/* Stat Card 1 - Customers */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 group relative overflow-hidden animate-floatCard">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-400/5 to-transparent rounded-full -ml-12 -mb-12 group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium tracking-wide">Total Customers</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1 text-gray-800 dark:text-white">{stats.totalCustomers}</p>
              </div>
              <div className="p-3 rounded-2xl bg-blue-100 dark:bg-blue-900/30 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs font-medium">
              <span className="text-emerald-500"><TrendingUp className="w-3 h-3 inline" /> 12%</span>
              <span className="text-gray-400">vs last month</span>
              <div className="ml-auto flex items-center gap-1">
                <div className="flex gap-0.5">
                  <span className="w-1 h-4 bg-blue-400 rounded-full animate-bar1" />
                  <span className="w-1 h-6 bg-blue-500 rounded-full animate-bar2" />
                  <span className="w-1 h-8 bg-blue-600 rounded-full animate-bar3" />
                  <span className="w-1 h-5 bg-blue-400 rounded-full animate-bar2" />
                  <span className="w-1 h-3 bg-blue-300 rounded-full animate-bar1" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stat Card 2 - Products */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 group relative overflow-hidden animate-floatCard" style={{ animationDelay: '0.15s' }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium tracking-wide">Total Products</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1 text-gray-800 dark:text-white">{stats.totalProducts}</p>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs font-medium">
              <span className="text-emerald-500"><TrendingUp className="w-3 h-3 inline" /> 5%</span>
              <span className="text-gray-400">vs last month</span>
              <div className="ml-auto flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[10px] text-gray-400">live</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stat Card 3 - Orders */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 group relative overflow-hidden animate-floatCard" style={{ animationDelay: '0.3s' }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium tracking-wide">Total Orders</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1 text-gray-800 dark:text-white">{stats.totalOrders}</p>
                <p className="text-[10px] text-gray-400">{stats.pendingOrders} pending</p>
              </div>
              <div className="p-3 rounded-2xl bg-purple-100 dark:bg-purple-900/30 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs font-medium">
              <span className="text-emerald-500"><TrendingUp className="w-3 h-3 inline" /> 8%</span>
              <span className="text-gray-400">vs last month</span>
              <div className="ml-auto flex gap-0.5">
                <span className="w-1 h-3 bg-purple-400 rounded-full animate-bar1" />
                <span className="w-1 h-4 bg-purple-500 rounded-full animate-bar2" />
                <span className="w-1 h-6 bg-purple-600 rounded-full animate-bar3" />
                <span className="w-1 h-4 bg-purple-500 rounded-full animate-bar2" />
                <span className="w-1 h-2 bg-purple-300 rounded-full animate-bar1" />
              </div>
            </div>
          </div>
        </div>

        {/* Stat Card 4 - Revenue */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 group relative overflow-hidden animate-floatCard" style={{ animationDelay: '0.45s' }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-amber-600/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
          <div className="absolute inset-0 bg-gradient-to-r from-amber-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium tracking-wide">Total Revenue</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1 text-gray-800 dark:text-white">${stats.totalRevenue.toFixed(2)}</p>
              </div>
              <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-900/30 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs font-medium">
              <span className="text-emerald-500"><TrendingUp className="w-3 h-3 inline" /> 15%</span>
              <span className="text-gray-400">vs last month</span>
              <div className="ml-auto relative">
                <div className="w-12 h-1 bg-amber-200 dark:bg-amber-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full animate-slideProgress" style={{ width: '75%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Alerts with Animation --- */}
      {(stats.lowStockItems > 0 || stats.pendingOrders > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {stats.lowStockItems > 0 && (
            <div 
              onClick={() => setShowLowStockModal(true)}
              className="cursor-pointer bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10 border border-amber-200/60 dark:border-amber-700/30 p-3 sm:p-4 lg:p-5 rounded-xl sm:rounded-2xl flex flex-wrap items-center justify-between gap-2 hover:shadow-md transition-all duration-300 hover:scale-[1.01] animate-slideIn"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-amber-200/50 dark:bg-amber-800/30 animate-pulse">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300 font-medium flex items-center gap-2">
                    ⚠️ Low Stock Alert
                    <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full animate-pulse">URGENT</span>
                  </p>
                  <p className="text-[10px] sm:text-xs text-amber-600/70 dark:text-amber-400/70">{stats.lowStockItems} product(s) running low on stock</p>
                </div>
              </div>
              <div className="text-xs sm:text-sm text-amber-700 dark:text-amber-300 hover:text-amber-900 font-medium flex items-center gap-1 bg-white/60 dark:bg-gray-800/50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl transition-all duration-200 hover:scale-105">
                View Stock <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>
            </div>
          )}
          {stats.pendingOrders > 0 && (
            <div 
              onClick={() => setShowPendingOrdersModal(true)}
              className="cursor-pointer bg-gradient-to-r from-blue-50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-800/10 border border-blue-200/60 dark:border-blue-700/30 p-3 sm:p-4 lg:p-5 rounded-xl sm:rounded-2xl flex flex-wrap items-center justify-between gap-2 hover:shadow-md transition-all duration-300 hover:scale-[1.01] animate-slideIn" 
              style={{ animationDelay: '0.15s' }}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-blue-200/50 dark:bg-blue-800/30 animate-bounce">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 font-medium flex items-center gap-2">
                    ⏳ Pending Orders
                    <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full">{stats.pendingOrders} orders</span>
                  </p>
                  <p className="text-[10px] sm:text-xs text-blue-600/70 dark:text-blue-400/70">Need immediate processing</p>
                </div>
              </div>
              <div className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 hover:text-blue-900 font-medium flex items-center gap-1 bg-white/60 dark:bg-gray-800/50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl transition-all duration-200 hover:scale-105">
                View Orders <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- Low Stock Modal --- */}
      {showLowStockModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slideUp">
            <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Low Stock Products
              </h2>
              <button 
                onClick={() => setShowLowStockModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              {lowStockProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
                  <p>No low stock products</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lowStockProducts.map((product) => (
                    <div key={product.PRODUCT_ID} className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800/30 hover:shadow-md transition">
                      <div>
                        <p className="font-medium dark:text-white">{product.NAME_EN}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{product.NAME_KH}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-red-600 dark:text-red-400 font-bold">
                            Available: {product.QtyAvailable}
                          </span>
                          <span className="text-xs text-gray-400">
                            Alert Level: {product.QTY_ALERT}
                          </span>
                          <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                            ${product.SALEOUT_PRICE}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          navigate(`/products/${product.PRODUCT_ID}/edit`);
                          setShowLowStockModal(false);
                        }}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
                      >
                        Restock
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
              <button
                onClick={handleViewStock}
                className="px-4 py-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition font-medium flex items-center gap-2"
              >
                View All Stock <ArrowRight className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setShowLowStockModal(false)}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Pending Orders Modal --- */}
      {showPendingOrdersModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-slideUp">
            <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                Pending Orders ({pendingOrdersList.length})
              </h2>
              <button 
                onClick={() => setShowPendingOrdersModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              {pendingOrdersList.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
                  <p>No pending orders</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingOrdersList.map((order) => (
                    <div key={order.OR_ID} className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-800/30 hover:shadow-md transition">
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="font-mono font-medium text-indigo-600 dark:text-indigo-400">
                            {order.ORDER_NO}
                          </p>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            order.STATUS === 'Processing' 
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          }`}>
                            {order.STATUS}
                          </span>
                        </div>
                        <p className="text-sm dark:text-white">
                          {order.FIRST_NAME} {order.LAST_NAME}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(order.ORDER_DATE).toLocaleDateString()}
                          </span>
                          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                            ${order.AMOUNT_US}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            handleViewOrderDetails(order.OR_ID);
                            setShowPendingOrdersModal(false);
                          }}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                        >
                          View
                        </button>
                        <button
                          onClick={() => {
                            handleProcessOrder(order.OR_ID);
                            setShowPendingOrdersModal(false);
                          }}
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm"
                        >
                          Process
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
              <button
                onClick={handleViewOrders}
                className="px-4 py-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition font-medium flex items-center gap-2"
              >
                View All Orders <ArrowRight className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setShowPendingOrdersModal(false)}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Quick Actions (Animated) --- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 animate-fadeInUp">
        {[
          { icon: Plus, label: 'New Order', color: 'indigo', delay: 0, onClick: handleNewOrder },
          { icon: Users, label: 'Add Customer', color: 'emerald', delay: 0.1, onClick: handleAddCustomer },
          { icon: Package, label: 'Add Product', color: 'purple', delay: 0.2, onClick: handleAddProduct },
          { icon: FileText, label: 'Generate Report', color: 'amber', delay: 0.3, onClick: handleGenerateReport }
        ].map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3 sm:p-4 rounded-xl hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-1.5 shadow-md hover:shadow-xl hover:scale-105 group animate-slideUp"
            style={{ animationDelay: `${action.delay}s` }}
          >
            <action.icon className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform duration-300" />
            <span className="text-xs sm:text-sm font-medium">{action.label}</span>
          </button>
        ))}
      </div>

      {/* --- Charts Section with Animation --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6 hover:shadow-xl transition-all duration-300 group animate-floatCard">
          <div className="flex flex-wrap justify-between items-center mb-4 sm:mb-6 gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 animate-pulse" />
                Revenue & Orders
              </h3>
              <p className="text-[10px] sm:text-xs text-gray-400">Last 6 months performance</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] sm:text-xs">
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-indigo-500 rounded animate-pulse" /> Revenue</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-purple-400 rounded" /> Orders</span>
              <span className="flex items-center gap-1.5 hidden sm:flex"><span className="w-3 h-0.5 bg-emerald-500 rounded animate-pulse-slow" /> Profit</span>
            </div>
          </div>
          <div className="w-full h-[180px] xs:h-[200px] sm:h-[240px] lg:h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.06} />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v/1000}k`} />
                <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                    padding: '12px 16px',
                    fontSize: '12px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                  }}
                />
                <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#colorRevenue)" strokeWidth={2} />
                <Bar yAxisId="right" dataKey="orders" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={24} />
                <Line yAxisId="left" type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6 hover:shadow-xl transition-all duration-300 group animate-floatCard" style={{ animationDelay: '0.2s' }}>
          <div className="flex justify-between items-center mb-3 sm:mb-4">
            <h3 className="text-sm sm:text-base font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 animate-spin-slow" />
              Sales Mix
            </h3>
            <span className="text-[10px] sm:text-xs text-gray-400">By category</span>
          </div>
          <div className="w-full h-[160px] xs:h-[180px] sm:h-[200px] lg:h-[230px]">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={salesDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={60}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  className="text-[8px] sm:text-[10px]"
                  animationBegin={0}
                  animationDuration={1500}
                >
                  {salesDistribution.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                      className="hover:opacity-80 transition-opacity duration-300 cursor-pointer"
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                    padding: '8px 14px',
                    fontSize: '12px'
                  }}
                />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* --- Additional Chart - Radar Performance --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6 hover:shadow-xl transition-all duration-300 group animate-floatCard" style={{ animationDelay: '0.3s' }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm sm:text-base font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" />
              Performance Radar
            </h3>
            <span className="text-[10px] sm:text-xs text-gray-400">6 metrics</span>
          </div>
          <div className="w-full h-[200px] sm:h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="60%" data={radarData}>
                <PolarGrid stroke="#374151" opacity={0.2} />
                <PolarAngleAxis dataKey="subject" stroke="#9ca3af" fontSize={10} />
                <PolarRadiusAxis stroke="#9ca3af" fontSize={9} />
                <Radar name="Current" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                <Radar name="Target" dataKey="B" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                    padding: '8px 14px',
                    fontSize: '12px'
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity / Mini Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6 hover:shadow-xl transition-all duration-300 group animate-floatCard" style={{ animationDelay: '0.4s' }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm sm:text-base font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 animate-pulse" />
              Recent Activity
            </h3>
            <span className="text-[10px] sm:text-xs text-gray-400">Live</span>
          </div>
          <div className="space-y-3">
            {[
              { icon: ShoppingCart, text: 'New order #1234 placed', time: '2 min ago', color: 'purple' },
              { icon: Users, text: 'John Doe registered as customer', time: '15 min ago', color: 'blue' },
              { icon: DollarSign, text: 'Payment of $450 received', time: '1 hour ago', color: 'green' },
              { icon: Package, text: 'Product "Pro Max" added', time: '2 hours ago', color: 'amber' },
            ].map((activity, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 group/item animate-slideIn"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`p-2 rounded-xl bg-${activity.color}-100 dark:bg-${activity.color}-900/30 group-hover/item:scale-110 transition-transform duration-300`}>
                  <activity.icon className={`w-4 h-4 text-${activity.color}-600 dark:text-${activity.color}-400`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{activity.text}</p>
                  <p className="text-xs text-gray-400">{activity.time}</p>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- Recent Orders Table --- */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6 hover:shadow-xl transition-all duration-300 animate-floatCard" style={{ animationDelay: '0.5s' }}>
        <div className="flex flex-wrap justify-between items-center mb-4 sm:mb-6 gap-3">
          <div>
            <h2 className="text-sm sm:text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 animate-bounce" />
              Recent Orders
            </h2>
            <p className="text-[10px] sm:text-xs text-gray-400">Latest transactions from your store</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button className="p-1.5 sm:p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105">
              <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
            </button>
            <button 
              onClick={handleViewOrders}
              className="text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-medium flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/20 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl transition-all duration-200 hover:scale-105 hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
            >
              View All <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-center py-8 sm:py-12 text-gray-400 dark:text-gray-500">
            <ShoppingCart className="w-10 h-10 sm:w-14 sm:h-14 mx-auto mb-3 sm:mb-4 opacity-30 animate-float" />
            <p className="text-sm sm:text-base font-medium">No orders yet</p>
            <p className="text-xs sm:text-sm">Start selling to see orders here</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="min-w-[600px] sm:min-w-full">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="py-2 sm:py-3.5 px-2 sm:px-3 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Order #</th>
                    <th className="py-2 sm:py-3.5 px-2 sm:px-3 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Customer</th>
                    <th className="py-2 sm:py-3.5 px-2 sm:px-3 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Date</th>
                    <th className="py-2 sm:py-3.5 px-2 sm:px-3 text-right font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                    <th className="py-2 sm:py-3.5 px-2 sm:px-3 text-center font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden xs:table-cell">Status</th>
                    <th className="py-2 sm:py-3.5 px-2 sm:px-3 text-right font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.slice(0, 6).map((order, index) => (
                    <tr
                      key={order.OR_ID || order.order_id || index}
                      className="border-b dark:border-gray-700/60 hover:bg-gray-50/80 dark:hover:bg-gray-700/40 transition-all duration-200 group animate-slideIn"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <td className="py-2 sm:py-3.5 px-2 sm:px-3 font-medium text-indigo-600 dark:text-indigo-400 truncate max-w-[60px] sm:max-w-none">
                        {order.ORDER_NO || order.order_no}
                      </td>
                      <td className="py-2 sm:py-3.5 px-2 sm:px-3 text-gray-600 dark:text-gray-300 truncate max-w-[80px] sm:max-w-none hidden sm:table-cell">
                        {order.FIRST_NAME || order.first_name} {order.LAST_NAME || order.last_name}
                      </td>
                      <td className="py-2 sm:py-3.5 px-2 sm:px-3 text-gray-500 dark:text-gray-400 hidden md:table-cell">
                        {new Date(order.ORDER_DATE || order.order_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-2 sm:py-3.5 px-2 sm:px-3 text-right font-semibold dark:text-white">
                        ${(order.AMOUNT_US || order.net_amount || 0).toFixed(2)}
                      </td>
                      <td className="py-2 sm:py-3.5 px-2 sm:px-3 text-center hidden xs:table-cell">
                        <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-xs font-medium transition-all duration-300 hover:scale-105 ${
                          (order.STATUS || order.status) === 'Completed' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                          (order.STATUS || order.status) === 'Pending' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 animate-pulse' :
                          'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                        }`}>
                          {order.STATUS || order.status || 'Pending'}
                        </span>
                      </td>
                      <td className="py-2 sm:py-3.5 px-2 sm:px-3 text-right">
                        <div className="flex items-center justify-end gap-0.5 sm:gap-1 opacity-50 sm:group-hover:opacity-100 transition-all duration-200">
                          <button 
                            onClick={() => handleViewOrderDetails(order.OR_ID || order.order_id)}
                            className="p-1 sm:p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 hover:scale-110"
                          >
                            <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                          </button>
                          <button 
                            onClick={() => handleProcessOrder(order.OR_ID || order.order_id)}
                            className="p-1 sm:p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/20 transition-all duration-200 hover:scale-110"
                          >
                            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 hover:text-emerald-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* --- Footer Stats with Animation --- */}
      <div className="grid grid-cols-1 xs:grid-cols-3 gap-2 sm:gap-4 pt-1 sm:pt-2">
        {[
          { label: 'Avg Order Value', value: `$${stats.avgOrderValue || 124.50}`, icon: Award, color: 'indigo', delay: 0 },
          { label: 'Conversion Rate', value: `${stats.conversionRate || 4.2}%`, icon: Target, color: 'emerald', delay: 0.15 },
          { label: 'Growth Rate', value: `${stats.growthRate || 23}%`, icon: BarChartIcon, color: 'rose', delay: 0.3 }
        ].map((item, index) => (
          <div
            key={index}
            className="bg-gradient-to-br from-indigo-50 to-purple-50/30 dark:from-indigo-900/20 dark:to-purple-800/5 rounded-2xl p-3 sm:p-5 text-center border border-indigo-100 dark:border-indigo-800/20 transition-all duration-300 hover:scale-105 hover:shadow-lg animate-floatCard"
            style={{ animationDelay: `${item.delay}s` }}
          >
            <item.icon className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-indigo-500 mb-1 sm:mb-2 animate-float" />
            <p className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white">{item.value}</p>
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
          </div>
        ))}
      </div>

      {/* --- Custom CSS Animations --- */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes floatCard {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-4px) scale(1.01); }
        }
        @keyframes floatParticle {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          25% { transform: translate(30px, -40px) scale(1.2); opacity: 0.6; }
          50% { transform: translate(-20px, -70px) scale(0.8); opacity: 0.4; }
          75% { transform: translate(10px, -30px) scale(1.1); opacity: 0.7; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8) rotate(180deg); }
        }
        @keyframes bar1 {
          0%, 100% { height: 4px; }
          50% { height: 8px; }
        }
        @keyframes bar2 {
          0%, 100% { height: 6px; }
          50% { height: 12px; }
        }
        @keyframes bar3 {
          0%, 100% { height: 8px; }
          50% { height: 16px; }
        }
        @keyframes slideProgress {
          0% { width: 0%; }
          100% { width: 75%; }
        }
        @keyframes headerGlow {
          0%, 100% { box-shadow: 0 0 40px rgba(99, 102, 241, 0.3); }
          50% { box-shadow: 0 0 80px rgba(139, 92, 246, 0.4); }
        }

        .animate-fadeIn { animation: fadeIn 0.6s ease-out forwards; }
        .animate-fadeInUp { animation: fadeInUp 0.5s ease-out forwards; }
        .animate-slideDown { animation: slideDown 0.3s ease-out forwards; }
        .animate-slideIn { animation: slideIn 0.4s ease-out forwards; opacity: 0; }
        .animate-slideUp { animation: slideUp 0.5s ease-out forwards; opacity: 0; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-floatCard { animation: floatCard 4s ease-in-out infinite; }
        .animate-floatParticle { animation: floatParticle 15s ease-in-out infinite; }
        .animate-float-delayed { animation: float 3s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse 3s ease-in-out infinite; }
        .animate-spin-slow { animation: spin 20s linear infinite; }
        .animate-shimmer { animation: shimmer 3s linear infinite; background-size: 200% 100%; }
        .animate-sparkle { animation: sparkle 2s ease-in-out infinite; }
        .animate-bar1 { animation: bar1 1.5s ease-in-out infinite; }
        .animate-bar2 { animation: bar2 1.5s ease-in-out infinite; }
        .animate-bar3 { animation: bar3 1.5s ease-in-out infinite; }
        .animate-slideProgress { animation: slideProgress 2s ease-out forwards; }
        .animate-headerGlow { animation: headerGlow 4s ease-in-out infinite; }

        .animation-delay-1000 { animation-delay: 1s; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-3000 { animation-delay: 3s; }

        * {
          -webkit-tap-highlight-color: transparent;
        }
        
        ::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: #c4c4c4;
          border-radius: 2px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #a0a0a0;
        }
        .dark ::-webkit-scrollbar-thumb {
          background: #4b5563;
        }
        .dark ::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;