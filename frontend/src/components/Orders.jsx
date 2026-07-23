import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import {
  Plus, X, Save, Printer, Search, ClipboardList, RefreshCw,
  AlertCircle, CheckCircle, Loader2, Package, User,
  ShoppingCart, Eye, Trash2, List, Zap, Check, AlertTriangle,
  Clock, DollarSign, ArrowUp, ArrowDown, Phone, Mail, MapPin
} from 'lucide-react';
import { exportInvoicePDF } from '../utils/pdfExport';

// ============================================
// API CONFIGURATION
// ============================================
const API_BASE = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api';
const CACHE_KEY = 'pos_orders_cache';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

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
// SHARED DATA HELPERS
// ============================================
const extractArrayData = (responseData, extraKeys = []) => {
  if (typeof responseData === 'string' && responseData.includes('<!DOCTYPE html>')) {
    return null;
  }
  if (Array.isArray(responseData)) return responseData;
  if (responseData && typeof responseData === 'object') {
    if (Array.isArray(responseData.data)) return responseData.data;
    for (const key of extraKeys) {
      if (Array.isArray(responseData[key])) return responseData[key];
    }
    if (responseData.data && typeof responseData.data === 'object') {
      for (const key of extraKeys) {
        if (Array.isArray(responseData.data[key])) return responseData.data[key];
      }
      const values = Object.values(responseData.data);
      if (values.length > 0 && Array.isArray(values[0])) return values[0];
    }
  }
  return [];
};

