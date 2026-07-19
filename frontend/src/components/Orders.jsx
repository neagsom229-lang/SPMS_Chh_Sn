import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import { 
  Plus, X, Save, Printer, Search, FileText, RefreshCw, 
  AlertCircle, CheckCircle, Loader2, Package, User, 
  ShoppingCart, Eye, Trash2, Calendar, List, 
  CreditCard, Wallet, Zap, Check, AlertTriangle
} from 'lucide-react';
import { exportInvoicePDF } from '../utils/pdfExport';

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
  
  // ===== PURCHASE STATE =====
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [isProcessingPurchase, setIsProcessingPurchase] = useState(false);
  const [purchaseResult, setPurchaseResult] = useState(null);
  
  // ===== ORDER LIST STATE =====
  const [savedOrders, setSavedOrders] = useState([]);
  const [viewMode, setViewMode] = useState('create');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);

  // ===== REFS =====
  const isMounted = useRef(true);

  // ===== LOAD SAVED ORDERS FROM LOCALSTORAGE =====
  const loadSavedOrders = useCallback(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('orders') || '[]');
      setSavedOrders(saved);
    } catch (error) {
      console.error('Error loading orders:', error);
      setSavedOrders([]);
    }
  }, []);

  // ===== FETCH CUSTOMERS =====
  const fetchCustomers = useCallback(async () => {
    try {
      const res = await api.get('/api/customers', { timeout: 10000 });
      if (isMounted.current) {
        setCustomers(res.data || []);
        console.log('👥 Customers loaded:', res.data?.length || 0);
      }
    } catch (error) {
      console.error('❌ Error fetching customers:', error.message);
      if (isMounted.current) {
        setCustomers([
          { CUS_ID: '1', FIRST_NAME: 'John', LAST_NAME: 'Doe', PHONE: '555-0101' },
          { CUS_ID: '2', FIRST_NAME: 'Jane', LAST_NAME: 'Smith', PHONE: '555-0102' },
          { CUS_ID: '3', FIRST_NAME: 'Robert', LAST_NAME: 'Johnson', PHONE: '555-0103' },
          { CUS_ID: '4', FIRST_NAME: 'Mary', LAST_NAME: 'Williams', PHONE: '555-0104' },
          { CUS_ID: '5', FIRST_NAME: 'David', LAST_NAME: 'Brown', PHONE: '555-0105' },
        ]);
      }
    }
  }, []);

  // ===== FETCH PRODUCTS =====
  const fetchProducts = useCallback(async () => {
    try {
      const res = await api.get('/api/products', { timeout: 10000 });
      if (isMounted.current) {
        setProducts(res.data || []);
        console.log('📦 Products loaded:', res.data?.length || 0);
      }
    } catch (error) {
      console.error('❌ Error fetching products:', error.message);
      if (isMounted.current) {
        setProducts([
          { PRODUCT_ID: '1', NAME_EN: 'Laptop Pro', SALEOUT_PRICE: 1299.99 },
          { PRODUCT_ID: '2', NAME_EN: 'Smartphone X', SALEOUT_PRICE: 899.99 },
          { PRODUCT_ID: '3', NAME_EN: 'Tablet Plus', SALEOUT_PRICE: 499.99 },
          { PRODUCT_ID: '4', NAME_EN: 'Wireless Mouse', SALEOUT_PRICE: 29.99 },
          { PRODUCT_ID: '5', NAME_EN: 'Keyboard Pro', SALEOUT_PRICE: 79.99 },
          { PRODUCT_ID: '6', NAME_EN: 'USB-C Hub', SALEOUT_PRICE: 49.99 },
          { PRODUCT_ID: '7', NAME_EN: 'Monitor Stand', SALEOUT_PRICE: 34.99 },
          { PRODUCT_ID: '8', NAME_EN: 'Laptop Bag', SALEOUT_PRICE: 24.99 },
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

  // ===== CHECK STOCK AVAILABILITY =====
  const checkStockAvailability = useCallback(async () => {
    let hasStockIssue = false;
    let stockMessages = [];

    for (const item of items) {
      if (!item.product_id) continue;
      
      try {
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

  // ===== PROCESS PURCHASE - FIXED =====
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
      // Use customer ID as string (Access uses text for CUS_ID)
      const customerId = String(selectedCustomer);
      
      // Validate customer exists
      const customerExists = customers.some(c => {
        const cId = c.CUS_ID || c.cus_id;
        return String(cId) === customerId;
      });

      if (!customerExists) {
        showMessage('❌ Customer not found in database', 'error');
        setIsProcessingPurchase(false);
        return;
      }

      // Prepare purchase data - all IDs as strings
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

      console.log('📤 Processing purchase:', purchaseData);

      let response;
      try {
        response = await api.post('/api/purchase', purchaseData);
      } catch (apiError) {
        console.warn('⚠️ API purchase failed, using local storage:', apiError.response?.data || apiError.message);
        
        // Save to localStorage as fallback
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
        
        showMessage(`✅ Purchase completed! Order ${orderNo_result} created. Stock updated.`, 'success');
        
        setItems([]);
        setDiscount(0);
        setSelectedCustomer('');
        setSelectedCustomerName('');
        generateOrderNo();
        
        fetchProducts();
      } else {
        showMessage(`❌ Purchase failed: ${response.data.message || 'Unknown error'}`, 'error');
      }
      
    } catch (error) {
      console.error('❌ Purchase error:', error);
      showMessage(`❌ Purchase failed: ${error.message}`, 'error');
      
      // Fallback: Save to localStorage
      const fallbackOrder = {
        id: Date.now(),
        order_no: orderNo,
        customer_id: String(selectedCustomer),
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
        message: 'Order saved locally (emergency fallback)',
        local: true
      });
      
      showMessage(`⚠️ Order saved locally. Stock not updated automatically.`, 'warning');
      
      setItems([]);
      setDiscount(0);
      setSelectedCustomer('');
      setSelectedCustomerName('');
      generateOrderNo();
      
    } finally {
      setIsProcessingPurchase(false);
    }
  }, [selectedCustomer, selectedCustomerName, customers, items, discount, orderStatus, orderNo, subtotal, grandTotal, paymentMethod, generateOrderNo, showMessage, fetchProducts, checkStockAvailability]);

  // ===== SAVE ORDER (Legacy - for local storage only) =====
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

      console.log('📤 Saving order to localStorage:', orderData);
      
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
      
    } catch (error) {
      console.error('❌ Save order error:', error.message);
      showMessage(`❌ Failed to save order: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedCustomer, selectedCustomerName, items, discount, orderStatus, orderNo, subtotal, grandTotal, paymentMethod, generateOrderNo, showMessage]);

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
    showMessage('✅ Order deleted successfully!', 'success');
  }, [savedOrders, showMessage]);

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
    showMessage('🗑️ All orders cleared!', 'info');
  }, [showMessage]);

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
      'Pending': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
      'Processing': 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
      'Completed': 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
      'Cancelled': 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    };
    return colors[status] || colors['Pending'];
  };

  // ===== RENDER =====
  return (
    <div className="space-y-4 p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Message Toast */}
      {message && (
        <div className={`p-4 rounded-lg shadow-sm border ${
          messageType === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800' 
            : messageType === 'error'
            ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
            : messageType === 'warning'
            ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
            : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              {messageType === 'success' && <CheckCircle className="w-5 h-5" />}
              {messageType === 'error' && <AlertCircle className="w-5 h-5" />}
              {messageType === 'warning' && <AlertTriangle className="w-5 h-5" />}
              {messageType === 'info' && <RefreshCw className="w-5 h-5" />}
              {message}
            </span>
            <button onClick={() => setMessage('')} className="opacity-50 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ===== MODE SELECTOR ===== */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Orders Management</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('create')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                viewMode === 'create'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
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
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                viewMode === 'list'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <List className="w-4 h-4" />
              Orders List
              <span className="ml-1 text-xs bg-gray-300 dark:bg-gray-600 px-2 py-0.5 rounded-full">
                {savedOrders.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ===== CREATE ORDER VIEW ===== */}
      {viewMode === 'create' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          {/* Header */}
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <ShoppingCart className="w-7 h-7 text-indigo-600" />
                New Order
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create a new customer order</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg text-gray-600 dark:text-gray-300">
                #{orderNo}
              </span>
              <button 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 text-gray-500 hover:text-indigo-600 transition rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <button 
                onClick={handleReset}
                className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Order Status & Payment Method */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
              <select 
                value={orderStatus}
                onChange={(e) => setOrderStatus(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Pending">⏳ Pending</option>
                <option value="Processing">🔄 Processing</option>
                <option value="Completed">✅ Completed</option>
                <option value="Cancelled">❌ Cancelled</option>
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Payment:</span>
              <select 
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Cash">💵 Cash</option>
                <option value="Card">💳 Card</option>
                <option value="Bank Transfer">🏦 Bank Transfer</option>
                <option value="Mobile Payment">📱 Mobile Payment</option>
              </select>
            </div>
          </div>

          {/* Customer Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <User className="w-4 h-4" />
              Customer *
            </label>
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
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select Customer</option>
              {customers.map((customer) => {
                const cId = customer.CUS_ID || customer.cus_id;
                const firstName = customer.FIRST_NAME || customer.first_name || '';
                const lastName = customer.LAST_NAME || customer.last_name || '';
                const phone = customer.PHONE || customer.phone || '';
                const fullName = `${firstName} ${lastName}`.trim() || 'Customer';
                return (
                  <option key={cId} value={cId}>
                    {fullName} {phone ? `- ${phone}` : ''}
                  </option>
                );
              })}
            </select>
            {selectedCustomerName && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Selected: <span className="font-medium text-gray-700 dark:text-gray-300">{selectedCustomerName}</span>
              </p>
            )}
          </div>

          {/* Product Search & Items */}
          <div className="mb-4">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
              <h3 className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Order Items <span className="text-xs text-gray-400">({totalItems} items)</span>
              </h3>
              <button 
                onClick={addItem}
                className="flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Item
              </button>
            </div>

            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Items Table */}
          {items.length === 0 ? (
            <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center text-gray-400 dark:text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No items added yet</p>
              <p className="text-sm">Search and add products or click "Add Item"</p>
            </div>
          ) : (
            <div className="overflow-x-auto mb-4">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Product</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Qty</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Price</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Discount</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Subtotal</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                      <td className="px-4 py-2">
                        <select 
                          value={item.product_id}
                          onChange={(e) => updateItem(item.id, 'product_id', e.target.value)}
                          className="w-full min-w-[150px] px-2 py-1.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="">Select Product</option>
                          {filteredProducts.map((product) => {
                            const pId = product.PRODUCT_ID || product.product_id;
                            const name = product.NAME_EN || product.name_en || 'Unknown';
                            const price = product.SALEOUT_PRICE || product.saleout_price || 0;
                            return (
                              <option key={pId} value={pId}>
                                {name} - ${Number(price).toFixed(2)}
                              </option>
                            );
                          })}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input 
                          type="number" 
                          min="1"
                          value={item.qty}
                          onChange={(e) => updateItem(item.id, 'qty', Math.max(1, Number(e.target.value) || 1))}
                          className="w-16 text-center px-2 py-1.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input 
                          type="number" 
                          step="0.01"
                          min="0"
                          value={item.unit_price}
                          onChange={(e) => updateItem(item.id, 'unit_price', Math.max(0, Number(e.target.value) || 0))}
                          className="w-24 text-right px-2 py-1.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input 
                          type="number" 
                          step="0.01"
                          min="0"
                          value={item.discount}
                          onChange={(e) => updateItem(item.id, 'discount', Math.max(0, Number(e.target.value) || 0))}
                          className="w-20 text-right px-2 py-1.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-4 py-2 font-medium text-right text-sm dark:text-white">
                        ${(item.subtotal || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition"
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

          {/* Order Summary */}
          <div className="border-t dark:border-gray-700 pt-4 mt-4">
            <div className="flex flex-col items-end">
              <div className="w-full max-w-sm space-y-2">
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal ({totalItems} items):</span>
                  <span className="dark:text-white font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 text-sm items-center">
                  <span className="text-gray-600 dark:text-gray-400">Discount:</span>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                    className="w-32 text-right px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex justify-between py-2 font-bold text-lg border-t dark:border-gray-700 pt-2">
                  <span className="text-gray-800 dark:text-white">Grand Total:</span>
                  <span className="text-indigo-600 dark:text-indigo-400">${grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-end gap-3 mt-6 pt-4 border-t dark:border-gray-700">
            <button 
              onClick={handleSaveOrder}
              disabled={loading || items.length === 0}
              className="flex items-center px-6 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </button>
            <button 
              onClick={handlePurchase}
              disabled={isProcessingPurchase || items.length === 0}
              className="flex items-center px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessingPurchase ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              {isProcessingPurchase ? 'Processing...' : '💳 Purchase Now'}
            </button>
            <button 
              onClick={handlePrintInvoice}
              disabled={!orderId && !savedOrderData}
              className="flex items-center px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText className="w-4 h-4 mr-2" /> Print Invoice
            </button>
            <button 
              onClick={() => window.print()}
              disabled={items.length === 0}
              className="flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
            >
              <Printer className="w-4 h-4 mr-2" /> Print Page
            </button>
          </div>

          {/* Purchase Result */}
          {purchaseResult && (
            <div className={`mt-4 p-4 rounded-lg border ${
              purchaseResult.success 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-start gap-3">
                {purchaseResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                )}
                <div>
                  <p className={`font-medium ${purchaseResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                    {purchaseResult.message}
                  </p>
                  {purchaseResult.order_no && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Order #: {purchaseResult.order_no}
                    </p>
                  )}
                  {purchaseResult.local && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                      ⚠️ Saved locally. Stock may not be updated.
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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex flex-wrap justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <List className="w-7 h-7 text-indigo-600" />
                Saved Orders
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {savedOrders.length} orders saved locally
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={loadSavedOrders}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              {savedOrders.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </button>
              )}
            </div>
          </div>

          {savedOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No orders saved</p>
              <p className="text-sm mt-1">Orders you create will appear here</p>
              <button
                onClick={() => setViewMode('create')}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Create New Order
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Order #</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Total</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Items</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {savedOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                      <td className="px-4 py-3 text-sm font-medium text-indigo-600 dark:text-indigo-400">
                        {order.order_no}
                      </td>
                      <td className="px-4 py-3 text-sm dark:text-gray-300">
                        {order.customer_name || 'Unknown'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(order.date)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-right dark:text-white">
                        ${(order.total || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(order.status)}`}>
                          {order.status || 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                        {order.items?.length || 0}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewOrder(order)}
                            className="text-blue-500 hover:text-blue-700 transition p-1"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            className="text-red-500 hover:text-red-700 transition p-1"
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

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-400 dark:text-gray-500 flex justify-between">
            <span>Total: {savedOrders.length} orders</span>
            <span className="flex items-center gap-1">
              <span>💾 Stored locally in your browser</span>
            </span>
          </div>
        </div>
      )}

      {/* ===== ORDER DETAIL MODAL ===== */}
      {showOrderDetail && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Order Details
              </h2>
              <button 
                onClick={() => setShowOrderDetail(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Order #</p>
                  <p className="font-bold dark:text-white">{selectedOrder.order_no}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Customer</p>
                  <p className="font-bold dark:text-white">{selectedOrder.customer_name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
                  <p className="font-bold dark:text-white">{formatDate(selectedOrder.date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedOrder.status)}`}>
                    {selectedOrder.status || 'Pending'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Payment</p>
                  <p className="font-bold dark:text-white">{selectedOrder.payment_method || 'N/A'}</p>
                </div>
              </div>

              <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">Items</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Product</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Qty</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Price</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map((item, index) => (
                      <tr key={index} className="border-b dark:border-gray-700">
                        <td className="px-4 py-2 text-sm dark:text-white">{item.product_name || 'Product'}</td>
                        <td className="px-4 py-2 text-sm text-center dark:text-white">{item.qty}</td>
                        <td className="px-4 py-2 text-sm text-right dark:text-white">${(item.unit_price || 0).toFixed(2)}</td>
                        <td className="px-4 py-2 text-sm text-right dark:text-white">${(item.subtotal || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-300 dark:border-gray-600">
                      <td colSpan="3" className="px-4 py-2 text-right font-bold dark:text-white">Subtotal:</td>
                      <td className="px-4 py-2 text-right font-bold dark:text-white">${(selectedOrder.subtotal || 0).toFixed(2)}</td>
                    </tr>
                    {selectedOrder.discount > 0 && (
                      <tr>
                        <td colSpan="3" className="px-4 py-2 text-right dark:text-white">Discount:</td>
                        <td className="px-4 py-2 text-right dark:text-white">-${(selectedOrder.discount || 0).toFixed(2)}</td>
                      </tr>
                    )}
                    <tr className="border-t-2 border-gray-300 dark:border-gray-600">
                      <td colSpan="3" className="px-4 py-2 text-right font-bold text-lg dark:text-white">Grand Total:</td>
                      <td className="px-4 py-2 text-right font-bold text-lg text-indigo-600 dark:text-indigo-400">
                        ${(selectedOrder.total || 0).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button 
                onClick={() => setShowOrderDetail(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition dark:text-white"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  setShowOrderDetail(false);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                <Printer className="w-4 h-4 inline mr-2" />
                Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="text-center text-xs text-gray-400 dark:text-gray-500 py-2">
        <p>🛒 Orders Management| {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
};

export default Orders;