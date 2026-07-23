import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import { 
  Search, Plus, Edit2, Trash2, Package, X, Save, 
  RefreshCw, AlertCircle, CheckCircle, Loader2,
  Filter, ArrowUp, ArrowDown, Grid3x3, List,
  TrendingUp, TrendingDown, DollarSign, ShoppingBag,
  BarChart3, Zap, Award, Star, Clock, AlertTriangle,
  ChevronRight, Eye, Copy, Tag, Layers, Box,
  Sparkles, Gift, Shield,
  ClipboardList, Image as ImageIcon, Upload, Camera
} from 'lucide-react';

// ============================================
// API CONFIGURATION
// ============================================
const API_BASE = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api';
console.log('🔧 API_BASE:', API_BASE);

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
// MAIN PRODUCTS COMPONENT
// ============================================
const Products = () => {
  // ===== STATE =====
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('NAME_EN');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [productStats, setProductStats] = useState({
    total: 0,
    lowStock: 0,
    active: 0,
    totalValue: 0
  });

  // ===== IMAGE UPLOAD STATE =====
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false); // ✅ now a real lock, see handleImageSelect

  // ===== FORM DATA =====
  const [formData, setFormData] = useState({
    NAME_EN: '',
    NAME_KH: '',
    BARCODE: '',
    BRAND: '',
    CATEGORY_ID: '',
    BUYIN_PRICE: '',
    SALEOUT_PRICE: '',
    QTY_ALERT: '10',
    QTY_INSTOCK: '0',
    IMAGE_URL: ''
  });

  // ===== REFS =====
  const isMounted = useRef(true);
  const searchTimeout = useRef(null);
  const headerRef = useRef(null);
  const fileInputRef = useRef(null);
  // ✅ Mirrors formData.IMAGE_URL synchronously so handleSubmit never reads a stale
  // value even if it somehow fires in the same tick as a state update.
  const imageUrlRef = useRef('');

  // ===== MOUSE TRACKING =====
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // ============================================
  // SHOW MESSAGE
  // ============================================
  const showMessage = useCallback((text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
    const timer = setTimeout(() => setMessage(''), 5000);
    return () => clearTimeout(timer);
  }, []);

  // ============================================
  // GET FALLBACK PRODUCTS
  // ============================================
  const getFallbackProducts = useCallback(() => {
    return [
      { 
        PRODUCT_ID: 'PROD001', 
        NAME_EN: 'Laptop Pro', 
        NAME_KH: 'កុំព្យូទ័រយួរដៃ', 
        BARCODE: 'LP001', 
        BRAND: 'TechPro', 
        BUYIN_PRICE: 899.99,
        SALEOUT_PRICE: 1299.99, 
        QtyInStock: 50, 
        QTY_ALERT: 10, 
        STATUS: 'Active',
        image_url: null
      },
      { 
        PRODUCT_ID: 'PROD002', 
        NAME_EN: 'Smartphone X', 
        NAME_KH: 'ទូរស័ព្ទឆ្លាត', 
        BARCODE: 'SP002', 
        BRAND: 'PhoneMaster', 
        BUYIN_PRICE: 599.99,
        SALEOUT_PRICE: 899.99, 
        QtyInStock: 30, 
        QTY_ALERT: 10, 
        STATUS: 'Active',
        image_url: null
      },
      { 
        PRODUCT_ID: 'PROD003', 
        NAME_EN: 'Wireless Mouse', 
        NAME_KH: 'កណ្ដុរឥតខ្សែ', 
        BARCODE: 'WM003', 
        BRAND: 'Accessory', 
        BUYIN_PRICE: 15.99,
        SALEOUT_PRICE: 29.99, 
        QtyInStock: 100, 
        QTY_ALERT: 15, 
        STATUS: 'Active',
        image_url: null
      },
      { 
        PRODUCT_ID: 'PROD004', 
        NAME_EN: 'Keyboard Pro', 
        NAME_KH: 'ក្ដារចុច', 
        BARCODE: 'KP004', 
        BRAND: 'Accessory', 
        BUYIN_PRICE: 45.99,
        SALEOUT_PRICE: 79.99, 
        QtyInStock: 45, 
        QTY_ALERT: 10, 
        STATUS: 'Active',
        image_url: null
      },
    ];
  }, []);

  // ============================================
  // SAFE DATA EXTRACTION
  // ============================================
  const extractProductsData = useCallback((responseData) => {
    if (typeof responseData === 'string' && responseData.includes('<!DOCTYPE html>')) {
      console.warn('⚠️ Received HTML - API not available');
      return [];
    }
    
    if (Array.isArray(responseData)) {
      return responseData;
    }
    
    if (responseData && typeof responseData === 'object') {
      if (Array.isArray(responseData.data)) {
        return responseData.data;
      }
      if (Array.isArray(responseData.products)) {
        return responseData.products;
      }
      if (Array.isArray(responseData.items)) {
        return responseData.items;
      }
      if (responseData.data && typeof responseData.data === 'object') {
        if (Array.isArray(responseData.data.items)) {
          return responseData.data.items;
        }
        if (Array.isArray(responseData.data.products)) {
          return responseData.data.products;
        }
        const values = Object.values(responseData.data);
        if (values.length > 0 && Array.isArray(values[0])) {
          return values[0];
        }
      }
    }
    
    return [];
  }, []);

  // ============================================
  // CALCULATE STATS
  // ============================================
  const calculateStats = useCallback((data) => {
    const productsArray = Array.isArray(data) ? data : [];
    const stats = {
      total: productsArray.length,
      lowStock: productsArray.filter(p => {
        const stock = Number(p.QtyInStock || p.qty_instock || 0);
        const alert = Number(p.QTY_ALERT || p.qty_alert || 10);
        return stock <= alert;
      }).length,
      active: productsArray.filter(p => {
        const status = p.STATUS || p.status || 'Active';
        return status === 'Active';
      }).length,
      totalValue: productsArray.reduce((sum, p) => {
        const price = Number(p.SALEOUT_PRICE || p.saleout_price || 0);
        const stock = Number(p.QtyInStock || p.qty_instock || 0);
        return sum + (price * stock);
      }, 0)
    };
    setProductStats(stats);
  }, []);

  // ============================================
  // RESET FORM
  // ============================================
  const resetForm = useCallback(() => {
    setFormData({ 
      NAME_EN: '', 
      NAME_KH: '', 
      BARCODE: '', 
      BRAND: '', 
      CATEGORY_ID: '', 
      BUYIN_PRICE: '', 
      SALEOUT_PRICE: '', 
      QTY_ALERT: '10', 
      QTY_INSTOCK: '0',
      IMAGE_URL: ''
    });
    imageUrlRef.current = '';
  }, []);

  // ============================================
  // FETCH PRODUCTS
  // ============================================
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/products', { 
        params: search ? { search: search } : {} 
      });
      
      if (isMounted.current) {
        if (typeof res.data === 'string' && res.data.includes('<!DOCTYPE html>')) {
          const fallbackData = getFallbackProducts();
          setProducts(fallbackData);
          calculateStats(fallbackData);
          showMessage('📋 Using offline data (API not available)', 'warning');
          setLoading(false);
          setIsRefreshing(false);
          return;
        }

        const productsData = extractProductsData(res.data);
        const productsArray = Array.isArray(productsData) ? productsData : [];
        
        if (productsArray.length > 0) {
          console.log('✅ Products loaded:', productsArray.length);
          setProducts(productsArray);
          calculateStats(productsArray);
        } else {
          const fallbackData = getFallbackProducts();
          setProducts(fallbackData);
          calculateStats(fallbackData);
          showMessage('📋 Using fallback data (API returned empty)', 'info');
        }
      }
    } catch (error) {
      console.error('❌ Error fetching products:', error.message);
      if (isMounted.current) {
        const fallbackData = getFallbackProducts();
        setProducts(fallbackData);
        calculateStats(fallbackData);
        showMessage('📋 Using offline data (API connection failed)', 'warning');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [search, showMessage, getFallbackProducts, extractProductsData, calculateStats]);

  // ============================================
  // IMAGE VALIDATION
  // ============================================
  const isValidImage = useCallback((url) => {
    if (!url) return false;
    if (typeof url !== 'string') return false;
    if (url.startsWith('data:image/')) return true;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      if (url.includes('example.com') || url.includes('placeholder')) {
        return false;
      }
      return true;
    }
    if (url.startsWith('/uploads/')) return true;
    return false;
  }, []);

  // ============================================
  // ✅ FIXED: IMAGE HANDLING
  // The bug: FileReader.readAsDataURL() is asynchronous. The old code never set
  // isUploading, so the Save button stayed clickable while the file was still
  // being read — if you clicked Save right after choosing a file, formData.IMAGE_URL
  // was still '' and the image never made it into the request. Fixing this by:
  //   1. Actually setting isUploading true/false around the read.
  //   2. Wrapping FileReader in a Promise so we can await it.
  //   3. Writing to imageUrlRef synchronously the instant we have the base64 string,
  //      so nothing downstream can read a stale/empty value.
  //   4. Disabling the Save button (and blocking handleSubmit) while isUploading.
  // ============================================
  const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  const handleImageSelect = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) {
      console.log('❌ No file selected');
      return;
    }

    console.log('📸 File selected:', file.name, file.type, file.size);

    // Basic guard: only accept actual image files
    if (!file.type.startsWith('image/')) {
      showMessage('❌ Please select a valid image file', 'error');
      return;
    }

    setIsUploading(true);
    setUploadProgress(30);

    try {
      const base64Image = await readFileAsDataURL(file);
      setUploadProgress(100);

      console.log('📸 Base64 image length:', base64Image.length);
      console.log('📸 Base64 preview:', base64Image.substring(0, 50) + '...');

      // ✅ Write to the ref immediately — this is synchronous and can't race with a click.
      imageUrlRef.current = base64Image;

      setImagePreview(base64Image);
      setSelectedImage(file);
      setFormData(prev => ({ ...prev, IMAGE_URL: base64Image }));

      showMessage('✅ Image selected successfully!', 'success');
    } catch (err) {
      console.error('❌ Failed to read image:', err);
      showMessage('❌ Failed to read image file', 'error');
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 400);
    }
  }, [showMessage]);

  const removeImage = useCallback(() => {
    console.log('🗑️ Removing image...');
    setSelectedImage(null);
    setImagePreview(null);
    setUploadProgress(0);
    imageUrlRef.current = '';
    setFormData(prev => {
      console.log('🗑️ Clearing image from formData');
      return { ...prev, IMAGE_URL: '' };
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // ============================================
  // OPEN MODALS
  // ============================================
  const openAddModal = useCallback(() => {
    setEditingProduct(null);
    resetForm();
    setImagePreview(null);
    setSelectedImage(null);
    setShowModal(true);
  }, [resetForm]);

  const openEditModal = useCallback((product) => {
    const productId = product.PRODUCT_ID || product.product_id;
    console.log('✏️ Editing product:', productId);
    
    const imageData = product.image_url || product.IMAGE_URL || '';
    const hasValidImage = isValidImage(imageData);
    
    console.log('📸 Existing image:', hasValidImage ? 'YES' : 'NO');
    if (imageData) {
      console.log('📸 Image preview:', imageData.substring(0, 50) + '...');
    }
    
    setEditingProduct(product);
    setFormData({
      NAME_EN: product.NAME_EN || '',
      NAME_KH: product.NAME_KH || '',
      BARCODE: product.BARCODE || '',
      BRAND: product.BRAND || '',
      CATEGORY_ID: product.CATEGORY_ID || '',
      BUYIN_PRICE: product.BUYIN_PRICE || '',
      SALEOUT_PRICE: product.SALEOUT_PRICE || '',
      QTY_ALERT: product.QTY_ALERT || '10',
      QTY_INSTOCK: '0',
      IMAGE_URL: hasValidImage ? imageData : ''
    });
    imageUrlRef.current = hasValidImage ? imageData : '';
    
    if (hasValidImage) {
      setImagePreview(imageData);
      console.log('📸 Image preview loaded from existing');
    } else {
      setImagePreview(null);
      console.log('📸 No valid image, ready for upload');
    }
    setSelectedImage(null);
    setShowModal(true);
  }, [isValidImage]);

  // ============================================
  // ✅ FIXED: HANDLE SUBMIT
  // Now reads imageUrlRef.current (always current) instead of trusting formData
  // alone, and refuses to submit while an image is still being processed.
  // ============================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isUploading) {
      showMessage('⏳ Please wait, image is still processing...', 'warning');
      return;
    }

    setSubmitting(true);
    
    // Validate required fields
    if (!formData.NAME_EN || formData.NAME_EN.trim() === '') {
      showMessage('❌ Product English name is required', 'error');
      setSubmitting(false);
      return;
    }
    
    if (!formData.SALEOUT_PRICE || parseFloat(formData.SALEOUT_PRICE) <= 0) {
      showMessage('❌ Valid sale price is required', 'error');
      setSubmitting(false);
      return;
    }

    // ✅ CRITICAL: prefer the ref — it's always in sync, formData can lag by a tick
    const imageUrl = imageUrlRef.current || formData.IMAGE_URL || '';
    console.log('📸 Image URL before submit:', imageUrl ? `✅ EXISTS (${imageUrl.length} chars)` : '❌ EMPTY');
    
    if (imageUrl) {
      console.log('📸 Image preview:', imageUrl.substring(0, 50) + '...');
    }

    // ✅ Build payload with IMAGE_URL
    const payload = {
      NAME_EN: formData.NAME_EN.trim(),
      NAME_KH: formData.NAME_KH?.trim() || '',
      BARCODE: formData.BARCODE?.trim() || '',
      BRAND: formData.BRAND?.trim() || '',
      CATEGORY_ID: formData.CATEGORY_ID || null,
      BUYIN_PRICE: parseFloat(formData.BUYIN_PRICE) || 0,
      SALEOUT_PRICE: parseFloat(formData.SALEOUT_PRICE) || 0,
      QTY_ALERT: parseInt(formData.QTY_ALERT) || 10,
      QTY_INSTOCK: parseInt(formData.QTY_INSTOCK) || 0,
      IMAGE_URL: imageUrl  // ✅ This MUST be included!
    };

    console.log('📤 Sending product data:', {
      ...payload,
      IMAGE_URL: payload.IMAGE_URL ? `✅ (${payload.IMAGE_URL.length} chars)` : '❌ MISSING'
    });

    try {
      let response;
      if (editingProduct) {
        const productId = editingProduct.PRODUCT_ID || editingProduct.product_id;
        console.log('🆔 Updating product ID:', productId);
        response = await api.put(`/products/${productId}`, payload);
        console.log('📥 Update response:', response.data);
        showMessage('✅ Product updated successfully!');
      } else {
        response = await api.post('/products', payload);
        console.log('📥 Create response:', response.data);
        showMessage('✅ Product created successfully!');
      }
      
      setShowModal(false);
      setEditingProduct(null);
      
      // ✅ Refresh products to show new image
      await fetchProducts();
      
      // ✅ Reset form AFTER fetch
      resetForm();
      removeImage();
      
    } catch (error) {
      console.error('❌ Submit error:', error);
      console.error('❌ Error response:', error.response?.data);
      showMessage(`❌ ${error.response?.data?.error || 'Failed to save product'}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================
  // HANDLE DELETE
  // ============================================
  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    const product = products.find(p => (p.PRODUCT_ID || p.product_id) === id);
    if (product?._local) {
      setProducts(prev => prev.filter(p => (p.PRODUCT_ID || p.product_id) !== id));
      calculateStats(products.filter(p => (p.PRODUCT_ID || p.product_id) !== id));
      showMessage('✅ Local product deleted!');
      return;
    }

    try {
      await api.delete(`/products/${id}`);
      showMessage('✅ Product deleted successfully!');
      fetchProducts();
    } catch (error) {
      console.error('Delete error:', error);
      showMessage('❌ Failed to delete product', 'error');
    }
  }, [products, fetchProducts, showMessage, calculateStats]);

  // ============================================
  // BULK DELETE
  // ============================================
  const handleBulkDelete = useCallback(async () => {
    if (selectedProducts.length === 0) return;
    if (!window.confirm(`Delete ${selectedProducts.length} selected products?`)) return;

    try {
      const localIds = [];
      const apiIds = [];
      
      for (const id of selectedProducts) {
        const product = products.find(p => (p.PRODUCT_ID || p.product_id) === id);
        if (product?._local) {
          localIds.push(id);
        } else {
          apiIds.push(id);
        }
      }

      if (localIds.length > 0) {
        setProducts(prev => prev.filter(p => !localIds.includes(p.PRODUCT_ID || p.product_id)));
        calculateStats(products.filter(p => !localIds.includes(p.PRODUCT_ID || p.product_id)));
      }

      for (const id of apiIds) {
        await api.delete(`/products/${id}`);
      }

      showMessage(`✅ ${selectedProducts.length} products deleted!`);
      setSelectedProducts([]);
      if (apiIds.length > 0) fetchProducts();
    } catch (error) {
      console.error('Bulk delete error:', error);
      showMessage('❌ Failed to delete some products', 'error');
    }
  }, [selectedProducts, products, fetchProducts, showMessage, calculateStats]);

  // ============================================
  // TOGGLE SELECT
  // ============================================
  const toggleSelect = useCallback((id) => {
    setSelectedProducts(prev => {
      if (prev.includes(id)) {
        return prev.filter(p => p !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.PRODUCT_ID || p.product_id));
    }
  }, [selectedProducts, products]);

  // ============================================
  // FILTERED & SORTED PRODUCTS
  // ============================================
  const filteredProducts = useMemo(() => {
    const productsArray = Array.isArray(products) ? products : [];
    let result = [...productsArray];

    if (filterStatus === 'lowStock') {
      result = result.filter(p => {
        const stock = Number(p.QtyInStock || p.qty_instock || 0);
        const alert = Number(p.QTY_ALERT || p.qty_alert || 10);
        return stock <= alert;
      });
    } else if (filterStatus === 'active') {
      result = result.filter(p => {
        const status = p.STATUS || p.status || 'Active';
        return status === 'Active';
      });
    } else if (filterStatus === 'inactive') {
      result = result.filter(p => {
        const status = p.STATUS || p.status || 'Active';
        return status !== 'Active';
      });
    }

    result.sort((a, b) => {
      let comparison = 0;
      const aVal = a[sortBy] ?? '';
      const bVal = b[sortBy] ?? '';
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal);
      } else if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [products, filterStatus, sortBy, sortOrder]);

  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  const formatPrice = (price) => `$${Number(price || 0).toFixed(2)}`;

  const getStatusBadge = (status) => {
    const isActive = (status || 'Active') === 'Active';
    return isActive 
      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800';
  };

  const getStockBadge = (stock, alert) => {
    const qty = Number(stock || 0);
    const alertLevel = Number(alert || 10);
    
    if (qty <= 0) {
      return { color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800', icon: AlertCircle };
    }
    if (qty <= alertLevel) {
      return { color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800', icon: AlertTriangle };
    }
    return { color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800', icon: CheckCircle };
  };

  const getStatIcon = (type) => {
    const icons = {
      total: <Package className="w-5 h-5 text-indigo-500" />,
      lowStock: <AlertTriangle className="w-5 h-5 text-amber-500" />,
      active: <CheckCircle className="w-5 h-5 text-emerald-500" />,
      totalValue: <DollarSign className="w-5 h-5 text-purple-500" />
    };
    return icons[type] || icons.total;
  };

  const getProductIcon = (name) => {
    const icons = [
      '📱', '💻', '⌨️', '🖥️', '📷', '🎧', '⌚', '📡', '🔋', '💾',
      '🖱️', '📀', '💿', '📹', '🎮', '📺', '🔊', '📻', '⏰', '💡'
    ];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return icons[Math.abs(hash) % icons.length];
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchProducts();
  }, [fetchProducts]);

  // ============================================
  // USE EFFECTS
  // ============================================
  useEffect(() => {
    isMounted.current = true;
    fetchProducts();

    return () => {
      isMounted.current = false;
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [fetchProducts]);

  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(() => {
      fetchProducts();
    }, 500);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [search, fetchProducts]);

  // ============================================
  // RENDER
  // ============================================
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
              <span className="text-xs font-medium text-white/80 tracking-wider uppercase">Inventory Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
              <Package className="w-8 h-8" />
              Products Inventory
            </h1>
            <p className="text-indigo-100 mt-1 text-sm">Manage your product catalog and inventory levels</p>
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
            <button
              onClick={openAddModal}
              className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl hover:bg-white/30 transition hover:scale-105 duration-300 flex items-center gap-2 border border-white/10"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 relative z-10">
          {[
            { label: 'Total Products', value: productStats.total, icon: 'total' },
            { label: 'Low Stock', value: productStats.lowStock, icon: 'lowStock' },
            { label: 'Active Products', value: productStats.active, icon: 'active' },
            { label: 'Inventory Value', value: `$${productStats.totalValue.toFixed(2)}`, icon: 'totalValue' }
          ].map((stat, index) => (
            <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 hover:bg-white/20 transition-all duration-300 hover:scale-105 animate-slideUp border border-white/5" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="flex items-center gap-2">
                {getStatIcon(stat.icon)}
                <p className="text-xs text-indigo-200">{stat.label}</p>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ===== CONTROLS ===== */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-300">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative flex-1 min-w-[200px] group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-indigo-500 transition-colors w-4 h-4" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="🔍 Search by name, barcode..."
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 group-hover:border-indigo-300"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:border-indigo-300"
            >
              <option value="all">All Products</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="lowStock">Low Stock</option>
            </select>

            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none px-2"
              >
                <option value="NAME_EN">Name</option>
                <option value="SALEOUT_PRICE">Price</option>
                <option value="QtyInStock">Stock</option>
                <option value="BARCODE">Barcode</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-gray-600 transition-all duration-300 hover:scale-110"
              >
                {sortOrder === 'asc' ? <ArrowUp className="w-4 h-4 text-gray-500" /> : <ArrowDown className="w-4 h-4 text-gray-500" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all duration-300 hover:scale-110 ${
                  viewMode === 'grid' 
                    ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-600' 
                    : 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300'
                }`}
                title="Grid view"
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all duration-300 hover:scale-110 ${
                  viewMode === 'list' 
                    ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-600' 
                    : 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300'
                }`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {selectedProducts.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="px-3 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-300 hover:scale-105 flex items-center gap-2 text-sm shadow-lg shadow-red-600/20"
              >
                <Trash2 className="w-4 h-4" />
                Delete ({selectedProducts.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ===== PRODUCTS DISPLAY ===== */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 animate-ping" />
            </div>
          </div>
          <p className="text-gray-400 font-medium">Loading products...</p>
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0s' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center hover:shadow-lg transition-all duration-300">
          <Package className="w-20 h-20 mx-auto text-gray-300 dark:text-gray-600 mb-4 animate-float" />
          <h3 className="text-xl font-medium text-gray-600 dark:text-gray-400">No products found</h3>
          <p className="text-gray-400 dark:text-gray-500 mt-2">
            {search ? 'Try adjusting your search or filters' : 'Add your first product to get started'}
          </p>
          <button
            onClick={openAddModal}
            className="mt-4 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105 font-medium"
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Add Product
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product, index) => {
            const id = product.PRODUCT_ID || product.product_id || `prod-${index}`;
            const nameEn = product.NAME_EN || product.name_en || 'Unknown';
            const nameKh = product.NAME_KH || product.name_kh || '';
            const barcode = product.BARCODE || product.barcode || '-';
            const brand = product.BRAND || product.brand || '';
            const buyPrice = Number(product.BUYIN_PRICE || product.buy_price || 0);
            const salePrice = Number(product.SALEOUT_PRICE || product.saleout_price || 0);
            const stock = Number(product.QtyInStock || product.qty_instock || 0);
            const alertLevel = Number(product.QTY_ALERT || product.qty_alert || 10);
            const status = product.STATUS || product.status || 'Active';
            const isLow = stock <= alertLevel;
            const stockBadge = getStockBadge(stock, alertLevel);
            const isSelected = selectedProducts.includes(id);
            const productIcon = getProductIcon(nameEn);
            
            const rawImage = product.image_url || product.IMAGE_URL || '';
            const imageUrl = (isValidImage(rawImage) && rawImage) ? rawImage : '';

            return (
              <div
                key={id}
                className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-2 transition-all duration-500 hover:shadow-xl hover:-translate-y-2 group animate-fadeIn cursor-pointer ${
                  isSelected ? 'border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/30' : 'border-gray-100 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                } ${isLow ? 'hover:border-amber-400 dark:hover:border-amber-600' : ''}`}
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => toggleSelect(id)}
              >
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      {imageUrl ? (
                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                          <img 
                            src={imageUrl} 
                            alt={nameEn}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.log(`❌ Image failed to load for: ${nameEn}`);
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = `<span class="text-2xl">${productIcon}</span>`;
                            }}
                          />
                        </div>
                      ) : (
                        <div className={`p-3 rounded-2xl text-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 ${
                          isLow 
                            ? 'bg-amber-50 dark:bg-amber-900/20' 
                            : 'bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20'
                        }`}>
                          <span>{productIcon}</span>
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-800 dark:text-white text-sm truncate max-w-[120px] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {nameEn}
                        </h3>
                        {nameKh && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[120px]">
                            {nameKh}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(product);
                        }}
                        className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(id);
                        }}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="text-[10px] bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full text-gray-500 dark:text-gray-400 font-mono group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors">
                      {barcode}
                    </span>
                    {brand && (
                      <span className="text-[10px] bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded-full text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
                        {brand}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="text-xs text-gray-400">Sale Price</p>
                      <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                        {formatPrice(salePrice)}
                      </p>
                    </div>
                    {buyPrice > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Buy Price</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatPrice(buyPrice)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-all duration-300 ${stockBadge.color} group-hover:scale-105`}>
                        <stockBadge.icon className="w-3 h-3" />
                        {stock} in stock
                      </span>
                      {isLow && (
                        <span className="text-[10px] text-amber-500 font-medium animate-pulse flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Low stock!
                        </span>
                      )}
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-all duration-300 ${getStatusBadge(status)} group-hover:scale-105`}>
                      {status === 'Active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50">
                <tr>
                  <th className="px-3 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === products.length && products.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Product</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">Barcode</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">Buy Price</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sale Price</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Stock</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">Status</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredProducts.map((product, index) => {
                  const id = product.PRODUCT_ID || product.product_id || `prod-${index}`;
                  const nameEn = product.NAME_EN || product.name_en || 'Unknown';
                  const nameKh = product.NAME_KH || product.name_kh || '';
                  const barcode = product.BARCODE || product.barcode || '-';
                  const buyPrice = Number(product.BUYIN_PRICE || product.buy_price || 0);
                  const salePrice = Number(product.SALEOUT_PRICE || product.saleout_price || 0);
                  const stock = Number(product.QtyInStock || product.qty_instock || 0);
                  const alertLevel = Number(product.QTY_ALERT || product.qty_alert || 10);
                  const status = product.STATUS || product.status || 'Active';
                  const isLow = stock <= alertLevel;
                  const stockBadge = getStockBadge(stock, alertLevel);
                  const isSelected = selectedProducts.includes(id);
                  
                  const rawImage = product.image_url || product.IMAGE_URL || '';
                  const imageUrl = (isValidImage(rawImage) && rawImage) ? rawImage : '';

                  return (
                    <tr 
                      key={id} 
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-all duration-300 group animate-slideIn ${
                        isSelected ? 'bg-indigo-50 dark:bg-indigo-900/10' : ''
                      } ${isLow ? 'hover:bg-amber-50/50 dark:hover:bg-amber-900/5' : ''}`}
                      style={{ animationDelay: `${index * 0.03}s` }}
                    >
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(id)}
                          className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          {imageUrl ? (
                            <img 
                              src={imageUrl} 
                              alt={nameEn}
                              className="w-10 h-10 rounded-lg object-cover bg-gray-100 dark:bg-gray-700"
                              onError={(e) => {
                                console.log(`❌ Image failed to load for: ${nameEn}`);
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <span className="text-xl">{getProductIcon(nameEn)}</span>
                          )}
                          <div>
                            <p className="font-medium text-sm dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {nameEn}
                            </p>
                            {nameKh && <p className="text-xs text-gray-400 dark:text-gray-500">{nameKh}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400 font-mono hidden md:table-cell">
                        {barcode}
                      </td>
                      <td className="px-3 py-3 text-sm text-right text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                        {formatPrice(buyPrice)}
                      </td>
                      <td className="px-3 py-3 text-sm text-right font-medium dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {formatPrice(salePrice)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-all duration-300 ${stockBadge.color} group-hover:scale-105`}>
                          <stockBadge.icon className="w-3 h-3" />
                          {stock}
                        </span>
                        {isLow && (
                          <span className="ml-1 text-[10px] text-amber-500 animate-pulse">⚠</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center hidden sm:table-cell">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-all duration-300 ${getStatusBadge(status)} group-hover:scale-105`}>
                          {status === 'Active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(product)}
                            className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300 group-hover:scale-110"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(id)}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300 group-hover:scale-110"
                            title="Delete"
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
        </div>
      )}

      {/* ===== FOOTER ===== */}
      <div className="text-center text-xs text-gray-400 dark:text-gray-500 py-4 border-t border-gray-200 dark:border-gray-700">
        <p className="flex items-center justify-center gap-4 flex-wrap">
          <span>📦 {filteredProducts.length} products displayed</span>
          <span>•</span>
          <span>💾 {productStats.total} total in inventory</span>
          <span>•</span>
          <span>⚠️ {productStats.lowStock} low stock alerts</span>
          <span>•</span>
          <span>💰 ${productStats.totalValue.toFixed(2)} total value</span>
          <span>•</span>
          <span>{new Date().toLocaleString()}</span>
        </p>
      </div>

      {/* ============================================ */}
      {/* ===== MODAL WITH IMAGE UPLOAD ===== */}
      {/* ============================================ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-slideUp">
            <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600 animate-bounce" />
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-300 hover:rotate-90"
                disabled={submitting}
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                
                {/* ===== IMAGE UPLOAD SECTION ===== */}
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-indigo-500" />
                    Product Image
                  </label>
                  
                  {imagePreview ? (
                    <div className="relative mb-3">
                      <div className="w-full h-48 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600">
                        <img 
                          src={imagePreview} 
                          alt="Product preview" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-300 hover:scale-110 shadow-lg"
                        disabled={isUploading}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="mb-3 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-center text-gray-400 dark:text-gray-500">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No image uploaded</p>
                      <p className="text-xs">Click "Upload Image" to add one</p>
                    </div>
                  )}

                  {isUploading && (
                    <div className="mb-3">
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <span>Processing image, please wait...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 px-4 py-2.5 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-500 transition-all duration-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 group flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={submitting || isUploading}
                    >
                      {isUploading ? (
                        <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                      )}
                      <span className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {isUploading ? 'Processing...' : imagePreview ? 'Change Image' : 'Upload Image'}
                      </span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      disabled={submitting || isUploading}
                    />
                    {imagePreview && (
                      <button
                        type="button"
                        onClick={removeImage}
                        className="px-3 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-300 hover:scale-105 disabled:opacity-50"
                        disabled={isUploading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                    Supported: All image formats (JPG, PNG, WEBP, GIF, AVIF, BMP, SVG, etc.)
                  </p>
                </div>

                {/* ===== Name EN ===== */}
                <div className="group">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
                    Name (English) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.NAME_EN}
                    onChange={(e) => setFormData({...formData, NAME_EN: e.target.value})}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 group-hover:border-indigo-300"
                    placeholder="Enter product name in English"
                    disabled={submitting}
                  />
                </div>

                {/* ===== Name KH ===== */}
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name (Khmer)</label>
                  <input
                    type="text"
                    value={formData.NAME_KH}
                    onChange={(e) => setFormData({...formData, NAME_KH: e.target.value})}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 group-hover:border-indigo-300"
                    placeholder="Enter product name in Khmer"
                    disabled={submitting}
                  />
                </div>

                {/* ===== Barcode & Brand ===== */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="group">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Barcode</label>
                    <input
                      type="text"
                      value={formData.BARCODE}
                      onChange={(e) => setFormData({...formData, BARCODE: e.target.value})}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 group-hover:border-indigo-300"
                      placeholder="Enter barcode"
                      disabled={submitting}
                    />
                  </div>
                  <div className="group">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Brand</label>
                    <input
                      type="text"
                      value={formData.BRAND}
                      onChange={(e) => setFormData({...formData, BRAND: e.target.value})}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 group-hover:border-indigo-300"
                      placeholder="Enter brand name"
                      disabled={submitting}
                    />
                  </div>
                </div>

                {/* ===== Prices ===== */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="group">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Buy Price (USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.BUYIN_PRICE}
                      onChange={(e) => setFormData({...formData, BUYIN_PRICE: e.target.value})}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 group-hover:border-indigo-300"
                      placeholder="0.00"
                      disabled={submitting}
                    />
                  </div>
                  <div className="group">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
                      Sale Price (USD) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.SALEOUT_PRICE}
                      onChange={(e) => setFormData({...formData, SALEOUT_PRICE: e.target.value})}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 group-hover:border-indigo-300"
                      placeholder="0.00"
                      disabled={submitting}
                    />
                  </div>
                </div>

                {/* ===== Stock ===== */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="group">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Stock Alert Level</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.QTY_ALERT}
                      onChange={(e) => setFormData({...formData, QTY_ALERT: e.target.value})}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 group-hover:border-indigo-300"
                      disabled={submitting}
                    />
                  </div>
                  {!editingProduct && (
                    <div className="group">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Initial Stock</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.QTY_INSTOCK}
                        onChange={(e) => setFormData({...formData, QTY_INSTOCK: e.target.value})}
                        className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 group-hover:border-indigo-300"
                        disabled={submitting}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* ===== Actions ===== */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="px-6 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 dark:text-white font-medium disabled:opacity-50"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  disabled={submitting || isUploading}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing image...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {editingProduct ? 'Update Product' : 'Save Product'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;