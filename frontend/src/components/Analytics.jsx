import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';

import {
  BarChart, Bar, LineChart, Line, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, AreaChart, Area, ComposedChart,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Calendar, DollarSign, ShoppingBag, Users,
  Filter, Download, RefreshCw, Eye, Clock, Award, Package,
  User, ChevronDown, Search, AlertCircle, CheckCircle, XCircle,
  Database, AlertTriangle, Printer, ClipboardList, FileSpreadsheet,
  Zap, Activity, BarChart3, PieChart as PieChartIcon,
  Loader2, ChevronRight, Shield, File, Plus, Minus,
  Building, Phone, Mail, MapPin, Star, Target,
  Sparkles, Rocket, Gift, Flame, Crown, Gem,
  Grid, Layers, GitBranch, Workflow, Zap as ZapIcon,
  Globe, Heart, Coffee, Sun, Moon, Cloud,
  Move, ArrowRight, ArrowLeft, CornerDownRight,
  CircleDot, Square, Diamond, Hexagon, Octagon,
  X
} from 'lucide-react';

// ============================================
// CONSTANTS
// ============================================
const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6', '#f472b6', '#8b5cf6'];

const STAT_CARDS = [
  { id: 'revenue', icon: DollarSign, title: 'Total Revenue', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30', gradient: 'from-green-500 to-emerald-600' },
  { id: 'orders', icon: ShoppingBag, title: 'Total Orders', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30', gradient: 'from-blue-500 to-indigo-600' },
  { id: 'products', icon: Package, title: 'Products Sold', color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30', gradient: 'from-purple-500 to-pink-600' },
  { id: 'avgOrder', icon: Users, title: 'Average Order Value', color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30', gradient: 'from-orange-500 to-amber-600' }
];

const TABS = [
  { id: 'overview', label: 'Overview', icon: TrendingUp, color: 'indigo' },
  { id: 'products', label: 'Products', icon: Package, color: 'green' },
  { id: 'customers', label: 'Customers', icon: Users, color: 'purple' },
  { id: 'reports', label: 'Reports', icon: File, color: 'pink' }
];

// ============================================
// NUMERIC SAFETY HELPER
// ============================================
const num = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

// ============================================
// MOCK DATA
// ============================================
const MOCK_DATA = {
  monthly: () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map(month => ({
      month,
      revenue: Math.floor(Math.random() * 5000) + 1000,
      orders: Math.floor(Math.random() * 50) + 10,
      profit: Math.floor(Math.random() * 1500) + 300,
      customers: Math.floor(Math.random() * 30) + 5
    }));
  },
  products: () => {
    const products = ['Wireless Mouse', 'Keyboard Pro', 'USB-C Hub', 'Monitor Stand', 'Laptop Bag', 'Webcam HD', 'Desk Mat', 'Cable Kit', 'Phone Holder', 'Charger Pro'];
    return products.map(name => ({
      product_name: name,
      total_sold: Math.floor(Math.random() * 100) + 10,
      revenue: Math.floor(Math.random() * 5000) + 500,
      growth: Math.floor(Math.random() * 40) - 10,
      rating: (Math.random() * 2 + 3).toFixed(1)
    }));
  },
  yearly: () => {
    const years = ['2022', '2023', '2024', '2025'];
    return years.map(year => ({
      year,
      revenue: Math.floor(Math.random() * 50000) + 10000,
      orders: Math.floor(Math.random() * 500) + 100,
      profit: Math.floor(Math.random() * 15000) + 3000
    }));
  },
  summary: () => ({
    totalRevenue: Math.floor(Math.random() * 50000) + 10000,
    totalOrders: Math.floor(Math.random() * 500) + 100,
    totalProducts: Math.floor(Math.random() * 100) + 20,
    averageOrderValue: Math.floor(Math.random() * 200) + 50,
    revenueGrowth: Math.floor(Math.random() * 30) - 5,
    orderGrowth: Math.floor(Math.random() * 30) - 5,
    customerGrowth: Math.floor(Math.random() * 20) + 2,
    profitMargin: Math.floor(Math.random() * 25) + 15,
    conversionRate: (Math.random() * 5 + 2).toFixed(1)
  }),
  // ✅ FIXED: Use numeric IDs instead of CUS001 format
  customers: () => [
    { CUS_ID: 1, FIRST_NAME: 'John', LAST_NAME: 'Doe', PHONE: '555-0101', EMAIL: 'john@example.com', total_spent: 2450, orders: 12, joined: '2025-01-15' },
    { CUS_ID: 2, FIRST_NAME: 'Jane', LAST_NAME: 'Smith', PHONE: '555-0102', EMAIL: 'jane@example.com', total_spent: 1800, orders: 8, joined: '2025-02-20' },
    { CUS_ID: 3, FIRST_NAME: 'Robert', LAST_NAME: 'Johnson', PHONE: '555-0103', EMAIL: 'robert@example.com', total_spent: 1200, orders: 6, joined: '2025-03-10' },
    { CUS_ID: 4, FIRST_NAME: 'Mary', LAST_NAME: 'Williams', PHONE: '555-0104', EMAIL: 'mary@example.com', total_spent: 3200, orders: 15, joined: '2024-11-05' },
    { CUS_ID: 5, FIRST_NAME: 'David', LAST_NAME: 'Brown', PHONE: '555-0105', EMAIL: 'david@example.com', total_spent: 950, orders: 4, joined: '2025-05-01' }
  ],
  customerHistory: (customerId) => {
    const histories = {
      1: [
        { ORDER_NO: 'ORD-001', ORDER_DATE: '2026-07-01', amount: 149.99, STATUS: 'Completed' },
        { ORDER_NO: 'ORD-002', ORDER_DATE: '2026-06-15', amount: 89.50, STATUS: 'Completed' },
        { ORDER_NO: 'ORD-003', ORDER_DATE: '2026-05-20', amount: 234.75, STATUS: 'Pending' }
      ],
      2: [
        { ORDER_NO: 'ORD-004', ORDER_DATE: '2026-07-10', amount: 234.75, STATUS: 'Pending' },
        { ORDER_NO: 'ORD-005', ORDER_DATE: '2026-06-20', amount: 567.00, STATUS: 'Completed' }
      ],
      3: [
        { ORDER_NO: 'ORD-006', ORDER_DATE: '2026-07-05', amount: 89.50, STATUS: 'Completed' },
        { ORDER_NO: 'ORD-007', ORDER_DATE: '2026-06-10', amount: 149.99, STATUS: 'Completed' }
      ],
      4: [
        { ORDER_NO: 'ORD-008', ORDER_DATE: '2026-07-12', amount: 320.00, STATUS: 'Completed' },
        { ORDER_NO: 'ORD-009', ORDER_DATE: '2026-06-25', amount: 450.00, STATUS: 'Completed' }
      ],
      5: [
        { ORDER_NO: 'ORD-010', ORDER_DATE: '2026-07-01', amount: 95.00, STATUS: 'Pending' }
      ]
    };
    return histories[customerId] || [
      { ORDER_NO: 'ORD-001', ORDER_DATE: '2026-07-01', amount: 149.99, STATUS: 'Completed' },
      { ORDER_NO: 'ORD-002', ORDER_DATE: '2026-06-15', amount: 89.50, STATUS: 'Completed' },
      { ORDER_NO: 'ORD-003', ORDER_DATE: '2026-05-20', amount: 234.75, STATUS: 'Pending' }
    ];
  },
  reportData: {
    monthlySales: [
      { month: 'Jan', revenue: 4500, orders: 45, profit: 1200, customers: 38 },
      { month: 'Feb', revenue: 5200, orders: 52, profit: 1500, customers: 42 },
      { month: 'Mar', revenue: 4800, orders: 48, profit: 1300, customers: 40 },
      { month: 'Apr', revenue: 6100, orders: 61, profit: 1800, customers: 55 },
      { month: 'May', revenue: 5800, orders: 58, profit: 1600, customers: 48 },
      { month: 'Jun', revenue: 7200, orders: 72, profit: 2100, customers: 62 },
      { month: 'Jul', revenue: 6800, orders: 68, profit: 1900, customers: 58 },
      { month: 'Aug', revenue: 7900, orders: 79, profit: 2300, customers: 70 }
    ],
    productPerformance: [
      { name: 'Wireless Mouse', sales: 145, revenue: 4350, profit: 1300, rating: 4.5 },
      { name: 'Keyboard Pro', sales: 120, revenue: 6000, profit: 1800, rating: 4.8 },
      { name: 'USB-C Hub', sales: 98, revenue: 3430, profit: 980, rating: 4.2 },
      { name: 'Monitor Stand', sales: 85, revenue: 2975, profit: 850, rating: 4.0 },
      { name: 'Laptop Bag', sales: 75, revenue: 2250, profit: 675, rating: 4.3 },
      { name: 'Webcam HD', sales: 60, revenue: 1800, profit: 540, rating: 3.9 }
    ],
    customerAnalytics: [
      { name: 'John Doe', orders: 12, totalSpent: 2450, avgOrder: 204, lastOrder: '2026-07-10', segment: 'VIP' },
      { name: 'Jane Smith', orders: 8, totalSpent: 1800, avgOrder: 225, lastOrder: '2026-07-08', segment: 'Regular' },
      { name: 'Robert Johnson', orders: 6, totalSpent: 1200, avgOrder: 200, lastOrder: '2026-07-05', segment: 'Regular' },
      { name: 'Mary Williams', orders: 15, totalSpent: 3200, avgOrder: 213, lastOrder: '2026-07-12', segment: 'VIP' },
      { name: 'David Brown', orders: 4, totalSpent: 950, avgOrder: 238, lastOrder: '2026-07-01', segment: 'New' }
    ],
    revenueSummary: {
      totalRevenue: 43500,
      totalOrders: 356,
      totalCustomers: 124,
      avgOrderValue: 122,
      revenueGrowth: 12.5,
      orderGrowth: 8.3,
      customerGrowth: 5.2,
      profitMargin: 22.4,
      conversionRate: 3.8,
      topProduct: 'Keyboard Pro',
      topCustomer: 'Mary Williams'
    }
  }
};

// ============================================
// ANIMATED SUB-COMPONENTS
// ============================================

const AnimatedCounter = ({ value, duration = 1500, prefix = '', suffix = '' }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const startValue = 0;
    const endValue = typeof value === 'number' ? value : parseFloat(value) || 0;
    const startTime = performance.now();

    const updateCounter = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (endValue - startValue) * eased;

      setDisplayValue(current);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(updateCounter);
      }
    };

    animationRef.current = requestAnimationFrame(updateCounter);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration, isVisible]);

  const formatValue = (val) => {
    if (typeof value === 'string' && value.startsWith('$')) {
      return `${prefix}${val.toFixed(2)}${suffix}`;
    }
    if (val >= 1000) {
      return `${prefix}${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}${suffix}`;
    }
    return `${prefix}${val.toFixed(1)}${suffix}`;
  };

  return <span ref={elementRef}>{isVisible ? formatValue(displayValue) : '0'}</span>;
};

