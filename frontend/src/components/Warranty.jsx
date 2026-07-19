import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Shield, Plus, Edit2, Trash2, X, Save, RefreshCw, Wrench,
  Search, Filter, Download, Eye, CheckCircle, Clock,
  AlertCircle, Calendar, Info
} from 'lucide-react';

console.log('🔵 Warranty component file loaded');

const Warranty = () => {
  console.log('🟢 Warranty component RENDERING - component is mounted');

  // Use ref to track if component is mounted and if initial load is done
  const isMounted = useRef(true);
  const initialLoadDone = useRef(false);

  // Simple state with default data
  const [warranties, setWarranties] = useState([
    { WarrantyID: 1, CustomerID: 1, ProductID: 1, SerialNumber: 'SN-001', WarrantyPeriod: 12, WarrantyStartDate: '2024-01-01', WarrantyEndDate: '2025-01-01', Status: 'Active' },
    { WarrantyID: 2, CustomerID: 2, ProductID: 2, SerialNumber: 'SN-002', WarrantyPeriod: 24, WarrantyStartDate: '2023-06-01', WarrantyEndDate: '2025-06-01', Status: 'Active' },
    { WarrantyID: 3, CustomerID: 1, ProductID: 3, SerialNumber: 'SN-003', WarrantyPeriod: 12, WarrantyStartDate: '2022-01-01', WarrantyEndDate: '2023-01-01', Status: 'Expired' }
  ]);
  
  const [services, setServices] = useState([
    { ServiceID: 1, CustomerID: 1, ProductID: 1, SerialNumber: 'SN-001', IssueDescription: 'Screen cracked - needs replacement', ServiceType: 'Repair', Status: 'PENDING', ReceivedDate: '2024-01-15' },
    { ServiceID: 2, CustomerID: 2, ProductID: 2, SerialNumber: 'SN-002', IssueDescription: 'Battery not holding charge', ServiceType: 'Maintenance', Status: 'IN_PROGRESS', ReceivedDate: '2024-01-10' },
    { ServiceID: 3, CustomerID: 1, ProductID: 3, SerialNumber: 'SN-003', IssueDescription: 'Software update required', ServiceType: 'Maintenance', Status: 'COMPLETED', ReceivedDate: '2024-01-05' }
  ]);
  
  const [customers] = useState([
    { CUS_ID: 1, FIRST_NAME: 'John', LAST_NAME: 'Doe', PHONE: '555-0101', EMAIL: 'john@example.com' },
    { CUS_ID: 2, FIRST_NAME: 'Jane', LAST_NAME: 'Smith', PHONE: '555-0102', EMAIL: 'jane@example.com' },
    { CUS_ID: 3, FIRST_NAME: 'Robert', LAST_NAME: 'Johnson', PHONE: '555-0103', EMAIL: 'robert@example.com' }
  ]);
  
  const [products] = useState([
    { PRODUCT_ID: 1, NAME_EN: 'Laptop Pro X1', PRICE: 1299.99 },
    { PRODUCT_ID: 2, NAME_EN: 'Smartphone Ultra', PRICE: 899.99 },
    { PRODUCT_ID: 3, NAME_EN: 'Tablet Plus', PRICE: 499.99 }
  ]);

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('warranty');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Use useEffect with cleanup to prevent double execution
  useEffect(() => {
    console.log('📊 Warranty useEffect running');
    
    // Only run if not already loaded
    if (!initialLoadDone.current) {
      console.log('📊 Initial load - setting loading to false');
      initialLoadDone.current = true;
      setLoading(false);
    }
    
    // Cleanup function
    return () => {
      console.log('🧹 Warranty cleanup');
      isMounted.current = false;
    };
  }, []); // Empty dependency array - runs once

  // Memoized helper functions
  const getCustomerName = useCallback((item) => {
    if (item.FIRST_NAME || item.LAST_NAME) {
      return `${item.FIRST_NAME || ''} ${item.LAST_NAME || ''}`.trim() || 'Unknown';
    }
    if (item.first_name || item.last_name) {
      return `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Unknown';
    }
    return item.CustomerID ? `Customer #${item.CustomerID}` : 'Unknown';
  }, []);

  const getProductName = useCallback((item) => {
    if (item.PRODUCT_NAME) return item.PRODUCT_NAME;
    if (item.NAME_EN) return item.NAME_EN;
    if (item.name_en) return item.name_en;
    if (item.product_name) return item.product_name;
    return item.ProductID ? `Product #${item.ProductID}` : 'Unknown';
  }, []);

  const formatDate = useCallback((dateValue) => {
    if (!dateValue) return 'N/A';
    try {
      const date = new Date(dateValue);
      if (isNaN(date)) return 'N/A';
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return 'N/A';
    }
  }, []);

  const getStatusBadge = useCallback((status) => {
    const statusMap = {
      'ACTIVE': 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
      'Active': 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
      'EXPIRED': 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
      'Expired': 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
      'PENDING': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
      'Pending': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
      'IN_PROGRESS': 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
      'In Progress': 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
      'COMPLETED': 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
      'Completed': 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
    };
    const color = statusMap[status] || statusMap['Pending'];
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>
        {status || 'Pending'}
      </span>
    );
  }, []);

  // Memoized filtered data
  const filteredWarranties = useMemo(() => {
    let filtered = warranties;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(w => 
        getCustomerName(w).toLowerCase().includes(term) ||
        getProductName(w).toLowerCase().includes(term) ||
        (w.SerialNumber || '').toLowerCase().includes(term)
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(w => 
        (w.Status || '').toUpperCase() === statusFilter.toUpperCase()
      );
    }
    return filtered;
  }, [warranties, searchTerm, statusFilter, getCustomerName, getProductName]);

  const filteredServices = useMemo(() => {
    let filtered = services;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        getCustomerName(s).toLowerCase().includes(term) ||
        getProductName(s).toLowerCase().includes(term) ||
        (s.ServiceNo || '').toLowerCase().includes(term) ||
        (s.IssueDescription || '').toLowerCase().includes(term)
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => 
        (s.Status || '').toUpperCase() === statusFilter.toUpperCase()
      );
    }
    return filtered;
  }, [services, searchTerm, statusFilter, getCustomerName, getProductName]);

  // Memoized stats
  const stats = useMemo(() => ({
    totalWarranties: warranties.length,
    activeWarranties: warranties.filter(w => w.Status === 'Active' || w.Status === 'ACTIVE').length,
    expiredWarranties: warranties.filter(w => w.Status === 'Expired' || w.Status === 'EXPIRED').length,
    totalServices: services.length,
    pendingServices: services.filter(s => s.Status === 'Pending' || s.Status === 'PENDING').length,
    inProgressServices: services.filter(s => s.Status === 'IN_PROGRESS' || s.Status === 'In Progress').length
  }), [warranties, services]);

  // Show message with auto-clear
  const showMessage = useCallback((text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
    const timer = setTimeout(() => setMessage(''), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Export function
  const handleExport = useCallback(() => {
    const data = activeTab === 'warranty' ? filteredWarranties : filteredServices;
    if (data.length === 0) {
      showMessage('⚠️ No data to export', 'warning');
      return;
    }
    
    const headers = activeTab === 'warranty' 
      ? ['ID', 'Customer', 'Product', 'Serial', 'Start Date', 'End Date', 'Status']
      : ['ID', 'Customer', 'Product', 'Issue', 'Status', 'Date'];
    
    let csv = headers.join(',') + '\n';
    data.forEach(item => {
      const row = activeTab === 'warranty' 
        ? [item.WarrantyID, getCustomerName(item), getProductName(item), item.SerialNumber, 
           formatDate(item.WarrantyStartDate), formatDate(item.WarrantyEndDate), item.Status]
        : [item.ServiceID, getCustomerName(item), getProductName(item), 
           (item.IssueDescription || '').replace(/,/g, ';'), item.Status, formatDate(item.ReceivedDate)];
      csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${activeTab}_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    
    showMessage(`✅ Exported ${data.length} records successfully!`);
  }, [activeTab, filteredWarranties, filteredServices, getCustomerName, getProductName, formatDate, showMessage]);

  // Delete handler
  const handleDelete = useCallback((id, type) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    if (type === 'warranty') {
      setWarranties(prev => prev.filter(w => w.WarrantyID !== id));
    } else {
      setServices(prev => prev.filter(s => s.ServiceID !== id));
    }
    showMessage('✅ Deleted successfully!');
  }, [showMessage]);

  // Add new item
  const handleAddNew = useCallback(() => {
    if (activeTab === 'warranty') {
      const newWarranty = {
        WarrantyID: warranties.length + 1,
        CustomerID: 1,
        ProductID: 1,
        SerialNumber: `SN-${String(warranties.length + 1).padStart(3, '0')}`,
        WarrantyPeriod: 12,
        WarrantyStartDate: new Date().toISOString().split('T')[0],
        WarrantyEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        Status: 'Active'
      };
      setWarranties(prev => [...prev, newWarranty]);
    } else {
      const newService = {
        ServiceID: services.length + 1,
        CustomerID: 1,
        ProductID: 1,
        SerialNumber: `SN-${String(services.length + 1).padStart(3, '0')}`,
        IssueDescription: 'New service request',
        ServiceType: 'Repair',
        Status: 'PENDING',
        ReceivedDate: new Date().toISOString().split('T')[0]
      };
      setServices(prev => [...prev, newService]);
    }
    setShowModal(false);
    showMessage(`✅ New ${activeTab} added successfully!`);
  }, [activeTab, warranties.length, services.length, showMessage]);

  // Reset filters
  const handleReset = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('all');
    showMessage('🔄 Filters reset');
  }, [showMessage]);

  // Refresh data
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showMessage('✅ Data refreshed!');
    }, 500);
  }, [showMessage]);

  // View details
  const viewDetails = useCallback((item) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Shield className="w-7 h-7 text-indigo-600" />
              Warranty & Service Management
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              <Calendar className="w-4 h-4 inline mr-1" />
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              Reset
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add New
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <p className="text-xs text-green-600 dark:text-green-400">Total Warranties</p>
            <p className="text-lg font-bold text-green-700 dark:text-green-300">{stats.totalWarranties}</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <p className="text-xs text-blue-600 dark:text-blue-400">Active</p>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{stats.activeWarranties}</p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
            <p className="text-xs text-yellow-600 dark:text-yellow-400">Pending Services</p>
            <p className="text-lg font-bold text-yellow-700 dark:text-yellow-300">{stats.pendingServices}</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
            <p className="text-xs text-purple-600 dark:text-purple-400">In Progress</p>
            <p className="text-lg font-bold text-purple-700 dark:text-purple-300">{stats.inProgressServices}</p>
          </div>
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`p-4 rounded-lg shadow-sm border ${
          messageType === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800'
            : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
        }`}>
          <div className="flex items-center justify-between">
            <span>{message}</span>
            <button onClick={() => setMessage('')} className="opacity-50 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b dark:border-gray-700 px-6">
          <button
            onClick={() => {
              setActiveTab('warranty');
              setSearchTerm('');
              setStatusFilter('all');
            }}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition border-b-2 ${
              activeTab === 'warranty'
                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Shield className="w-4 h-4" />
            Warranties
            <span className="ml-1 text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
              {warranties.length}
            </span>
          </button>
          <button
            onClick={() => {
              setActiveTab('services');
              setSearchTerm('');
              setStatusFilter('all');
            }}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition border-b-2 ${
              activeTab === 'services'
                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Wrench className="w-4 h-4" />
            Services
            <span className="ml-1 text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
              {services.length}
            </span>
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="all">All Status</option>
                {activeTab === 'warranty' ? (
                  <>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="expired">Expired</option>
                  </>
                ) : (
                  <>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </>
                )}
              </select>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {activeTab === 'warranty' ? filteredWarranties.length : filteredServices.length} records
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {activeTab === 'warranty' ? (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Serial</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Start</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">End</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredWarranties.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-400">
                      <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                      <p>No warranties found</p>
                      <p className="text-xs mt-1">Try adjusting your search or filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredWarranties.map((w) => (
                    <tr key={w.WarrantyID} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                      <td className="px-4 py-3 text-sm dark:text-white">{getCustomerName(w)}</td>
                      <td className="px-4 py-3 text-sm dark:text-white">{getProductName(w)}</td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-500 dark:text-gray-400">{w.SerialNumber}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{formatDate(w.WarrantyStartDate)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{formatDate(w.WarrantyEndDate)}</td>
                      <td className="px-4 py-3 text-center">{getStatusBadge(w.Status)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => viewDetails(w)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 transition rounded hover:bg-indigo-50"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(w.WarrantyID, 'warranty')}
                            className="p-1.5 text-gray-400 hover:text-red-600 transition rounded hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Issue</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredServices.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-400">
                      <Wrench className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                      <p>No services found</p>
                      <p className="text-xs mt-1">Try adjusting your search or filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredServices.map((s) => (
                    <tr key={s.ServiceID} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                      <td className="px-4 py-3 text-sm dark:text-white">{getCustomerName(s)}</td>
                      <td className="px-4 py-3 text-sm dark:text-white">{getProductName(s)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-[200px] truncate" title={s.IssueDescription}>
                        {s.IssueDescription}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{s.ServiceType}</td>
                      <td className="px-4 py-3 text-center">{getStatusBadge(s.Status)}</td>
                      <td className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">{formatDate(s.ReceivedDate)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => handleDelete(s.ServiceID, 'service')}
                            className="p-1.5 text-gray-400 hover:text-red-600 transition rounded hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500 flex justify-between">
          <span>
            Showing {activeTab === 'warranty' ? filteredWarranties.length : filteredServices.length} of {activeTab === 'warranty' ? warranties.length : services.length} records
          </span>
          <span>
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                  {activeTab === 'warranty' ? <Shield className="w-5 h-5 text-indigo-600" /> : <Wrench className="w-5 h-5 text-indigo-600" />}
                  Add New {activeTab === 'warranty' ? 'Warranty' : 'Service'}
                </h2>
                <button 
                  onClick={() => setShowModal(false)} 
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Customer</label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {customers.map((c) => (
                      <option key={c.CUS_ID} value={c.CUS_ID}>
                        {c.FIRST_NAME} {c.LAST_NAME}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product</label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {products.map((p) => (
                      <option key={p.PRODUCT_ID} value={p.PRODUCT_ID}>
                        {p.NAME_EN}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Serial Number</label>
                  <input
                    type="text"
                    placeholder="Enter serial number"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                {activeTab === 'warranty' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Warranty Period (months)</label>
                    <input
                      type="number"
                      defaultValue="12"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Issue Description</label>
                    <textarea
                      rows="3"
                      placeholder="Describe the issue"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button 
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition dark:text-white"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddNew}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Add {activeTab === 'warranty' ? 'Warranty' : 'Service'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                  <Info className="w-5 h-5 text-indigo-600" />
                  Details
                </h2>
                <button 
                  onClick={() => setShowDetailModal(false)} 
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Customer</p>
                  <p className="font-medium dark:text-white">{getCustomerName(selectedItem)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Product</p>
                  <p className="font-medium dark:text-white">{getProductName(selectedItem)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Serial Number</p>
                  <p className="font-mono dark:text-white">{selectedItem.SerialNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  <div>{getStatusBadge(selectedItem.Status)}</div>
                </div>
                {selectedItem.WarrantyStartDate && (
                  <>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Start Date</p>
                      <p className="dark:text-white">{formatDate(selectedItem.WarrantyStartDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">End Date</p>
                      <p className="dark:text-white">{formatDate(selectedItem.WarrantyEndDate)}</p>
                    </div>
                  </>
                )}
                {selectedItem.IssueDescription && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Issue Description</p>
                    <p className="dark:text-white">{selectedItem.IssueDescription}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button 
                onClick={() => setShowDetailModal(false)} 
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

console.log('✅ Warranty component exported');  

export default Warranty;