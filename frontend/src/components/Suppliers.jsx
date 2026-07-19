import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, Plus, Edit2, Trash2, Truck, X, Save, 
  Phone, Mail, MapPin, User, Building2, RefreshCw 
} from 'lucide-react';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [formData, setFormData] = useState({
    SUP_NAME: '',
    CONTACT_PERSON: '',
    PHONE: '',
    ADDRESS: '',
    EMAIL: ''
  });

  // Fetch suppliers on load and when search changes
  useEffect(() => {
    fetchSuppliers();
  }, [search]);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/suppliers', { 
        params: { search: search || undefined } 
      });
      console.log('🚚 Suppliers loaded:', res.data);
      setSuppliers(res.data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      showMessage('❌ Failed to load suppliers', 'error');
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
    if (!formData.SUP_NAME || formData.SUP_NAME.trim() === '') {
      showMessage('❌ Supplier name is required', 'error');
      setSubmitting(false);
      return;
    }

    try {
      if (editingSupplier) {
        await axios.put(`/api/suppliers/${editingSupplier.SUP_ID}`, formData);
        showMessage('✅ Supplier updated successfully!');
      } else {
        await axios.post('/api/suppliers', formData);
        showMessage('✅ Supplier created successfully!');
      }
      setShowModal(false);
      setEditingSupplier(null);
      setFormData({ SUP_NAME: '', CONTACT_PERSON: '', PHONE: '', ADDRESS: '', EMAIL: '' });
      fetchSuppliers();
    } catch (error) {
      console.error('Submit error:', error.response?.data || error.message);
      showMessage(`❌ ${error.response?.data?.error || 'Failed to save supplier'}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;
    
    try {
      await axios.delete(`/api/suppliers/${id}`);
      showMessage('✅ Supplier deleted successfully!');
      fetchSuppliers();
    } catch (error) {
      console.error('Delete error:', error);
      showMessage('❌ Failed to delete supplier', 'error');
    }
  };

  const openEditModal = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      SUP_NAME: supplier.SUP_NAME || '',
      CONTACT_PERSON: supplier.CONTACT_PERSON || '',
      PHONE: supplier.PHONE || '',
      ADDRESS: supplier.ADDRESS || '',
      EMAIL: supplier.EMAIL || ''
    });
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditingSupplier(null);
    setFormData({ 
      SUP_NAME: '', 
      CONTACT_PERSON: '', 
      PHONE: '', 
      ADDRESS: '', 
      EMAIL: '' 
    });
    setShowModal(true);
  };

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${color} bg-opacity-10`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-xl font-bold dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6">
      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg mb-4 ${
          messageType === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
        }`}>
          {message}
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Truck className="w-7 h-7 text-indigo-600" />
              Suppliers
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage your supplier relationships
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchSuppliers}
              className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </button>
            <button
              onClick={openAddModal}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Supplier
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard icon={Building2} label="Total Suppliers" value={suppliers.length} color="text-blue-600" />
          <StatCard icon={User} label="Active" value={suppliers.filter(s => s.STATUS === 'Active').length} color="text-green-600" />
          <StatCard icon={Phone} label="With Phone" value={suppliers.filter(s => s.PHONE).length} color="text-yellow-600" />
          <StatCard icon={Mail} label="With Email" value={suppliers.filter(s => s.EMAIL).length} color="text-purple-600" />
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search suppliers by name, contact person or phone..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="text-center py-12">
            <Truck className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">No suppliers found</h3>
            <p className="text-gray-400 dark:text-gray-500 mt-1">Add your first supplier to get started</p>
            <button
              onClick={openAddModal}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <Plus className="w-4 h-4 inline mr-2" /> Add Supplier
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Supplier</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Contact Person</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Email</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((supplier) => (
                  <tr key={supplier.SUP_ID} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-indigo-500" />
                        <span className="font-medium text-sm dark:text-white">{supplier.SUP_NAME}</span>
                      </div>
                      {supplier.ADDRESS && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-400 dark:text-gray-500">
                          <MapPin className="w-3 h-3" />
                          {supplier.ADDRESS}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm dark:text-gray-300">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 text-gray-400" />
                        {supplier.CONTACT_PERSON || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm dark:text-gray-300">
                      {supplier.PHONE ? (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-green-500" />
                          {supplier.PHONE}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm dark:text-gray-300">
                      {supplier.EMAIL ? (
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-blue-500" />
                          {supplier.EMAIL}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        supplier.STATUS === 'Active' 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                          : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                      }`}>
                        {supplier.STATUS || 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => openEditModal(supplier)} 
                        className="text-blue-500 hover:text-blue-700 p-1 transition"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(supplier.SUP_ID)} 
                        className="text-red-500 hover:text-red-700 p-1 ml-2 transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
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
                <Truck className="w-5 h-5 text-indigo-600" />
                {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Supplier Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.SUP_NAME}
                    onChange={(e) => setFormData({...formData, SUP_NAME: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    placeholder="Enter supplier name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={formData.CONTACT_PERSON}
                    onChange={(e) => setFormData({...formData, CONTACT_PERSON: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    placeholder="Enter contact person name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.PHONE}
                    onChange={(e) => setFormData({...formData, PHONE: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.EMAIL}
                    onChange={(e) => setFormData({...formData, EMAIL: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                  <input
                    type="text"
                    value={formData.ADDRESS}
                    onChange={(e) => setFormData({...formData, ADDRESS: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    placeholder="Enter address"
                  />
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
                      {editingSupplier ? 'Update' : 'Save'}
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

export default Suppliers;