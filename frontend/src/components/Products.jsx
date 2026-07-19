import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Plus, Edit2, Trash2, Package, X, Save } from 'lucide-react';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [formData, setFormData] = useState({
    NAME_EN: '',
    NAME_KH: '',
    BARCODE: '',
    BRAND: '',
    CATEGORY_ID: '',
    BUYIN_PRICE: '',
    SALEOUT_PRICE: '',
    QTY_ALERT: '10',
    QTY_INSTOCK: '0'
  });

  useEffect(() => {
    fetchProducts();
  }, [search]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/products', { params: { search: search || undefined } });
      console.log('📦 Products loaded:', res.data.length);
      setProducts(res.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      showMessage('❌ Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Validate required fields
    if (!formData.NAME_EN || !formData.SALEOUT_PRICE) {
      showMessage('❌ Product name and sale price are required', 'error');
      setSubmitting(false);
      return;
    }

    try {
      if (editingProduct) {
        await axios.put(`/api/products/${editingProduct.PRODUCT_ID}`, formData);
        showMessage('✅ Product updated successfully!');
      } else {
        await axios.post('/api/products', formData);
        showMessage('✅ Product created successfully!');
      }
      setShowModal(false);
      setEditingProduct(null);
      setFormData({ 
        NAME_EN: '', NAME_KH: '', BARCODE: '', BRAND: '', 
        CATEGORY_ID: '', BUYIN_PRICE: '', SALEOUT_PRICE: '', 
        QTY_ALERT: '10', QTY_INSTOCK: '0' 
      });
      fetchProducts();
    } catch (error) {
      console.error('Submit error:', error.response?.data || error.message);
      showMessage(`❌ ${error.response?.data?.error || 'Failed to save product'}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await axios.delete(`/api/products/${id}`);
      showMessage('✅ Product deleted successfully!');
      fetchProducts();
    } catch (error) {
      console.error('Delete error:', error);
      showMessage('❌ Failed to delete product', 'error');
    }
  };

  const openEditModal = (product) => {
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
      QTY_INSTOCK: '0'
    });
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({ 
      NAME_EN: '', NAME_KH: '', BARCODE: '', BRAND: '', 
      CATEGORY_ID: '', BUYIN_PRICE: '', SALEOUT_PRICE: '', 
      QTY_ALERT: '10', QTY_INSTOCK: '0' 
    });
    setShowModal(true);
  };

  return (
    <div className="p-4 md:p-6">
      {message && (
        <div className={`p-3 rounded-lg mb-4 ${messageType === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'}`}>
          {message}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Package className="w-7 h-7 text-indigo-600" />
              Products
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage your product inventory
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </button>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products by name or barcode..."
              className="w-full md:w-1/2 pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">No products found</h3>
            <p className="text-gray-400 dark:text-gray-500 mt-1">Add your first product to get started</p>
            <button
              onClick={openAddModal}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <Plus className="w-4 h-4 inline mr-2" /> Add Product
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Barcode</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Buy Price</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Sale Price</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Stock</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const productId = product.PRODUCT_ID || product.product_id;
                  const nameEn = product.NAME_EN || product.name_en || 'Unknown';
                  const nameKh = product.NAME_KH || product.name_kh || '';
                  const barcode = product.BARCODE || product.barcode || '-';
                  const buyPrice = Number(product.BUYIN_PRICE || product.buy_price || 0);
                  const salePrice = Number(product.SALEOUT_PRICE || product.saleout_price || 0);
                  const stock = product.QtyInStock || product.qty_instock || 0;
                  const alertLevel = product.QTY_ALERT || product.qty_alert || 10;
                  const status = product.STATUS || product.status || 'Active';
                  const isLow = stock <= alertLevel;
                  
                  return (
                    <tr key={productId} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3">
                        <p className="font-medium text-sm dark:text-white">{nameEn}</p>
                        {nameKh && <p className="text-xs text-gray-400 dark:text-gray-500">{nameKh}</p>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{barcode}</td>
                      <td className="px-4 py-3 text-sm text-right dark:text-white">${buyPrice.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium dark:text-white">${salePrice.toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${isLow ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'}`}>
                          {stock}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status === 'Active' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                          {status === 'Active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button 
                          onClick={() => openEditModal(product)} 
                          className="text-blue-500 hover:text-blue-700 p-1 transition"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(productId)} 
                          className="text-red-500 hover:text-red-700 p-1 ml-2 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600" />
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name (English) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.NAME_EN}
                    onChange={(e) => setFormData({...formData, NAME_EN: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter product name in English"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name (Khmer)</label>
                  <input
                    type="text"
                    value={formData.NAME_KH}
                    onChange={(e) => setFormData({...formData, NAME_KH: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter product name in Khmer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Barcode</label>
                  <input
                    type="text"
                    value={formData.BARCODE}
                    onChange={(e) => setFormData({...formData, BARCODE: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter barcode"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Brand</label>
                  <input
                    type="text"
                    value={formData.BRAND}
                    onChange={(e) => setFormData({...formData, BRAND: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter brand name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Buy Price (USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.BUYIN_PRICE}
                      onChange={(e) => setFormData({...formData, BUYIN_PRICE: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Sale Price (USD) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.SALEOUT_PRICE}
                      onChange={(e) => setFormData({...formData, SALEOUT_PRICE: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stock Alert</label>
                    <input
                      type="number"
                      value={formData.QTY_ALERT}
                      onChange={(e) => setFormData({...formData, QTY_ALERT: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  {!editingProduct && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Initial Stock</label>
                      <input
                        type="number"
                        value={formData.QTY_INSTOCK}
                        onChange={(e) => setFormData({...formData, QTY_INSTOCK: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t dark:border-gray-700">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition dark:text-white"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {editingProduct ? 'Update' : 'Save'}
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