import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import { 
  Search, Plus, Edit2, Trash2, Truck, X, Save, 
  Phone, Mail, MapPin, User, Building2, RefreshCw,
  Filter, ArrowUp, ArrowDown, Grid3x3, List,
  Clock, CheckCircle, AlertCircle,
  Eye, Globe, Shield,
  Download, AlertTriangle,
  FileText, Loader2, Star, Award
} from 'lucide-react';

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
// MAIN SUPPLIERS COMPONENT
// ============================================
const Suppliers = () => {
  // ===== STATE =====
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('SUP_NAME');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSupplierDetail, setSelectedSupplierDetail] = useState(null);
  const [supplierStats, setSupplierStats] = useState({
    total: 0,
    active: 0,
    withPhone: 0,
    withEmail: 0
  });

  // ===== FORM DATA =====
  const [formData, setFormData] = useState({
    SUP_NAME: '',
    CONTACT_PERSON: '',
    PHONE: '',
    ADDRESS: '',
    EMAIL: '',
    STATUS: 'Active',
    WEBSITE: '',
    TAX_ID: '',
    NOTES: ''
  });

  // ===== REFS =====
  const isMounted = useRef(true);
  const searchTimeout = useRef(null);

  // ===== FETCH SUPPLIERS - FIXED ✅ =====
  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      // ✅ FIXED: Removed '/api' prefix
      const res = await api.get('/suppliers', { 
        params: { search: search || undefined } 
      });
      
      if (isMounted.current) {
        const data = res.data || [];
        setSuppliers(data);
        calculateStats(data);
      }
    } catch (error) {
      console.error('❌ Error fetching suppliers:', error);
      if (isMounted.current) {
        showMessage('❌ Failed to load suppliers', 'error');
        // Fallback data
        const fallbackData = [
          { SUP_ID: 'SUP001', SUP_NAME: 'TechPro Supplies', CONTACT_PERSON: 'John Smith', PHONE: '555-0101', EMAIL: 'john@techpro.com', ADDRESS: '123 Tech St, Silicon Valley', STATUS: 'Active', WEBSITE: 'techpro.com', TAX_ID: 'TAX-001' },
          { SUP_ID: 'SUP002', SUP_NAME: 'Global Electronics', CONTACT_PERSON: 'Sarah Johnson', PHONE: '555-0102', EMAIL: 'sarah@globalelec.com', ADDRESS: '456 Global Ave, NYC', STATUS: 'Active', WEBSITE: 'globalelec.com', TAX_ID: 'TAX-002' },
          { SUP_ID: 'SUP003', SUP_NAME: 'Prime Components', CONTACT_PERSON: 'Robert Wilson', PHONE: '555-0103', EMAIL: 'robert@primecomp.com', ADDRESS: '789 Prime Rd, Chicago', STATUS: 'Active', WEBSITE: 'primecomp.com', TAX_ID: 'TAX-003' },
          { SUP_ID: 'SUP004', SUP_NAME: 'Quality Parts Co', CONTACT_PERSON: 'Mary Brown', PHONE: '555-0104', EMAIL: 'mary@qualityparts.com', ADDRESS: '321 Quality Ln, LA', STATUS: 'Inactive', WEBSITE: 'qualityparts.com', TAX_ID: 'TAX-004' },
          { SUP_ID: 'SUP005', SUP_NAME: 'Industrial Solutions', CONTACT_PERSON: 'James Davis', PHONE: '', EMAIL: '', ADDRESS: '111 Industrial Pkwy, Dallas', STATUS: 'Active', WEBSITE: '', TAX_ID: '' },
        ];
        setSuppliers(fallbackData);
        calculateStats(fallbackData);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [search]);

  // ===== CALCULATE STATS =====
  const calculateStats = useCallback((data) => {
    const stats = {
      total: data.length,
      active: data.filter(s => (s.STATUS || 'Active') === 'Active').length,
      withPhone: data.filter(s => s.PHONE && s.PHONE.trim() !== '').length,
      withEmail: data.filter(s => s.EMAIL && s.EMAIL.trim() !== '').length
    };
    setSupplierStats(stats);
  }, []);

  // ===== SHOW MESSAGE =====
  const showMessage = useCallback((text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
    const timer = setTimeout(() => setMessage(''), 5000);
    return () => clearTimeout(timer);
  }, []);

  // ===== INITIAL LOAD =====
  useEffect(() => {
    isMounted.current = true;
    fetchSuppliers();

    return () => {
      isMounted.current = false;
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [fetchSuppliers]);

  // ===== SEARCH DEBOUNCE =====
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(() => {
      fetchSuppliers();
    }, 500);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [search, fetchSuppliers]);

  // ===== HANDLE SUBMIT - FIXED ✅ =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    if (!formData.SUP_NAME || formData.SUP_NAME.trim() === '') {
      showMessage('❌ Supplier name is required', 'error');
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        STATUS: formData.STATUS || 'Active'
      };

      if (editingSupplier) {
        // ✅ FIXED: Removed '/api' prefix
        await api.put(`/suppliers/${editingSupplier.SUP_ID}`, payload);
        showMessage('✅ Supplier updated successfully!');
      } else {
        // ✅ FIXED: Removed '/api' prefix
        await api.post('/suppliers', payload);
        showMessage('✅ Supplier created successfully!');
      }
      
      setShowModal(false);
      setEditingSupplier(null);
      resetForm();
      fetchSuppliers();
    } catch (error) {
      console.error('Submit error:', error.response?.data || error.message);
      showMessage(`❌ ${error.response?.data?.error || 'Failed to save supplier'}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ===== HANDLE DELETE - FIXED ✅ =====
  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;
    
    try {
      // ✅ FIXED: Removed '/api' prefix
      await api.delete(`/suppliers/${id}`);
      showMessage('✅ Supplier deleted successfully!');
      fetchSuppliers();
    } catch (error) {
      console.error('Delete error:', error);
      showMessage('❌ Failed to delete supplier', 'error');
    }
  }, [fetchSuppliers, showMessage]);

  // ===== BULK DELETE - FIXED ✅ =====
  const handleBulkDelete = useCallback(async () => {
    if (selectedSuppliers.length === 0) return;
    if (!window.confirm(`Delete ${selectedSuppliers.length} selected suppliers?`)) return;

    try {
      for (const id of selectedSuppliers) {
        // ✅ FIXED: Removed '/api' prefix
        await api.delete(`/suppliers/${id}`);
      }
      showMessage(`✅ ${selectedSuppliers.length} suppliers deleted!`);
      setSelectedSuppliers([]);
      fetchSuppliers();
    } catch (error) {
      console.error('Bulk delete error:', error);
      showMessage('❌ Failed to delete some suppliers', 'error');
    }
  }, [selectedSuppliers, fetchSuppliers, showMessage]);

  // ===== RESET FORM =====
  const resetForm = useCallback(() => {
    setFormData({ 
      SUP_NAME: '', 
      CONTACT_PERSON: '', 
      PHONE: '', 
      ADDRESS: '', 
      EMAIL: '',
      STATUS: 'Active',
      WEBSITE: '',
      TAX_ID: '',
      NOTES: ''
    });
  }, []);

  // ===== OPEN MODAL =====
  const openEditModal = useCallback((supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      SUP_NAME: supplier.SUP_NAME || '',
      CONTACT_PERSON: supplier.CONTACT_PERSON || '',
      PHONE: supplier.PHONE || '',
      ADDRESS: supplier.ADDRESS || '',
      EMAIL: supplier.EMAIL || '',
      STATUS: supplier.STATUS || 'Active',
      WEBSITE: supplier.WEBSITE || '',
      TAX_ID: supplier.TAX_ID || '',
      NOTES: supplier.NOTES || ''
    });
    setShowModal(true);
  }, []);

  const openAddModal = useCallback(() => {
    setEditingSupplier(null);
    resetForm();
    setShowModal(true);
  }, [resetForm]);

  // ===== VIEW SUPPLIER DETAIL =====
  const viewSupplierDetail = useCallback((supplier) => {
    setSelectedSupplierDetail(supplier);
    setShowDetailModal(true);
  }, []);

  // ===== TOGGLE SELECT =====
  const toggleSelect = useCallback((id) => {
    setSelectedSuppliers(prev => {
      if (prev.includes(id)) {
        return prev.filter(p => p !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);

  // ===== TOGGLE SELECT ALL =====
  const toggleSelectAll = useCallback(() => {
    if (selectedSuppliers.length === suppliers.length) {
      setSelectedSuppliers([]);
    } else {
      setSelectedSuppliers(suppliers.map(s => s.SUP_ID));
    }
  }, [selectedSuppliers, suppliers]);

  // ===== EXPORT CSV =====
  const exportCSV = useCallback(() => {
    if (!suppliers.length) {
      showMessage('⚠️ No data to export', 'warning');
      return;
    }

    try {
      const headers = ['ID', 'Supplier Name', 'Contact Person', 'Phone', 'Email', 'Address', 'Status'];
      let csv = headers.join(',') + '\n';
      
      suppliers.forEach(s => {
        const row = [
          s.SUP_ID || '',
          `"${(s.SUP_NAME || '').replace(/"/g, '""')}"`,
          `"${(s.CONTACT_PERSON || '').replace(/"/g, '""')}"`,
          s.PHONE || '',
          s.EMAIL || '',
          `"${(s.ADDRESS || '').replace(/"/g, '""')}"`,
          s.STATUS || 'Active'
        ];
        csv += row.join(',') + '\n';
      });
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `suppliers_${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showMessage('✅ Suppliers exported successfully!', 'success');
    } catch (error) {
      console.error('Export error:', error);
      showMessage('❌ Failed to export suppliers', 'error');
    }
  }, [suppliers, showMessage]);

  // ===== REFRESH =====
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchSuppliers();
  }, [fetchSuppliers]);

  // ===== FILTERED & SORTED SUPPLIERS =====
  const filteredSuppliers = useMemo(() => {
    let result = [...suppliers];

    if (filterStatus === 'active') {
      result = result.filter(s => (s.STATUS || 'Active') === 'Active');
    } else if (filterStatus === 'inactive') {
      result = result.filter(s => (s.STATUS || 'Active') !== 'Active');
    } else if (filterStatus === 'withPhone') {
      result = result.filter(s => s.PHONE && s.PHONE.trim() !== '');
    } else if (filterStatus === 'withEmail') {
      result = result.filter(s => s.EMAIL && s.EMAIL.trim() !== '');
    }

    result.sort((a, b) => {
      let comparison = 0;
      const aVal = a[sortBy] || '';
      const bVal = b[sortBy] || '';
      
      if (typeof aVal === 'string') {
        comparison = aVal.localeCompare(bVal);
      } else if (typeof aVal === 'number') {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [suppliers, filterStatus, sortBy, sortOrder]);

  // ===== GET STATUS BADGE =====
  const getStatusBadge = (status) => {
    const isActive = (status || 'Active') === 'Active';
    return isActive 
      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800';
  };

  // ===== GET STAT ICON =====
  const getStatIcon = (type) => {
    const icons = {
      total: <Building2 className="w-5 h-5 text-indigo-500" />,
      active: <CheckCircle className="w-5 h-5 text-emerald-500" />,
      withPhone: <Phone className="w-5 h-5 text-yellow-500" />,
      withEmail: <Mail className="w-5 h-5 text-purple-500" />
    };
    return icons[type] || icons.total;
  };

  // ===== GET AVATAR COLOR =====
  const getAvatarColor = (name) => {
    const colors = [
      'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 
      'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-red-500', 'bg-orange-500', 'bg-teal-500'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // ===== GET INITIALS =====
  const getInitials = (name) => {
    if (!name || name === 'Unknown') return '?';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // ===== LOADING =====
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 animate-ping" />
          </div>
        </div>
        <p className="text-gray-400 font-medium">Loading suppliers...</p>
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
            </div>
            <div className="flex-1 text-sm font-medium">{message}</div>
            <button onClick={() => setMessage('')} className="flex-shrink-0 opacity-50 hover:opacity-100 transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ===== HEADER WITH STATS ===== */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-wrap justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Truck className="w-8 h-8" />
              Supplier Management
            </h1>
            <p className="text-indigo-100 mt-1 text-sm">Manage your supplier relationships and contacts</p>
          </div>
          <div className="flex items-center gap-3 mt-3 sm:mt-0">
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {new Date().toLocaleTimeString()}
            </div>
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-white/20 backdrop-blur-sm p-2 rounded-xl hover:bg-white/30 transition"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={exportCSV}
              className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl hover:bg-white/30 transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={openAddModal}
              className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl hover:bg-white/30 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Supplier
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {[
            { label: 'Total Suppliers', value: supplierStats.total, icon: 'total' },
            { label: 'Active', value: supplierStats.active, icon: 'active' },
            { label: 'With Phone', value: supplierStats.withPhone, icon: 'withPhone' },
            { label: 'With Email', value: supplierStats.withEmail, icon: 'withEmail' }
          ].map((stat, index) => (
            <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 hover:bg-white/20 transition animate-slideUp" style={{ animationDelay: `${index * 0.1}s` }}>
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
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="🔍 Search by name, contact, phone..."
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            {/* Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            >
              <option value="all">All Suppliers</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="withPhone">With Phone</option>
              <option value="withEmail">With Email</option>
            </select>

            {/* Sort */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none px-2"
              >
                <option value="SUP_NAME">Name</option>
                <option value="CONTACT_PERSON">Contact</option>
                <option value="PHONE">Phone</option>
                <option value="STATUS">Status</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-gray-600 transition"
              >
                {sortOrder === 'asc' ? <ArrowUp className="w-4 h-4 text-gray-500" /> : <ArrowDown className="w-4 h-4 text-gray-500" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode */}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                title="Grid view"
              >
                <Grid3x3 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                title="List view"
              >
                <List className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
            </div>

            {/* Bulk Actions */}
            {selectedSuppliers.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="px-3 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition flex items-center gap-2 text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Delete ({selectedSuppliers.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ===== SUPPLIERS GRID ===== */}
      {filteredSuppliers.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
          <Truck className="w-20 h-20 mx-auto text-gray-300 dark:text-gray-600 mb-4 animate-float" />
          <h3 className="text-xl font-medium text-gray-600 dark:text-gray-400">No suppliers found</h3>
          <p className="text-gray-400 dark:text-gray-500 mt-2">
            {search || filterStatus !== 'all' ? 'Try adjusting your search or filters' : 'Add your first supplier to get started'}
          </p>
          <button
            onClick={openAddModal}
            className="mt-4 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition font-medium"
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Add Supplier
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        // ===== GRID VIEW =====
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSuppliers.map((supplier, index) => {
            const id = supplier.SUP_ID;
            const name = supplier.SUP_NAME || 'Unknown';
            const contact = supplier.CONTACT_PERSON || '';
            const phone = supplier.PHONE || '';
            const email = supplier.EMAIL || '';
            const address = supplier.ADDRESS || '';
            const status = supplier.STATUS || 'Active';
            const initials = getInitials(name);
            const avatarColor = getAvatarColor(name);
            const isSelected = selectedSuppliers.includes(id);

            return (
              <div
                key={id}
                className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group animate-fadeIn cursor-pointer ${
                  isSelected ? 'border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/30' : 'border-gray-100 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => toggleSelect(id)}
              >
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg ${avatarColor} shadow-lg`}>
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-800 dark:text-white truncate max-w-[120px]">
                          {name}
                        </h3>
                        {contact ? (
                          <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[120px] flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {contact}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[120px] flex items-center gap-1">
                            <User className="w-3 h-3" />
                            No contact person
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          viewSupplierDetail(supplier);
                        }}
                        className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition opacity-0 group-hover:opacity-100"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(supplier);
                        }}
                        className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition opacity-0 group-hover:opacity-100"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(id);
                        }}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition opacity-0 group-hover:opacity-100"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1.5 mb-3">
                    {phone && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-emerald-500" />
                        {phone}
                      </p>
                    )}
                    {email && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        <span className="truncate">{email}</span>
                      </p>
                    )}
                    {address && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 truncate">
                        <MapPin className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                        <span className="truncate">{address}</span>
                      </p>
                    )}
                    {!phone && !email && !address && (
                      <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                        No contact information available
                      </p>
                    )}
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(status)}`}>
                      {status}
                    </span>
                    {supplier.WEBSITE && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {supplier.WEBSITE}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // ===== LIST VIEW =====
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50">
                <tr>
                  <th className="px-3 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedSuppliers.length === suppliers.length && suppliers.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Supplier</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">Contact Person</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">Phone</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">Email</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden xl:table-cell">Address</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredSuppliers.map((supplier, index) => {
                  const id = supplier.SUP_ID;
                  const name = supplier.SUP_NAME || 'Unknown';
                  const contact = supplier.CONTACT_PERSON || '';
                  const phone = supplier.PHONE || '';
                  const email = supplier.EMAIL || '';
                  const address = supplier.ADDRESS || '';
                  const status = supplier.STATUS || 'Active';
                  const isSelected = selectedSuppliers.includes(id);

                  return (
                    <tr 
                      key={id} 
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 transition group animate-slideIn ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/10' : ''}`}
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
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs ${getAvatarColor(name)}`}>
                            {getInitials(name)}
                          </div>
                          <span className="font-medium text-sm dark:text-white">{name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-600 dark:text-gray-300 hidden md:table-cell">
                        {contact || '-'}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                        {phone || '-'}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                        {email || '-'}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-400 dark:text-gray-500 hidden xl:table-cell">
                        {address || '-'}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(status)}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => viewSupplierDetail(supplier)}
                            className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition group-hover:scale-110"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(supplier)}
                            className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition group-hover:scale-110"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(id)}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition group-hover:scale-110"
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
          <span>🚚 {filteredSuppliers.length} suppliers displayed</span>
          <span>•</span>
          <span>💾 {supplierStats.total} total suppliers</span>
          <span>•</span>
          <span>📱 {supplierStats.withPhone} with phone</span>
          <span>•</span>
          <span>✉️ {supplierStats.withEmail} with email</span>
          <span>•</span>
          <span>{new Date().toLocaleString()}</span>
        </p>
      </div>

      {/* ===== REST OF COMPONENT (Modal, Detail Modal, CSS) ===== */}
      {/* The rest of your component remains the same */}
      
    </div>
  );
};

export default Suppliers;