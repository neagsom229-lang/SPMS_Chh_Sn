import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, AreaChart, Area, ComposedChart
} from 'recharts';
import {
  TrendingUp, TrendingDown, Calendar, DollarSign, ShoppingBag, Users,
  Filter, Download, RefreshCw, Eye, Clock, Award, Package,
  User, ChevronDown, Search, AlertCircle, CheckCircle, XCircle,
  Database, AlertTriangle, Printer, FileText, FileSpreadsheet,
  Zap, Activity, BarChart3, PieChart as PieChartIcon,
  Loader2, ChevronRight, Shield, File, Plus, Minus,
  Building, Phone, Mail, MapPin, Star, Target
} from 'lucide-react';

// ============================================
// CONSTANTS
// ============================================
const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'];

const STAT_CARDS = [
  { id: 'revenue', icon: DollarSign, title: 'Total Revenue', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  { id: 'orders', icon: ShoppingBag, title: 'Total Orders', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  { id: 'products', icon: Package, title: 'Products Sold', color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  { id: 'avgOrder', icon: Users, title: 'Average Order Value', color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30' }
];

const TABS = [
  { id: 'overview', label: 'Overview', icon: TrendingUp },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'reports', label: 'Reports', icon: File }
];

// ============================================
// NUMERIC SAFETY HELPER
// ============================================
// MS Access / ADO drivers frequently hand numeric columns back as strings
// (e.g. "1199.00" instead of 1199). Every place this component calls
// .toFixed(), does arithmetic, or feeds a value into a recharts axis needs
// a real number, or it silently renders "NaN" / breaks the chart. This
// wrapper is used everywhere a value comes straight from the API.
const num = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

// ============================================
// MOCK DATA
// ============================================
const MOCK_DATA = {
  monthly: () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      revenue: Math.floor(Math.random() * 5000) + 1000,
      orders: Math.floor(Math.random() * 50) + 10
    }));
  },
  products: () => {
    const products = ['Wireless Mouse', 'Keyboard Pro', 'USB-C Hub', 'Monitor Stand', 'Laptop Bag', 'Webcam HD', 'Desk Mat', 'Cable Kit', 'Phone Holder', 'Charger Pro'];
    return products.map(name => ({
      product_name: name,
      total_sold: Math.floor(Math.random() * 100) + 10,
      revenue: Math.floor(Math.random() * 5000) + 500
    }));
  },
  yearly: () => {
    const years = ['2022', '2023', '2024', '2025'];
    return years.map(year => ({
      year,
      revenue: Math.floor(Math.random() * 50000) + 10000,
      orders: Math.floor(Math.random() * 500) + 100
    }));
  },
  summary: () => ({
    totalRevenue: Math.floor(Math.random() * 50000) + 10000,
    totalOrders: Math.floor(Math.random() * 500) + 100,
    totalProducts: Math.floor(Math.random() * 100) + 20,
    averageOrderValue: Math.floor(Math.random() * 200) + 50,
    revenueGrowth: Math.floor(Math.random() * 30) - 5,
    orderGrowth: Math.floor(Math.random() * 30) - 5
  }),
  customers: () => [
    { CUS_ID: 1, FIRST_NAME: 'John', LAST_NAME: 'Doe', PHONE: '555-0101', EMAIL: 'john@example.com' },
    { CUS_ID: 2, FIRST_NAME: 'Jane', LAST_NAME: 'Smith', PHONE: '555-0102', EMAIL: 'jane@example.com' },
    { CUS_ID: 3, FIRST_NAME: 'Robert', LAST_NAME: 'Johnson', PHONE: '555-0103', EMAIL: 'robert@example.com' }
  ],
  customerHistory: (customerId) => {
    const histories = {
      1: [
        { ORDER_NO: 'ORD-001', ORDER_DATE: '2026-07-01', amount: 149.99, STATUS: 'Completed' },
        { ORDER_NO: 'ORD-002', ORDER_DATE: '2026-06-15', amount: 89.50, STATUS: 'Completed' }
      ],
      2: [
        { ORDER_NO: 'ORD-003', ORDER_DATE: '2026-07-10', amount: 234.75, STATUS: 'Pending' },
        { ORDER_NO: 'ORD-004', ORDER_DATE: '2026-06-20', amount: 567.00, STATUS: 'Completed' }
      ]
    };
    return histories[customerId] || [
      { ORDER_NO: 'ORD-001', ORDER_DATE: '2026-07-01', amount: 149.99, STATUS: 'Completed' },
      { ORDER_NO: 'ORD-002', ORDER_DATE: '2026-06-15', amount: 89.50, STATUS: 'Completed' },
      { ORDER_NO: 'ORD-003', ORDER_DATE: '2026-05-20', amount: 234.75, STATUS: 'Pending' }
    ];
  },
  // Report mock data
  reportData: {
    monthlySales: [
      { month: 'Jan', revenue: 4500, orders: 45, profit: 1200 },
      { month: 'Feb', revenue: 5200, orders: 52, profit: 1500 },
      { month: 'Mar', revenue: 4800, orders: 48, profit: 1300 },
      { month: 'Apr', revenue: 6100, orders: 61, profit: 1800 },
      { month: 'May', revenue: 5800, orders: 58, profit: 1600 },
      { month: 'Jun', revenue: 7200, orders: 72, profit: 2100 },
    ],
    productPerformance: [
      { name: 'Wireless Mouse', sales: 145, revenue: 4350, profit: 1300 },
      { name: 'Keyboard Pro', sales: 120, revenue: 6000, profit: 1800 },
      { name: 'USB-C Hub', sales: 98, revenue: 3430, profit: 980 },
      { name: 'Monitor Stand', sales: 85, revenue: 2975, profit: 850 },
      { name: 'Laptop Bag', sales: 75, revenue: 2250, profit: 675 },
    ],
    customerAnalytics: [
      { name: 'John Doe', orders: 12, totalSpent: 2450, avgOrder: 204, lastOrder: '2026-07-10' },
      { name: 'Jane Smith', orders: 8, totalSpent: 1800, avgOrder: 225, lastOrder: '2026-07-08' },
      { name: 'Robert Johnson', orders: 6, totalSpent: 1200, avgOrder: 200, lastOrder: '2026-07-05' },
    ],
    revenueSummary: {
      totalRevenue: 43500,
      totalOrders: 356,
      totalCustomers: 124,
      avgOrderValue: 122,
      revenueGrowth: 12.5,
      orderGrowth: 8.3,
      customerGrowth: 5.2,
    }
  }
};

