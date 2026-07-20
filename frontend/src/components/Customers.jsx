import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import { 
  Search, Plus, Edit2, Trash2, Users as UsersIcon, 
  X, Save, DollarSign, Phone, Mail, MapPin, User,
  RefreshCw, AlertCircle, CheckCircle, Loader2,
  Filter, ArrowUp, ArrowDown, Grid3x3, List,
  TrendingUp, TrendingDown, Award, Star, Clock,
  Calendar, ChevronRight, Eye, Copy, Tag, Layers,
  Box, MessageCircle, Heart, Shield, Zap
} from 'lucide-react';

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
// MAIN CUSTOMERS COMPONENT
// ============================================
const Customers = () => {
  // ===== STATE =====
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [customerStats, setCustomerStats] = useState({
    total: 0,
    active: 0,
    withPhone: 0,
    totalBalance: 0
  });

  // ===== FORM DATA =====
  const [formData, setFormData] = useState({
    FIRST_NAME: '',
    LAST_NAME: '',
    PHONE: '',
    E_MAIL: '',
    ADDRESS: '',
    BALANCE: '',
    STATUS: 'Active'
  });

  // ===== REFS =====
  const isMounted = useRef(true);
  const searchTimeout = useRef(null);

  // ===== INITIAL LOAD =====
  useEffect(() => {
    isMounted.current = true;
    fetchCustomers();

    return () => {
      isMounted.current = false;
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  // ===== SEARCH DEBOUNCE =====
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(() => {
      fetchCustomers();
    }, 500);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [search]);

  // ===== FETCH CUSTOMERS =====
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/customers', { 
        params: { search: search || undefined } 
      });
      if (isMounted.current) {
        const data = res.data || [];
        setCustomers(data);
        calculateStats(data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      if (isMounted.current) {
        showMessage('❌ Failed to load customers', 'error');
        // Fallback data
        const fallbackData = [
          { CUS_ID: '1', FIRST_NAME: 'John', LAST_NAME: 'Doe', PHONE: '555-0101', E_MAIL: 'john@example.com', ADDRESS: '123 Main St, NY', BALANCE: 150.00, STATUS: 'Active' },
          { CUS_ID: '2', FIRST_NAME: 'Jane', LAST_NAME: 'Smith', PHONE: '555-0102', E_MAIL: 'jane@example.com', ADDRESS: '456 Oak Ave, LA', BALANCE: 0.00, STATUS: 'Active' },
          { CUS_ID: '3', FIRST_NAME: 'Robert', LAST_NAME: 'Johnson', PHONE: '555-0103', E_MAIL: 'robert@example.com', ADDRESS: '789 Pine Rd, SF', BALANCE: 75.50, STATUS: 'Active' },
          { CUS_ID: '4', FIRST_NAME: 'Mary', LAST_NAME: 'Williams', PHONE: '555-0104', E_MAIL: 'mary@example.com', ADDRESS: '321 Elm St, CHI', BALANCE: 200.00, STATUS: 'Active' },
          { CUS_ID: '5', FIRST_NAME: 'David', LAST_NAME: 'Brown', PHONE: '', E_MAIL: '', ADDRESS: '', BALANCE: 0.00, STATUS: 'Inactive' },
        ];
        setCustomers(fallbackData);
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
      active: data.filter(c => (c.STATUS || c.status || 'Active') === 'Active').length,
      withPhone: data.filter(c => c.PHONE || c.phone).length,
      totalBalance: data.reduce((sum, c) => sum + Number(c.BALANCE || c.balance || 0), 0)
    };
    setCustomerStats(stats);
  }, []);

  // ===== SHOW MESSAGE =====
  const showMessage = useCallback((text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
    const timer = setTimeout(() => setMessage(''), 5000);
    return () => clearTimeout(timer);
  }, []);

  // ===== HANDLE SUBMIT =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    if (!formData.FIRST_NAME || !formData.LAST_NAME) {
      showMessage('❌ First name and last name are required', 'error');
      setSubmitting(false);
      return;
    }

    try {
      const submitData = {
        ...formData,
        BALANCE: formData.BALANCE ? parseFloat(formData.BALANCE) : 0
      };

      if (editingCustomer) {
        const customerId = editingCustomer.CUS_ID || editingCustomer.cus_id || editingCustomer.ID;
        await api.put(`/api/customers/${customerId}`, submitData);
        showMessage('✅ Customer updated successfully!');
      } else {
        await api.post('/api/customers', submitData);
        showMessage('✅ Customer created successfully!');
      }
      
      setShowModal(false);
      setEditingCustomer(null);
      resetForm();
      fetchCustomers();
    } catch (error) {
      console.error('Submit error:', error.response?.data || error.message);
      showMessage(`❌ ${error.response?.data?.error || 'Failed to save customer'}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ===== HANDLE DELETE =====
  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    
    try {
      await api.delete(`/api/customers/${id}`);
      showMessage('✅ Customer deleted successfully!');
      fetchCustomers();
    } catch (error) {
      console.error('Delete error:', error);
      showMessage('❌ Failed to delete customer', 'error');
    }
  }, [fetchCustomers, showMessage]);

  // ===== BULK DELETE =====
  const handleBulkDelete = useCallback(async () => {
    if (selectedCustomers.length === 0) return;
    if (!window.confirm(`Delete ${selectedCustomers.length} selected customers?`)) return;

    try {
      for (const id of selectedCustomers) {
        await api.delete(`/api/customers/${id}`);
      }
      showMessage(`✅ ${selectedCustomers.length} customers deleted!`);
      setSelectedCustomers([]);
      fetchCustomers();
    } catch (error) {
      console.error('Bulk delete error:', error);
      showMessage('❌ Failed to delete some customers', 'error');
    }
  }, [selectedCustomers, fetchCustomers, showMessage]);

  // ===== RESET FORM =====
  const resetForm = useCallback(() => {
    setFormData({ 
      FIRST_NAME: '', 
      LAST_NAME: '', 
      PHONE: '', 
      E_MAIL: '', 
      ADDRESS: '', 
      BALANCE: '',
      STATUS: 'Active' 
    });
  }, []);

  // ===== OPEN MODAL =====
  const openEditModal = useCallback((customer) => {
    setEditingCustomer(customer);
    setFormData({
      FIRST_NAME: customer.FIRST_NAME || customer.first_name || '',
      LAST_NAME: customer.LAST_NAME || customer.last_name || '',
      PHONE: customer.PHONE || customer.phone || '',
      E_MAIL: customer.E_MAIL || customer.e_mail || '',
      ADDRESS: customer.ADDRESS || customer.address || '',
      BALANCE: customer.BALANCE || customer.balance || '',
      STATUS: customer.STATUS || customer.status || 'Active'
    });
    setShowModal(true);
  }, []);

  const openAddModal = useCallback(() => {
    setEditingCustomer(null);
    resetForm();
    setShowModal(true);
  }, [resetForm]);

  // ===== TOGGLE SELECT =====
  const toggleSelect = useCallback((id) => {
    setSelectedCustomers(prev => {
      if (prev.includes(id)) {
        return prev.filter(p => p !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);

  // ===== TOGGLE SELECT ALL =====
  const toggleSelectAll = useCallback(() => {
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(customers.map(c => c.CUS_ID || c.cus_id || c.ID));
    }
  }, [selectedCustomers, customers]);

  // ===== FILTERED & SORTED CUSTOMERS =====
  const filteredCustomers = useMemo(() => {
    let result = [...customers];

    if (filterStatus === 'active') {
      result = result.filter(c => (c.STATUS || c.status || 'Active') === 'Active');
    } else if (filterStatus === 'inactive') {
      result = result.filter(c => (c.STATUS || c.status || 'Active') !== 'Active');
    } else if (filterStatus === 'withBalance') {
      result = result.filter(c => Number(c.BALANCE || c.balance || 0) > 0);
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
  }, [customers, filterStatus, sortBy, sortOrder]);

  // ===== FORMAT NAME =====
  const getFullName = (customer) => {
    const firstName = customer.FIRST_NAME || customer.first_name || '';
    const lastName = customer.LAST_NAME || customer.last_name || '';
    return `${firstName} ${lastName}`.trim() || 'Unknown';
  };

  // ===== GET INITIALS =====
  const getInitials = (customer) => {
    const firstName = customer.FIRST_NAME || customer.first_name || '';
    const lastName = customer.LAST_NAME || customer.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?';
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

  // ===== FORMAT PHONE =====
  const formatPhone = (phone) => {
    if (!phone) return '-';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

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
      total: <UsersIcon className="w-5 h-5 text-indigo-500" />,
      active: <CheckCircle className="w-5 h-5 text-emerald-500" />,
      withPhone: <Phone className="w-5 h-5 text-yellow-500" />,
      totalBalance: <DollarSign className="w-5 h-5 text-purple-500" />
    };
    return icons[type] || icons.total;
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

      {/* ===== HEADER WITH STATS ===== */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-wrap justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <UsersIcon className="w-8 h-8" />
              Customer Management
            </h1>
            <p className="text-indigo-100 mt-1 text-sm">Manage your customer relationships and accounts</p>
          </div>
          <div className="flex items-center gap-3 mt-3 sm:mt-0">
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {new Date().toLocaleTimeString()}
            </div>
            <button 
              onClick={() => {
                setIsRefreshing(true);
                fetchCustomers();
              }}
              disabled={isRefreshing}
              className="bg-white/20 backdrop-blur-sm p-2 rounded-xl hover:bg-white/30 transition"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={openAddModal}
              className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl hover:bg-white/30 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Customer
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {[
            { label: 'Total Customers', value: customerStats.total, icon: 'total' },
            { label: 'Active Customers', value: customerStats.active, icon: 'active' },
            { label: 'With Phone', value: customerStats.withPhone, icon: 'withPhone' },
            { label: 'Total Balance', value: `$${customerStats.totalBalance.toFixed(2)}`, icon: 'totalBalance' }
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
                placeholder="🔍 Search by name, phone, email..."
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            {/* Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            >
              <option value="all">All Customers</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="withBalance">With Balance</option>
            </select>

            {/* Sort */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none px-2"
              >
                <option value="name">Name</option>
                <option value="BALANCE">Balance</option>
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
            {selectedCustomers.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="px-3 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition flex items-center gap-2 text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Delete ({selectedCustomers.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ===== CUSTOMERS GRID ===== */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 animate-ping" />
            </div>
          </div>
          <p className="text-gray-400 font-medium">Loading customers...</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
          <UsersIcon className="w-20 h-20 mx-auto text-gray-300 dark:text-gray-600 mb-4 animate-float" />
          <h3 className="text-xl font-medium text-gray-600 dark:text-gray-400">No customers found</h3>
          <p className="text-gray-400 dark:text-gray-500 mt-2">
            {search ? 'Try adjusting your search or filters' : 'Add your first customer to get started'}
          </p>
          <button
            onClick={openAddModal}
            className="mt-4 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition font-medium"
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Add Customer
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        // ===== GRID VIEW =====
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCustomers.map((customer, index) => {
            const id = customer.CUS_ID || customer.cus_id || customer.ID;
            const fullName = getFullName(customer);
            const initials = getInitials(customer);
            const avatarColor = getAvatarColor(fullName);
            const phone = customer.PHONE || customer.phone || '';
            const email = customer.E_MAIL || customer.e_mail || '';
            const address = customer.ADDRESS || customer.address || '';
            const balance = Number(customer.BALANCE || customer.balance || 0);
            const status = customer.STATUS || customer.status || 'Active';
            const isSelected = selectedCustomers.includes(id);

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
                          {fullName}
                        </h3>
                        {address && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[120px] flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {address}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(customer);
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
                        {formatPhone(phone)}
                      </p>
                    )}
                    {email && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        <span className="truncate">{email}</span>
                      </p>
                    )}
                  </div>

                  {/* Balance & Status */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <div className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(status)}`}>
                        {status}
                      </div>
                      {balance > 0 && (
                        <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                          ${balance.toFixed(2)}
                        </span>
                      )}
                    </div>
                    {balance > 0 && (
                      <div className="flex items-center gap-1">
                        <div className="w-1 h-4 bg-purple-400 rounded-full animate-bar1" />
                        <div className="w-1 h-6 bg-purple-500 rounded-full animate-bar2" />
                        <div className="w-1 h-8 bg-purple-600 rounded-full animate-bar3" />
                      </div>
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
                      checked={selectedCustomers.length === customers.length && customers.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Customer</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">Phone</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">Email</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">Address</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Balance</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredCustomers.map((customer, index) => {
                  const id = customer.CUS_ID || customer.cus_id || customer.ID;
                  const fullName = getFullName(customer);
                  const phone = customer.PHONE || customer.phone || '';
                  const email = customer.E_MAIL || customer.e_mail || '';
                  const address = customer.ADDRESS || customer.address || '';
                  const balance = Number(customer.BALANCE || customer.balance || 0);
                  const status = customer.STATUS || customer.status || 'Active';
                  const isSelected = selectedCustomers.includes(id);

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
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs ${getAvatarColor(fullName)}`}>
                            {getInitials(customer)}
                          </div>
                          <span className="font-medium text-sm dark:text-white">{fullName}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                        {phone ? <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-emerald-500" /> {formatPhone(phone)}</span> : '-'}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">
                        {email || '-'}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-400 dark:text-gray-500 hidden lg:table-cell">
                        {address || '-'}
                      </td>
                      <td className="px-3 py-3 text-sm font-medium text-right dark:text-white">
                        ${balance.toFixed(2)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(status)}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(customer)}
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
          <span>👥 {filteredCustomers.length} customers displayed</span>
          <span>•</span>
          <span>💾 {customerStats.total} total customers</span>
          <span>•</span>
          <span>💰 ${customerStats.totalBalance.toFixed(2)} total balance</span>
          <span>•</span>
          <span>{new Date().toLocaleString()}</span>
        </p>
      </div>

      {/* ===== MODAL ===== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-slideUp">
            <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                <UsersIcon className="w-5 h-5 text-indigo-600" />
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h2>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition"
                disabled={submitting}
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.FIRST_NAME}
                      onChange={(e) => setFormData({...formData, FIRST_NAME: e.target.value})}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      placeholder="First name"
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.LAST_NAME}
                      onChange={(e) => setFormData({...formData, LAST_NAME: e.target.value})}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      placeholder="Last name"
                      disabled={submitting}
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    Phone
                  </label>
                  <input
                    type="text"
                    value={formData.PHONE}
                    onChange={(e) => setFormData({...formData, PHONE: e.target.value})}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    placeholder="Enter phone number"
                    disabled={submitting}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.E_MAIL}
                    onChange={(e) => setFormData({...formData, E_MAIL: e.target.value})}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    placeholder="Enter email address"
                    disabled={submitting}
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.ADDRESS}
                    onChange={(e) => setFormData({...formData, ADDRESS: e.target.value})}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    placeholder="Enter address"
                    disabled={submitting}
                  />
                </div>

                {/* Balance */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    Balance (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.BALANCE}
                    onChange={(e) => setFormData({...formData, BALANCE: e.target.value})}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    placeholder="0.00"
                    disabled={submitting}
                  />
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Customer's current balance (default: 0.00)
                  </p>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
                  <select
                    value={formData.STATUS}
                    onChange={(e) => setFormData({...formData, STATUS: e.target.value})}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    disabled={submitting}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="px-6 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition dark:text-white font-medium disabled:opacity-50"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {editingCustomer ? 'Update Customer' : 'Create Customer'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== CSS ANIMATIONS ===== */}
      <style jsx>{`
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

        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; opacity: 0; }
        .animate-slideIn { animation: slideIn 0.4s ease-out forwards; opacity: 0; }
        .animate-slideInRight { animation: slideInRight 0.5s ease-out forwards; }
        .animate-slideUp { animation: slideUp 0.4s ease-out forwards; opacity: 0; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-bar1 { animation: bar1 1.5s ease-in-out infinite; }
        .animate-bar2 { animation: bar2 1.5s ease-in-out infinite; }
        .animate-bar3 { animation: bar3 1.5s ease-in-out infinite; }
        .animate-pulse { animation: pulse 2s ease-in-out infinite; }

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

export default Customers;