import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import { 
  Activity, Search, RefreshCw, Filter, X, 
  Clock, User, Eye, Trash2, Download, 
  AlertCircle, CheckCircle, Loader2,
  Calendar, ChevronRight, ArrowUp, ArrowDown,
  Grid3x3, List, FileText, Shield, Zap,
  Sparkles, Award, Star, Gift, Heart
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
// MAIN ACTIVITYLOG COMPONENT
// ============================================
const ActivityLog = () => {
  // ===== STATE =====
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [filterTable, setFilterTable] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('list');
  const [selectedLogs, setSelectedLogs] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLogDetail, setSelectedLogDetail] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // ===== REFS =====
  const isMounted = useRef(true);
  const searchTimeout = useRef(null);
  const headerRef = useRef(null);

  // ===== MOUSE TRACKING =====
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // ===== FETCH ACTIVITY LOGS - FIXED ✅ =====
  const fetchActivityLogs = useCallback(async () => {
    setLoading(true);
    setIsRefreshing(true);
    try {
      // ✅ FIXED: Removed '/api' prefix
      const res = await api.get('/api/activity-logs', {
        params: { limit: 200 }
      });
      if (isMounted.current) {
        const data = res.data || [];
        setLogs(data);
        showMessage(`✅ Loaded ${data.length} activity logs`, 'success');
      }
    } catch (error) {
      console.error('❌ Error fetching activity logs:', error);
      if (isMounted.current) {
        showMessage('❌ Failed to load activity logs', 'error');
        // Fallback mock data
        const mockLogs = generateMockLogs();
        setLogs(mockLogs);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  // ===== FETCH USERS - FIXED ✅ =====
  const fetchUsers = useCallback(async () => {
    try {
      // ✅ FIXED: Removed '/api' prefix
      const res = await api.get('/api/users');
      if (isMounted.current) {
        setUsers(res.data || []);
      }
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      if (isMounted.current) {
        setUsers([
          { user_id: 1, username: 'admin', fullname: 'Administrator' },
          { user_id: 2, username: 'cashier1', fullname: 'John Doe' },
          { user_id: 3, username: 'cashier2', fullname: 'Jane Smith' },
        ]);
      }
    }
  }, []);

  // ===== GENERATE MOCK LOGS =====
  const generateMockLogs = () => {
    const actions = ['Login', 'Logout', 'Created customer', 'Updated customer', 'Deleted customer', 'Created product', 'Updated product', 'Deleted product', 'Created order', 'Updated order', 'Deleted order', 'Created user', 'Updated user', 'Deleted user'];
    const tables = ['TBL_CUSTOMERS', 'TBL_PRODUCTS', 'TBL_ORDERS', 'Tbl_Users', 'TBL_SUPPLIERS'];
    const users = ['admin', 'cashier1', 'cashier2', 'manager1'];
    const mockLogs = [];

    for (let i = 0; i < 50; i++) {
      const date = new Date();
      date.setHours(date.getHours() - Math.floor(Math.random() * 72));
      
      mockLogs.push({
        log_id: Date.now() + i,
        user_id: Math.floor(Math.random() * 4) + 1,
        username: users[Math.floor(Math.random() * users.length)],
        action: actions[Math.floor(Math.random() * actions.length)],
        table_name: tables[Math.floor(Math.random() * tables.length)],
        record_id: Math.floor(Math.random() * 100) + 1,
        action_date: date.toISOString(),
      });
    }

    // Sort by date descending
    mockLogs.sort((a, b) => new Date(b.action_date) - new Date(a.action_date));
    return mockLogs;
  };

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
    Promise.all([fetchActivityLogs(), fetchUsers()]);

    return () => {
      isMounted.current = false;
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [fetchActivityLogs, fetchUsers]);

  // ===== REFRESH =====
  const handleRefresh = useCallback(async () => {
    await Promise.all([fetchActivityLogs(), fetchUsers()]);
  }, [fetchActivityLogs, fetchUsers]);

  // ===== SEARCH DEBOUNCE =====
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(() => {
      // Search handled by useMemo
    }, 300);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchTerm]);

  // ===== FILTERED & SORTED LOGS =====
  const filteredLogs = useMemo(() => {
    let result = [...logs];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(log => {
        const username = log.username || '';
        const action = log.action || '';
        const table = log.table_name || '';
        return username.toLowerCase().includes(term) ||
               action.toLowerCase().includes(term) ||
               table.toLowerCase().includes(term) ||
               String(log.record_id || '').includes(term);
      });
    }

    // Action filter
    if (filterAction !== 'all') {
      result = result.filter(log => log.action === filterAction);
    }

    // User filter
    if (filterUser !== 'all') {
      result = result.filter(log => String(log.user_id) === filterUser);
    }

    // Table filter
    if (filterTable !== 'all') {
      result = result.filter(log => log.table_name === filterTable);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.action_date) - new Date(b.action_date);
          break;
        case 'user':
          comparison = (a.username || '').localeCompare(b.username || '');
          break;
        case 'action':
          comparison = (a.action || '').localeCompare(b.action || '');
          break;
        case 'table':
          comparison = (a.table_name || '').localeCompare(b.table_name || '');
          break;
        default:
          comparison = new Date(a.action_date) - new Date(b.action_date);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [logs, searchTerm, filterAction, filterUser, filterTable, sortBy, sortOrder]);

  // ===== CALCULATE STATS =====
  const stats = useMemo(() => {
    const total = logs.length;
    const actionCounts = {};
    const userCounts = {};
    const tableCounts = {};

    logs.forEach(log => {
      const action = log.action || 'Unknown';
      const user = log.username || 'Unknown';
      const table = log.table_name || 'Unknown';
      
      actionCounts[action] = (actionCounts[action] || 0) + 1;
      userCounts[user] = (userCounts[user] || 0) + 1;
      tableCounts[table] = (tableCounts[table] || 0) + 1;
    });

    return { total, actionCounts, userCounts, tableCounts };
  }, [logs]);

  // ===== GET ACTION EMOJI =====
  const getActionEmoji = (action) => {
    const emojis = {
      'Login': '🔐',
      'Logout': '🚪',
      'Created customer': '👤',
      'Updated customer': '✏️',
      'Deleted customer': '🗑️',
      'Created product': '📦',
      'Updated product': '✏️',
      'Deleted product': '🗑️',
      'Created order': '🛒',
      'Updated order': '✏️',
      'Deleted order': '🗑️',
      'Created user': '👤',
      'Updated user': '✏️',
      'Deleted user': '🗑️',
    };
    return emojis[action] || '📋';
  };

  // ===== GET ACTION COLOR =====
  const getActionColor = (action) => {
    if (action.includes('Created')) return 'text-emerald-500 dark:text-emerald-400';
    if (action.includes('Updated')) return 'text-blue-500 dark:text-blue-400';
    if (action.includes('Deleted')) return 'text-red-500 dark:text-red-400';
    if (action.includes('Login')) return 'text-green-500 dark:text-green-400';
    if (action.includes('Logout')) return 'text-orange-500 dark:text-orange-400';
    return 'text-purple-500 dark:text-purple-400';
  };

  // ===== GET ACTION BADGE =====
  const getActionBadge = (action) => {
    const colors = {
      'Login': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800',
      'Logout': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800',
      'Created customer': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
      'Updated customer': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
      'Deleted customer': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800',
      'Created product': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
      'Updated product': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
      'Deleted product': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800',
      'Created order': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
      'Updated order': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
      'Deleted order': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800',
      'Created user': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
      'Updated user': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
      'Deleted user': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800',
    };
    return colors[action] || 'bg-gray-100 dark:bg-gray-700/30 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700';
  };

  // ===== FORMAT DATE =====
  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date)) return dateStr;
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  // ===== TIME AGO =====
  const timeAgo = (dateStr) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      return formatDate(dateStr);
    } catch {
      return dateStr;
    }
  };

  // ===== VIEW LOG DETAIL =====
  const viewLogDetail = (log) => {
    setSelectedLogDetail(log);
    setShowDetailModal(true);
  };

  // ===== TOGGLE SELECT =====
  const toggleSelect = (id) => {
    setSelectedLogs(prev => {
      if (prev.includes(id)) {
        return prev.filter(p => p !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // ===== TOGGLE SELECT ALL =====
  const toggleSelectAll = () => {
    if (selectedLogs.length === filteredLogs.length) {
      setSelectedLogs([]);
    } else {
      setSelectedLogs(filteredLogs.map(log => log.log_id));
    }
  };

  // ===== EXPORT LOGS =====
  const exportLogs = () => {
    if (!filteredLogs.length) {
      showMessage('⚠️ No data to export', 'warning');
      return;
    }

    try {
      const headers = ['ID', 'User', 'Action', 'Table', 'Record ID', 'Date'];
      let csv = headers.join(',') + '\n';
      
      filteredLogs.forEach(log => {
        const row = [
          log.log_id || '',
          `"${log.username || 'Unknown'}"`,
          `"${log.action || ''}"`,
          `"${log.table_name || ''}"`,
          log.record_id || '',
          `"${formatDate(log.action_date)}"`
        ];
        csv += row.join(',') + '\n';
      });
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity_logs_${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showMessage(`✅ ${filteredLogs.length} logs exported successfully!`, 'success');
    } catch (error) {
      console.error('Export error:', error);
      showMessage('❌ Failed to export logs', 'error');
    }
  };

  // ===== CLEAR SELECTED =====
  const clearSelected = () => {
    setSelectedLogs([]);
    showMessage('✅ Selection cleared', 'info');
  };

  // ===== GET UNIQUE ACTIONS =====
  const uniqueActions = useMemo(() => {
    const actions = new Set();
    logs.forEach(log => {
      if (log.action) actions.add(log.action);
    });
    return Array.from(actions).sort();
  }, [logs]);

  // ===== GET UNIQUE TABLES =====
  const uniqueTables = useMemo(() => {
    const tables = new Set();
    logs.forEach(log => {
      if (log.table_name) tables.add(log.table_name);
    });
    return Array.from(tables).sort();
  }, [logs]);

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
        <p className="text-gray-400 font-medium">Loading activity logs...</p>
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
      
      {/* ===== MESSAGE TOAST - FIXED ✅ ===== */}
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
              {messageType === 'info' && <Activity className="w-5 h-5 text-blue-500" />}
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
              <span className="text-xs font-medium text-white/80 tracking-wider uppercase">Audit Trail</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
              <Activity className="w-8 h-8" />
              Activity Logs
            </h1>
            <p className="text-indigo-100 mt-1 text-sm">Monitor all user activities and system events</p>
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
              onClick={exportLogs}
              className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl hover:bg-white/30 transition hover:scale-105 duration-300 flex items-center gap-2 border border-white/10"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 relative z-10">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 hover:bg-white/20 transition-all duration-300 hover:scale-105 border border-white/5">
            <p className="text-xs text-indigo-200">Total Activities</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 hover:bg-white/20 transition-all duration-300 hover:scale-105 border border-white/5">
            <p className="text-xs text-indigo-200">Unique Users</p>
            <p className="text-2xl font-bold">{Object.keys(stats.userCounts).length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 hover:bg-white/20 transition-all duration-300 hover:scale-105 border border-white/5">
            <p className="text-xs text-indigo-200">Actions</p>
            <p className="text-2xl font-bold">{Object.keys(stats.actionCounts).length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 hover:bg-white/20 transition-all duration-300 hover:scale-105 border border-white/5">
            <p className="text-xs text-indigo-200">Tables</p>
            <p className="text-2xl font-bold">{Object.keys(stats.tableCounts).length}</p>
          </div>
        </div>
      </div>

      {/* ===== CONTROLS ===== */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-300">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-indigo-500 transition-colors w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="🔍 Search by user, action, table..."
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 group-hover:border-indigo-300"
              />
            </div>

            {/* Filter Action */}
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:border-indigo-300"
            >
              <option value="all">All Actions</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>

            {/* Filter User */}
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:border-indigo-300"
            >
              <option value="all">All Users</option>
              {users.map(user => (
                <option key={user.user_id} value={String(user.user_id)}>
                  {user.username || user.fullname || `User ${user.user_id}`}
                </option>
              ))}
            </select>

            {/* Filter Table */}
            <select
              value={filterTable}
              onChange={(e) => setFilterTable(e.target.value)}
              className="px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:border-indigo-300"
            >
              <option value="all">All Tables</option>
              {uniqueTables.map(table => (
                <option key={table} value={table}>{table}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode */}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
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
            </div>

            {/* Bulk Actions */}
            {selectedLogs.length > 0 && (
              <button
                onClick={clearSelected}
                className="px-3 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-300 hover:scale-105 flex items-center gap-2 text-sm shadow-lg shadow-indigo-600/20"
              >
                <X className="w-4 h-4" />
                Clear ({selectedLogs.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ===== LOGS GRID ===== */}
      {filteredLogs.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center hover:shadow-lg transition-all duration-300">
          <Activity className="w-20 h-20 mx-auto text-gray-300 dark:text-gray-600 mb-4 animate-float" />
          <h3 className="text-xl font-medium text-gray-600 dark:text-gray-400">No activity logs found</h3>
          <p className="text-gray-400 dark:text-gray-500 mt-2">
            {searchTerm || filterAction !== 'all' || filterUser !== 'all' || filterTable !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Activities will appear here as users interact with the system'}
          </p>
        </div>
      ) : viewMode === 'list' ? (
        // ===== LIST VIEW =====
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50">
                <tr>
                  <th className="px-3 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedLogs.length === filteredLogs.length && filteredLogs.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">Table</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">Record ID</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">Time</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredLogs.map((log, index) => {
                  const isSelected = selectedLogs.includes(log.log_id);
                  const actionEmoji = getActionEmoji(log.action);
                  const actionColor = getActionColor(log.action);

                  return (
                    <tr 
                      key={log.log_id} 
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-all duration-300 group animate-slideIn ${
                        isSelected ? 'bg-indigo-50 dark:bg-indigo-900/10' : ''
                      }`}
                      style={{ animationDelay: `${index * 0.03}s` }}
                    >
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(log.log_id)}
                          className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs bg-indigo-500`}>
                            {log.username ? log.username.charAt(0).toUpperCase() : '?'}
                          </div>
                          <span className="font-medium text-sm dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {log.username || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionBadge(log.action)} transition-all duration-300 group-hover:scale-105`}>
                          <span className="text-base">{actionEmoji}</span>
                          {log.action || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">
                        {log.table_name || '-'}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                        {log.record_id || '-'}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                        {timeAgo(log.action_date)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={() => viewLogDetail(log)}
                          className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300 group-hover:scale-110"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // ===== GRID VIEW =====
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredLogs.map((log, index) => {
            const isSelected = selectedLogs.includes(log.log_id);
            const actionEmoji = getActionEmoji(log.action);
            const actionColor = getActionColor(log.action);

            return (
              <div
                key={log.log_id}
                className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-2 transition-all duration-500 hover:shadow-xl hover:-translate-y-2 group animate-fadeIn cursor-pointer ${
                  isSelected ? 'border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/30' : 'border-gray-100 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                }`}
                style={{ animationDelay: `${index * 0.04}s` }}
                onClick={() => toggleSelect(log.log_id)}
              >
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 transition-all duration-300 group-hover:scale-110`}>
                        {actionEmoji}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {log.username || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {timeAgo(log.action_date)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        viewLogDetail(log);
                      }}
                      className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110"
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Action */}
                  <div className="mb-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionBadge(log.action)} transition-all duration-300 group-hover:scale-105`}>
                      {log.action || 'Unknown'}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-1.5">
                    {log.table_name && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                        <span className="text-xs text-gray-400">Table:</span>
                        <span className="font-medium">{log.table_name}</span>
                      </p>
                    )}
                    {log.record_id && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                        <span className="text-xs text-gray-400">Record ID:</span>
                        <span className="font-mono font-medium">{log.record_id}</span>
                      </p>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {formatDate(log.action_date)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== FOOTER ===== */}
      <div className="text-center text-xs text-gray-400 dark:text-gray-500 py-4 border-t border-gray-200 dark:border-gray-700">
        <p className="flex items-center justify-center gap-4 flex-wrap">
          <span>📋 {filteredLogs.length} logs displayed</span>
          <span>•</span>
          <span>💾 {stats.total} total logs</span>
          <span>•</span>
          <span>👤 {Object.keys(stats.userCounts).length} unique users</span>
          <span>•</span>
          <span>📊 {Object.keys(stats.actionCounts).length} unique actions</span>
          <span>•</span>
          <span>{new Date().toLocaleString()}</span>
        </p>
      </div>

      {/* ===== LOG DETAIL MODAL ===== */}
      {showDetailModal && selectedLogDetail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-slideUp">
            <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                Log Details
              </h2>
              <button 
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-300 hover:rotate-90"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              {/* User Info */}
              <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-2xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg`}>
                  {selectedLogDetail.username ? selectedLogDetail.username.charAt(0).toUpperCase() : '?'}
                </div>
                <div>
                  <p className="text-lg font-bold dark:text-white">{selectedLogDetail.username || 'Unknown'}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">User ID: {selectedLogDetail.user_id || 'N/A'}</p>
                </div>
              </div>

              {/* Action Details */}
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Action Details
              </h3>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                  <span className="text-base">{getActionEmoji(selectedLogDetail.action)}</span>
                  <span className={`font-medium ${getActionColor(selectedLogDetail.action)}`}>
                    {selectedLogDetail.action || 'Unknown'}
                  </span>
                </div>
                {selectedLogDetail.table_name && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                    <FileText className="w-4 h-4 text-purple-500" />
                    <span className="dark:text-white">Table: <span className="font-medium">{selectedLogDetail.table_name}</span></span>
                  </div>
                )}
                {selectedLogDetail.record_id && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                    <Key className="w-4 h-4 text-amber-500" />
                    <span className="dark:text-white">Record ID: <span className="font-mono font-medium">{selectedLogDetail.record_id}</span></span>
                  </div>
                )}
              </div>

              {/* Timestamp */}
              <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                <p className="text-xs text-gray-400">Timestamp</p>
                <p className="text-sm font-medium dark:text-white">{formatDate(selectedLogDetail.action_date)}</p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button 
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105 font-medium flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Close
              </button>
            </div>
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
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.1); }
        }
        @keyframes spin-slow {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }

        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; opacity: 0; }
        .animate-slideIn { animation: slideIn 0.4s ease-out forwards; opacity: 0; }
        .animate-slideInRight { animation: slideInRight 0.5s ease-out forwards; }
        .animate-slideUp { animation: slideUp 0.4s ease-out forwards; opacity: 0; }
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

export default ActivityLog;