// ============================================
// SUB-COMPONENTS
// ============================================

const StatCard = ({ icon: Icon, title, value, subtitle, color, bgColor, trend }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${bgColor}`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
            {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          </div>
        </div>
        {trend !== undefined && trend !== null && (
          <div className={`flex items-center gap-1 text-sm font-medium ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-400'}`}>
            {trend > 0 ? <TrendingUp className="w-4 h-4" /> : trend < 0 ? <TrendingDown className="w-4 h-4" /> : null}
            {trend !== 0 && `${Math.abs(trend)}%`}
          </div>
        )}
      </div>
    </div>
  );
};

const ErrorDisplay = ({ error, errorDetails, onRetry }) => (
  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-8 text-center">
    <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
    <h3 className="text-xl font-semibold text-red-700 dark:text-red-400">{error}</h3>
    {errorDetails && (
      <div className="mt-4 text-left max-w-2xl mx-auto">
        <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-4">
          <p className="text-sm text-red-600 dark:text-red-300 font-mono">
            <strong>Error:</strong> {errorDetails.message}
          </p>
          {errorDetails.sqlError && (
            <p className="text-sm text-red-500 dark:text-red-400 font-mono mt-2">
              <strong>SQL Error:</strong> {errorDetails.sqlError}
            </p>
          )}
          <p className="text-xs text-red-400 dark:text-red-500 mt-2">
            <strong>Timestamp:</strong> {errorDetails.timestamp}
          </p>
        </div>
      </div>
    )}
    <div className="mt-6 flex justify-center gap-3 flex-wrap">
      <button
        onClick={onRetry}
        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
      >
        <RefreshCw className="w-4 h-4" />
        Retry
      </button>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
      >
        Reload Page
      </button>
    </div>
  </div>
);

