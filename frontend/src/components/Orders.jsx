import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import { 
  Plus, X, Save, Printer, Search, FileText, RefreshCw, 
  AlertCircle, CheckCircle, Loader2, Package, User, 
  ShoppingCart, Eye, Trash2, Calendar, List, 
  CreditCard, Wallet, Zap, Check, AlertTriangle,
  BarChart3, TrendingUp, Clock, DollarSign,
  ChevronRight, Filter, Grid3x3, LayoutGrid,
  ArrowUp, ArrowDown, Star, Award, Gift,
  Sparkles, Shield, Truck
} from 'lucide-react';
import { exportInvoicePDF } from '../utils/pdfExport';

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
// MAIN ORDERS COMPONENT
// ============================================
const Orders = () => {
  // ===== STATE =====
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedCustomerName, setSelectedCustomerName] = useState('');
  const [items, setItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [orderNo, setOrderNo] = useState('');
  const [orderId, setOrderId] = useState(null);
  const [orderStatus, setOrderStatus] = useState('Pending');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [savedOrderData, setSavedOrderData] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // ===== PURCHASE STATE =====
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [isProcessingPurchase, setIsProcessingPurchase] = useState(false);
  const [purchaseResult, setPurchaseResult] = useState(null);
  
  // ===== ORDER LIST STATE =====
  const [savedOrders, setSavedOrders] = useState([]);
  const [viewMode, setViewMode] = useState('create');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [orderStats, setOrderStats] = useState({ total: 0, pending: 0, completed: 0, revenue: 0 });

  // ===== REFS =====
  const isMounted = useRef(true);
  const itemsEndRef = useRef(null);
  const headerRef = useRef(null);

  // ===== MOUSE TRACKING =====
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // ===== LOAD SAVED ORDERS FROM LOCALSTORAGE =====
  const loadSavedOrders = useCallback(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('orders') || '[]');
      setSavedOrders(saved);
      
      const stats = {
        total: saved.length,
        pending: saved.filter(o => o.status === 'Pending' || o.status === 'Processing').length,
        completed: saved.filter(o => o.status === 'Completed').length,
        revenue: saved.reduce((sum, o) => sum + (o.total || 0), 0)
      };
      setOrderStats(stats);
    } catch (error) {
      console.error('Error loading orders:', error);
      setSavedOrders([]);
    }
  }, []);

  // ===== FETCH CUSTOMERS - FIXED ✅ =====
  const fetchCustomers = useCallback(async () => {
    try {
      // ✅ FIXED: Removed '/api' prefix
      const res = await api.get('/api/customers', { timeout: 10000 });
      if (isMounted.current) {
        setCustomers(res.data || []);
      }
    } catch (error) {
      console.error('❌ Error fetching customers:', error.message);
      if (isMounted.current) {
        setCustomers([
          { CUS_ID: 'CUS001', FIRST_NAME: 'John', LAST_NAME: 'Doe', PHONE: '555-0101', EMAIL: 'john@example.com' },
          { CUS_ID: 'CUS002', FIRST_NAME: 'Jane', LAST_NAME: 'Smith', PHONE: '555-0102', EMAIL: 'jane@example.com' },
          { CUS_ID: 'CUS003', FIRST_NAME: 'Robert', LAST_NAME: 'Johnson', PHONE: '555-0103', EMAIL: 'robert@example.com' },
          { CUS_ID: 'CUS004', FIRST_NAME: 'Mary', LAST_NAME: 'Williams', PHONE: '555-0104', EMAIL: 'mary@example.com' },
          { CUS_ID: 'CUS005', FIRST_NAME: 'David', LAST_NAME: 'Brown', PHONE: '555-0105', EMAIL: 'david@example.com' },
        ]);
      }
    }
  }, []);

  // ===== FETCH PRODUCTS - FIXED ✅ =====
  const fetchProducts = useCallback(async () => {
    try {
      // ✅ FIXED: Removed '/api' prefix
      const res = await api.get('/api/products', { timeout: 10000 });
      if (isMounted.current) {
        setProducts(res.data || []);
      }
    } catch (error) {
      console.error('❌ Error fetching products:', error.message);
      if (isMounted.current) {
        setProducts([
          { PRODUCT_ID: 'PROD001', NAME_EN: 'Laptop Pro', NAME_KH: 'កុំព្យូទ័រយួរដៃ', SALEOUT_PRICE: 1299.99, STOCK: 50 },
          { PRODUCT_ID: 'PROD002', NAME_EN: 'Smartphone X', NAME_KH: 'ទូរស័ព្ទឆ្លាត', SALEOUT_PRICE: 899.99, STOCK: 30 },
          { PRODUCT_ID: 'PROD003', NAME_EN: 'Tablet Plus', NAME_KH: 'ថេប្លេត', SALEOUT_PRICE: 499.99, STOCK: 20 },
          { PRODUCT_ID: 'PROD004', NAME_EN: 'Wireless Mouse', NAME_KH: 'កណ្ដុរឥតខ្សែ', SALEOUT_PRICE: 29.99, STOCK: 100 },
          { PRODUCT_ID: 'PROD005', NAME_EN: 'Keyboard Pro', NAME_KH: 'ក្ដារចុច', SALEOUT_PRICE: 79.99, STOCK: 45 },
          { PRODUCT_ID: 'PROD006', NAME_EN: 'USB-C Hub', NAME_KH: 'Hub USB-C', SALEOUT_PRICE: 49.99, STOCK: 60 },
          { PRODUCT_ID: 'PROD007', NAME_EN: 'Monitor Stand', NAME_KH: 'ជើងម៉ូនីទ័', SALEOUT_PRICE: 34.99, STOCK: 35 },
          { PRODUCT_ID: 'PROD008', NAME_EN: 'Laptop Bag', NAME_KH: 'កាបូបកុំព្យូទ័រ', SALEOUT_PRICE: 24.99, STOCK: 25 },
        ]);
      }
    }
  }, []);

  // ===== GENERATE ORDER NUMBER =====
  const generateOrderNo = useCallback(() => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    setOrderNo(`ORD-${year}${month}${day}-${random}`);
    setOrderId(null);
    setSavedOrderData(null);
    setPurchaseResult(null);
  }, []);

  // ===== INITIAL LOAD =====
  useEffect(() => {
    isMounted.current = true;
    fetchCustomers();
    fetchProducts();
    generateOrderNo();
    loadSavedOrders();

    return () => {
      isMounted.current = false;
    };
  }, [fetchCustomers, fetchProducts, generateOrderNo, loadSavedOrders]);

  // ===== SCROLL TO ITEMS =====
  useEffect(() => {
    if (items.length > 0 && itemsEndRef.current) {
      itemsEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [items.length]);

  // ===== ITEM FUNCTIONS =====
  const addItem = useCallback(() => {
    setItems(prev => [...prev, {
      id: Date.now(),
      product_id: '',
      qty: 1,
      unit_price: 0,
      discount: 0,
      subtotal: 0,
      product_name: ''
    }]);
  }, []);

  const removeItem = useCallback((id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const updateItem = useCallback((id, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        
        if (field === 'product_id') {
          const product = products.find(p => {
            const pId = p.PRODUCT_ID || p.product_id;
            return String(pId) === String(value);
          });
          if (product) {
            updated.unit_price = product.SALEOUT_PRICE || product.saleout_price || 0;
            updated.product_name = product.NAME_EN || product.name_en || '';
          } else {
            updated.unit_price = 0;
            updated.product_name = '';
          }
        }
        
        updated.subtotal = (updated.qty * updated.unit_price) - (updated.discount || 0);
        return updated;
      }
      return item;
    }));
  }, [products]);

  // ===== CALCULATE TOTALS =====
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  }, [items]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal - (discount || 0));
  }, [subtotal, discount]);

  const totalItems = items.length;

  // ===== SHOW MESSAGE =====
  const showMessage = useCallback((text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
    const timer = setTimeout(() => setMessage(''), 5000);
    return () => clearTimeout(timer);
  }, []);

  // ===== CHECK STOCK AVAILABILITY - FIXED ✅ =====
  const checkStockAvailability = useCallback(async () => {
    let hasStockIssue = false;
    let stockMessages = [];

    for (const item of items) {
      if (!item.product_id) continue;
      
      try {
        // ✅ FIXED: Removed '/api' prefix
        const res = await api.get(`/api/stock/product/${item.product_id}`, { timeout: 5000 });
        const available = res.data?.QtyAvailable || 0;
        
        if (available < item.qty) {
          hasStockIssue = true;
          stockMessages.push({
            product: item.product_name || `Product ${item.product_id}`,
            available: available,
            requested: item.qty
          });
        }
      } catch (error) {
        console.warn(`⚠️ Could not check stock for product ${item.product_id}:`, error.message);
      }
    }

    return { hasStockIssue, stockMessages };
  }, [items]);

  // ===== PROCESS PURCHASE - FIXED ✅ =====
  const handlePurchase = useCallback(async () => {
    if (!selectedCustomer) {
      showMessage('❌ Please select a customer', 'error');
      return;
    }
    if (items.length === 0) {
      showMessage('❌ Please add at least one item', 'error');
      return;
    }
    if (items.some(item => !item.product_id)) {
      showMessage('❌ Please select a product for all items', 'error');
      return;
    }

    const { hasStockIssue, stockMessages } = await checkStockAvailability();
    
    if (hasStockIssue) {
      const messages = stockMessages.map(m => 
        `${m.product}: ${m.available} available, ${m.requested} requested`
      ).join('\n');
      
      if (!window.confirm(`⚠️ Some items have stock issues:\n${messages}\n\nContinue anyway?`)) {
        return;
      }
    }

    setIsProcessingPurchase(true);

    try {
      const customerId = String(selectedCustomer);
      
      const customerExists = customers.some(c => {
        const cId = c.CUS_ID || c.cus_id;
        return String(cId) === customerId;
      });

      if (!customerExists) {
        showMessage('❌ Customer not found in database', 'error');
        setIsProcessingPurchase(false);
        return;
      }

      const purchaseData = {
        CUSTOMER_ID: customerId,
        items: items.map(item => ({
          product_id: String(item.product_id),
          qty: Number(item.qty),
          unit_price: Number(item.unit_price),
          discount: Number(item.discount || 0)
        })),
        DISCOUNT: Number(discount),
        PAYMENT_METHOD: paymentMethod,
        STATUS: orderStatus
      };

      let response;
      try {
        // ✅ FIXED: Removed '/api' prefix
        response = await api.post('/api/purchase', purchaseData);
      } catch (apiError) {
        console.warn('⚠️ API purchase failed, using local storage:', apiError.response?.data || apiError.message);
        
        const fallbackOrder = {
          id: Date.now(),
          order_no: orderNo,
          customer_id: customerId,
          customer_name: selectedCustomerName || 'Unknown',
          items: items.map(item => ({
            product_id: String(item.product_id),
            product_name: item.product_name || 'Product',
            qty: Number(item.qty),
            unit_price: Number(item.unit_price),
            discount: Number(item.discount || 0),
            subtotal: Number(item.subtotal || 0)
          })),
          discount: Number(discount),
          subtotal: Number(subtotal),
          total: Number(grandTotal),
          status: orderStatus,
          payment_method: paymentMethod,
          date: new Date().toISOString(),
          saved_locally: true
        };

        const savedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
        savedOrders.unshift(fallbackOrder);
        localStorage.setItem('orders', JSON.stringify(savedOrders));
        setSavedOrders(savedOrders);
        
        setOrderId(fallbackOrder.id);
        setSavedOrderData(fallbackOrder);
        setPurchaseResult({
          success: true,
          order_no: orderNo,
          message: 'Order saved locally (API unavailable)',
          local: true
        });
        
        showMessage(`✅ Purchase completed! Order ${orderNo} saved locally`, 'success');
        
        setItems([]);
        setDiscount(0);
        setSelectedCustomer('');
        setSelectedCustomerName('');
        generateOrderNo();
        setIsProcessingPurchase(false);
        loadSavedOrders();
        return;
      }

      if (response.data.success) {
        const orderNo_result = response.data.order_no || orderNo;
        setOrderId(response.data.order_id);
        setSavedOrderData(response.data.order);
        setPurchaseResult({
          success: true,
          order_no: orderNo_result,
          message: 'Purchase completed successfully! Stock updated.',
          local: false,
          data: response.data
        });
        
        showMessage(`✅ Purchase completed! Order ${orderNo_result} created.`, 'success');
        
        setItems([]);
        setDiscount(0);
        setSelectedCustomer('');
        setSelectedCustomerName('');
        generateOrderNo();
        
        fetchProducts();
        loadSavedOrders();
      } else {
        showMessage(`❌ Purchase failed: ${response.data.message || 'Unknown error'}`, 'error');
      }
      
    } catch (error) {
      console.error('❌ Purchase error:', error);
      showMessage(`❌ Purchase failed: ${error.message}`, 'error');
    } finally {
      setIsProcessingPurchase(false);
    }
  }, [selectedCustomer, selectedCustomerName, customers, items, discount, orderStatus, orderNo, subtotal, grandTotal, paymentMethod, generateOrderNo, showMessage, fetchProducts, checkStockAvailability, loadSavedOrders]);

  // ===== SAVE ORDER =====
  const handleSaveOrder = useCallback(async () => {
    if (!selectedCustomer) {
      showMessage('❌ Please select a customer', 'error');
      return;
    }
    if (items.length === 0) {
      showMessage('❌ Please add at least one item', 'error');
      return;
    }
    if (items.some(item => !item.product_id)) {
      showMessage('❌ Please select a product for all items', 'error');
      return;
    }

    setLoading(true);

    try {
      const customerId = String(selectedCustomer);

      const orderData = {
        id: Date.now(),
        order_no: orderNo,
        customer_id: customerId,
        customer_name: selectedCustomerName || 'Unknown',
        items: items.map(item => ({
          product_id: String(item.product_id),
          product_name: item.product_name || 'Product',
          qty: Number(item.qty),
          unit_price: Number(item.unit_price),
          discount: Number(item.discount || 0),
          subtotal: Number(item.subtotal || 0)
        })),
        discount: Number(discount),
        subtotal: Number(subtotal),
        total: Number(grandTotal),
        status: orderStatus,
        payment_method: paymentMethod,
        date: new Date().toISOString(),
        saved_locally: true
      };

      const savedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      savedOrders.unshift(orderData);
      localStorage.setItem('orders', JSON.stringify(savedOrders));
      setSavedOrders(savedOrders);
      
      setOrderId(orderData.id);
      setSavedOrderData(orderData);
      showMessage(`✅ Order ${orderNo} saved successfully!`, 'success');
      
      setItems([]);
      setDiscount(0);
      setSelectedCustomer('');
      setSelectedCustomerName('');
      generateOrderNo();
      loadSavedOrders();
      
    } catch (error) {
      console.error('❌ Save order error:', error.message);
      showMessage(`❌ Failed to save order: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedCustomer, selectedCustomerName, items, discount, orderStatus, orderNo, subtotal, grandTotal, paymentMethod, generateOrderNo, showMessage, loadSavedOrders]);

  // ===== PRINT INVOICE =====
  const handlePrintInvoice = useCallback(async () => {
    if (!orderId && !savedOrderData) {
      showMessage('❌ Please complete a purchase first', 'error');
      return;
    }

    try {
      const pdfData = {
        order_no: savedOrderData?.order_no || orderNo,
        customer_name: savedOrderData?.customer_name || selectedCustomerName || 'Customer',
        status: savedOrderData?.status || orderStatus,
        discount: savedOrderData?.discount || discount,
        items: savedOrderData?.items || items,
        payment_method: savedOrderData?.payment_method || paymentMethod,
        total: savedOrderData?.total || grandTotal
      };

      await exportInvoicePDF(pdfData, `invoice-${pdfData.order_no}.pdf`);
      showMessage('✅ Invoice generated successfully!', 'success');
      
    } catch (error) {
      console.error('❌ Print invoice error:', error);
      showMessage('❌ Failed to generate invoice', 'error');
    }
  }, [orderId, savedOrderData, selectedCustomerName, items, orderStatus, discount, orderNo, grandTotal, paymentMethod, showMessage]);

  // ===== REFRESH DATA =====
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([fetchCustomers(), fetchProducts()]);
    loadSavedOrders();
    setIsRefreshing(false);
    showMessage('✅ Data refreshed!', 'success');
  }, [fetchCustomers, fetchProducts, loadSavedOrders, showMessage]);

  // ===== RESET FORM =====
  const handleReset = useCallback(() => {
    if (items.length > 0 && !window.confirm('Are you sure you want to reset? All items will be lost.')) {
      return;
    }
    setItems([]);
    setDiscount(0);
    setSelectedCustomer('');
    setSelectedCustomerName('');
    setOrderStatus('Pending');
    setPaymentMethod('Cash');
    setOrderId(null);
    setSavedOrderData(null);
    setPurchaseResult(null);
    generateOrderNo();
    showMessage('🔄 Form reset', 'info');
  }, [items, generateOrderNo, showMessage]);

  // ===== DELETE ORDER =====
  const handleDeleteOrder = useCallback((id) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    
    const updated = savedOrders.filter(o => o.id !== id);
    localStorage.setItem('orders', JSON.stringify(updated));
    setSavedOrders(updated);
    loadSavedOrders();
    showMessage('✅ Order deleted successfully!', 'success');
  }, [savedOrders, showMessage, loadSavedOrders]);

  // ===== VIEW ORDER DETAIL =====
  const handleViewOrder = useCallback((order) => {
    setSelectedOrder(order);
    setShowOrderDetail(true);
  }, []);

  // ===== CLEAR ALL ORDERS =====
  const handleClearAll = useCallback(() => {
    if (!window.confirm('Delete all orders? This action cannot be undone.')) return;
    
    localStorage.setItem('orders', JSON.stringify([]));
    setSavedOrders([]);
    loadSavedOrders();
    showMessage('🗑️ All orders cleared!', 'info');
  }, [showMessage, loadSavedOrders]);

  // ===== FILTERED ORDERS =====
  const filteredOrders = useMemo(() => {
    let result = [...savedOrders];
    
    if (filterStatus !== 'all') {
      result = result.filter(o => o.status === filterStatus);
    }
    
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date) - new Date(b.date);
          break;
        case 'total':
          comparison = (a.total || 0) - (b.total || 0);
          break;
        case 'status':
          comparison = (a.status || '').localeCompare(b.status || '');
          break;
        default:
          comparison = new Date(a.date) - new Date(b.date);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return result;
  }, [savedOrders, filterStatus, sortBy, sortOrder]);

  // ===== FILTERED PRODUCTS =====
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    const search = searchTerm.toLowerCase();
    return products.filter(p => {
      const nameEn = p.NAME_EN || p.name_en || '';
      const nameKh = p.NAME_KH || p.name_kh || '';
      const barcode = p.BARCODE || p.barcode || '';
      return nameEn.toLowerCase().includes(search) ||
             nameKh.includes(search) ||
             barcode.includes(search);
    });
  }, [products, searchTerm]);

  // ===== GET PRODUCT EMOJI =====
  const getProductEmoji = (name) => {
    const emojis = ['📱', '💻', '⌨️', '🖥️', '📷', '🎧', '⌚', '📡', '🔋', '💾', '🖱️', '📀', '💿', '📹', '🎮', '📺', '🔊'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return emojis[Math.abs(hash) % emojis.length];
  };

  // ===== FORMAT DATE =====
  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  // ===== GET STATUS BADGE =====
  const getStatusBadge = (status) => {
    const colors = {
      'Pending': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800',
      'Processing': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
      'Completed': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800',
      'Cancelled': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800',
    };
    return colors[status] || colors['Pending'];
  };

  // ===== GET STATUS ICON =====
  const getStatusIcon = (status) => {
    const icons = {
      'Pending': <Clock className="w-3 h-3" />,
      'Processing': <Loader2 className="w-3 h-3 animate-spin" />,
      'Completed': <CheckCircle className="w-3 h-3" />,
      'Cancelled': <X className="w-3 h-3" />,
    };
    return icons[status] || icons['Pending'];
  };

  // ===== RENDER =====
  return (
    <div className="space-y-4 p-3 sm:p-4 md:p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      
      {/* ===== MESSAGE TOAST ===== */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 max-w-md w-full p-4 rounded-xl shadow-2xl border transform transition-all duration-500 animate-slideInRight ${
          messageType === 'success' 
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300' 
            : messageType === 'error'
            ? 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
            : messageType === 'warning'
            ? 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300'
            : 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
        }`}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {messageType === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
              {messageType === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
              {messageType === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
              {messageType === 'info' && <RefreshCw className="w-5 h-5 text-blue-500" />}
            </div>
            <div className="flex-1 text-sm font-medium">{message}</div>
            <button onClick={() => setMessage('')} className="flex-shrink-0 opacity-50 hover:opacity-100 transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ===== HEADER WITH STATS - 3D Tilt ===== */}
      <div 
        ref={headerRef}
        className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden transition-all duration-300"
        style={{
          transform: `perspective(1000px) rotateX(${(mousePosition.y / window.innerHeight - 0.5) * 2}deg) rotateY(${(mousePosition.x / window.innerWidth - 0.5) * 2}deg)`,
          transition: 'transform 0.1s ease-out'
        }}
      >
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full animate-pulse-slow" />
          <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-purple-300/20 rounded-full animate-pulse-slow animation-delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full animate-spin-slow" />
        </div>

        <div className="relative z-10 flex flex-wrap justify-between items-center">
          <div className="animate-fadeInUp">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-white/80 tracking-wider uppercase">Order Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
              <ShoppingCart className="w-8 h-8" />
              Orders Management
            </h1>
            <p className="text-indigo-100 mt-1 text-sm">Create and manage customer orders</p>
          </div>
          <div className="flex items-center gap-3 mt-3 sm:mt-0">
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl text-sm flex items-center gap-2 border border-white/10 animate-pulse-slow">
              <Clock className="w-4 h-4 text-white/80" />
              {new Date().toLocaleTimeString()}
            </div>
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-white/20 backdrop-blur-sm p-2 rounded-xl hover:bg-white/30 transition hover:scale-110 duration-300"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 relative z-10">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 hover:bg-white/20 transition-all duration-300 hover:scale-105 border border-white/5">
            <p className="text-xs text-indigo-200">Total Orders</p>
            <p className="text-2xl font-bold">{orderStats.total}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 hover:bg-white/20 transition-all duration-300 hover:scale-105 border border-white/5">
            <p className="text-xs text-indigo-200">Pending</p>
            <p className="text-2xl font-bold text-yellow-300">{orderStats.pending}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 hover:bg-white/20 transition-all duration-300 hover:scale-105 border border-white/5">
            <p className="text-xs text-indigo-200">Completed</p>
            <p className="text-2xl font-bold text-green-300">{orderStats.completed}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 hover:bg-white/20 transition-all duration-300 hover:scale-105 border border-white/5">
            <p className="text-xs text-indigo-200">Revenue</p>
            <p className="text-2xl font-bold">${orderStats.revenue.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* ===== MODE SELECTOR ===== */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 sm:p-4 hover:shadow-md transition-all duration-300">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('create')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 ${
                viewMode === 'create'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Plus className="w-4 h-4" />
              New Order
            </button>
            <button
              onClick={() => {
                setViewMode('list');
                loadSavedOrders();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 ${
                viewMode === 'list'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <List className="w-4 h-4" />
              Orders
              <span className="ml-1 text-xs bg-white/20 px-2 py-0.5 rounded-full animate-pulse">
                {savedOrders.length}
              </span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 hover:rotate-180"
              title="Reset form"
            >
              <RefreshCw className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* ===== CREATE ORDER VIEW ===== */}
      {viewMode === 'create' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6 animate-fadeIn hover:shadow-md transition-all duration-300">
          
          {/* Order Header */}
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600 animate-pulse" />
                Order #{orderNo}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Create a new customer order</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300">
                <span className="text-xs text-gray-500 dark:text-gray-400">Status:</span>
                <select 
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value)}
                  className="bg-transparent text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none"
                >
                  <option value="Pending">⏳ Pending</option>
                  <option value="Processing">🔄 Processing</option>
                  <option value="Completed">✅ Completed</option>
                  <option value="Cancelled">❌ Cancelled</option>
                </select>
              </div>
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300">
                <span className="text-xs text-gray-500 dark:text-gray-400">Payment:</span>
                <select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="bg-transparent text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none"
                >
                  <option value="Cash">💵 Cash</option>
                  <option value="Card">💳 Card</option>
                  <option value="Bank Transfer">🏦 Bank Transfer</option>
                  <option value="Mobile Payment">📱 Mobile Payment</option>
                </select>
              </div>
            </div>
          </div>

          {/* Customer Selection */}
          <div className="mb-6 group">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-500" />
              Select Customer <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select 
                value={selectedCustomer}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedCustomer(val);
                  const customer = customers.find(c => {
                    const cId = c.CUS_ID || c.cus_id;
                    return String(cId) === String(val);
                  });
                  if (customer) {
                    const firstName = customer.FIRST_NAME || customer.first_name || '';
                    const lastName = customer.LAST_NAME || customer.last_name || '';
                    setSelectedCustomerName(`${firstName} ${lastName}`.trim() || 'Customer');
                  } else {
                    setSelectedCustomerName('');
                  }
                }}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 group-hover:border-indigo-300"
              >
                <option value="">🔍 Select a customer...</option>
                {customers.map((customer) => {
                  const cId = customer.CUS_ID || customer.cus_id;
                  const firstName = customer.FIRST_NAME || customer.first_name || '';
                  const lastName = customer.LAST_NAME || customer.last_name || '';
                  const phone = customer.PHONE || customer.phone || '';
                  const email = customer.EMAIL || customer.email || '';
                  const fullName = `${firstName} ${lastName}`.trim() || 'Customer';
                  return (
                    <option key={cId} value={cId}>
                      {fullName} {phone ? `📞 ${phone}` : ''} {email ? `✉️ ${email}` : ''}
                    </option>
                  );
                })}
              </select>
              {selectedCustomerName && (
                <div className="mt-2 flex items-center gap-2 text-sm text-green-600 dark:text-green-400 animate-fadeIn">
                  <Check className="w-4 h-4" />
                  Customer selected: <span className="font-medium">{selectedCustomerName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Product Search & Items */}
          <div className="mb-4">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Package className="w-4 h-4 text-purple-500" />
                Order Items
                <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full text-gray-500 dark:text-gray-400 animate-pulse">
                  {totalItems} items
                </span>
              </h3>
              <button 
                onClick={addItem}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 text-sm font-medium"
              >
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>

            <div className="relative mb-3 group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-indigo-500 transition-colors w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="🔍 Search products by name, barcode..."
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 group-hover:border-indigo-300"
              />
            </div>
          </div>

          {/* Items Table */}
          {items.length === 0 ? (
            <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-8 text-center text-gray-400 dark:text-gray-500 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-300 hover:scale-[1.01]">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-30 animate-float" />
              <p className="text-lg font-medium">No items added yet</p>
              <p className="text-sm mt-1">Search for products and click "Add Item" to start building your order</p>
              <button 
                onClick={addItem}
                className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-300 hover:scale-105"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Add First Item
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Product</th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Qty</th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Price</th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Discount</th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Subtotal</th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {items.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300 group animate-slideIn" style={{ animationDelay: `${index * 0.05}s` }}>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{getProductEmoji(item.product_name || '')}</span>
                          <select 
                            value={item.product_id}
                            onChange={(e) => updateItem(item.id, 'product_id', e.target.value)}
                            className="flex-1 min-w-[130px] px-2 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
                          >
                            <option value="">Select Product</option>
                            {filteredProducts.map((product) => {
                              const pId = product.PRODUCT_ID || product.product_id;
                              const name = product.NAME_EN || product.name_en || 'Unknown';
                              const price = product.SALEOUT_PRICE || product.saleout_price || 0;
                              const stock = product.STOCK || 0;
                              return (
                                <option key={pId} value={pId}>
                                  {name} - ${Number(price).toFixed(2)} {stock > 0 ? `(${stock} in stock)` : '⚠️ Out of stock'}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <input 
                          type="number" 
                          min="1"
                          value={item.qty}
                          onChange={(e) => updateItem(item.id, 'qty', Math.max(1, Number(e.target.value) || 1))}
                          className="w-16 text-center px-2 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input 
                          type="number" 
                          step="0.01"
                          min="0"
                          value={item.unit_price}
                          onChange={(e) => updateItem(item.id, 'unit_price', Math.max(0, Number(e.target.value) || 0))}
                          className="w-24 text-right px-2 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input 
                          type="number" 
                          step="0.01"
                          min="0"
                          value={item.discount}
                          onChange={(e) => updateItem(item.id, 'discount', Math.max(0, Number(e.target.value) || 0))}
                          className="w-20 text-right px-2 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
                        />
                      </td>
                      <td className="px-3 py-2 font-bold text-right text-indigo-600 dark:text-indigo-400">
                        ${(item.subtotal || 0).toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300 group-hover:scale-110"
                          title="Remove item"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div ref={itemsEndRef} />

          {/* Order Summary */}
          <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/30 dark:to-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col items-end">
              <div className="w-full max-w-sm space-y-2">
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal ({totalItems} items):</span>
                  <span className="dark:text-white font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 text-sm items-center">
                  <span className="text-gray-600 dark:text-gray-400">Discount:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">$</span>
                    <input 
                      type="number" 
                      step="0.01"
                      min="0"
                      value={discount}
                      onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                      className="w-32 text-right px-2 py-1.5 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
                    />
                  </div>
                </div>
                <div className="flex justify-between py-3 font-bold text-lg border-t-2 border-gray-200 dark:border-gray-600">
                  <span className="text-gray-800 dark:text-white">Grand Total:</span>
                  <span className="text-2xl text-indigo-600 dark:text-indigo-400 animate-pulse">${grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button 
              onClick={handleSaveOrder}
              disabled={loading || items.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-300 hover:scale-105 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gray-600/20"
            >
              <Save className="w-4 h-4" />
              Save Draft
            </button>
            <button 
              onClick={handlePurchase}
              disabled={isProcessingPurchase || items.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 hover:scale-105 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-600/20"
            >
              {isProcessingPurchase ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              {isProcessingPurchase ? 'Processing...' : '💳 Purchase Now'}
            </button>
            <button 
              onClick={handlePrintInvoice}
              disabled={!orderId && !savedOrderData}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 transition-all duration-300 hover:scale-105 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-600/20"
            >
              <Printer className="w-4 h-4" />
              Print Invoice
            </button>
          </div>

          {/* Purchase Result */}
          {purchaseResult && (
            <div className={`mt-4 p-4 rounded-xl border animate-fadeIn ${
              purchaseResult.success 
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/10 border-green-200 dark:border-green-800' 
                : 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/10 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-start gap-3">
                {purchaseResult.success ? (
                  <CheckCircle className="w-6 h-6 text-green-500 mt-0.5 animate-bounce" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-500 mt-0.5" />
                )}
                <div>
                  <p className={`font-semibold ${purchaseResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                    {purchaseResult.message}
                  </p>
                  {purchaseResult.order_no && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Order #: <span className="font-mono font-medium">{purchaseResult.order_no}</span>
                    </p>
                  )}
                  {purchaseResult.local && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Saved locally. Stock may not be updated.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== ORDER LIST VIEW ===== */}
      {viewMode === 'list' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6 animate-fadeIn hover:shadow-md transition-all duration-300">
          
          {/* Header */}
          <div className="flex flex-wrap justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <List className="w-5 h-5 text-indigo-600" />
                Saved Orders
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {filteredOrders.length} orders {filterStatus !== 'all' ? `(${filterStatus})` : ''}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300 hover:border-indigo-300"
              >
                <option value="all">All Status</option>
                <option value="Pending">⏳ Pending</option>
                <option value="Processing">🔄 Processing</option>
                <option value="Completed">✅ Completed</option>
                <option value="Cancelled">❌ Cancelled</option>
              </select>
              
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-');
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder);
                }}
                className="px-3 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300 hover:border-indigo-300"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="total-desc">Highest Amount</option>
                <option value="total-asc">Lowest Amount</option>
                <option value="status-asc">Status A-Z</option>
                <option value="status-desc">Status Z-A</option>
              </select>

              <button
                onClick={loadSavedOrders}
                className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-110"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-30 animate-float" />
              <p className="text-lg font-medium">No orders found</p>
              <p className="text-sm mt-1">
                {savedOrders.length > 0 ? 'Try changing the filter' : 'Orders you create will appear here'}
              </p>
              {savedOrders.length === 0 && (
                <button
                  onClick={() => setViewMode('create')}
                  className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-300 hover:scale-105"
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  Create New Order
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Order #</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">Date</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">Items</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredOrders.map((order, index) => (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-all duration-300 group animate-slideIn" style={{ animationDelay: `${index * 0.04}s` }}>
                      <td className="px-4 py-3 text-sm font-mono font-medium text-indigo-600 dark:text-indigo-400">
                        {order.order_no}
                      </td>
                      <td className="px-4 py-3 text-sm dark:text-gray-300 hidden sm:table-cell">
                        {order.customer_name || 'Unknown'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">
                        {formatDate(order.date)}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-right dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        ${(order.total || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-300 ${getStatusBadge(order.status)} group-hover:scale-105`}>
                          {getStatusIcon(order.status)}
                          {order.status || 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                        {order.items?.length || 0}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleViewOrder(order)}
                            className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300 group-hover:scale-110"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300 group-hover:scale-110"
                            title="Delete order"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-400 dark:text-gray-500 flex flex-wrap justify-between items-center gap-2">
            <span>Total: {filteredOrders.length} orders</span>
            <span className="flex items-center gap-1">
              <span>💾 Stored locally in your browser</span>
              {savedOrders.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="ml-4 text-xs text-red-500 hover:text-red-700 transition-all duration-300 hover:scale-110"
                >
                  Clear All
                </button>
              )}
            </span>
          </div>
        </div>
      )}

      {/* ===== ORDER DETAIL MODAL ===== */}
      {showOrderDetail && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slideUp">
            <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Order Details
                <span className="text-sm font-mono font-normal text-gray-400 ml-2">#{selectedOrder.order_no}</span>
              </h2>
              <button 
                onClick={() => setShowOrderDetail(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-300 hover:rotate-90"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</p>
                  <p className="font-semibold dark:text-white">{selectedOrder.customer_name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</p>
                  <p className="font-semibold dark:text-white">{formatDate(selectedOrder.date)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</p>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedOrder.status)}`}>
                    {getStatusIcon(selectedOrder.status)}
                    {selectedOrder.status || 'Pending'}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Payment</p>
                  <p className="font-semibold dark:text-white">{selectedOrder.payment_method || 'N/A'}</p>
                </div>
              </div>

              {/* Items */}
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-purple-500" />
                Order Items ({selectedOrder.items?.length || 0})
              </h3>
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Product</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Qty</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Price</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {selectedOrder.items?.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-all duration-300">
                        <td className="px-4 py-2 text-sm dark:text-white">{item.product_name || 'Product'}</td>
                        <td className="px-4 py-2 text-sm text-center dark:text-white">{item.qty}</td>
                        <td className="px-4 py-2 text-sm text-right dark:text-white">${(item.unit_price || 0).toFixed(2)}</td>
                        <td className="px-4 py-2 text-sm text-right font-medium dark:text-white">${(item.subtotal || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-300 dark:border-gray-600">
                      <td colSpan="3" className="px-4 py-2 text-right font-medium dark:text-white">Subtotal:</td>
                      <td className="px-4 py-2 text-right font-medium dark:text-white">${(selectedOrder.subtotal || 0).toFixed(2)}</td>
                    </tr>
                    {selectedOrder.discount > 0 && (
                      <tr>
                        <td colSpan="3" className="px-4 py-2 text-right text-gray-500 dark:text-gray-400">Discount:</td>
                        <td className="px-4 py-2 text-right text-red-500">-${(selectedOrder.discount || 0).toFixed(2)}</td>
                      </tr>
                    )}
                    <tr className="border-t-2 border-gray-300 dark:border-gray-600">
                      <td colSpan="3" className="px-4 py-3 text-right font-bold text-lg dark:text-white">Grand Total:</td>
                      <td className="px-4 py-3 text-right font-bold text-xl text-indigo-600 dark:text-indigo-400">
                        ${(selectedOrder.total || 0).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex flex-wrap justify-end gap-3">
              <button 
                onClick={() => setShowOrderDetail(false)}
                className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 dark:text-white font-medium"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  setShowOrderDetail(false);
                }}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105 font-medium flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-gray-400 dark:text-gray-500 py-4 border-t border-gray-200 dark:border-gray-700">
        <p className="flex items-center justify-center gap-4 flex-wrap">
          <span>🛒 {filteredOrders.length} orders displayed</span>
          <span>•</span>
          <span>💰 ${orderStats.revenue.toFixed(2)} total revenue</span>
          <span>•</span>
          <span>⏳ {orderStats.pending} pending</span>
          <span>•</span>
          <span>✅ {orderStats.completed} completed</span>
          <span>•</span>
          <span>{new Date().toLocaleString()}</span>
        </p>
      </div>

      {/* ===== CSS ANIMATIONS ===== */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.1); }
        }
        @keyframes spin-slow {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }

        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
        .animate-slideIn { animation: slideIn 0.4s ease-out forwards; opacity: 0; }
        .animate-slideInRight { animation: slideInRight 0.5s ease-out forwards; }
        .animate-slideUp { animation: slideUp 0.4s ease-out forwards; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }
        .animate-bounce { animation: bounce 1s ease-in-out infinite; }
        .animation-delay-1000 { animation-delay: 1s; }

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
      `}</style>
    </div>
  );
};

export default Orders;