const AnimatedCard = ({ children, delay = 0, className = '' }) => {
  return (
    <div
      className={`animate-float-card ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const PulseDot = ({ active = true }) => (
  <span className={`inline-flex items-center gap-2 ${active ? 'text-green-500' : 'text-gray-400'}`}>
    <span className="relative flex h-2.5 w-2.5">
      {active && (
        <>
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
        </>
      )}
      {!active && (
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gray-400"></span>
      )}
    </span>
  </span>
);

const ShimmerLine = () => (
  <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
);

// ============================================
// STAT CARD WITH ANIMATION
// ============================================
const StatCard = ({ icon: Icon, title, value, subtitle, color, bgColor, gradient, trend, index }) => {
  const [isHovered, setIsHovered] = useState(false);

  const trendColor = trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-400';
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : null;

  return (
    <AnimatedCard delay={index * 100}>
      <div
        className="relative overflow-hidden bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-500 group cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          transform: isHovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <div
          className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
        />

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${bgColor} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
              <Icon className={`w-6 h-6 ${color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1 font-mono tracking-tight">
                <AnimatedCounter value={value} prefix={typeof value === 'string' && value.startsWith('$') ? '$' : ''} />
              </p>
              {subtitle && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {trend !== undefined && trend !== null && (
            <div className={`flex items-center gap-1 text-sm font-medium ${trendColor} transition-all duration-300 group-hover:scale-110`}>
              {TrendIcon && <TrendIcon className="w-4 h-4" />}
              {trend !== 0 && `${Math.abs(trend)}%`}
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 group-hover:w-full w-0" />
      </div>
    </AnimatedCard>
  );
};

// ============================================
// LOADING SKELETON WITH ANIMATION
// ============================================
const LoadingSkeleton = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
    <div className="relative">
      <div className="w-20 h-20 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-indigo-500/20 animate-ping" />
      </div>
    </div>
    <div className="text-center space-y-2">
      <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">Loading analytics data...</p>
      <div className="flex items-center justify-center gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  </div>
);

// ============================================
// MAIN COMPONENT
// ============================================
const Analytics = () => {
  // ===== STATE =====
  const [monthlyData, setMonthlyData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [yearlyData, setYearlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [customerHistory, setCustomerHistory] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [activeView, setActiveView] = useState('overview');
  const [dateRange, setDateRange] = useState('last6months');
  const [searchQuery, setSearchQuery] = useState('');
  const [analyticsSummary, setAnalyticsSummary] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    averageOrderValue: 0,
    revenueGrowth: 0,
    orderGrowth: 0,
    customerGrowth: 0,
    profitMargin: 0,
    conversionRate: 0
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [toast, setToast] = useState(null);

  // ===== REPORT STATE =====
  const [reportType, setReportType] = useState('monthlySales');
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');
  const [reportsLoaded, setReportsLoaded] = useState({});

  // ===== ANIMATION STATE =====
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef(null);

  // ===== REFS =====
  const isMounted = useRef(true);
  const fetchInProgress = useRef(false);

  // ===== MOCK DATA HELPERS =====
  const getMockData = useCallback((type, param = null) => {
    switch (type) {
      case 'monthly': return MOCK_DATA.monthly();
      case 'products': return MOCK_DATA.products();
      case 'yearly': return MOCK_DATA.yearly();
      case 'summary': return MOCK_DATA.summary();
      case 'customers': return MOCK_DATA.customers();
      case 'customerHistory': return MOCK_DATA.customerHistory(param);
      case 'reportData': return MOCK_DATA.reportData[param] || MOCK_DATA.reportData.monthlySales;
      default: return [];
    }
  }, []);

  // ===== SHOW TOAST =====
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ===== API CALLS =====
  const fetchAllAnalytics = useCallback(async () => {
    if (fetchInProgress.current) return;
    fetchInProgress.current = true;
    setLoading(true);
    setError(null);
    setErrorDetails(null);

    try {
      const useMockData = import.meta.env?.VITE_USE_MOCK_DATA === 'true' || 
                          !import.meta.env?.VITE_API_URL;

      if (useMockData) {
        console.log('📊 Using mock data for analytics');
        await new Promise(resolve => setTimeout(resolve, 500));
        setMonthlyData(getMockData('monthly'));
        setTopProducts(getMockData('products'));
        setYearlyData(getMockData('yearly'));
        setAnalyticsSummary(getMockData('summary'));
        setLoading(false);
        fetchInProgress.current = false;
        return;
      }

      const [monthlyRes, topRes, yearlyRes, summaryRes] = await Promise.all([
        axios.get('/api/analytics/monthly-revenue', {
          params: { range: dateRange },
          timeout: 10000
        }).catch(() => ({ data: getMockData('monthly') })),
        axios.get('/api/analytics/top-products', {
          params: { limit: 10 },
          timeout: 10000
        }).catch(() => ({ data: getMockData('products') })),
        axios.get('/api/analytics/yearly-revenue', {
          timeout: 10000
        }).catch(() => ({ data: getMockData('yearly') })),
        axios.get('/api/analytics/summary', {
          timeout: 10000
        }).catch(() => ({ data: getMockData('summary') }))
      ]);

      if (isMounted.current) {
        setMonthlyData((monthlyRes.data || []).map(d => ({
          ...d, revenue: num(d.revenue), orders: num(d.orders)
        })));
        setTopProducts((topRes.data || []).map(d => ({
          ...d, total_sold: num(d.total_sold), revenue: num(d.revenue)
        })));
        setYearlyData((yearlyRes.data || []).map(d => ({
          ...d, revenue: num(d.revenue), orders: num(d.orders)
        })));
        const s = summaryRes.data || {};
        setAnalyticsSummary({
          totalRevenue: num(s.totalRevenue),
          totalOrders: num(s.totalOrders),
          totalProducts: num(s.totalProducts),
          averageOrderValue: num(s.averageOrderValue),
          revenueGrowth: num(s.revenueGrowth),
          orderGrowth: num(s.orderGrowth),
          customerGrowth: num(s.customerGrowth),
          profitMargin: num(s.profitMargin),
          conversionRate: num(s.conversionRate)
        });
      }

    } catch (error) {
      console.error('❌ Error fetching analytics:', error);
      if (isMounted.current) {
        setError('Failed to load analytics data. Using fallback data.');
        setMonthlyData(getMockData('monthly'));
        setTopProducts(getMockData('products'));
        setYearlyData(getMockData('yearly'));
        setAnalyticsSummary(getMockData('summary'));
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        fetchInProgress.current = false;
      }
    }
  }, [dateRange, getMockData]);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await axios.get('/api/customers', { timeout: 10000 });
      if (isMounted.current) {
        setCustomers(res.data || []);
      }
    } catch (error) {
      console.error('❌ Error fetching customers:', error);
      if (isMounted.current) {
        setCustomers(getMockData('customers'));
      }
    }
  }, [getMockData]);

  const fetchReportData = useCallback(async (type) => {
    // ✅ FIXED: Prevent duplicate calls
    if (reportsLoaded[type]) {
      console.log(`📊 Report ${type} already loaded, skipping`);
      return;
    }

    setReportLoading(true);
    setReportError('');

    try {
      const useMockData = import.meta.env?.VITE_USE_MOCK_DATA === 'true' || 
                          !import.meta.env?.VITE_API_URL;

      if (useMockData) {
        console.log(`📊 Using mock data for report: ${type}`);
        await new Promise(resolve => setTimeout(resolve, 200));
        if (isMounted.current) {
          setReportData(getMockData('reportData', type));
          setReportsLoaded(prev => ({ ...prev, [type]: true }));
        }
        setReportLoading(false);
        return;
      }

      const res = await axios.get(`/api/reports/${type}`, {
        timeout: 10000
      });

      if (isMounted.current) {
        setReportData(res.data);
        setReportsLoaded(prev => ({ ...prev, [type]: true }));
      }
    } catch (error) {
      console.warn(`⚠️ Report ${type} fetch failed, using mock data:`, error.message);
      if (isMounted.current) {
        setReportData(getMockData('reportData', type));
        setReportsLoaded(prev => ({ ...prev, [type]: true }));
      }
    } finally {
      if (isMounted.current) {
        setReportLoading(false);
      }
    }
  }, [getMockData, reportsLoaded]);

  const fetchCustomerHistory = useCallback(async (customerId) => {
    if (!customerId) return;

    // ✅ FIXED: Extract numeric ID from CUS001 format
    let numericId;
    if (typeof customerId === 'string' && customerId.startsWith('CUS')) {
      numericId = parseInt(customerId.replace('CUS', ''), 10);
    } else {
      numericId = num(customerId, null);
    }

    if (numericId === null || isNaN(numericId)) {
      console.warn(`⚠️ Invalid customer id: ${customerId}`);
      if (isMounted.current) {
        setCustomerHistory(getMockData('customerHistory', 1));
      }
      return;
    }

    try {
      const useMockData = import.meta.env?.VITE_USE_MOCK_DATA === 'true' || 
                          !import.meta.env?.VITE_API_URL;

      if (useMockData) {
        console.log(`📊 Using mock customer history for ID: ${numericId}`);
        await new Promise(resolve => setTimeout(resolve, 200));
        if (isMounted.current) {
          setCustomerHistory(getMockData('customerHistory', numericId));
        }
        return;
      }

      const res = await axios.get(`/api/analytics/customer-history/${numericId}`, {
        timeout: 10000
      });
      if (isMounted.current) {
        setCustomerHistory((res.data || []).map(o => ({ ...o, amount: num(o.amount) })));
      }
    } catch (error) {
      console.error('❌ Error fetching customer history:', error);
      if (isMounted.current) {
        setCustomerHistory(getMockData('customerHistory', numericId));
      }
    }
  }, [getMockData]);

  // ===== EFFECTS =====
  useEffect(() => {
    isMounted.current = true;
    fetchAllAnalytics();
    fetchCustomers();

    // ✅ FIXED: Only load initial reports once
    const initialReports = ['monthlySales', 'productPerformance', 'customerAnalytics', 'revenueSummary'];
    initialReports.forEach(type => {
      fetchReportData(type);
    });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => {
      isMounted.current = false;
      fetchInProgress.current = false;
      observer.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== HANDLERS =====
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setReportsLoaded({}); // Reset loaded state
    await fetchAllAnalytics();
    await fetchReportData(reportType);
    setIsRefreshing(false);
    showToast('✅ Data refreshed!', 'success');
  }, [fetchAllAnalytics, fetchReportData, reportType, showToast]);

  const handleCustomerSelect = useCallback((e) => {
    const id = e.target.value;
    setSelectedCustomer(id);
    if (id) {
      fetchCustomerHistory(id);
    } else {
      setCustomerHistory([]);
    }
  }, [fetchCustomerHistory]);

  const handleReportTypeChange = useCallback((type) => {
    setReportType(type);
    fetchReportData(type);
  }, [fetchReportData]);

  // ===== EXPORT FUNCTIONS =====
  const handleExport = useCallback(async (format = 'csv') => {
    const data = activeView === 'products' ? topProducts : monthlyData;
    if (!data || data.length === 0) {
      showToast('No data to export', 'warning');
      return;
    }

    setExportLoading(true);
    setShowExportMenu(false);

    try {
      const isProductData = activeView === 'products';
      const headers = isProductData
        ? ['Product Name', 'Units Sold', 'Revenue', 'Growth %', 'Rating']
        : ['Month', 'Revenue', 'Orders', 'Profit', 'Customers'];

      let csv = headers.join(',') + '\n';
      data.forEach(item => {
        const row = isProductData
          ? [item.product_name || '', num(item.total_sold), num(item.revenue), num(item.growth), item.rating || 'N/A']
          : [item.month || '', num(item.revenue), num(item.orders), num(item.profit), num(item.customers)];
        csv += row.join(',') + '\n';
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${activeView}_data_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      showToast('✅ Export successful!', 'success');
    } catch (error) {
      console.error('❌ Export error:', error);
      showToast('❌ Export failed', 'error');
    } finally {
      setExportLoading(false);
    }
  }, [activeView, topProducts, monthlyData, showToast]);

  const exportReport = useCallback((format = 'csv') => {
    if (!reportData) {
      showToast('No report data to export', 'warning');
      return;
    }

    setExportLoading(true);

    try {
      let data = [];
      let headers = [];
      let filename = reportType;

      switch (reportType) {
        case 'monthlySales':
          data = reportData;
          headers = ['Month', 'Revenue', 'Orders', 'Profit', 'Customers'];
          filename = 'monthly_sales_report';
          break;
        case 'productPerformance':
          data = reportData;
          headers = ['Product', 'Units Sold', 'Revenue', 'Profit', 'Rating'];
          filename = 'product_performance_report';
          break;
        case 'customerAnalytics':
          data = reportData;
          headers = ['Customer', 'Orders', 'Total Spent', 'Avg Order', 'Segment'];
          filename = 'customer_analytics_report';
          break;
        case 'revenueSummary':
          data = [reportData];
          headers = ['Total Revenue', 'Total Orders', 'Total Customers', 'Avg Order Value', 'Profit Margin', 'Conversion Rate'];
          filename = 'revenue_summary';
          break;
        default:
          data = Array.isArray(reportData) ? reportData : [reportData];
          headers = Object.keys(data[0] || {});
      }

      let csv = headers.join(',') + '\n';

      if (reportType === 'revenueSummary') {
        const row = [
          num(reportData.totalRevenue),
          num(reportData.totalOrders),
          num(reportData.totalCustomers),
          num(reportData.avgOrderValue),
          num(reportData.profitMargin),
          num(reportData.conversionRate)
        ];
        csv += row.join(',') + '\n';
      } else {
        data.forEach(item => {
          const row = headers.map(h => {
            const key = h.toLowerCase().replace(/ /g, '');
            const value = item[key] ?? item[h] ?? '';
            return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
          });
          csv += row.join(',') + '\n';
        });
      }

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      showToast('✅ Report exported successfully!', 'success');
    } catch (error) {
      console.error('❌ Export error:', error);
      showToast('❌ Export failed', 'error');
    } finally {
      setExportLoading(false);
    }
  }, [reportType, reportData, showToast]);

  // ===== MEMOIZED DATA =====
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return topProducts;
    const query = searchQuery.toLowerCase();
    return topProducts.filter(p =>
      p.product_name?.toLowerCase().includes(query)
    );
  }, [topProducts, searchQuery]);

  const formatCurrency = useCallback((value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(num(value));
  }, []);

  // ===== REPORT RENDERERS =====
  const renderMonthlySales = () => {
    const data = reportData || [];
    if (!data.length) return <div className="text-center py-8 text-gray-400">No data available</div>;

    const totalRevenue = data.reduce((sum, d) => sum + num(d.revenue), 0);
    const totalOrders = data.reduce((sum, d) => sum + num(d.orders), 0);
    const avgProfit = data.reduce((sum, d) => sum + num(d.profit), 0) / data.length;

    return (
      <div className="space-y-4 animate-fade-in-up">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg hover:scale-105 transition-transform duration-300">
            <p className="text-xs text-green-600 dark:text-green-400">Total Revenue</p>
            <p className="text-lg font-bold text-green-700 dark:text-green-300 animate-count-up">${totalRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg hover:scale-105 transition-transform duration-300">
            <p className="text-xs text-blue-600 dark:text-blue-400">Total Orders</p>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-300 animate-count-up">{totalOrders}</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg hover:scale-105 transition-transform duration-300">
            <p className="text-xs text-purple-600 dark:text-purple-400">Avg Profit</p>
            <p className="text-lg font-bold text-purple-700 dark:text-purple-300 animate-count-up">${avgProfit.toFixed(2)}</p>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg hover:scale-105 transition-transform duration-300">
            <p className="text-xs text-indigo-600 dark:text-indigo-400">Data Points</p>
            <p className="text-lg font-bold text-indigo-700 dark:text-indigo-300 animate-count-up">{data.length}</p>
          </div>
        </div>
        <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} />
              <YAxis yAxisId="left" stroke="#9ca3af" fontSize={11} />
              <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: 'white' }} />
              <Legend />
              <Bar yAxisId="left" dataKey="revenue" fill="#6366f1" name="Revenue" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
              <Bar yAxisId="left" dataKey="profit" fill="#10b981" name="Profit" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#8b5cf6" name="Orders" strokeWidth={2} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderProductPerformance = () => {
    const data = reportData || [];
    if (!data.length) return <div className="text-center py-8 text-gray-400">No data available</div>;

    return (
      <div className="space-y-4 animate-fade-in-up">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg hover:scale-105 transition-transform duration-300">
            <p className="text-xs text-indigo-600 dark:text-indigo-400">Top Product</p>
            <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
              <Crown className="w-4 h-4 text-yellow-500" />
              {data[0]?.name || 'N/A'}
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg hover:scale-105 transition-transform duration-300">
            <p className="text-xs text-green-600 dark:text-green-400">Highest Revenue</p>
            <p className="text-sm font-bold text-green-700 dark:text-green-300 animate-count-up">
              ${Math.max(...data.map(d => num(d.revenue))).toFixed(2)}
            </p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg hover:scale-105 transition-transform duration-300">
            <p className="text-xs text-yellow-600 dark:text-yellow-400">Total Products</p>
            <p className="text-sm font-bold text-yellow-700 dark:text-yellow-300 animate-count-up">{data.length}</p>
          </div>
        </div>
        <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis type="number" stroke="#9ca3af" fontSize={11} />
              <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={11} width={100} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: 'white' }} />
              <Legend />
              <Bar dataKey="sales" fill="#6366f1" name="Units Sold" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderCustomerAnalytics = () => {
    const data = reportData || [];
    if (!data.length) return <div className="text-center py-8 text-gray-400">No data available</div>;

    const totalSpentSum = data.reduce((sum, d) => sum + num(d.totalSpent), 0);

    return (
      <div className="space-y-4 animate-fade-in-up">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg hover:scale-105 transition-transform duration-300">
            <p className="text-xs text-blue-600 dark:text-blue-400">Total Customers</p>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-300 animate-count-up">{data.length}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg hover:scale-105 transition-transform duration-300">
            <p className="text-xs text-green-600 dark:text-green-400">Total Spent</p>
            <p className="text-lg font-bold text-green-700 dark:text-green-300 animate-count-up">${totalSpentSum.toFixed(2)}</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg hover:scale-105 transition-transform duration-300">
            <p className="text-xs text-purple-600 dark:text-purple-400">Avg Spent</p>
            <p className="text-lg font-bold text-purple-700 dark:text-purple-300 animate-count-up">${(totalSpentSum / data.length).toFixed(2)}</p>
          </div>
        </div>
        <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="overflow-x-auto max-h-[300px] overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-300">Customer</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-300">Orders</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-300">Total Spent</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-300">Avg Order</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-300">Segment</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, i) => (
                  <tr key={i} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${item.segment === 'VIP' ? 'bg-gradient-to-r from-yellow-500 to-amber-500' : item.segment === 'Regular' ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-gradient-to-r from-green-500 to-emerald-500'}`}>
                        {item.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      {item.name}
                    </td>
                    <td className="px-4 py-3 text-right">{num(item.orders)}</td>
                    <td className="px-4 py-3 text-right font-medium">${num(item.totalSpent).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">${num(item.avgOrder).toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.segment === 'VIP' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                        item.segment === 'Regular' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                        'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      }`}>
                        {item.segment}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderRevenueSummary = () => {
    const data = reportData || {};
    if (!Object.keys(data).length) return <div className="text-center py-8 text-gray-400">No data available</div>;

    const metrics = [
      { label: 'Total Revenue', value: `$${num(data.totalRevenue).toFixed(2)}`, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30', icon: DollarSign },
      { label: 'Total Orders', value: num(data.totalOrders), color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30', icon: ShoppingBag },
      { label: 'Total Customers', value: num(data.totalCustomers), color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30', icon: Users },
      { label: 'Avg Order Value', value: `$${num(data.avgOrderValue).toFixed(2)}`, color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30', icon: TrendingUp },
      { label: 'Profit Margin', value: `${num(data.profitMargin).toFixed(1)}%`, color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30', icon: Target },
      { label: 'Conversion Rate', value: `${num(data.conversionRate).toFixed(1)}%`, color: 'text-cyan-600', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30', icon: Zap }
    ];

    const growthMetrics = [
      { label: 'Revenue Growth', value: `${num(data.revenueGrowth).toFixed(1)}%`, trend: num(data.revenueGrowth) > 0 ? 'up' : 'down' },
      { label: 'Order Growth', value: `${num(data.orderGrowth).toFixed(1)}%`, trend: num(data.orderGrowth) > 0 ? 'up' : 'down' },
      { label: 'Customer Growth', value: `${num(data.customerGrowth).toFixed(1)}%`, trend: num(data.customerGrowth) > 0 ? 'up' : 'down' }
    ];

    return (
      <div className="space-y-4 animate-fade-in-up">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {metrics.map((m, i) => (
            <div key={i} className={`${m.bgColor} p-4 rounded-lg hover:scale-105 transition-all duration-300 cursor-default border border-transparent hover:border-gray-200 dark:hover:border-gray-600`}>
              <div className="flex items-center gap-2 mb-1">
                <m.icon className={`w-4 h-4 ${m.color}`} />
                <p className="text-xs text-gray-600 dark:text-gray-400">{m.label}</p>
              </div>
              <p className={`text-lg font-bold ${m.color} animate-count-up`}>{m.value}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 animate-slide-up" style={{ animationDelay: '150ms' }}>
          {growthMetrics.map((m, i) => (
            <div key={i} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg hover:scale-105 transition-all duration-300">
              <p className="text-xs text-gray-500 dark:text-gray-400">{m.label}</p>
              <div className="flex items-center gap-2">
                <p className={`text-lg font-bold ${m.trend === 'up' ? 'text-green-600' : 'text-red-600'} animate-count-up`}>
                  {m.value}
                </p>
                <div className={`flex items-center gap-1 ${m.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                  {m.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <p className="text-xs text-yellow-600 dark:text-yellow-400">🏆 Top Product</p>
            <p className="text-lg font-bold text-yellow-700 dark:text-yellow-300">{data.topProduct || 'N/A'}</p>
          </div>
          <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-lg">
            <p className="text-xs text-pink-600 dark:text-pink-400">⭐ Top Customer</p>
            <p className="text-lg font-bold text-pink-700 dark:text-pink-300">{data.topCustomer || 'N/A'}</p>
          </div>
        </div>
      </div>
    );
  };

  // ===== RENDER REPORT CONTENT =====
  const renderReportContent = () => {
    if (reportLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="relative">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 border-t-indigo-600" />
            <Loader2 className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400 animate-pulse" />
          </div>
          <span className="ml-3 text-gray-500 animate-pulse">Loading report...</span>
        </div>
      );
    }

    if (reportError) {
      return (
        <div className="text-center py-8 text-red-500 animate-fade-in">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 animate-bounce" />
          <p>{reportError}</p>
        </div>
      );
    }

    switch (reportType) {
      case 'monthlySales':
        return renderMonthlySales();
      case 'productPerformance':
        return renderProductPerformance();
      case 'customerAnalytics':
        return renderCustomerAnalytics();
      case 'revenueSummary':
        return renderRevenueSummary();
      default:
        return <div className="text-center py-8 text-gray-400">Select a report type</div>;
    }
  };

  // ===== RENDER =====
  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      
      {/* ===== TOAST NOTIFICATION ===== */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-2xl border transform transition-all duration-500 animate-slide-in-right ${
          toast.type === 'success'
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
            : toast.type === 'warning'
            ? 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300'
            : 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
        }`}>
          <div className="flex items-center gap-3">
            {toast.type === 'success' && <CheckCircle className="w-5 h-5" />}
            {toast.type === 'warning' && <AlertCircle className="w-5 h-5" />}
            {toast.type === 'error' && <XCircle className="w-5 h-5" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* ===== HEADER ===== */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-6 text-white shadow-xl animate-gradient">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full animate-float" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/5 rounded-full animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full animate-float" style={{ animationDelay: '4s' }} />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <div className="relative">
                <TrendingUp className="w-8 h-8 animate-pulse" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping" />
              </div>
              Analytics Dashboard
            </h1>
            <p className="text-indigo-100 mt-1 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              <span className="inline-flex items-center gap-1 ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                <PulseDot active={true} />
                Live
              </span>
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 text-sm transition-all duration-300 hover:bg-white/30"
            >
              <option value="last30days" className="text-gray-800">Last 30 Days</option>
              <option value="last90days" className="text-gray-800">Last 90 Days</option>
              <option value="last6months" className="text-gray-800">Last 6 Months</option>
              <option value="last12months" className="text-gray-800">Last 12 Months</option>
            </select>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-all duration-300 hover:scale-105 disabled:opacity-50 text-sm font-medium"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={exportLoading}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-all duration-300 hover:scale-105 disabled:opacity-50 text-sm font-medium"
              >
                {exportLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Export
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showExportMenu ? 'rotate-180' : ''}`} />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-1 z-10 animate-slide-down">
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full px-4 py-2.5 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Export as CSV
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="w-full px-4 py-2.5 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    Print Report
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-6 flex flex-wrap items-center gap-4 text-xs text-white/80 border-t border-white/20 pt-4">
          <div className="flex items-center gap-2">
            <Database className="w-3 h-3" />
            <span>Database: <span className="text-white font-medium">Connected</span></span>
          </div>
          <span className="w-px h-4 bg-white/20"></span>
          <div className="flex items-center gap-2">
            <Activity className="w-3 h-3 animate-pulse" />
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
          <span className="ml-auto flex items-center gap-1 text-indigo-200">
            <Shield className="w-3 h-3" />
            Data encrypted
          </span>
        </div>
      </div>

      {/* ===== STATS GRID ===== */}
      <div ref={statsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((card, index) => {
          let value, subtitle, trend;
          switch (card.id) {
            case 'revenue':
              value = analyticsSummary.totalRevenue || 0;
              subtitle = `${analyticsSummary.totalOrders || 0} orders`;
              trend = analyticsSummary.revenueGrowth;
              break;
            case 'orders':
              value = analyticsSummary.totalOrders || 0;
              subtitle = 'This month';
              trend = analyticsSummary.orderGrowth;
              break;
            case 'products':
              value = analyticsSummary.totalProducts || 0;
              subtitle = 'Unique products';
              trend = null;
              break;
            case 'avgOrder':
              value = analyticsSummary.averageOrderValue || 0;
              subtitle = 'Per order';
              trend = null;
              break;
            default:
              value = 0;
              subtitle = '';
              trend = null;
          }
          return (
            <StatCard
              key={card.id}
              icon={card.icon}
              title={card.title}
              value={card.id === 'revenue' || card.id === 'avgOrder' ? `$${value}` : value}
              subtitle={subtitle}
              color={card.color}
              bgColor={card.bgColor}
              gradient={card.gradient}
              trend={trend}
              index={index}
            />
          );
        })}
      </div>

      {/* ===== TABS ===== */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden animate-slide-up">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex flex-wrap gap-1 p-4" aria-label="Tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveView(tab.id);
                  if (tab.id === 'overview') {
                    setSearchQuery('');
                  }
                }}
                className={`relative flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 overflow-hidden ${
                  activeView === tab.id
                    ? `text-${tab.color}-600 dark:text-${tab.color}-400 bg-${tab.color}-50 dark:bg-${tab.color}-900/20 shadow-md scale-105`
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-105'
                }`}
              >
                {activeView === tab.id && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                )}
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ===== OVERVIEW VIEW ===== */}
      {activeView === 'overview' && (
        <div className="animate-fade-in-up">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600 animate-bounce" />
                  Monthly Revenue & Orders
                </h2>
                <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                  <Zap className="w-3 h-3 animate-pulse" />
                  Real-time data
                </span>
              </div>
              {monthlyData.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-gray-400">
                  <p>No data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                    <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                    <YAxis yAxisId="left" stroke="#9ca3af" fontSize={12} />
                    <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: 'white' }} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="revenue" fill="#6366f1" name="Revenue ($)" radius={[4, 4, 0, 0]}>
                      {monthlyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                    <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#8b5cf6" name="Orders" strokeWidth={3} dot={{ r: 4 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow duration-300">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-indigo-600" />
                Revenue Distribution
              </h2>
              {monthlyData.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-gray-400">
                  <p>No data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={monthlyData.slice(0, 6)}
                      dataKey="revenue"
                      nameKey="month"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {monthlyData.slice(0, 6).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: 'white' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <AreaChart className="w-5 h-5 text-indigo-600" />
                Yearly Revenue Overview
              </h2>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {yearlyData.length} years tracked
              </span>
            </div>
            {yearlyData.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-gray-400">
                <p>No data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={yearlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                  <XAxis dataKey="year" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: 'white' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="#818cf8" fillOpacity={0.3}>
                    {yearlyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Area>
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* ===== PRODUCTS VIEW ===== */}
      {activeView === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                Top Selling Products
                <span className="text-xs font-normal text-gray-400 ml-2">
                  ({filteredProducts.length} of {topProducts.length})
                </span>
              </h2>
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm w-40 transition-all duration-300 focus:w-56"
                />
              </div>
            </div>
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Package className="w-12 h-12 mb-3 text-gray-300 animate-pulse" />
                <p>No products found</p>
                {searchQuery && <p className="text-xs mt-1">Try adjusting your search</p>}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={filteredProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                  <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                  <YAxis type="category" dataKey="product_name" stroke="#9ca3af" fontSize={12} width={100} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: 'white' }} />
                  <Bar dataKey="total_sold" fill="#6366f1" radius={[0, 4, 4, 0]}>
                    {filteredProducts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow duration-300">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-600" />
              Product Performance
            </h2>
            {topProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Package className="w-12 h-12 mb-3 text-gray-300 animate-pulse" />
                <p>No product data available</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {topProducts.slice(0, 5).map((product, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-300 hover:scale-[1.02] cursor-default"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold transition-transform duration-300 hover:scale-110 ${
                        index === 0 ? 'bg-gradient-to-r from-yellow-500 to-amber-500' :
                        index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                        index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-500' :
                        'bg-gradient-to-r from-indigo-400 to-indigo-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">{product.product_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                          <span>Sold: {num(product.total_sold)} units</span>
                          {product.growth && (
                            <span className={`flex items-center gap-0.5 ${product.growth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {product.growth > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {Math.abs(product.growth)}%
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800 dark:text-white">{formatCurrency(product.revenue || 0)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-end gap-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        {product.rating || 'N/A'}
                      </p>
                    </div>
                  </div>
                ))}
                {topProducts.length > 5 && (
                  <div className="text-center text-sm text-gray-400 dark:text-gray-500 pt-2 animate-pulse">
                    +{topProducts.length - 5} more products
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== CUSTOMERS VIEW ===== */}
      {activeView === 'customers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
          <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow duration-300">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Customer Selector
            </h2>
            <select
              value={selectedCustomer}
              onChange={handleCustomerSelect}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
            >
              <option value="">Select a customer</option>
              {customers.map((c) => {
                const name = `${c.FIRST_NAME || ''} ${c.LAST_NAME || ''}`.trim() || 'Customer';
                return (
                  <option key={c.CUS_ID} value={c.CUS_ID}>
                    {name} - {c.PHONE || 'No phone'}
                  </option>
                );
              })}
            </select>
            {selectedCustomer && (
              <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                    {customers.find(c => String(c.CUS_ID) === String(selectedCustomer))?.FIRST_NAME?.[0] || '?'}
                    {customers.find(c => String(c.CUS_ID) === String(selectedCustomer))?.LAST_NAME?.[0] || ''}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">
                      {customers.find(c => String(c.CUS_ID) === String(selectedCustomer))?.FIRST_NAME || ''}{' '}
                      {customers.find(c => String(c.CUS_ID) === String(selectedCustomer))?.LAST_NAME || ''}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      ID: {selectedCustomer}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow duration-300">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              Purchase History
              {customerHistory.length > 0 && (
                <span className="text-xs font-normal text-gray-400 ml-2">
                  ({customerHistory.length} orders)
                </span>
              )}
            </h2>

            {customerHistory.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <User className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600 animate-pulse" />
                <p className="font-medium">No customer selected</p>
                <p className="text-sm mt-1">Select a customer to view their purchase history</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Order</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerHistory.map((order, index) => (
                      <tr
                        key={order.ORDER_NO}
                        className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors animate-slide-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="px-4 py-3 text-sm font-medium text-indigo-600 dark:text-indigo-400">{order.ORDER_NO}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {new Date(order.ORDER_DATE).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-right text-gray-800 dark:text-white">
                          {formatCurrency(order.amount || 0)}
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 transition-all duration-300 hover:scale-105 ${
                            order.STATUS === 'Completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                            order.STATUS === 'Pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' :
                            'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                          }`}>
                            {order.STATUS === 'Completed' && <CheckCircle className="w-3 h-3" />}
                            {order.STATUS === 'Pending' && <Clock className="w-3 h-3" />}
                            {order.STATUS === 'Cancelled' && <XCircle className="w-3 h-3" />}
                            {order.STATUS || 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== REPORTS VIEW ===== */}
      {activeView === 'reports' && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { id: 'monthlySales', label: 'Monthly Sales', icon: TrendingUp, color: 'indigo' },
              { id: 'productPerformance', label: 'Product Performance', icon: Package, color: 'green' },
              { id: 'customerAnalytics', label: 'Customer Analytics', icon: Users, color: 'purple' },
              { id: 'revenueSummary', label: 'Revenue Summary', icon: DollarSign, color: 'orange' }
            ].map((report) => (
              <button
                key={report.id}
                onClick={() => handleReportTypeChange(report.id)}
                className={`relative p-4 rounded-xl border-2 transition-all duration-300 text-left overflow-hidden ${
                  reportType === report.id
                    ? `border-${report.color}-500 bg-${report.color}-50 dark:bg-${report.color}-900/20 shadow-lg scale-105`
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800 hover:scale-105'
                }`}
              >
                {reportType === report.id && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                )}
                <div className="flex items-center gap-3 relative z-10">
                  <div className={`p-2 rounded-lg transition-all duration-300 ${
                    reportType === report.id
                      ? `bg-${report.color}-100 dark:bg-${report.color}-900/30 text-${report.color}-600 dark:text-${report.color}-400`
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}>
                    <report.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className={`font-medium ${
                      reportType === report.id
                        ? `text-${report.color}-600 dark:text-${report.color}-400`
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {report.label}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-indigo-600" />
                {reportType === 'monthlySales' && 'Monthly Sales Report'}
                {reportType === 'productPerformance' && 'Product Performance Report'}
                {reportType === 'customerAnalytics' && 'Customer Analytics Report'}
                {reportType === 'revenueSummary' && 'Revenue Summary Report'}
              </h2>
              {reportData && (
                <div className="flex gap-2">
                  <button
                    onClick={() => exportReport('csv')}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 hover:scale-105"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    CSV
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 hover:scale-105"
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </button>
                </div>
              )}
            </div>
            <div className="report-content">
              {renderReportContent()}
            </div>
          </div>
        </div>
      )}

      {/* ===== FOOTER ===== */}
      <div className="text-center text-xs text-gray-400 dark:text-gray-500 py-4 border-t border-gray-200 dark:border-gray-700 animate-fade-in">
        <p className="flex items-center justify-center gap-2 flex-wrap">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            Analytics Dashboard
          </span>
          <span className="w-px h-3 bg-gray-300 dark:bg-gray-600"></span>
          <span className="flex items-center gap-1">
            <Database className="w-3 h-3 text-green-500" />
            Data refreshed automatically
          </span>
          <span className="w-px h-3 bg-gray-300 dark:bg-gray-600"></span>
          <span className="flex items-center gap-1">
            <Rocket className="w-3 h-3 text-purple-500" />
            © {new Date().getFullYear()} SPMS
          </span>
        </p>
      </div>

      {/* ===== GLOBAL ANIMATIONS ===== */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes float-card {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes count-up {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .animate-fade-in { animation: fade-in 0.6s ease-out forwards; }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
        .animate-slide-in-right { animation: slide-in-right 0.5s ease-out forwards; }
        .animate-slide-in { animation: slide-in 0.4s ease-out forwards; opacity: 0; }
        .animate-slide-down { animation: slide-down 0.3s ease-out forwards; }
        .animate-slide-up { animation: slide-up 0.4s ease-out forwards; opacity: 0; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-card { animation: float-card 3s ease-in-out infinite; }
        .animate-pulse { animation: pulse 2s ease-in-out infinite; }
        .animate-shimmer { animation: shimmer 1.5s infinite; }
        .animate-count-up { animation: count-up 0.5s ease-out forwards; }
        .animate-gradient { background-size: 200% 200%; animation: gradient 6s ease-in-out infinite; }

        /* Scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: #c4c4c4;
          border-radius: 3px;
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

        /* Print Styles */
        @media print {
          .fixed { display: none !important; }
          .bg-gradient-to-r { background: #fff !important; color: #000 !important; }
          button { display: none !important; }
          .dark\\:bg-gray-800 { background: #fff !important; }
          .dark\\:text-white { color: #000 !important; }
          .border { border-color: #ddd !important; }
          .shadow-sm { box-shadow: none !important; }
          .shadow-xl { box-shadow: none !important; }
          .hover\\:shadow-lg { box-shadow: none !important; }
          .report-content { break-inside: avoid; }
        }

        @media (max-width: 640px) {
          .animate-float-card {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Analytics;