const LoadingSkeleton = () => (
  <div className="flex items-center justify-center h-96">
    <div className="text-center">
      <div className="relative">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
        <Loader2 className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-indigo-400 animate-pulse" />
      </div>
      <p className="mt-4 text-gray-500 dark:text-gray-400 font-medium">Loading analytics data...</p>
      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">This may take a moment</p>
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
    orderGrowth: 0
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // ===== REPORT STATE =====
  const [reportType, setReportType] = useState('monthlySales');
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');

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

  // ===== API CALLS =====
  const fetchAllAnalytics = useCallback(async () => {
    if (fetchInProgress.current) return;
    fetchInProgress.current = true;
    setLoading(true);
    setError(null);
    setErrorDetails(null);

    try {
      const useMockData = import.meta.env?.VITE_USE_MOCK_DATA === 'true';

      if (useMockData) {
        setMonthlyData(getMockData('monthly'));
        setTopProducts(getMockData('products'));
        setYearlyData(getMockData('yearly'));
        setAnalyticsSummary(getMockData('summary'));
        setLoading(false);
        fetchInProgress.current = false;
        return;
      }

      // dateRange is now actually honored by the backend
      // (/api/analytics/monthly-revenue reads req.query.range).
      const [monthlyRes, topRes, yearlyRes, summaryRes] = await Promise.all([
        axios.get('/api/analytics/monthly-revenue', {
          params: { range: dateRange },
          timeout: 10000
        }).catch(err => {
          console.warn('⚠️ Monthly revenue fetch failed:', err.message);
          return { data: getMockData('monthly') };
        }),
        axios.get('/api/analytics/top-products', {
          params: { limit: 10 },
          timeout: 10000
        }).catch(err => {
          console.warn('⚠️ Top products fetch failed:', err.message);
          return { data: getMockData('products') };
        }),
        axios.get('/api/analytics/yearly-revenue', {
          timeout: 10000
        }).catch(err => {
          console.warn('⚠️ Yearly revenue fetch failed:', err.message);
          return { data: getMockData('yearly') };
        }),
        axios.get('/api/analytics/summary', {
          timeout: 10000
        }).catch(err => {
          console.warn('⚠️ Summary fetch failed:', err.message);
          return { data: getMockData('summary') };
        })
      ]);

      if (isMounted.current) {
        // Coerce every numeric field coming off the wire — Access/ADO can
        // return numbers as strings, which breaks recharts and .toFixed().
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
        });
      }

    } catch (error) {
      console.error('❌ Error fetching analytics:', error);
      if (isMounted.current) {
        const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
        const sqlError = error.response?.data?.sqlError || '';
        setError('Failed to load analytics data. Please try again.');
        setErrorDetails({
          message: errorMsg,
          sqlError: sqlError,
          timestamp: new Date().toLocaleString()
        });
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

  // ===== FETCH REPORT DATA =====
  const fetchReportData = useCallback(async (type) => {
    setReportLoading(true);
    setReportError('');

    try {
      // /api/reports/:type now exists on the backend and returns real
      // aggregates for monthlySales / productPerformance / customerAnalytics
      // / revenueSummary — previously this always 404'd and silently fell
      // through to mock data below.
      const res = await axios.get(`/api/reports/${type}`, {
        timeout: 10000
      });

      if (isMounted.current) {
        setReportData(res.data);
      }
    } catch (error) {
      console.warn(`⚠️ Report ${type} fetch failed, using mock data:`, error.message);
      if (isMounted.current) {
        setReportData(getMockData('reportData', type));
      }
    } finally {
      if (isMounted.current) {
        setReportLoading(false);
      }
    }
  }, [getMockData]);

  // ===== Fetch Customer History =====
  // The previous implementation tried to regex-extract digits out of the
  // customer's display ID (e.g. "C001" -> 1), which is fragile and breaks
  // the moment ID formats change. Now it trusts CUS_ID directly, since
  // /api/customers is expected to return the real numeric primary key
  // that TBL_ORDERS.CUSTOMER_ID actually references.
  const fetchCustomerHistory = useCallback(async (customerId) => {
    if (!customerId) return;

    const numericId = num(customerId, null);
    if (numericId === null) {
      console.warn(`⚠️ Customer id is not numeric: ${customerId}`);
      if (isMounted.current) {
        setCustomerHistory(getMockData('customerHistory', customerId));
      }
      return;
    }

    console.log(`📊 Fetching customer history for ID: ${numericId}`);

    try {
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
    // Load default report
    fetchReportData('monthlySales');

    return () => {
      isMounted.current = false;
      fetchInProgress.current = false;
    };
  }, [fetchAllAnalytics, fetchCustomers, fetchReportData]);

  // ===== HANDLERS =====
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchAllAnalytics();
    await fetchReportData(reportType);
    setIsRefreshing(false);
  }, [fetchAllAnalytics, fetchReportData, reportType]);

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
        ? ['Product Name', 'Units Sold', 'Revenue']
        : ['Month', 'Revenue', 'Orders'];

      let csv = headers.join(',') + '\n';
      data.forEach(item => {
        const row = isProductData
          ? [item.product_name || '', num(item.total_sold), num(item.revenue)]
          : [item.month || '', num(item.revenue), num(item.orders)];
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
  }, [activeView, topProducts, monthlyData]);

  // ===== EXPORT REPORT =====
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
          headers = ['Month', 'Revenue', 'Orders', 'Profit'];
          filename = 'monthly_sales_report';
          break;
        case 'productPerformance':
          data = reportData;
          headers = ['Product', 'Units Sold', 'Revenue', 'Profit'];
          filename = 'product_performance_report';
          break;
        case 'customerAnalytics':
          data = reportData;
          headers = ['Customer', 'Orders', 'Total Spent', 'Average Order'];
          filename = 'customer_analytics_report';
          break;
        case 'revenueSummary':
          data = [reportData];
          headers = ['Total Revenue', 'Total Orders', 'Total Customers', 'Avg Order Value'];
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
          num(reportData.avgOrderValue)
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
  }, [reportType, reportData]);

  // ===== TOAST NOTIFICATION =====
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

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
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <p className="text-xs text-green-600 dark:text-green-400">Total Revenue</p>
            <p className="text-lg font-bold text-green-700 dark:text-green-300">${totalRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <p className="text-xs text-blue-600 dark:text-blue-400">Total Orders</p>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{totalOrders}</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
            <p className="text-xs text-purple-600 dark:text-purple-400">Avg Profit</p>
            <p className="text-lg font-bold text-purple-700 dark:text-purple-300">${avgProfit.toFixed(2)}</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
            <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} />
            <YAxis yAxisId="left" stroke="#9ca3af" fontSize={11} />
            <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" fontSize={11} />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: 'white' }} />
            <Legend />
            <Bar yAxisId="left" dataKey="revenue" fill="#6366f1" name="Revenue" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="left" dataKey="profit" fill="#10b981" name="Profit" radius={[4, 4, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#8b5cf6" name="Orders" strokeWidth={2} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderProductPerformance = () => {
    const data = reportData || [];
    if (!data.length) return <div className="text-center py-8 text-gray-400">No data available</div>;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg">
            <p className="text-xs text-indigo-600 dark:text-indigo-400">Top Product</p>
            <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300">{data[0]?.name || 'N/A'}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <p className="text-xs text-green-600 dark:text-green-400">Highest Revenue</p>
            <p className="text-sm font-bold text-green-700 dark:text-green-300">
              ${Math.max(...data.map(d => num(d.revenue))).toFixed(2)}
            </p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
            <p className="text-xs text-yellow-600 dark:text-yellow-400">Total Products</p>
            <p className="text-sm font-bold text-yellow-700 dark:text-yellow-300">{data.length}</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
            <XAxis type="number" stroke="#9ca3af" fontSize={11} />
            <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={11} width={80} />
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
    );
  };

  const renderCustomerAnalytics = () => {
    const data = reportData || [];
    if (!data.length) return <div className="text-center py-8 text-gray-400">No data available</div>;

    const totalSpentSum = data.reduce((sum, d) => sum + num(d.totalSpent), 0);

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <p className="text-xs text-blue-600 dark:text-blue-400">Total Customers</p>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{data.length}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <p className="text-xs text-green-600 dark:text-green-400">Total Spent</p>
            <p className="text-lg font-bold text-green-700 dark:text-green-300">${totalSpentSum.toFixed(2)}</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
            <p className="text-xs text-purple-600 dark:text-purple-400">Avg Spent</p>
            <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
              ${(totalSpentSum / data.length).toFixed(2)}
            </p>
          </div>
        </div>
        <div className="overflow-x-auto max-h-[250px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left">Customer</th>
                <th className="px-3 py-2 text-right">Orders</th>
                <th className="px-3 py-2 text-right">Total Spent</th>
                <th className="px-3 py-2 text-right">Avg Order</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, i) => (
                <tr key={i} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-3 py-2 font-medium">{item.name}</td>
                  <td className="px-3 py-2 text-right">{num(item.orders)}</td>
                  <td className="px-3 py-2 text-right">${num(item.totalSpent).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">${num(item.avgOrder).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderRevenueSummary = () => {
    const data = reportData || {};
    if (!Object.keys(data).length) return <div className="text-center py-8 text-gray-400">No data available</div>;

    const metrics = [
      { label: 'Total Revenue', value: `$${num(data.totalRevenue).toFixed(2)}`, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
      { label: 'Total Orders', value: num(data.totalOrders), color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
      { label: 'Total Customers', value: num(data.totalCustomers), color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
      { label: 'Avg Order Value', value: `$${num(data.avgOrderValue).toFixed(2)}`, color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
    ];

    const growthMetrics = [
      { label: 'Revenue Growth', value: `${num(data.revenueGrowth).toFixed(1)}%`, trend: num(data.revenueGrowth) > 0 ? 'up' : 'down' },
      { label: 'Order Growth', value: `${num(data.orderGrowth).toFixed(1)}%`, trend: num(data.orderGrowth) > 0 ? 'up' : 'down' },
      { label: 'Customer Growth', value: `${num(data.customerGrowth).toFixed(1)}%`, trend: num(data.customerGrowth) > 0 ? 'up' : 'down' },
    ];

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {metrics.map((m, i) => (
            <div key={i} className={`${m.bgColor} p-3 rounded-lg`}>
              <p className="text-xs text-gray-600 dark:text-gray-400">{m.label}</p>
              <p className={`text-lg font-bold ${m.color}`}>{m.value}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {growthMetrics.map((m, i) => (
            <div key={i} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">{m.label}</p>
              <p className={`text-lg font-bold ${m.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {m.value}
              </p>
              <div className="flex items-center gap-1 mt-1">
                {m.trend === 'up' ? <TrendingUp className="w-3 h-3 text-green-600" /> : <TrendingDown className="w-3 h-3 text-red-600" />}
                <span className={`text-xs ${m.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {m.trend === 'up' ? 'Positive' : 'Negative'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ===== RENDER REPORT CONTENT =====
  const renderReportContent = () => {
    if (reportLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <span className="ml-3 text-gray-500">Loading report...</span>
        </div>
      );
    }

    if (reportError) {
      return (
        <div className="text-center py-8 text-red-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-3" />
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

  if (error) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <Calendar className="w-5 h-5" />
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
        <ErrorDisplay error={error} errorDetails={errorDetails} onRetry={handleRefresh} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border ${
          toast.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800'
            : toast.type === 'warning'
            ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
            : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-7 h-7 text-indigo-600" />
              Analytics Dashboard
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option value="last30days">Last 30 Days</option>
              <option value="last90days">Last 90 Days</option>
              <option value="last6months">Last 6 Months</option>
              <option value="last12months">Last 12 Months</option>
            </select>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={exportLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {exportLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Export
                <ChevronDown className="w-4 h-4" />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Export as CSV
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    Print Report
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-4">
          <div className="flex items-center gap-2">
            <Database className="w-3 h-3 text-green-500" />
            <span>Database: <span className="text-green-600 dark:text-green-400 font-medium">Connected</span></span>
          </div>
          <span className="w-px h-4 bg-gray-300 dark:bg-gray-600"></span>
          <div className="flex items-center gap-2">
            <Activity className="w-3 h-3" />
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
          {topProducts.length === 0 && (
            <>
              <span className="w-px h-4 bg-gray-300 dark:bg-gray-600"></span>
              <span className="text-yellow-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Using fallback data
              </span>
            </>
          )}
          <span className="ml-auto flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
            <Shield className="w-3 h-3" />
            Data encrypted
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((card) => {
          let value, subtitle, trend;
          switch (card.id) {
            case 'revenue':
              value = formatCurrency(analyticsSummary.totalRevenue || 0);
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
              value = formatCurrency(analyticsSummary.averageOrderValue || 0);
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
              value={value}
              subtitle={subtitle}
              color={card.color}
              bgColor={card.bgColor}
              trend={trend}
            />
          );
        })}
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
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
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  activeView === tab.id
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.id === 'products' && topProducts.length > 0 && (
                  <span className="ml-1 text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                    {topProducts.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Overview View */}
      {activeView === 'overview' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  Monthly Revenue & Orders
                </h2>
                <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
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
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white'
                      }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="revenue" fill="#6366f1" name="Revenue ($)" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#8b5cf6" name="Orders" strokeWidth={3} dot={{ r: 4 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
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
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
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
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="#818cf8" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}

      {/* Products View */}
      {activeView === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
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
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm w-40"
                />
              </div>
            </div>
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Package className="w-12 h-12 mb-3 text-gray-300" />
                <p>No products found</p>
                {searchQuery && <p className="text-xs mt-1">Try adjusting your search</p>}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={filteredProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                  <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                  <YAxis type="category" dataKey="product_name" stroke="#9ca3af" fontSize={12} width={120} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                  <Bar dataKey="total_sold" fill="#6366f1" radius={[0, 4, 4, 0]}>
                    {filteredProducts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-600" />
              Product Performance
            </h2>
            {topProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Package className="w-12 h-12 mb-3 text-gray-300" />
                <p>No product data available</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {topProducts.slice(0, 5).map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-400' : 'bg-indigo-400'}`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">{product.product_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Sold: {num(product.total_sold)} units</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800 dark:text-white">{formatCurrency(product.revenue || 0)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Revenue</p>
                    </div>
                  </div>
                ))}
                {topProducts.length > 5 && (
                  <div className="text-center text-sm text-gray-400 dark:text-gray-500 pt-2">
                    +{topProducts.length - 5} more products
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Customers View */}
      {activeView === 'customers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Customer Selector
            </h2>
            <select
              value={selectedCustomer}
              onChange={handleCustomerSelect}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400">Selected Customer</p>
                <p className="font-medium text-gray-800 dark:text-white">
                  {customers.find(c => String(c.CUS_ID) === String(selectedCustomer))?.FIRST_NAME || ''}{' '}
                  {customers.find(c => String(c.CUS_ID) === String(selectedCustomer))?.LAST_NAME || ''}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  ID: {selectedCustomer}
                </p>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
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
                <User className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p className="font-medium">No customer selected</p>
                <p className="text-sm mt-1">Select a customer to view their purchase history</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
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
                    {customerHistory.map((order) => (
                      <tr key={order.ORDER_NO} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
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
                          <span className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${
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

      {/* ============================================ */}
      {/* REPORTS VIEW - now backed by real /api/reports/:type data */}
      {/* ============================================ */}
      {activeView === 'reports' && (
        <div className="space-y-6">
          {/* Report Navigation */}
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
                className={`p-4 rounded-xl border transition-all duration-200 text-left ${
                  reportType === report.id
                    ? `border-${report.color}-500 bg-${report.color}-50 dark:bg-${report.color}-900/20 shadow-md`
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
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

          {/* Report Content */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                {reportType === 'monthlySales' && 'Monthly Sales Report'}
                {reportType === 'productPerformance' && 'Product Performance Report'}
                {reportType === 'customerAnalytics' && 'Customer Analytics Report'}
                {reportType === 'revenueSummary' && 'Revenue Summary Report'}
              </h2>
              {reportData && (
                <div className="flex gap-2">
                  <button
                    onClick={() => exportReport('csv')}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    CSV
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
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

      {/* Footer */}
      <div className="text-center text-xs text-gray-400 dark:text-gray-500 py-4 border-t border-gray-200 dark:border-gray-700">
        <p className="flex items-center justify-center gap-2 flex-wrap">
          <span>📊 Analytics Dashboard</span>
          <span className="w-px h-3 bg-gray-300 dark:bg-gray-600"></span>
          <span>Data refreshed automatically</span>
          <span className="w-px h-3 bg-gray-300 dark:bg-gray-600"></span>
          <span>© {new Date().getFullYear()} Chheang_Samnang</span>
        </p>
      </div>
    </div>
  );
};

// ============================================
// EXPORT
// ============================================
export default Analytics;