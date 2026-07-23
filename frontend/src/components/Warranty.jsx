import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import axios from 'axios';
import { 
  Shield, Plus, Edit2, Trash2, X, Save, RefreshCw, Wrench,
  Search, Filter, Download, Eye, CheckCircle, Clock,
  AlertCircle, Calendar, Info, Loader2, 
  ArrowUp, ArrowDown, Grid3x3, List,
  User, Package, Phone, Mail, MapPin,
  Award, Star, Zap, Activity, TrendingUp,
  AlertTriangle, ChevronRight, ClipboardList,
  Printer, Home, Briefcase, Users as UsersIcon,
  Key
} from 'lucide-react';

// ============================================
// ✅ API CONFIGURATION
// ============================================
const API_BASE = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api';
console.log('🔧 API_BASE (Warranty):', API_BASE);

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
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
// ✅ MOCK DATA GENERATOR (Fallback)
// ============================================
const generateMockData = () => {
  const now = new Date();
  const formatDate = (d) => d.toISOString().split('T')[0];
  
  const customers = [
    { id: 1, cus_id: 'CUS001', first_name: 'John', last_name: 'Doe', phone: '555-0101', e_mail: 'john@example.com', address: '123 Main St' },
    { id: 2, cus_id: 'CUS002', first_name: 'Jane', last_name: 'Smith', phone: '555-0102', e_mail: 'jane@example.com', address: '456 Oak Ave' },
    { id: 3, cus_id: 'CUS003', first_name: 'Robert', last_name: 'Johnson', phone: '555-0103', e_mail: 'robert@example.com', address: '789 Pine Rd' },
    { id: 4, cus_id: 'CUS004', first_name: 'Mary', last_name: 'Williams', phone: '555-0104', e_mail: 'mary@example.com', address: '321 Elm St' },
    { id: 5, cus_id: 'CUS005', first_name: 'David', last_name: 'Brown', phone: '555-0105', e_mail: 'david@example.com', address: '654 Maple Dr' }
  ];

  const products = [
    { id: 1, product_id: 'PROD001', name_en: 'Laptop Pro X1', saleout_price: 1299.99, category: 'Electronics' },
    { id: 2, product_id: 'PROD002', name_en: 'Smartphone Ultra', saleout_price: 899.99, category: 'Electronics' },
    { id: 3, product_id: 'PROD003', name_en: 'Tablet Plus', saleout_price: 499.99, category: 'Electronics' },
    { id: 4, product_id: 'PROD004', name_en: 'Wireless Headphones', saleout_price: 199.99, category: 'Accessories' },
    { id: 5, product_id: 'PROD005', name_en: 'Smart Watch Pro', saleout_price: 349.99, category: 'Wearables' }
  ];

  const warranties = [];
  const services = [];
  const statuses = ['Active', 'Active', 'Active', 'Expired', 'Active'];
  const serviceStatuses = ['Pending', 'In Progress', 'Completed', 'Pending', 'In Progress'];
  const issueDescriptions = [
    'Screen cracked', 'Battery issue', 'Software update', 'Hardware failure', 
    'Water damage', 'Charging issue', 'Display problem', 'Performance slow'
  ];

  for (let i = 0; i < 8; i++) {
    const customer = customers[i % customers.length];
    const product = products[i % products.length];
    const startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() - Math.floor(Math.random() * 24));
    const endDate = new Date(startDate);
    const period = [12, 24, 36][Math.floor(Math.random() * 3)];
    endDate.setMonth(endDate.getMonth() + period);

    warranties.push({
      warrantyid: i + 1,
      customerid: customer.id,
      productid: product.id,
      serialnumber: `SN-${String(i + 1).padStart(4, '0')}`,
      warrantyperiod: period,
      warrantystartdate: formatDate(startDate),
      warrantyenddate: formatDate(endDate),
      status: statuses[i % statuses.length],
      customer_name: `${customer.first_name} ${customer.last_name}`,
      product_name: product.name_en,
      notes: `Warranty for ${product.name_en}`
    });

    if (i < 6) {
      services.push({
        serviceid: i + 1,
        customerid: customer.id,
        productid: product.id,
        serialnumber: `SN-${String(i + 1).padStart(4, '0')}`,
        issuedescription: issueDescriptions[i % issueDescriptions.length],
        servicetype: ['Repair', 'Maintenance'][i % 2],
        status: serviceStatuses[i % serviceStatuses.length],
        receiveddate: formatDate(new Date(now.getFullYear(), now.getMonth() - i % 6, 1 + i % 28)),
        customer_name: `${customer.first_name} ${customer.last_name}`,
        product_name: product.name_en,
        notes: `Service ticket ${i + 1}`
      });
    }
  }

  return { warranties, services, customers, products };
};

