import React, { useState } from 'react';
import axios from 'axios';
import { 
  FileText, Download, Printer, RefreshCw, 
  AlertCircle, CheckCircle, Loader2, Database,
  TrendingUp, Package, Users, ShoppingBag,
  Calendar, Filter, ChevronDown, X
} from 'lucide-react';
import { exportToPDF } from '../utils/pdfExport';

const Reports = () => {
  // ===== STATE =====
  const [reportType, setReportType] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [totalRecords, setTotalRecords] = useState(0);
  const [generatedAt, setGeneratedAt] = useState('');

  // ===== REPORT OPTIONS =====
  const reportOptions = [
    { 
      value: 'customers', 
      label: '👥 Customer List',
      description: 'View all active customers with contact details',
      icon: Users
    },
    { 
      value: 'products', 
      label: '📦 Product List',
      description: 'View all products with pricing and stock',
      icon: Package
    },
    { 
      value: 'orders', 
      label: '🛒 Order Summary',
      description: 'View all orders with status and amounts',
      icon: ShoppingBag
    },
    { 
      value: 'stock', 
      label: '📊 Stock Report',
      description: 'View current stock levels and alerts',
      icon: TrendingUp
    }
  ];

  // ===== GENERATE REPORT =====
  const generateReport = async () => {
    if (!reportType) {
      setError('Please select a report type');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    setData(null);
    
    try {
      const res = await axios.get(`/api/reports/${reportType}`, {
        timeout: 15000
      });
      
      const reportData = res.data || [];
      setData(reportData);
      setTotalRecords(reportData.length);
      setGeneratedAt(new Date().toLocaleString());
      setSuccess(`✅ ${reportOptions.find(r => r.value === reportType)?.label} report generated successfully!`);
      
      setTimeout(() => setSuccess(''), 4000);
      
    } catch (error) {
      console.error('❌ Error generating report:', error);
      
      let errorMessage = 'Failed to generate report. ';
      if (error.response?.status === 404) {
        errorMessage += 'Report endpoint not found. Using sample data.';
      } else if (error.response?.status === 500) {
        errorMessage += 'Server error. Using sample data.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage += 'Request timed out. Using sample data.';
      } else {
        errorMessage += error.response?.data?.error || error.message || 'Unknown error.';
      }
      
      setError(`⚠️ ${errorMessage}`);
      setTimeout(() => setError(''), 5000);
      
      // Set mock data for demo if API fails
      setData(generateMockData(reportType));
      setTotalRecords(generateMockData(reportType).length);
      setGeneratedAt(new Date().toLocaleString());
      
    } finally {
      setLoading(false);
    }
  };

  // ===== MOCK DATA FOR DEMO =====
  const generateMockData = (type) => {
    switch(type) {
      case 'customers':
        return [
          { CUS_ID: 'C001', FIRST_NAME: 'John', LAST_NAME: 'Doe', PHONE: '555-0101', E_MAIL: 'john@example.com', STATUS: 'Active' },
          { CUS_ID: 'C002', FIRST_NAME: 'Jane', LAST_NAME: 'Smith', PHONE: '555-0102', E_MAIL: 'jane@example.com', STATUS: 'Active' },
          { CUS_ID: 'C003', FIRST_NAME: 'Robert', LAST_NAME: 'Johnson', PHONE: '555-0103', E_MAIL: 'robert@example.com', STATUS: 'Active' },
          { CUS_ID: 'C004', FIRST_NAME: 'Mary', LAST_NAME: 'Williams', PHONE: '555-0104', E_MAIL: 'mary@example.com', STATUS: 'Active' },
          { CUS_ID: 'C005', FIRST_NAME: 'David', LAST_NAME: 'Brown', PHONE: '555-0105', E_MAIL: 'david@example.com', STATUS: 'Active' },
        ];
      case 'products':
        return [
          { PRODUCT_ID: 1, NAME_EN: 'Laptop Pro', NAME_KH: 'កុំព្យូទ័រយួរដៃ', PRICE: 1299.99, STOCK: 15, STATUS: 'Active' },
          { PRODUCT_ID: 2, NAME_EN: 'Smartphone X', NAME_KH: 'ទូរស័ព្ទ X', PRICE: 899.99, STOCK: 25, STATUS: 'Active' },
          { PRODUCT_ID: 3, NAME_EN: 'Tablet Plus', NAME_KH: 'ថេប្លេត Plus', PRICE: 499.99, STOCK: 10, STATUS: 'Active' },
          { PRODUCT_ID: 4, NAME_EN: 'Wireless Mouse', NAME_KH: 'កណ្ដុរឥតខ្សែ', PRICE: 29.99, STOCK: 50, STATUS: 'Active' },
          { PRODUCT_ID: 5, NAME_EN: 'Keyboard Pro', NAME_KH: 'ក្ដារចុច Pro', PRICE: 79.99, STOCK: 30, STATUS: 'Active' },
        ];
      case 'orders':
        return [
          { ORDER_NO: 'ORD-001', ORDER_DATE: '2026-07-01', AMOUNT_US: 149.99, STATUS: 'Completed', PAYMENT_METHOD: 'Card' },
          { ORDER_NO: 'ORD-002', ORDER_DATE: '2026-07-05', AMOUNT_US: 89.50, STATUS: 'Pending', PAYMENT_METHOD: 'Cash' },
          { ORDER_NO: 'ORD-003', ORDER_DATE: '2026-07-10', AMOUNT_US: 234.75, STATUS: 'Completed', PAYMENT_METHOD: 'Card' },
          { ORDER_NO: 'ORD-004', ORDER_DATE: '2026-07-12', AMOUNT_US: 567.00, STATUS: 'Processing', PAYMENT_METHOD: 'Bank Transfer' },
          { ORDER_NO: 'ORD-005', ORDER_DATE: '2026-07-15', AMOUNT_US: 45.99, STATUS: 'Pending', PAYMENT_METHOD: 'Cash' },
        ];
      case 'stock':
        return [
          { PRODUCT_ID: 1, NAME_EN: 'Laptop Pro', QTY_IN_STOCK: 15, QTY_AVAILABLE: 12, ALERT_LEVEL: 10, STATUS: 'OK' },
          { PRODUCT_ID: 2, NAME_EN: 'Smartphone X', QTY_IN_STOCK: 25, QTY_AVAILABLE: 20, ALERT_LEVEL: 10, STATUS: 'OK' },
          { PRODUCT_ID: 3, NAME_EN: 'Tablet Plus', QTY_IN_STOCK: 5, QTY_AVAILABLE: 3, ALERT_LEVEL: 10, STATUS: 'LOW STOCK' },
          { PRODUCT_ID: 4, NAME_EN: 'Wireless Mouse', QTY_IN_STOCK: 50, QTY_AVAILABLE: 48, ALERT_LEVEL: 10, STATUS: 'OK' },
          { PRODUCT_ID: 5, NAME_EN: 'Keyboard Pro', QTY_IN_STOCK: 30, QTY_AVAILABLE: 28, ALERT_LEVEL: 10, STATUS: 'OK' },
        ];
      default:
        return [];
    }
  };

  // ===== EXPORT CSV =====
  const exportCSV = () => {
    if (!data || data.length === 0) {
      setError('❌ No data to export');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    try {
      const headers = Object.keys(data[0]);
      const csv = [
        headers.join(','),
        ...data.map(row => headers.map(h => {
          const value = row[h] || '';
          return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }).join(','))
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}_report_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setSuccess(`✅ CSV exported successfully!`);
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (error) {
      console.error('❌ Export error:', error);
      setError('❌ Failed to export CSV');
      setTimeout(() => setError(''), 3000);
    }
  };

  // ===== PRINT REPORT =====
  const printReport = () => {
    if (!data || data.length === 0) {
      setError('❌ No data to print');
      setTimeout(() => setError(''), 3000);
      return;
    }
    window.print();
  };

  // ===== EXPORT PDF =====
  const handleExportPDF = () => {
    if (!data || data.length === 0) {
      setError('❌ No data to export as PDF');
      setTimeout(() => setError(''), 3000);
      return;
    }
    exportToPDF('report-table', `${reportType}_report.pdf`);
  };

  // ===== CLEAR REPORT =====
  const clearReport = () => {
    setData(null);
    setTotalRecords(0);
    setGeneratedAt('');
    setReportType('');
    setError('');
    setSuccess('');
  };

  // ===== GET STATUS COLOR =====
  const getStatusColor = (status) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('active') || s.includes('completed') || s === 'ok') return 'text-green-600 bg-green-100 dark:bg-green-900/30';
    if (s.includes('pending') || s.includes('low')) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
    if (s.includes('expired') || s.includes('inactive')) return 'text-red-600 bg-red-100 dark:bg-red-900/30';
    return 'text-gray-600 bg-gray-100 dark:bg-gray-700';
  };

  // ===== GET STATUS BADGE =====
  const renderStatusBadge = (status) => {
    const color = getStatusColor(status);
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        {status || 'N/A'}
      </span>
    );
  };

  // ===== FORMAT DATE =====
  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    try {
      const date = new Date(dateValue);
      if (isNaN(date)) return dateValue;
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateValue;
    }
  };

  // ===== FORMAT CURRENCY =====
  const formatCurrency = (value) => {
    if (value === undefined || value === null) return 'N/A';
    const num = Number(value);
    if (isNaN(num)) return value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(num);
  };

  // ===== GET REPORT LABEL =====
  const getReportLabel = () => {
    return reportOptions.find(r => r.value === reportType)?.label || 'Report';
  };

  // ===== RENDER =====
  return (
    <div className="space-y-6 p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <FileText className="w-7 h-7 text-indigo-600" />
              Reports Dashboard
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {data && (
              <button
                onClick={clearReport}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <span className="text-red-600 dark:text-red-400">{error}</span>
            <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <span className="text-green-600 dark:text-green-400">{success}</span>
            <button onClick={() => setSuccess('')} className="ml-auto text-green-500 hover:text-green-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Controls */}
        <div className="mt-4 flex flex-wrap gap-3">
          <select 
            value={reportType} 
            onChange={(e) => setReportType(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[200px] flex-1"
          >
            <option value="">Select Report Type</option>
            {reportOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          
          <button 
            onClick={generateReport}
            disabled={!reportType || loading}
            className="flex items-center px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 mr-2" />
            )}
            {loading ? 'Generating...' : 'Generate Report'}
          </button>

          {data && data.length > 0 && (
            <>
              <button 
                onClick={exportCSV}
                className="flex items-center px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Download className="w-4 h-4 mr-2" /> Export CSV
              </button>
              <button 
                onClick={handleExportPDF}
                className="flex items-center px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                <FileText className="w-4 h-4 mr-2" /> Export PDF
              </button>
              <button 
                onClick={printReport}
                className="flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Printer className="w-4 h-4 mr-2" /> Print
              </button>
            </>
          )}
        </div>
      </div>

      {/* Report Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">Generating report...</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Please wait</p>
          </div>
        ) : data && data.length > 0 ? (
          <>
            {/* Report Info */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex flex-wrap justify-between items-center gap-2">
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span>
                  <Database className="w-4 h-4 inline mr-1" />
                  <span className="font-medium text-gray-700 dark:text-gray-300 total-records">{totalRecords}</span> records
                </span>
                <span className="w-px h-4 bg-gray-300 dark:bg-gray-600"></span>
                <span>
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Generated: {generatedAt}
                </span>
                <span className="w-px h-4 bg-gray-300 dark:bg-gray-600"></span>
                <span>
                  <FileText className="w-4 h-4 inline mr-1" />
                  <span className="report-type">{getReportLabel()}</span>
                </span>
              </div>
              <button
                onClick={generateReport}
                className="flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto p-4">
              <table className="w-full border-collapse" id="report-table">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    {Object.keys(data[0]).map(key => (
                      <th key={key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b">
                        {key.replace(/_/g, ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {data.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      {Object.entries(row).map(([key, value], i) => {
                        let displayValue = value !== null && value !== undefined ? String(value) : '-';
                        
                        if (key.toLowerCase().includes('date') && value) {
                          displayValue = formatDate(value);
                        }
                        else if (key.toLowerCase().includes('amount') || key.toLowerCase().includes('price') || key.toLowerCase().includes('total')) {
                          displayValue = formatCurrency(value);
                        }
                        else if (key.toLowerCase().includes('status')) {
                          return (
                            <td key={i} className="px-4 py-2 text-sm">
                              {renderStatusBadge(value)}
                            </td>
                          );
                        }
                        
                        return (
                          <td key={i} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 max-w-[200px] truncate" title={displayValue}>
                            {displayValue}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500 flex justify-between">
              <span>Showing {data.length} records</span>
              <span>Generated: {generatedAt}</span>
            </div>
          </>
        ) : data && data.length === 0 ? (
          <div className="text-center py-16">
            <Database className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">No data found</h3>
            <p className="text-gray-400 dark:text-gray-500 mt-1">Try generating a different report</p>
          </div>
        ) : (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">Select a report type</h3>
            <p className="text-gray-400 dark:text-gray-500 mt-1">Choose a report from the dropdown and click Generate</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-400 dark:text-gray-500 py-4 border-t border-gray-200 dark:border-gray-700">
        <p className="flex items-center justify-center gap-2 flex-wrap">
          <span>📊 Reports Dashboard</span>
          <span className="w-px h-3 bg-gray-300 dark:bg-gray-600"></span>
          <span>Data on demand</span>
          <span className="w-px h-3 bg-gray-300 dark:bg-gray-600"></span>
          <span>© {new Date().getFullYear()} SPMS</span>
        </p>
      </div>
    </div>
  );
};

export default Reports; 