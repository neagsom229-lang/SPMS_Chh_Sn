import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { 
  Search, RefreshCw, AlertCircle, CheckCircle, 
  Package, TrendingUp, TrendingDown, 
  Filter, X, Download, Printer, Eye,
  Loader2, Database
} from 'lucide-react';

const Stock = () => {
  // ===== STATE =====
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // ===== FETCH STOCK =====
  const fetchStock = useCallback(async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const res = await axios.get('/api/stock', { timeout: 10000 });
      console.log('📊 Stock data:', res.data);
      
      if (res.data && res.data.length > 0) {
        setStock(res.data);
        setMessage(`✅ Loaded ${res.data.length} stock items`);
        setMessageType('success');
      } else {
        // Use mock data if API returns empty
        setStock(generateMockStock());
        setMessage('📊 Using sample stock data (API returned empty)');
        setMessageType('info');
      }
    } catch (error) {
      console.error('❌ Error fetching stock:', error);
      setMessage('⚠️ Using sample stock data (API unavailable)');
      setMessageType('warning');
      setStock(generateMockStock());
    } finally {
      setLoading(false);
    }
  }, []);

  // ===== GENERATE MOCK STOCK DATA =====
  const generateMockStock = () => {
    const products = [
      { PRODUCT_ID: 1, NAME_EN: 'Laptop Pro', NAME_KH: 'កុំព្យូទ័រយួរដៃ', QtyInStock: 15, QtyReserved: 3, QtyAvailable: 12, QTY_ALERT: 10 },
      { PRODUCT_ID: 2, NAME_EN: 'Smartphone X', NAME_KH: 'ទូរស័ព្ទ X', QtyInStock: 25, QtyReserved: 5, QtyAvailable: 20, QTY_ALERT: 10 },
      { PRODUCT_ID: 3, NAME_EN: 'Tablet Plus', NAME_KH: 'ថេប្លេត Plus', QtyInStock: 5, QtyReserved: 2, QtyAvailable: 3, QTY_ALERT: 10 },
      { PRODUCT_ID: 4, NAME_EN: 'Wireless Mouse', NAME_KH: 'កណ្ដុរឥតខ្សែ', QtyInStock: 50, QtyReserved: 2, QtyAvailable: 48, QTY_ALERT: 10 },
      { PRODUCT_ID: 5, NAME_EN: 'Keyboard Pro', NAME_KH: 'ក្ដារចុច Pro', QtyInStock: 30, QtyReserved: 2, QtyAvailable: 28, QTY_ALERT: 10 },
      { PRODUCT_ID: 6, NAME_EN: 'USB-C Hub', NAME_KH: 'USB-C Hub', QtyInStock: 8, QtyReserved: 3, QtyAvailable: 5, QTY_ALERT: 10 },
      { PRODUCT_ID: 7, NAME_EN: 'Monitor Stand', NAME_KH: 'ឈរម៉ូនីទ័រ', QtyInStock: 12, QtyReserved: 2, QtyAvailable: 10, QTY_ALERT: 10 },
      { PRODUCT_ID: 8, NAME_EN: 'Laptop Bag', NAME_KH: 'កាបូបកុំព្យូទ័រ', QtyInStock: 3, QtyReserved: 1, QtyAvailable: 2, QTY_ALERT: 10 },
      { PRODUCT_ID: 9, NAME_EN: 'Charger Pro', NAME_KH: 'ឆ្នាំងសាក Pro', QtyInStock: 20, QtyReserved: 0, QtyAvailable: 20, QTY_ALERT: 10 },
      { PRODUCT_ID: 10, NAME_EN: 'HDMI Cable', NAME_KH: 'ខ្សែ HDMI', QtyInStock: 100, QtyReserved: 10, QtyAvailable: 90, QTY_ALERT: 10 },
    ];
    return products;
  };

  // ===== INITIAL LOAD =====
  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  // ===== REFRESH =====
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchStock();
    setIsRefreshing(false);
  };

  // ===== GET STOCK STATUS =====
  const getStockStatus = useCallback((qty, alert) => {
    const available = Number(qty) || 0;
    const alertLevel = Number(alert) || 10;
    
    if (available <= 0) {
      return { 
        label: 'Out of Stock', 
        color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
        icon: AlertCircle,
        priority: 3
      };
    }
    if (available <= alertLevel) {
      return { 
        label: 'Low Stock', 
        color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
        icon: AlertCircle,
        priority: 2
      };
    }
    return { 
      label: 'In Stock', 
      color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
      icon: CheckCircle,
      priority: 1
    };
  }, []);

  // ===== GET PRODUCT NAME =====
  const getProductName = useCallback((item) => {
    return item.NAME_EN || item.name_en || item.ProductName || `Product ${item.PRODUCT_ID || item.product_id || ''}`;
  }, []);

  // ===== GET PRODUCT NAME KH =====
  const getProductNameKh = useCallback((item) => {
    return item.NAME_KH || item.name_kh || '';
  }, []);

  // ===== GET STOCK VALUE =====
  const getStockValue = useCallback((item, field) => {
    const value = item[field] || 0;
    return Number(value) || 0;
  }, []);

  // ===== FILTER STOCK =====
  const filteredStock = useMemo(() => {
    let result = stock;
    
    // Search filter
    if (search) {
      const term = search.toLowerCase();
      result = result.filter(item => {
        const name = getProductName(item).toLowerCase();
        const nameKh = getProductNameKh(item).toLowerCase();
        const id = String(item.PRODUCT_ID || item.product_id || '');
        return name.includes(term) || nameKh.includes(term) || id.includes(term);
      });
    }
    
    // Status filter
    if (filterStatus !== 'all') {
      result = result.filter(item => {
        const available = getStockValue(item, 'QtyAvailable');
        const alert = getStockValue(item, 'QTY_ALERT');
        const status = getStockStatus(available, alert);
        return status.label.toLowerCase() === filterStatus.toLowerCase() || 
               status.label.replace(' ', '').toLowerCase() === filterStatus.toLowerCase();
      });
    }
    
    return result;
  }, [stock, search, filterStatus, getProductName, getProductNameKh, getStockValue, getStockStatus]);

  // ===== CALCULATE STATS =====
  const stats = useMemo(() => {
    const total = stock.length;
    let lowStock = 0;
    let outOfStock = 0;
    let healthy = 0;
    
    stock.forEach(item => {
      const available = getStockValue(item, 'QtyAvailable');
      const alert = getStockValue(item, 'QTY_ALERT');
      const status = getStockStatus(available, alert);
      
      if (status.priority === 3) outOfStock++;
      else if (status.priority === 2) lowStock++;
      else healthy++;
    });
    
    return { total, lowStock, outOfStock, healthy };
  }, [stock, getStockValue, getStockStatus]);

  // ===== EXPORT CSV =====
  const exportCSV = () => {
    if (!stock.length) {
      setMessage('⚠️ No data to export');
      setMessageType('warning');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    
    try {
      const headers = ['Product ID', 'Product Name', 'In Stock', 'Reserved', 'Available', 'Alert Level', 'Status'];
      let csv = headers.join(',') + '\n';
      
      stock.forEach(item => {
        const available = getStockValue(item, 'QtyAvailable');
        const alert = getStockValue(item, 'QTY_ALERT');
        const status = getStockStatus(available, alert);
        
        const row = [
          item.PRODUCT_ID || item.product_id || '',
          `"${getProductName(item)}"`,
          getStockValue(item, 'QtyInStock'),
          getStockValue(item, 'QtyReserved'),
          available,
          alert,
          status.label
        ];
        csv += row.join(',') + '\n';
      });
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stock_report_${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setMessage('✅ Stock exported successfully!');
      setMessageType('success');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('❌ Export error:', error);
      setMessage('❌ Failed to export stock');
      setMessageType('error');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // ===== VIEW PRODUCT DETAIL =====
  const viewProductDetail = (item) => {
    setSelectedProduct(item);
    setShowDetailModal(true);
  };

  // ===== RENDER STATUS BADGE =====
  const renderStatusBadge = (status) => {
    const StatusIcon = status.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
        <StatusIcon className="w-3 h-3" />
        {status.label}
      </span>
    );
  };

  // ===== LOADING =====
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
        <p className="mt-4 text-gray-500 dark:text-gray-400">Loading stock data...</p>
      </div>
    );
  }

  // ===== RENDER =====
  return (
    <div className="space-y-4 p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Message Toast */}
      {message && (
        <div className={`p-4 rounded-lg shadow-sm border ${
          messageType === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800' 
            : messageType === 'warning'
            ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
            : messageType === 'info'
            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
            : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              {messageType === 'success' && <CheckCircle className="w-5 h-5" />}
              {messageType === 'warning' && <AlertCircle className="w-5 h-5" />}
              {messageType === 'info' && <Database className="w-5 h-5" />}
              {messageType === 'error' && <X className="w-5 h-5" />}
              {message}
            </span>
            <button onClick={() => setMessage('')} className="opacity-50 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Package className="w-7 h-7 text-indigo-600" />
              Stock Management
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Monitor and manage your inventory levels
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Products</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.total}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-100 dark:border-green-800">
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">In Stock</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.healthy}</p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-100 dark:border-yellow-800">
            <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">Low Stock</p>
            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{stats.lowStock}</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-100 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">Out of Stock</p>
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.outOfStock}</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products by name or ID..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option value="all">All Status</option>
              <option value="instock">In Stock</option>
              <option value="lowstock">Low Stock</option>
              <option value="outofstock">Out of Stock</option>
            </select>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {filteredStock.length} products
          </span>
        </div>

        {/* Table */}
        {filteredStock.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">No stock records found</h3>
            <p className="text-gray-400 dark:text-gray-500 mt-1">
              {search || filterStatus !== 'all' ? 'Try adjusting your search or filters' : 'Add products to start tracking inventory'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Product</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">In Stock</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Reserved</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Available</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Alert Level</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStock.map((item) => {
                  const productId = item.PRODUCT_ID || item.product_id;
                  const productName = getProductName(item);
                  const productNameKh = getProductNameKh(item);
                  const qtyInStock = getStockValue(item, 'QtyInStock');
                  const qtyReserved = getStockValue(item, 'QtyReserved');
                  const qtyAvailable = getStockValue(item, 'QtyAvailable');
                  const alertLevel = getStockValue(item, 'QTY_ALERT');
                  const status = getStockStatus(qtyAvailable, alertLevel);
                  
                  return (
                    <tr key={productId || Math.random()} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                      <td className="px-4 py-3">
                        <p className="font-medium text-sm dark:text-white">{productName}</p>
                        {productNameKh && <p className="text-xs text-gray-400 dark:text-gray-500">{productNameKh}</p>}
                      </td>
                      <td className="px-4 py-3 text-right font-medium dark:text-white">{qtyInStock}</td>
                      <td className="px-4 py-3 text-right dark:text-gray-300">{qtyReserved}</td>
                      <td className={`px-4 py-3 text-right font-bold ${qtyAvailable <= alertLevel ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {qtyAvailable}
                      </td>
                      <td className="px-4 py-3 text-right dark:text-gray-300">{alertLevel}</td>
                      <td className="px-4 py-3 text-center">
                        {renderStatusBadge(status)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => viewProductDetail(item)}
                          className="text-blue-500 hover:text-blue-700 transition p-1"
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
            <div className="mt-2 text-xs text-gray-400 dark:text-gray-500 flex justify-between">
              <span>Showing {filteredStock.length} of {stock.length} products</span>
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {showDetailModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600" />
                Product Details
              </h2>
              <button 
                onClick={() => setShowDetailModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Product ID</p>
                  <p className="font-medium dark:text-white">{selectedProduct.PRODUCT_ID || selectedProduct.product_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  <div>{renderStatusBadge(getStockStatus(
                    getStockValue(selectedProduct, 'QtyAvailable'),
                    getStockValue(selectedProduct, 'QTY_ALERT')
                  ))}</div>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Product Name</p>
                  <p className="font-medium dark:text-white">{getProductName(selectedProduct)}</p>
                  {getProductNameKh(selectedProduct) && (
                    <p className="text-sm text-gray-400 dark:text-gray-500">{getProductNameKh(selectedProduct)}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">In Stock</p>
                  <p className="font-medium dark:text-white">{getStockValue(selectedProduct, 'QtyInStock')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Reserved</p>
                  <p className="font-medium dark:text-white">{getStockValue(selectedProduct, 'QtyReserved')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Available</p>
                  <p className={`font-medium ${getStockValue(selectedProduct, 'QtyAvailable') <= getStockValue(selectedProduct, 'QTY_ALERT') ? 'text-red-600' : 'text-green-600'}`}>
                    {getStockValue(selectedProduct, 'QtyAvailable')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Alert Level</p>
                  <p className="font-medium dark:text-white">{getStockValue(selectedProduct, 'QTY_ALERT')}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Notes</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    {getStockValue(selectedProduct, 'QtyAvailable') <= getStockValue(selectedProduct, 'QTY_ALERT') 
                      ? '⚠️ This product is running low on stock. Please reorder soon.'
                      : '✅ Stock level is healthy.'}
                  </p>
                </div>
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

export default Stock;