const getFallbackCustomers = () => ([
  { CUS_ID: 'CUS001', FIRST_NAME: 'John', LAST_NAME: 'Doe', PHONE: '555-0101', E_MAIL: 'john@example.com', ADDRESS: '123 Main St, NY', BALANCE: 150.00, STATUS: 'Active', image_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop' },
  { CUS_ID: 'CUS002', FIRST_NAME: 'Jane', LAST_NAME: 'Smith', PHONE: '555-0102', E_MAIL: 'jane@example.com', ADDRESS: '456 Oak Ave, LA', BALANCE: 0.00, STATUS: 'Active', image_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop' },
  { CUS_ID: 'CUS003', FIRST_NAME: 'Robert', LAST_NAME: 'Johnson', PHONE: '555-0103', E_MAIL: 'robert@example.com', ADDRESS: '789 Pine Rd, SF', BALANCE: 75.50, STATUS: 'Active', image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop' },
  { CUS_ID: 'CUS004', FIRST_NAME: 'Mary', LAST_NAME: 'Williams', PHONE: '555-0104', E_MAIL: 'mary@example.com', ADDRESS: '321 Elm St, CHI', BALANCE: 200.00, STATUS: 'Active', image_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop' },
]);

const getFallbackProducts = () => ([
  { PRODUCT_ID: 'PROD001', NAME_EN: 'Laptop Pro', NAME_KH: 'កុំព្យូទ័រយួរដៃ', BARCODE: 'LP001', BRAND: 'TechPro', BUYIN_PRICE: 899.99, SALEOUT_PRICE: 1299.99, QtyInStock: 50, QTY_ALERT: 10, STATUS: 'Active', image_url: null },
  { PRODUCT_ID: 'PROD002', NAME_EN: 'Smartphone X', NAME_KH: 'ទូរស័ព្ទឆ្លាត', BARCODE: 'SP002', BRAND: 'PhoneMaster', BUYIN_PRICE: 599.99, SALEOUT_PRICE: 899.99, QtyInStock: 30, QTY_ALERT: 10, STATUS: 'Active', image_url: null },
  { PRODUCT_ID: 'PROD003', NAME_EN: 'Wireless Mouse', NAME_KH: 'កណ្ដុរឥតខ្សែ', BARCODE: 'WM003', BRAND: 'Accessory', BUYIN_PRICE: 15.99, SALEOUT_PRICE: 29.99, QtyInStock: 100, QTY_ALERT: 15, STATUS: 'Active', image_url: null },
  { PRODUCT_ID: 'PROD004', NAME_EN: 'Keyboard Pro', NAME_KH: 'ក្ដារចុច', BARCODE: 'KP004', BRAND: 'Accessory', BUYIN_PRICE: 45.99, SALEOUT_PRICE: 79.99, QtyInStock: 45, QTY_ALERT: 10, STATUS: 'Active', image_url: null },
]);

const getProductStock = (product) => {
  const val = product?.QtyInStock ?? product?.qty_instock ?? product?.STOCK ?? product?.stock;
  return Number(val || 0);
};

const getProductImage = (product) => {
  const url = product?.image_url || product?.IMAGE_URL || '';
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('data:image/')) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    if (url.includes('example.com') || url.includes('placeholder')) return '';
    return url;
  }
  if (url.startsWith('/uploads/')) return url;
  return '';
};

const getCustomerImage = (customer) => customer?.image_url || customer?.IMAGE_URL || '';

// ============================================
// MAIN ORDERS COMPONENT
// ============================================
const Orders = () => {
  // ===== STATE =====
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
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
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [viewMode, setViewMode] = useState('create');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // ===== REFS =====
  const isMounted = useRef(true);
  const itemsEndRef = useRef(null);
  const headerRef = useRef(null);

  // ===== MOUSE TRACKING =====
  useEffect(() => {
    const handleMouseMove = (e) => setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // ===== SHOW MESSAGE =====
  const showMessage = useCallback((text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
    const timer = setTimeout(() => setMessage(''), 5000);
    return () => clearTimeout(timer);
  }, []);

  // ============================================
  // FETCH CUSTOMERS
  // ============================================
  const fetchCustomers = useCallback(async () => {
    try {
      const res = await api.get('/customers');
      if (!isMounted.current) return;
      const extracted = extractArrayData(res.data, ['customers', 'items']);
      if (extracted === null) throw new Error('API not available');
      setCustomers(extracted.length > 0 ? extracted : getFallbackCustomers());
      console.log('✅ Customers loaded:', extracted.length);
    } catch (error) {
      console.warn('⚠️ Customers API unavailable, using fallback:', error.message);
      if (isMounted.current) setCustomers(getFallbackCustomers());
    }
  }, []);

  // ============================================
  // FETCH PRODUCTS
  // ============================================
  const fetchProducts = useCallback(async () => {
    try {
      const res = await api.get('/products');
      if (!isMounted.current) return;
      const extracted = extractArrayData(res.data, ['products', 'items']);
      if (extracted === null) throw new Error('API not available');
      setProducts(extracted.length > 0 ? extracted : getFallbackProducts());
      console.log('✅ Products loaded:', extracted.length);
    } catch (error) {
      console.warn('⚠️ Products API unavailable, using fallback:', error.message);
      if (isMounted.current) setProducts(getFallbackProducts());
    }
  }, []);

  // ============================================
  // ✅ FIXED: FETCH ORDERS - Properly maps data
  // ============================================
  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const res = await api.get('/orders');
      const extracted = extractArrayData(res.data, ['orders', 'items']);
      if (extracted === null) throw new Error('API not available');
      
      // ✅ Map the data to match frontend expectations
      const mappedOrders = extracted.map(order => ({
        id: order.or_id || order.id,
        order_no: order.order_no,
        date: order.order_date || order.date,
        total: Number(order.amount_us || order.total || 0),
        status: order.status || 'Pending',
        payment_method: order.paymentmethod || order.payment_method,
        customer_id: order.customer_id,
        customer_name: order.customer_name || 'Unknown',
        items: order.items || [],
        item_count: order.item_count || order.items?.length || 0,
        discount: order.discount || 0,
        subtotal: order.subtotal || 0,
        saved_locally: order.saved_locally || false,
        notes: order.notes || ''
      }));
      
      if (isMounted.current) {
        setSavedOrders(mappedOrders);
        try { 
          localStorage.setItem(CACHE_KEY, JSON.stringify(mappedOrders)); 
        } catch { /* ignore */ }
      }
    } catch (error) {
      console.warn('⚠️ Orders API unavailable, using local cache:', error.message);
      try {
        const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || localStorage.getItem('orders') || '[]');
        if (isMounted.current) setSavedOrders(Array.isArray(cached) ? cached : []);
      } catch {
        if (isMounted.current) setSavedOrders([]);
      }
    } finally {
      if (isMounted.current) setOrdersLoading(false);
    }
  }, []);

  // ============================================
  // ✅ FIXED: FETCH SINGLE ORDER DETAILS
  // ============================================
  const fetchOrderDetails = useCallback(async (orderId) => {
    try {
      const res = await api.get(`/orders/${orderId}`);
      const data = res.data;
      
      // Map the response to match frontend expectations
      const customerName = data.customer 
        ? `${data.customer.FIRST_NAME || ''} ${data.customer.LAST_NAME || ''}`.trim() 
        : data.customer_name || 'Unknown';
      
      return {
        id: data.OR_ID || data.id,
        order_no: data.ORDER_NO || data.order_no,
        date: data.ORDER_DATE || data.date,
        total: Number(data.AMOUNT_US || data.total || 0),
        status: data.STATUS || data.status || 'Pending',
        payment_method: data.PaymentMethod || data.payment_method,
        customer_id: data.CUSTOMER_ID || data.customer_id,
        customer_name: customerName,
        items: (data.items || []).map(item => ({
          product_id: item.product_id,
          product_name: item.product_name || 'Product',
          qty: Number(item.qty || 0),
          unit_price: Number(item.unit_price || 0),
          discount: Number(item.discount || 0),
          subtotal: Number(item.subtotal || 0),
          image: item.image_url || ''
        })),
        discount: data.discount || 0,
        subtotal: data.subtotal || 0,
        notes: data.NOTES || data.notes || '',
        saved_locally: false
      };
    } catch (error) {
      console.error('❌ Failed to fetch order details:', error);
      return null;
    }
  }, []);

  const persistOrderLocally = useCallback((orderData) => {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
      const updated = [orderData, ...(Array.isArray(cached) ? cached : [])];
      localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
      localStorage.setItem('orders', JSON.stringify(updated));
      setSavedOrders(updated);
    } catch (e) {
      console.error('❌ Failed to persist order locally:', e);
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
    setDataLoading(true);
    Promise.all([fetchCustomers(), fetchProducts()]).finally(() => {
      if (isMounted.current) setDataLoading(false);
    });
    generateOrderNo();
    fetchOrders();

    return () => { isMounted.current = false; };
  }, [fetchCustomers, fetchProducts, fetchOrders, generateOrderNo]);

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
      product_name: '',
      image: '',
      stock: undefined
    }]);
  }, []);

  const removeItem = useCallback((id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const updateItem = useCallback((id, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };

      if (field === 'product_id') {
        const product = products.find(p => String(p.PRODUCT_ID || p.product_id) === String(value));
        if (product) {
          updated.unit_price = Number(product.SALEOUT_PRICE || product.saleout_price || 0);
          updated.product_name = product.NAME_EN || product.name_en || '';
          updated.image = getProductImage(product);
          updated.stock = getProductStock(product);
        } else {
          updated.unit_price = 0;
          updated.product_name = '';
          updated.image = '';
          updated.stock = undefined;
        }
      }

      updated.subtotal = (updated.qty * updated.unit_price) - (updated.discount || 0);
      return updated;
    }));
  }, [products]);

  // ===== CALCULATE TOTALS =====
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + (item.subtotal || 0), 0), [items]);
  const grandTotal = useMemo(() => Math.max(0, subtotal - (discount || 0)), [subtotal, discount]);
  const totalItems = items.length;

  // ============================================
  // STOCK CHECK
  // ============================================
  const checkStockAvailability = useCallback(() => {
    let hasStockIssue = false;
    const stockMessages = [];

    for (const item of items) {
      if (!item.product_id) continue;
      const product = products.find(p => String(p.PRODUCT_ID || p.product_id) === String(item.product_id));
      if (!product) continue;
      const available = getProductStock(product);
      if (available < item.qty) {
        hasStockIssue = true;
        stockMessages.push({
          product: item.product_name || `Product ${item.product_id}`,
          available,
          requested: item.qty
        });
      }
    }

    return { hasStockIssue, stockMessages };
  }, [items, products]);

  // ============================================
  // ✅ FIXED: PROCESS PURCHASE
  // ============================================
  const handlePurchase = useCallback(async () => {
    if (!selectedCustomer) { showMessage('❌ Please select a customer', 'error'); return; }
    if (items.length === 0) { showMessage('❌ Please add at least one item', 'error'); return; }
    if (items.some(item => !item.product_id)) { showMessage('❌ Please select a product for all items', 'error'); return; }

    const { hasStockIssue, stockMessages } = checkStockAvailability();
    if (hasStockIssue) {
      const summary = stockMessages.map(m => `${m.product}: ${m.available} available, ${m.requested} requested`).join('\n');
      if (!window.confirm(`⚠️ Some items have stock issues:\n${summary}\n\nContinue anyway?`)) return;
    }

    setIsProcessingPurchase(true);

    const purchasePayload = {
      CUSTOMER_ID: String(selectedCustomer),
      items: items.map(item => ({
        product_id: String(item.product_id),
        qty: Number(item.qty),
        unit_price: Number(item.unit_price),
        discount: Number(item.discount || 0)
      })),
      DISCOUNT: Number(discount),
      discount: Number(discount),
      PAYMENT_METHOD: paymentMethod,
      payment_method: paymentMethod,
      STATUS: orderStatus,
      status: orderStatus,
      order_no: orderNo
    };

    try {
      const response = await api.post('/orders', purchasePayload);
      const responseData = response?.data || {};
      const finalOrderNo = responseData.order_no || orderNo;
      const orderData = responseData.order || { 
        ...purchasePayload, 
        id: responseData.order_id || Date.now(),
        order_no: finalOrderNo,
        customer_name: selectedCustomerName || 'Unknown'
      };

      setOrderId(responseData.order_id || orderData.id);
      setSavedOrderData(orderData);
      setPurchaseResult({
        success: true,
        order_no: finalOrderNo,
        message: 'Purchase completed successfully! Stock updated.',
        local: false
      });
      showMessage(`✅ Purchase completed! Order ${finalOrderNo} created.`, 'success');

      setItems([]);
      setDiscount(0);
      setSelectedCustomer('');
      setSelectedCustomerName('');
      generateOrderNo();

      await Promise.all([fetchProducts(), fetchOrders()]);
    } catch (apiError) {
      console.warn('⚠️ Purchase API failed, saving locally:', apiError.response?.data || apiError.message);

      const localOrder = { 
        ...purchasePayload, 
        id: Date.now(), 
        order_no: orderNo,
        customer_name: selectedCustomerName || 'Unknown',
        saved_locally: true,
        date: new Date().toISOString(),
        total: grandTotal,
        subtotal: subtotal,
        items: items.map(item => ({
          product_id: String(item.product_id),
          product_name: item.product_name || 'Product',
          qty: Number(item.qty),
          unit_price: Number(item.unit_price),
          discount: Number(item.discount || 0),
          subtotal: Number(item.subtotal || 0)
        }))
      };
      persistOrderLocally(localOrder);

      setOrderId(localOrder.id);
      setSavedOrderData(localOrder);
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
    } finally {
      setIsProcessingPurchase(false);
    }
  }, [selectedCustomer, selectedCustomerName, items, discount, orderStatus, orderNo, subtotal, grandTotal, paymentMethod, generateOrderNo, showMessage, fetchProducts, fetchOrders, checkStockAvailability, persistOrderLocally]);

  // ============================================
  // SAVE ORDER (draft)
  // ============================================
  const handleSaveOrder = useCallback(async () => {
    if (!selectedCustomer) { showMessage('❌ Please select a customer', 'error'); return; }
    if (items.length === 0) { showMessage('❌ Please add at least one item', 'error'); return; }
    if (items.some(item => !item.product_id)) { showMessage('❌ Please select a product for all items', 'error'); return; }

    setLoading(true);

    const orderPayload = {
      CUSTOMER_ID: String(selectedCustomer),
      items: items.map(item => ({
        product_id: String(item.product_id),
        qty: Number(item.qty),
        unit_price: Number(item.unit_price),
        discount: Number(item.discount || 0)
      })),
      discount: Number(discount),
      payment_method: paymentMethod,
      status: orderStatus,
      order_no: orderNo
    };

    try {
      const res = await api.post('/orders', orderPayload);
      const saved = res?.data?.order || { 
        ...orderPayload, 
        id: res?.data?.order_id || Date.now(),
        order_no: orderNo,
        customer_name: selectedCustomerName || 'Unknown'
      };
      setOrderId(res?.data?.order_id || saved.id);
      setSavedOrderData(saved);
      showMessage(`✅ Order ${orderNo} saved successfully!`, 'success');
      await fetchOrders();
    } catch (error) {
      console.warn('⚠️ Save via API failed, saving locally:', error.message);
      const localOrder = { 
        ...orderPayload, 
        id: Date.now(), 
        order_no: orderNo,
        customer_name: selectedCustomerName || 'Unknown',
        saved_locally: true,
        date: new Date().toISOString(),
        total: grandTotal,
        subtotal: subtotal,
        items: items.map(item => ({
          product_id: String(item.product_id),
          product_name: item.product_name || 'Product',
          qty: Number(item.qty),
          unit_price: Number(item.unit_price),
          discount: Number(item.discount || 0),
          subtotal: Number(item.subtotal || 0)
        }))
      };
      persistOrderLocally(localOrder);
      setOrderId(localOrder.id);
      setSavedOrderData(localOrder);
      showMessage(`✅ Order ${orderNo} saved locally (offline)`, 'success');
    }

    setItems([]);
    setDiscount(0);
    setSelectedCustomer('');
    setSelectedCustomerName('');
    generateOrderNo();
    setLoading(false);
  }, [selectedCustomer, selectedCustomerName, items, discount, orderStatus, orderNo, subtotal, grandTotal, paymentMethod, generateOrderNo, showMessage, fetchOrders, persistOrderLocally]);

  // ============================================
  // PRINT INVOICE
  // ============================================
  const handlePrintInvoice = useCallback(async (orderOverride) => {
    const source = orderOverride || savedOrderData;
    if (!source && !orderId) {
      showMessage('❌ Please complete a purchase first', 'error');
      return;
    }

    try {
      const pdfData = {
        order_no: source?.order_no || orderNo,
        customer_name: source?.customer_name || selectedCustomerName || 'Customer',
        status: source?.status || source?.STATUS || orderStatus,
        discount: source?.discount ?? discount,
        items: source?.items || items,
        payment_method: source?.payment_method || source?.PAYMENT_METHOD || paymentMethod,
        total: source?.total ?? grandTotal
      };

      await exportInvoicePDF(pdfData, `invoice-${pdfData.order_no}.pdf`);
      showMessage('✅ Invoice generated successfully!', 'success');
    } catch (error) {
      console.error('❌ Print invoice error:', error);
      showMessage('❌ Failed to generate invoice', 'error');
    }
  }, [savedOrderData, orderId, orderNo, selectedCustomerName, orderStatus, discount, items, paymentMethod, grandTotal, showMessage]);

  // ===== REFRESH DATA =====
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([fetchCustomers(), fetchProducts(), fetchOrders()]);
    setIsRefreshing(false);
    showMessage('✅ Data refreshed!', 'success');
  }, [fetchCustomers, fetchProducts, fetchOrders, showMessage]);

  // ===== RESET FORM =====
  const handleReset = useCallback(() => {
    if (items.length > 0 && !window.confirm('Are you sure you want to reset? All items will be lost.')) return;
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

  // ============================================
  // ✅ FIXED: DELETE ORDER
  // ============================================
  const handleDeleteOrder = useCallback(async (order) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    const id = order.id || order._id || order.ORDER_ID || order.order_id || order.or_id;

    // If it's a local order, just remove from cache
    if (order.saved_locally || !id) {
      const updated = savedOrders.filter(o => (o.id || o._id || o.ORDER_ID || o.order_id || o.or_id) !== id);
      setSavedOrders(updated);
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
        localStorage.setItem('orders', JSON.stringify(updated));
      } catch { /* ignore */ }
      showMessage('✅ Order deleted successfully!', 'success');
      return;
    }

    try {
      await api.delete(`/orders/${id}`);
      showMessage('✅ Order deleted successfully!', 'success');
      await fetchOrders();
    } catch (error) {
      console.warn('⚠️ Delete via API failed, removing from local cache:', error.message);
      const updated = savedOrders.filter(o => (o.id || o._id || o.ORDER_ID || o.order_id || o.or_id) !== id);
      setSavedOrders(updated);
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
        localStorage.setItem('orders', JSON.stringify(updated));
      } catch { /* ignore */ }
      showMessage('✅ Order deleted from local cache', 'success');
    }
  }, [savedOrders, showMessage, fetchOrders]);

  // ============================================
  // ✅ FIXED: VIEW ORDER DETAIL
  // ============================================
  const handleViewOrder = useCallback(async (order) => {
    // If it's a local order or already has full details, show it directly
    if (order.saved_locally || (order.items && order.items.length > 0)) {
      setSelectedOrder(order);
      setShowOrderDetail(true);
      return;
    }

    // Otherwise fetch full details from API
    const id = order.id || order._id || order.ORDER_ID || order.order_id || order.or_id;
    if (!id) {
      setSelectedOrder(order);
      setShowOrderDetail(true);
      return;
    }

    const fullOrder = await fetchOrderDetails(id);
    if (fullOrder) {
      setSelectedOrder(fullOrder);
      setShowOrderDetail(true);
    } else {
      // Fallback: show what we have
      setSelectedOrder(order);
      setShowOrderDetail(true);
    }
  }, [fetchOrderDetails]);

  // ===== CLEAR ALL LOCAL ORDERS =====
  const handleClearAll = useCallback(() => {
    if (!window.confirm('Clear all locally-cached orders? Orders stored on the server will not be affected.')) return;
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify([]));
      localStorage.setItem('orders', JSON.stringify([]));
    } catch { /* ignore */ }
    fetchOrders();
    showMessage('🗑️ Local order cache cleared!', 'info');
  }, [showMessage, fetchOrders]);

  // ===== ORDER STATS =====
  const orderStats = useMemo(() => {
    const arr = Array.isArray(savedOrders) ? savedOrders : [];
    return {
      total: arr.length,
      pending: arr.filter(o => (o.status || o.STATUS) === 'Pending' || (o.status || o.STATUS) === 'Processing').length,
      completed: arr.filter(o => (o.status || o.STATUS) === 'Completed').length,
      revenue: arr.reduce((sum, o) => sum + Number(o.total || o.TOTAL || 0), 0)
    };
  }, [savedOrders]);

  // ===== FILTERED ORDERS =====
  const filteredOrders = useMemo(() => {
    const arr = Array.isArray(savedOrders) ? savedOrders : [];
    let result = [...arr];

    if (filterStatus !== 'all') {
      result = result.filter(o => (o.status || o.STATUS) === filterStatus);
    }

    if (orderSearchTerm.trim()) {
      const q = orderSearchTerm.trim().toLowerCase();
      result = result.filter(o =>
        (o.order_no || '').toLowerCase().includes(q) ||
        (o.customer_name || '').toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date || a.order_date) - new Date(b.date || b.order_date);
          break;
        case 'total':
          comparison = (a.total || 0) - (b.total || 0);
          break;
        case 'status':
          comparison = (a.status || a.STATUS || '').localeCompare(b.status || b.STATUS || '');
          break;
        default:
          comparison = new Date(a.date || a.order_date) - new Date(b.date || b.order_date);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [savedOrders, filterStatus, orderSearchTerm, sortBy, sortOrder]);

  // ===== FILTERED PRODUCTS =====
  const filteredProducts = useMemo(() => {
    const arr = Array.isArray(products) ? products : [];
    if (!searchTerm) return arr;
    const q = searchTerm.toLowerCase();
    return arr.filter(p => {
      const nameEn = p.NAME_EN || p.name_en || '';
      const nameKh = p.NAME_KH || p.name_kh || '';
      const barcode = p.BARCODE || p.barcode || '';
      return nameEn.toLowerCase().includes(q) || nameKh.includes(q) || barcode.toLowerCase().includes(q);
    });
  }, [products, searchTerm]);

  // ===== HELPER FUNCTIONS =====
  const getProductEmoji = (name) => {
    const emojis = ['📱', '💻', '⌨️', '🖥️', '📷', '🎧', '⌚', '📡', '🔋', '💾', '🖱️', '📀', '💿', '📹', '🎮', '📺', '🔊'];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return emojis[Math.abs(hash) % emojis.length];
  };

  const getInitials = (name) => {
    const parts = (name || '').trim().split(' ').filter(Boolean);
    if (parts.length === 0) return '?';
    return parts.slice(0, 2).map(p => p.charAt(0).toUpperCase()).join('');
  };

  const getAvatarColor = (name) => {
    const colors = ['bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-orange-500', 'bg-teal-500', 'bg-cyan-500', 'bg-rose-500', 'bg-amber-500'];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const formatPhone = (phone) => {
    if (!phone) return '-';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    if (cleaned.length === 9) return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`;
    return phone;
  };

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr || 'N/A';
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      'Pending': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800',
      'Processing': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
      'Completed': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800',
      'Cancelled': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800',
    };
    return colors[status] || colors['Pending'];
  };

  const getStatusIcon = (status) => {
    const icons = {
      'Pending': <Clock className="w-3 h-3" />,
      'Processing': <Loader2 className="w-3 h-3 animate-spin" />,
      'Completed': <CheckCircle className="w-3 h-3" />,
      'Cancelled': <X className="w-3 h-3" />,
    };
    return icons[status] || icons['Pending'];
  };

  const getStatIcon = (type) => {
    const icons = {
      total: <ClipboardList className="w-5 h-5 text-indigo-100" />,
      pending: <Clock className="w-5 h-5 text-yellow-300" />,
      completed: <CheckCircle className="w-5 h-5 text-green-300" />,
      revenue: <DollarSign className="w-5 h-5 text-indigo-100" />
    };
    return icons[type] || icons.total;
  };

  const selectedCustomerObj = useMemo(
    () => customers.find(c => String(c.CUS_ID || c.cus_id) === String(selectedCustomer)),
    [customers, selectedCustomer]
  );

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
            <button onClick={() => setMessage('')} className="flex-shrink-0 opacity-50 hover:opacity-100 transition" aria-label="Dismiss message">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ===== HEADER WITH STATS ===== */}
      <div
        ref={headerRef}
        className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden transition-all duration-300"
        style={{
          transform: `perspective(1000px) rotateX(${(mousePosition.y / window.innerHeight - 0.5) * 2}deg) rotateY(${(mousePosition.x / window.innerWidth - 0.5) * 2}deg)`,
          transition: 'transform 0.1s ease-out'
        }}
      >
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
              aria-label="Refresh data"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 relative z-10">
          {[
            { label: 'Total Orders', value: orderStats.total, icon: 'total', valueClass: '' },
            { label: 'Pending', value: orderStats.pending, icon: 'pending', valueClass: 'text-yellow-300' },
            { label: 'Completed', value: orderStats.completed, icon: 'completed', valueClass: 'text-green-300' },
            { label: 'Revenue', value: `$${orderStats.revenue.toFixed(2)}`, icon: 'revenue', valueClass: '' },
          ].map((stat, index) => (
            <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 hover:bg-white/20 transition-all duration-300 hover:scale-105 border border-white/5 animate-slideUp" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="flex items-center gap-2">
                {getStatIcon(stat.icon)}
                <p className="text-xs text-indigo-200">{stat.label}</p>
              </div>
              <p className={`text-2xl font-bold ${stat.valueClass}`}>
                {ordersLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : stat.value}
              </p>
            </div>
          ))}
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
              onClick={() => { setViewMode('list'); fetchOrders(); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 ${
                viewMode === 'list'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <List className="w-4 h-4" />
              Orders
              <span className="ml-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                {savedOrders.length}
              </span>
            </button>
          </div>
          <button
            onClick={handleReset}
            className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 hover:rotate-180"
            title="Reset form"
            aria-label="Reset form"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* ===== CREATE ORDER VIEW ===== */}
      {viewMode === 'create' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6 animate-fadeIn hover:shadow-md transition-all duration-300">

          {/* Order Header */}
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-indigo-600" />
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

          {dataLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
              </div>
              <p className="text-gray-400 font-medium">Loading customers &amp; products...</p>
            </div>
          ) : (
            <>
              {/* Customer Selection */}
              <div className="mb-6 group">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-500" />
                  Select Customer <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedCustomer(val);
                    const customer = customers.find(c => String(c.CUS_ID || c.cus_id) === String(val));
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
                    const fullName = `${firstName} ${lastName}`.trim() || 'Customer';
                    return (
                      <option key={cId} value={cId}>
                        {fullName} {phone ? `— ${phone}` : ''}
                      </option>
                    );
                  })}
                </select>

                {/* Selected customer mini profile card */}
                {selectedCustomerObj && (
                  <div className="mt-3 flex items-center gap-3 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/10 rounded-xl border border-indigo-100 dark:border-indigo-900/40 animate-fadeIn">
                    {getCustomerImage(selectedCustomerObj) ? (
                      <img
                        src={getCustomerImage(selectedCustomerObj)}
                        alt={selectedCustomerName}
                        className="w-11 h-11 rounded-xl object-cover flex-shrink-0 border-2 border-white dark:border-gray-700 shadow-sm"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-semibold flex-shrink-0 ${getAvatarColor(selectedCustomerName)}`}>
                        {getInitials(selectedCustomerName)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-gray-800 dark:text-white flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-green-500" />
                        {selectedCustomerName}
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        {(selectedCustomerObj.PHONE || selectedCustomerObj.phone) && (
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {formatPhone(selectedCustomerObj.PHONE || selectedCustomerObj.phone)}</span>
                        )}
                        {(selectedCustomerObj.E_MAIL || selectedCustomerObj.e_mail) && (
                          <span className="flex items-center gap-1 truncate"><Mail className="w-3 h-3" /> {selectedCustomerObj.E_MAIL || selectedCustomerObj.e_mail}</span>
                        )}
                        {(selectedCustomerObj.ADDRESS || selectedCustomerObj.address) && (
                          <span className="flex items-center gap-1 truncate"><MapPin className="w-3 h-3" /> {selectedCustomerObj.ADDRESS || selectedCustomerObj.address}</span>
                        )}
                      </div>
                    </div>
                    {Number(selectedCustomerObj.BALANCE || selectedCustomerObj.balance || 0) > 0 && (
                      <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 bg-white dark:bg-gray-800 px-2.5 py-1 rounded-lg flex-shrink-0">
                        ${Number(selectedCustomerObj.BALANCE || selectedCustomerObj.balance).toFixed(2)} balance
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Product Search & Items */}
              <div className="mb-4">
                <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Package className="w-4 h-4 text-purple-500" />
                    Order Items
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full text-gray-500 dark:text-gray-400">
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
                <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-8 text-center text-gray-400 dark:text-gray-500 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-300">
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
                      {items.map((item, index) => {
                        const overStock = item.stock !== undefined && item.qty > item.stock;
                        return (
                          <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300 group animate-slideIn" style={{ animationDelay: `${index * 0.05}s` }}>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                {item.image ? (
                                  <img src={item.image} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" onError={(e) => { e.target.style.display = 'none'; }} />
                                ) : (
                                  <span className="text-xl flex-shrink-0">{getProductEmoji(item.product_name || '')}</span>
                                )}
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
                                    const stock = getProductStock(product);
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
                                className={`w-16 text-center px-2 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all duration-300 dark:bg-gray-700 dark:text-white ${
                                  overStock ? 'border-amber-400 focus:ring-amber-400' : 'border-gray-200 dark:border-gray-600 focus:ring-indigo-500'
                                }`}
                              />
                              {item.stock !== undefined && (
                                <p className={`text-[10px] mt-1 text-center ${overStock ? 'text-amber-500 font-medium' : 'text-gray-400'}`}>
                                  Max: {item.stock}
                                </p>
                              )}
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
                                aria-label="Remove item"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
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
                      <span className="text-2xl text-indigo-600 dark:text-indigo-400">${grandTotal.toFixed(2)}</span>
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
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Draft
                </button>
                <button
                  onClick={handlePurchase}
                  disabled={isProcessingPurchase || items.length === 0}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 hover:scale-105 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-600/20"
                >
                  {isProcessingPurchase ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  {isProcessingPurchase ? 'Processing...' : '💳 Purchase Now'}
                </button>
                <button
                  onClick={() => handlePrintInvoice()}
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
                      <CheckCircle className="w-6 h-6 text-green-500 mt-0.5" />
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
                          Saved locally. It will sync automatically once the server is reachable.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ===== ORDER LIST VIEW ===== */}
      {viewMode === 'list' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6 animate-fadeIn hover:shadow-md transition-all duration-300">

          {/* Header */}
          <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
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
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-indigo-500 transition-colors w-4 h-4" />
                <input
                  type="text"
                  value={orderSearchTerm}
                  onChange={(e) => setOrderSearchTerm(e.target.value)}
                  placeholder="Search order # or customer..."
                  className="pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300 hover:border-indigo-300 w-56"
                />
              </div>

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
                onClick={fetchOrders}
                className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-110"
                title="Refresh"
                aria-label="Refresh orders"
              >
                <RefreshCw className={`w-4 h-4 text-gray-500 ${ordersLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Orders List */}
          {ordersLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-14 h-14 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
              <p className="text-gray-400 font-medium">Loading orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-30 animate-float" />
              <p className="text-lg font-medium">No orders found</p>
              <p className="text-sm mt-1">
                {savedOrders.length > 0 ? 'Try changing the filter or search' : 'Orders you create will appear here'}
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
                  {filteredOrders.map((order, index) => {
                    const status = order.status || order.STATUS || 'Pending';
                    const itemCount = order.items?.length || order.item_count || 0;
                    return (
                      <tr key={order.id || order.order_no || index} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-all duration-300 group animate-slideIn" style={{ animationDelay: `${index * 0.04}s` }}>
                        <td className="px-4 py-3 text-sm font-mono font-medium text-indigo-600 dark:text-indigo-400">
                          {order.order_no}
                          {order.saved_locally && (
                            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-sans normal-case">offline</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm dark:text-gray-300 hidden sm:table-cell">
                          {order.customer_name || 'Unknown'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">
                          {formatDate(order.date || order.order_date)}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-right dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          ${Number(order.total || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-300 ${getStatusBadge(status)} group-hover:scale-105`}>
                            {getStatusIcon(status)}
                            {status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                          {itemCount}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleViewOrder(order)}
                              className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300 group-hover:scale-110"
                              title="View details"
                              aria-label="View order details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteOrder(order)}
                              className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300 group-hover:scale-110"
                              title="Delete order"
                              aria-label="Delete order"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-400 dark:text-gray-500 flex flex-wrap justify-between items-center gap-2">
            <span>Total: {filteredOrders.length} orders</span>
            <span className="flex items-center gap-1">
              <span>🔄 Synced with server when available, cached locally when offline</span>
              {savedOrders.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="ml-4 text-xs text-red-500 hover:text-red-700 transition-all duration-300 hover:scale-110"
                >
                  Clear local cache
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
                <ClipboardList className="w-5 h-5 text-indigo-600" />
                Order Details
                <span className="text-sm font-mono font-normal text-gray-400 ml-2">#{selectedOrder.order_no}</span>
              </h2>
              <button
                onClick={() => setShowOrderDetail(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-300 hover:rotate-90"
                aria-label="Close"
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
                  <p className="font-semibold dark:text-white">{formatDate(selectedOrder.date || selectedOrder.order_date)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</p>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedOrder.status || selectedOrder.STATUS)}`}>
                    {getStatusIcon(selectedOrder.status || selectedOrder.STATUS)}
                    {selectedOrder.status || selectedOrder.STATUS || 'Pending'}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Payment</p>
                  <p className="font-semibold dark:text-white">{selectedOrder.payment_method || selectedOrder.PAYMENT_METHOD || 'N/A'}</p>
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
                        <td className="px-4 py-2 text-sm dark:text-white">
                          <div className="flex items-center gap-2">
                            {item.image && (
                              <img src={item.image} alt="" className="w-8 h-8 rounded object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                            )}
                            {item.product_name || 'Product'}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm text-center dark:text-white">{item.qty}</td>
                        <td className="px-4 py-2 text-sm text-right dark:text-white">${Number(item.unit_price || 0).toFixed(2)}</td>
                        <td className="px-4 py-2 text-sm text-right font-medium dark:text-white">${Number(item.subtotal || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-300 dark:border-gray-600">
                      <td colSpan="3" className="px-4 py-2 text-right font-medium dark:text-white">Subtotal:</td>
                      <td className="px-4 py-2 text-right font-medium dark:text-white">${Number(selectedOrder.subtotal || 0).toFixed(2)}</td>
                    </tr>
                    {Number(selectedOrder.discount || 0) > 0 && (
                      <tr>
                        <td colSpan="3" className="px-4 py-2 text-right text-gray-500 dark:text-gray-400">Discount:</td>
                        <td className="px-4 py-2 text-right text-red-500">-${Number(selectedOrder.discount || 0).toFixed(2)}</td>
                      </tr>
                    )}
                    <tr className="border-t-2 border-gray-300 dark:border-gray-600">
                      <td colSpan="3" className="px-4 py-3 text-right font-bold text-lg dark:text-white">Grand Total:</td>
                      <td className="px-4 py-3 text-right font-bold text-xl text-indigo-600 dark:text-indigo-400">
                        ${Number(selectedOrder.total || 0).toFixed(2)}
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
                  handlePrintInvoice(selectedOrder);
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
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(100px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        @keyframes pulse-slow { 0%, 100% { opacity: 0.2; transform: scale(1); } 50% { opacity: 0.4; transform: scale(1.1); } }
        @keyframes spin-slow { 0% { transform: translate(-50%, -50%) rotate(0deg); } 100% { transform: translate(-50%, -50%) rotate(360deg); } }

        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
        .animate-slideIn { animation: slideIn 0.4s ease-out forwards; opacity: 0; }
        .animate-slideInRight { animation: slideInRight 0.5s ease-out forwards; }
        .animate-slideUp { animation: slideUp 0.4s ease-out forwards; opacity: 0; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }
        .animation-delay-1000 { animation-delay: 1s; }

        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #c4c4c4; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #a0a0a0; }
        .dark ::-webkit-scrollbar-thumb { background: #4b5563; }
        .dark ::-webkit-scrollbar-thumb:hover { background: #6b7280; }
      `}</style>
    </div>
  );
};

export default Orders;