// ============================================
// ✅ MAIN WARRANTY COMPONENT
// ============================================
const Warranty = () => {
  // ===== STATE =====
  const [warranties, setWarranties] = useState([]);
  const [services, setServices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('warranty');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('grid');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [warrantyStats, setWarrantyStats] = useState({
    total: 0,
    active: 0,
    expiring: 0,
    expired: 0
  });
  const [serviceStats, setServiceStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0
  });

  // ===== FORM DATA =====
  const [formData, setFormData] = useState({
    customer_id: '',
    product_id: '',
    serial_number: '',
    warranty_period: 12,
    start_date: '',
    end_date: '',
    status: 'Active',
    issue_description: '',
    service_type: 'Repair',
    received_date: ''
  });

  // ===== REFS =====
  const isMounted = useRef(true);
  const searchTimeout = useRef(null);

  // ===== SHOW MESSAGE =====
  const showMessage = useCallback((text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
    const timer = setTimeout(() => setMessage(''), 5000);
    return () => clearTimeout(timer);
  }, []);

  // ===== FETCH CUSTOMERS & PRODUCTS =====
  const fetchCustomersAndProducts = useCallback(async () => {
    try {
      const [customersRes, productsRes] = await Promise.all([
        api.get('/customers'),
        api.get('/products')
      ]);
      
      if (isMounted.current) {
        const customersData = Array.isArray(customersRes.data) ? customersRes.data : [];
        const productsData = Array.isArray(productsRes.data) ? productsRes.data : [];
        
        setCustomers(customersData);
        setProducts(productsData);
        console.log(`👥 Customers loaded: ${customersData.length}`);
        console.log(`📦 Products loaded: ${productsData.length}`);
      }
    } catch (error) {
      console.error('❌ Error fetching customers/products:', error);
      if (isMounted.current) {
        const mockData = generateMockData();
        setCustomers(mockData.customers);
        setProducts(mockData.products);
      }
    }
  }, []);

  // ===== FETCH WARRANTIES =====
  const fetchWarranties = useCallback(async () => {
    try {
      const res = await api.get('/warranties');
      if (isMounted.current) {
        const data = Array.isArray(res.data) ? res.data : [];
        setWarranties(data);
        calculateWarrantyStats(data);
        console.log(`🛡️ Warranties loaded: ${data.length}`);
      }
    } catch (error) {
      console.error('❌ Error fetching warranties:', error);
      if (isMounted.current) {
        const mockData = generateMockData();
        setWarranties(mockData.warranties);
        calculateWarrantyStats(mockData.warranties);
        showMessage('⚠️ Using sample warranty data', 'warning');
      }
    }
  }, [showMessage]);

  // ===== FETCH SERVICES =====
  const fetchServices = useCallback(async () => {
    try {
      const res = await api.get('/services');
      if (isMounted.current) {
        const data = Array.isArray(res.data) ? res.data : [];
        setServices(data);
        calculateServiceStats(data);
        console.log(`🔧 Services loaded: ${data.length}`);
      }
    } catch (error) {
      console.error('❌ Error fetching services:', error);
      if (isMounted.current) {
        const mockData = generateMockData();
        setServices(mockData.services);
        calculateServiceStats(mockData.services);
        showMessage('⚠️ Using sample service data', 'warning');
      }
    }
  }, [showMessage]);

  // ===== LOAD ALL DATA =====
  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchCustomersAndProducts(),
      fetchWarranties(),
      fetchServices()
    ]);
    setLoading(false);
    setIsRefreshing(false);
  }, [fetchCustomersAndProducts, fetchWarranties, fetchServices]);

  // ===== CALCULATE STATS =====
  const calculateWarrantyStats = useCallback((data) => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const stats = {
      total: data.length,
      active: data.filter(w => w.status === 'Active').length,
      expiring: data.filter(w => {
        if (w.status !== 'Active') return false;
        const endDate = new Date(w.warrantyenddate);
        return endDate <= thirtyDaysFromNow && endDate > now;
      }).length,
      expired: data.filter(w => w.status === 'Expired').length
    };
    setWarrantyStats(stats);
  }, []);

  const calculateServiceStats = useCallback((data) => {
    const stats = {
      total: data.length,
      pending: data.filter(s => s.status === 'Pending').length,
      inProgress: data.filter(s => s.status === 'In Progress').length,
      completed: data.filter(s => s.status === 'Completed').length
    };
    setServiceStats(stats);
  }, []);

  // ===== INITIAL LOAD =====
  useEffect(() => {
    isMounted.current = true;
    loadData();

    return () => {
      isMounted.current = false;
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [loadData]);

  // ===== SEARCH DEBOUNCE =====
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(() => {
      // Filter handled by useMemo
    }, 300);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchTerm]);

  // ===== GET HELPER FUNCTIONS =====
  const getCustomerName = useCallback((item) => {
    if (item.customer_name) return item.customer_name;
    const customer = customers.find(c => 
      c.id === item.customerid || 
      c.id === item.CustomerID ||
      parseInt(c.cus_id) === item.customerid ||
      parseInt(c.id) === item.CustomerID
    );
    return customer ? `${customer.first_name || customer.FIRST_NAME || ''} ${customer.last_name || customer.LAST_NAME || ''}`.trim() || 'Unknown' : 'Unknown';
  }, [customers]);

  const getProductName = useCallback((item) => {
    if (item.product_name) return item.product_name;
    const product = products.find(p => 
      p.id === item.productid || 
      p.id === item.ProductID ||
      parseInt(p.product_id) === item.productid ||
      parseInt(p.id) === item.ProductID
    );
    return product?.name_en || product?.NAME_EN || 'Unknown';
  }, [products]);

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

  // ===== GET STATUS BADGE =====
  const getStatusBadge = useCallback((status) => {
    const statusMap = {
      'Active': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
      'Expired': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800',
      'Pending': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800',
      'In Progress': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
      'Completed': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800'
    };
    return `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusMap[status] || statusMap['Pending']}`;
  }, []);

  // ===== GET STATUS ICON =====
  const getStatusIcon = useCallback((status) => {
    const icons = {
      'Active': CheckCircle,
      'Expired': X,
      'Pending': Clock,
      'In Progress': Activity,
      'Completed': Award
    };
    const Icon = icons[status] || Clock;
    return <Icon className="w-3.5 h-3.5" />;
  }, []);

  // ===== GET STAT ICON =====
  const getStatIcon = useCallback((type) => {
    const icons = {
      total: <Shield className="w-5 h-5 text-indigo-500" />,
      active: <CheckCircle className="w-5 h-5 text-emerald-500" />,
      expiring: <AlertCircle className="w-5 h-5 text-yellow-500" />,
      expired: <X className="w-5 h-5 text-red-500" />,
      pending: <Clock className="w-5 h-5 text-yellow-500" />,
      inProgress: <Activity className="w-5 h-5 text-blue-500" />,
      completed: <Award className="w-5 h-5 text-purple-500" />
    };
    return icons[type] || icons.total;
  }, []);

  // ===== GET AVATAR COLOR =====
  const getAvatarColor = useCallback((name) => {
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
  }, []);

  // ===== GET INITIALS =====
  const getInitials = useCallback((name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }, []);

  // ===== FILTERED DATA =====
  const filteredWarranties = useMemo(() => {
    let result = [...warranties];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(w => {
        const customerName = w.customer_name || getCustomerName(w);
        const productName = w.product_name || getProductName(w);
        return customerName.toLowerCase().includes(term) ||
               productName.toLowerCase().includes(term) ||
               (w.serialnumber || '').toLowerCase().includes(term);
      });
    }

    if (filterStatus !== 'all') {
      result = result.filter(w => {
        if (filterStatus === 'active') return w.status === 'Active';
        if (filterStatus === 'expired') return w.status === 'Expired';
        return true;
      });
    }

    result.sort((a, b) => {
      let aVal, bVal;
      if (sortBy === 'customer') {
        aVal = a.customer_name || getCustomerName(a);
        bVal = b.customer_name || getCustomerName(b);
      } else if (sortBy === 'product') {
        aVal = a.product_name || getProductName(a);
        bVal = b.product_name || getProductName(b);
      } else if (sortBy === 'end_date') {
        aVal = new Date(a.warrantyenddate);
        bVal = new Date(b.warrantyenddate);
      } else {
        aVal = a[sortBy] ?? '';
        bVal = b[sortBy] ?? '';
      }

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [warranties, searchTerm, filterStatus, sortBy, sortOrder, getCustomerName, getProductName]);

  const filteredServices = useMemo(() => {
    let result = [...services];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(s => {
        const customerName = s.customer_name || getCustomerName(s);
        const productName = s.product_name || getProductName(s);
        return customerName.toLowerCase().includes(term) ||
               productName.toLowerCase().includes(term) ||
               (s.issuedescription || '').toLowerCase().includes(term);
      });
    }

    if (filterStatus !== 'all') {
      const statusMap = {
        'pending': 'Pending',
        'in_progress': 'In Progress',
        'completed': 'Completed'
      };
      const targetStatus = statusMap[filterStatus] || filterStatus;
      result = result.filter(s => s.status === targetStatus);
    }

    if (filterType !== 'all') {
      result = result.filter(s => s.servicetype === filterType);
    }

    result.sort((a, b) => {
      let aVal, bVal;
      if (sortBy === 'customer') {
        aVal = a.customer_name || getCustomerName(a);
        bVal = b.customer_name || getCustomerName(b);
      } else if (sortBy === 'product') {
        aVal = a.product_name || getProductName(a);
        bVal = b.product_name || getProductName(b);
      } else if (sortBy === 'date') {
        aVal = new Date(a.receiveddate);
        bVal = new Date(b.receiveddate);
      } else {
        aVal = a[sortBy] ?? '';
        bVal = b[sortBy] ?? '';
      }

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [services, searchTerm, filterStatus, filterType, sortBy, sortOrder, getCustomerName, getProductName]);

  const currentData = useMemo(() => {
    return activeTab === 'warranty' ? filteredWarranties : filteredServices;
  }, [activeTab, filteredWarranties, filteredServices]);

  // ===== RESET FORM =====
  const resetForm = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);
    
    setFormData({
      customer_id: '',
      product_id: '',
      serial_number: '',
      warranty_period: 12,
      start_date: today,
      end_date: endDate.toISOString().split('T')[0],
      status: 'Active',
      issue_description: '',
      service_type: 'Repair',
      received_date: today
    });
  }, []);

  // ===== OPEN MODAL =====
  const openEditModal = useCallback((item) => {
    setEditingItem(item);
    
    if (activeTab === 'warranty') {
      setFormData({
        customer_id: String(item.customerid || item.CustomerID || ''),
        product_id: String(item.productid || item.ProductID || ''),
        serial_number: item.serialnumber || item.SerialNumber || '',
        warranty_period: item.warrantyperiod || item.WarrantyPeriod || 12,
        start_date: item.warrantystartdate || item.WarrantyStartDate || '',
        end_date: item.warrantyenddate || item.WarrantyEndDate || '',
        status: item.status || item.Status || 'Active',
        issue_description: '',
        service_type: 'Repair',
        received_date: '',
        notes: item.notes || ''
      });
    } else {
      setFormData({
        customer_id: String(item.customerid || item.CustomerID || ''),
        product_id: String(item.productid || item.ProductID || ''),
        serial_number: item.serialnumber || item.SerialNumber || '',
        warranty_period: 12,
        start_date: '',
        end_date: '',
        status: item.status || item.Status || 'Pending',
        issue_description: item.issuedescription || item.IssueDescription || '',
        service_type: item.servicetype || item.ServiceType || 'Repair',
        received_date: item.receiveddate || item.ReceivedDate || '',
        notes: item.notes || ''
      });
    }
    setShowModal(true);
  }, [activeTab]);

  const openAddModal = useCallback(() => {
    setEditingItem(null);
    resetForm();
    setShowModal(true);
  }, [resetForm]);

  // ===== HANDLE SUBMIT =====
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data = {
        CustomerID: parseInt(formData.customer_id),
        ProductID: parseInt(formData.product_id),
        SerialNumber: formData.serial_number || `SN-${String(Date.now()).slice(-4)}`,
        notes: formData.notes || ''
      };

      if (activeTab === 'warranty') {
        const startDate = new Date(formData.start_date);
        const endDate = new Date(formData.end_date);
        if (endDate <= startDate) {
          showMessage('❌ End date must be after start date', 'error');
          setSubmitting(false);
          return;
        }

        data.WarrantyPeriod = parseInt(formData.warranty_period) || 12;
        data.WarrantyStartDate = formData.start_date || new Date().toISOString().split('T')[0];
        data.WarrantyEndDate = formData.end_date;
        data.Status = formData.status || 'Active';

        if (editingItem) {
          const id = editingItem.warrantyid || editingItem.WarrantyID;
          await api.put(`/warranties/${id}`, data);
          showMessage('✅ Warranty updated successfully!');
        } else {
          await api.post('/warranties', data);
          showMessage('✅ Warranty created successfully!');
        }
        await fetchWarranties();
      } else {
        data.IssueDescription = formData.issue_description || 'Service request';
        data.ServiceType = formData.service_type || 'Repair';
        data.Status = formData.status || 'Pending';
        data.ReceivedDate = formData.received_date || new Date().toISOString().split('T')[0];

        if (editingItem) {
          const id = editingItem.serviceid || editingItem.ServiceID;
          await api.put(`/services/${id}`, data);
          showMessage('✅ Service updated successfully!');
        } else {
          await api.post('/services', data);
          showMessage('✅ Service created successfully!');
        }
        await fetchServices();
      }

      setShowModal(false);
      setEditingItem(null);
      resetForm();
    } catch (error) {
      console.error('Submit error:', error);
      showMessage(`❌ ${error.response?.data?.error || 'Failed to save'}`, 'error');
    } finally {
      setSubmitting(false);
    }
  }, [formData, activeTab, editingItem, fetchWarranties, fetchServices, resetForm, showMessage]);

  // ===== HANDLE DELETE =====
  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      if (activeTab === 'warranty') {
        await api.delete(`/warranties/${id}`);
        await fetchWarranties();
        showMessage('✅ Warranty deleted successfully!');
      } else {
        await api.delete(`/services/${id}`);
        await fetchServices();
        showMessage('✅ Service deleted successfully!');
      }
    } catch (error) {
      console.error('Delete error:', error);
      showMessage(`❌ ${error.response?.data?.error || 'Failed to delete'}`, 'error');
    }
  }, [activeTab, fetchWarranties, fetchServices, showMessage]);

  // ===== BULK DELETE =====
  const handleBulkDelete = useCallback(async () => {
    if (selectedItems.length === 0) return;
    if (!window.confirm(`Delete ${selectedItems.length} selected items?`)) return;

    try {
      if (activeTab === 'warranty') {
        await api.delete('/warranties/bulk', { data: { ids: selectedItems } });
        await fetchWarranties();
      } else {
        await api.delete('/services/bulk', { data: { ids: selectedItems } });
        await fetchServices();
      }
      showMessage(`✅ ${selectedItems.length} items deleted!`);
      setSelectedItems([]);
    } catch (error) {
      console.error('Bulk delete error:', error);
      showMessage(`❌ ${error.response?.data?.error || 'Failed to delete items'}`, 'error');
    }
  }, [selectedItems, activeTab, fetchWarranties, fetchServices, showMessage]);

  // ===== REFRESH =====
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadData();
    showMessage('✅ Data refreshed!');
  }, [loadData, showMessage]);

  // ===== VIEW DETAIL =====
  const viewDetail = useCallback((item) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  }, []);

  // ===== TOGGLE SELECT =====
  const toggleSelect = useCallback((id) => {
    setSelectedItems(prev => {
      if (prev.includes(id)) {
        return prev.filter(p => p !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);

  // ===== TOGGLE SELECT ALL =====
  const toggleSelectAll = useCallback(() => {
    if (selectedItems.length === currentData.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(currentData.map(item => 
        activeTab === 'warranty' ? (item.warrantyid || item.WarrantyID) : (item.serviceid || item.ServiceID)
      ));
    }
  }, [selectedItems, currentData, activeTab]);

  // ===== EXPORT =====
  const handleExport = useCallback(() => {
    if (currentData.length === 0) {
      showMessage('⚠️ No data to export', 'warning');
      return;
    }

    try {
      const headers = activeTab === 'warranty' 
        ? ['ID', 'Customer', 'Product', 'Serial', 'Start Date', 'End Date', 'Status']
        : ['ID', 'Customer', 'Product', 'Issue', 'Type', 'Status', 'Date'];
      
      let csv = headers.join(',') + '\n';
      currentData.forEach(item => {
        const customerName = item.customer_name || getCustomerName(item);
        const productName = item.product_name || getProductName(item);

        const row = activeTab === 'warranty' 
          ? [item.warrantyid || item.WarrantyID, `"${customerName}"`, `"${productName}"`, item.serialnumber || item.SerialNumber, 
             formatDate(item.warrantystartdate || item.WarrantyStartDate), formatDate(item.warrantyenddate || item.WarrantyEndDate), item.status || item.Status]
          : [item.serviceid || item.ServiceID, `"${customerName}"`, `"${productName}"`, 
             `"${(item.issuedescription || item.IssueDescription || '').replace(/"/g, '""')}"`, item.servicetype || item.ServiceType, item.status || item.Status, formatDate(item.receiveddate || item.ReceivedDate)];
        csv += row.join(',') + '\n';
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeTab}_${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showMessage(`✅ ${currentData.length} records exported successfully!`);
    } catch (error) {
      console.error('Export error:', error);
      showMessage('❌ Failed to export data', 'error');
    }
  }, [currentData, activeTab, getCustomerName, getProductName, formatDate, showMessage]);

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
        <p className="text-gray-400 font-medium">Loading warranty data...</p>
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
              <Shield className="w-8 h-8" />
              Warranty & Service Management
            </h1>
            <p className="text-indigo-100 mt-1 text-sm">Track warranties and manage service requests</p>
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
              onClick={handleExport}
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
              Add {activeTab === 'warranty' ? 'Warranty' : 'Service'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {activeTab === 'warranty' ? (
            <>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 hover:bg-white/20 transition animate-slideUp">
                <div className="flex items-center gap-2">
                  {getStatIcon('total')}
                  <p className="text-xs text-indigo-200">Total Warranties</p>
                </div>
                <p className="text-2xl font-bold">{warrantyStats.total}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 hover:bg-white/20 transition animate-slideUp" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center gap-2">
                  {getStatIcon('active')}
                  <p className="text-xs text-indigo-200">Active</p>
                </div>
                <p className="text-2xl font-bold">{warrantyStats.active}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 hover:bg-white/20 transition animate-slideUp" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center gap-2">
                  {getStatIcon('expiring')}
                  <p className="text-xs text-indigo-200">Expiring Soon</p>
                </div>
                <p className="text-2xl font-bold">{warrantyStats.expiring}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 hover:bg-white/20 transition animate-slideUp" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-center gap-2">
                  {getStatIcon('expired')}
                  <p className="text-xs text-indigo-200">Expired</p>
                </div>
                <p className="text-2xl font-bold">{warrantyStats.expired}</p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 hover:bg-white/20 transition animate-slideUp">
                <div className="flex items-center gap-2">
                  {getStatIcon('total')}
                  <p className="text-xs text-indigo-200">Total Services</p>
                </div>
                <p className="text-2xl font-bold">{serviceStats.total}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 hover:bg-white/20 transition animate-slideUp" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center gap-2">
                  {getStatIcon('pending')}
                  <p className="text-xs text-indigo-200">Pending</p>
                </div>
                <p className="text-2xl font-bold">{serviceStats.pending}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 hover:bg-white/20 transition animate-slideUp" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center gap-2">
                  {getStatIcon('inProgress')}
                  <p className="text-xs text-indigo-200">In Progress</p>
                </div>
                <p className="text-2xl font-bold">{serviceStats.inProgress}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 hover:bg-white/20 transition animate-slideUp" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-center gap-2">
                  {getStatIcon('completed')}
                  <p className="text-xs text-indigo-200">Completed</p>
                </div>
                <p className="text-2xl font-bold">{serviceStats.completed}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ===== TABS ===== */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              setActiveTab('warranty');
              setSearchTerm('');
              setFilterStatus('all');
              setFilterType('all');
              setSelectedItems([]);
            }}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition border-b-2 ${
              activeTab === 'warranty'
                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
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
              setFilterStatus('all');
              setFilterType('all');
              setSelectedItems([]);
            }}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition border-b-2 ${
              activeTab === 'services'
                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            <Wrench className="w-4 h-4" />
            Services
            <span className="ml-1 text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
              {services.length}
            </span>
          </button>
        </div>

        {/* ===== CONTROLS ===== */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={`🔍 Search ${activeTab}...`}
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              >
                <option value="all">All Status</option>
                {activeTab === 'warranty' ? (
                  <>
                    <option value="active">Active</option>
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

              {/* Type Filter (Services only) */}
              {activeTab === 'services' && (
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                >
                  <option value="all">All Types</option>
                  <option value="Repair">Repair</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              )}

              {/* Sort */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none px-2"
                >
                  <option value="customer">Customer</option>
                  <option value="product">Product</option>
                  <option value={activeTab === 'warranty' ? 'end_date' : 'date'}>
                    {activeTab === 'warranty' ? 'End Date' : 'Date'}
                  </option>
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
              {selectedItems.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition flex items-center gap-2 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete ({selectedItems.length})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ===== CONTENT ===== */}
        {currentData.length === 0 ? (
          <div className="p-12 text-center">
            {activeTab === 'warranty' ? (
              <Shield className="w-20 h-20 mx-auto text-gray-300 dark:text-gray-600 mb-4 animate-float" />
            ) : (
              <Wrench className="w-20 h-20 mx-auto text-gray-300 dark:text-gray-600 mb-4 animate-float" />
            )}
            <h3 className="text-xl font-medium text-gray-600 dark:text-gray-400">
              No {activeTab} found
            </h3>
            <p className="text-gray-400 dark:text-gray-500 mt-2">
              {searchTerm || filterStatus !== 'all' || filterType !== 'all' 
                ? 'Try adjusting your search or filters' 
                : `Add your first ${activeTab === 'warranty' ? 'warranty' : 'service'} to get started`}
            </p>
            <button
              onClick={openAddModal}
              className="mt-4 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition font-medium"
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Add {activeTab === 'warranty' ? 'Warranty' : 'Service'}
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          // ===== GRID VIEW =====
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {currentData.map((item, index) => {
              const id = activeTab === 'warranty' ? (item.warrantyid || item.WarrantyID) : (item.serviceid || item.ServiceID);
              const customerName = item.customer_name || getCustomerName(item);
              const productName = item.product_name || getProductName(item);
              const initials = getInitials(customerName);
              const avatarColor = getAvatarColor(customerName);
              const isSelected = selectedItems.includes(id);

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
                            {customerName}
                          </h3>
                          <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[120px] flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            {productName}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            viewDetail(item);
                          }}
                          className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition opacity-0 group-hover:opacity-100"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(item);
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

                    {/* Details */}
                    <div className="space-y-1.5 mb-3">
                      <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                        <ClipboardList className="w-3.5 h-3.5 text-gray-400" />
                        {item.serialnumber || item.SerialNumber || 'N/A'}
                      </p>
                      {activeTab === 'warranty' ? (
                        <>
                          <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-purple-500" />
                            {formatDate(item.warrantystartdate || item.WarrantyStartDate)} → {formatDate(item.warrantyenddate || item.WarrantyEndDate)}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-blue-500" />
                            {item.warrantyperiod || item.WarrantyPeriod || 12} months
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2 truncate">
                            <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                            <span className="truncate">{item.issuedescription || item.IssueDescription || 'No description'}</span>
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <Briefcase className="w-3.5 h-3.5 text-amber-500" />
                            {item.servicetype || item.ServiceType || 'N/A'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-purple-500" />
                            Received: {formatDate(item.receiveddate || item.ReceivedDate)}
                          </p>
                        </>
                      )}
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                      <span className={getStatusBadge(item.status || item.Status)}>
                        {getStatusIcon(item.status || item.Status)}
                        {item.status || item.Status}
                      </span>
                      <span className="text-xs text-gray-400">
                        ID: #{id}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // ===== LIST VIEW =====
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-3 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === currentData.length && currentData.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">Serial</th>
                  {activeTab === 'warranty' ? (
                    <>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">Start Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">End Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">Period</th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">Issue</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">Received</th>
                    </>
                  )}
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {currentData.map((item, index) => {
                  const id = activeTab === 'warranty' ? (item.warrantyid || item.WarrantyID) : (item.serviceid || item.ServiceID);
                  const customerName = item.customer_name || getCustomerName(item);
                  const productName = item.product_name || getProductName(item);
                  const isSelected = selectedItems.includes(id);

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
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs ${getAvatarColor(customerName)}`}>
                            {getInitials(customerName)}
                          </div>
                          <span className="font-medium text-sm dark:text-white">{customerName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {productName}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-500 dark:text-gray-400 hidden md:table-cell">
                        {item.serialnumber || item.SerialNumber || '-'}
                      </td>
                      {activeTab === 'warranty' ? (
                        <>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                            {formatDate(item.warrantystartdate || item.WarrantyStartDate)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                            {formatDate(item.warrantyenddate || item.WarrantyEndDate)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                            {item.warrantyperiod || item.WarrantyPeriod || 12} mo
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 hidden lg:table-cell max-w-[150px] truncate">
                            {item.issuedescription || item.IssueDescription || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                            {item.servicetype || item.ServiceType || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">
                            {formatDate(item.receiveddate || item.ReceivedDate)}
                          </td>
                        </>
                      )}
                      <td className="px-4 py-3 text-center">
                        <span className={getStatusBadge(item.status || item.Status)}>
                          {getStatusIcon(item.status || item.Status)}
                          {item.status || item.Status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => viewDetail(item)}
                            className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition group-hover:scale-110"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(item)}
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
        )}

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500 flex justify-between items-center">
          <span>Showing {currentData.length} of {activeTab === 'warranty' ? warranties.length : services.length} records</span>
          <span>Updated: {new Date().toLocaleString()}</span>
        </div>
      </div>

      {/* ===== FOOTER ===== */}
      <div className="text-center text-xs text-gray-400 dark:text-gray-500 py-4 border-t border-gray-200 dark:border-gray-700">
        <p className="flex items-center justify-center gap-4 flex-wrap">
          <span>🛡️ {activeTab === 'warranty' ? 'Warranty' : 'Service'} Management</span>
          <span>•</span>
          <span>📊 {currentData.length} records displayed</span>
          <span>•</span>
          <span>📅 {new Date().toLocaleString()}</span>
          <span>•</span>
          <span>© {new Date().getFullYear()} SPMS</span>
        </p>
      </div>

      {/* ===== DETAIL MODAL ===== */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-slideUp">
            <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                {activeTab === 'warranty' ? <Shield className="w-5 h-5 text-indigo-600" /> : <Wrench className="w-5 h-5 text-indigo-600" />}
                {activeTab === 'warranty' ? 'Warranty' : 'Service'} Details
              </h2>
              <button 
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl ${getAvatarColor(customerName)} shadow-lg`}>
                  {getInitials(customerName)}
                </div>
                <div>
                  <p className="text-lg font-bold dark:text-white">{customerName}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Package className="w-4 h-4" />
                    {productName}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={getStatusBadge(selectedItem.status || selectedItem.Status)}>
                      {getStatusIcon(selectedItem.status || selectedItem.Status)}
                      {selectedItem.status || selectedItem.Status}
                    </span>
                    <span className="text-xs text-gray-400">#{activeTab === 'warranty' ? (selectedItem.warrantyid || selectedItem.WarrantyID) : (selectedItem.serviceid || selectedItem.ServiceID)}</span>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Serial Number</p>
                    <p className="font-medium dark:text-white font-mono">{selectedItem.serialnumber || selectedItem.SerialNumber || 'N/A'}</p>
                  </div>
                  {activeTab === 'warranty' ? (
                    <>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Period</p>
                        <p className="font-medium dark:text-white">{selectedItem.warrantyperiod || selectedItem.WarrantyPeriod || 'N/A'} months</p>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Start Date</p>
                        <p className="font-medium dark:text-white">{formatDate(selectedItem.warrantystartdate || selectedItem.WarrantyStartDate)}</p>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">End Date</p>
                        <p className="font-medium dark:text-white">{formatDate(selectedItem.warrantyenddate || selectedItem.WarrantyEndDate)}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="col-span-2 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Issue Description</p>
                        <p className="font-medium dark:text-white">{selectedItem.issuedescription || selectedItem.IssueDescription || 'N/A'}</p>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Service Type</p>
                        <p className="font-medium dark:text-white">{selectedItem.servicetype || selectedItem.ServiceType || 'N/A'}</p>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Received Date</p>
                        <p className="font-medium dark:text-white">{formatDate(selectedItem.receiveddate || selectedItem.ReceivedDate)}</p>
                      </div>
                    </>
                  )}
                </div>

                {selectedItem.notes && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Notes</p>
                    <p className="text-sm dark:text-white mt-1">{selectedItem.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button 
                onClick={() => {
                  setShowDetailModal(false);
                  openEditModal(selectedItem);
                }}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <button 
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== ADD/EDIT MODAL ===== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-slideUp">
            <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                {activeTab === 'warranty' ? <Shield className="w-5 h-5 text-indigo-600" /> : <Wrench className="w-5 h-5 text-indigo-600" />}
                {editingItem ? 'Edit' : 'Add New'} {activeTab === 'warranty' ? 'Warranty' : 'Service'}
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
                {/* Customer */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
                    <User className="w-4 h-4" />
                    Customer <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.customer_id}
                    onChange={(e) => setFormData({...formData, customer_id: e.target.value})}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    disabled={submitting}
                  >
                    <option value="">Select Customer</option>
                    {customers.map((c) => (
                      <option key={c.id || c.CUS_ID} value={c.id || c.CUS_ID}>
                        {c.first_name || c.FIRST_NAME} {c.last_name || c.LAST_NAME}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Product */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
                    <Package className="w-4 h-4" />
                    Product <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.product_id}
                    onChange={(e) => setFormData({...formData, product_id: e.target.value})}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    disabled={submitting}
                  >
                    <option value="">Select Product</option>
                    {products.map((p) => (
                      <option key={p.id || p.PRODUCT_ID} value={p.id || p.PRODUCT_ID}>
                        {p.name_en || p.NAME_EN}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Serial Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
                    <ClipboardList className="w-4 h-4" />
                    Serial Number
                  </label>
                  <input
                    type="text"
                    value={formData.serial_number}
                    onChange={(e) => setFormData({...formData, serial_number: e.target.value})}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    placeholder="Enter serial number"
                    disabled={submitting}
                  />
                </div>

                {activeTab === 'warranty' ? (
                  <>
                    {/* Warranty Period */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Warranty Period (months)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={formData.warranty_period}
                        onChange={(e) => setFormData({...formData, warranty_period: e.target.value})}
                        className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                        disabled={submitting}
                      />
                    </div>

                    {/* Start & End Date */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={formData.start_date}
                          onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                          className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                          disabled={submitting}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          End Date
                        </label>
                        <input
                          type="date"
                          value={formData.end_date}
                          onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                          className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                          disabled={submitting}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Issue Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
                        <Info className="w-4 h-4" />
                        Issue Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        rows="3"
                        value={formData.issue_description}
                        onChange={(e) => setFormData({...formData, issue_description: e.target.value})}
                        className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                        placeholder="Describe the issue"
                        disabled={submitting}
                      />
                    </div>

                    {/* Service Type & Received Date */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />
                          Service Type
                        </label>
                        <select
                          value={formData.service_type}
                          onChange={(e) => setFormData({...formData, service_type: e.target.value})}
                          className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                          disabled={submitting}
                        >
                          <option value="Repair">Repair</option>
                          <option value="Maintenance">Maintenance</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Received Date
                        </label>
                        <input
                          type="date"
                          value={formData.received_date}
                          onChange={(e) => setFormData({...formData, received_date: e.target.value})}
                          className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                          disabled={submitting}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
                    <Activity className="w-4 h-4" />
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    disabled={submitting}
                  >
                    {activeTab === 'warranty' ? (
                      <>
                        <option value="Active">Active</option>
                        <option value="Expired">Expired</option>
                      </>
                    ) : (
                      <>
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </>
                    )}
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
                      {editingItem ? 'Update' : 'Create'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; opacity: 0; }
        .animate-slideIn { animation: slideIn 0.4s ease-out forwards; opacity: 0; }
        .animate-slideInRight { animation: slideInRight 0.5s ease-out forwards; }
        .animate-slideUp { animation: slideUp 0.4s ease-out forwards; opacity: 0; }
        .animate-float { animation: float 3s ease-in-out infinite; }

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

export default Warranty;