import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, Plus, Edit2, Trash2, Users as UsersIcon, 
  X, Save, DollarSign, Phone, Mail, MapPin, User
} from 'lucide-react';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [formData, setFormData] = useState({
    FIRST_NAME: '',
    LAST_NAME: '',
    PHONE: '',
    E_MAIL: '',
    ADDRESS: '',
    BALANCE: '',
    STATUS: 'Active'
  });

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/customers', { params: { search: search || undefined } });
      console.log('👥 Customers loaded:', res.data.length);
      setCustomers(res.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      showMessage('❌ Failed to load customers', 'error');
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
    if (!formData.FIRST_NAME || !formData.LAST_NAME) {
      showMessage('❌ First name and last name are required', 'error');
      setSubmitting(false);
      return;
    }

    try {
      // Prepare data - convert BALANCE to number if provided
      const submitData = {
        ...formData,
        BALANCE: formData.BALANCE ? parseFloat(formData.BALANCE) : 0
      };

      if (editingCustomer) {
        const customerId = editingCustomer.CUS_ID || editingCustomer.cus_id || editingCustomer.ID;
        await axios.put(`/api/customers/${customerId}`, submitData);
        showMessage('✅ Customer updated successfully!');
      } else {
        await axios.post('/api/customers', submitData);
        showMessage('✅ Customer created successfully!');
      }
      setShowModal(false);
      setEditingCustomer(null);
      setFormData({ 
        FIRST_NAME: '', 
        LAST_NAME: '', 
        PHONE: '', 
        E_MAIL: '', 
        ADDRESS: '', 
        BALANCE: '',
        STATUS: 'Active' 
      });
      fetchCustomers();
    } catch (error) {
      console.error('Submit error:', error.response?.data || error.message);
      showMessage(`❌ ${error.response?.data?.error || 'Failed to save customer'}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    
    try {
      await axios.delete(`/api/customers/${id}`);
      showMessage('✅ Customer deleted successfully!');
      fetchCustomers();
    } catch (error) {
      console.error('Delete error:', error);
      showMessage('❌ Failed to delete customer', 'error');
    }
  };

  const openEditModal = (customer) => {
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
  };

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData({ 
      FIRST_NAME: '', 
      LAST_NAME: '', 
      PHONE: '', 
      E_MAIL: '', 
      ADDRESS: '', 
      BALANCE: '',
      STATUS: 'Active' 
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
    <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Message Toast */}
      {message && (
        <div className={`p-3 rounded-lg mb-4 ${
          messageType === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
        }`}>
          {message}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <UsersIcon className="w-7 h-7 text-indigo-600" />
              Customers
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage your customer relationships
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Customer
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard 
            icon={UsersIcon} 
            label="Total Customers" 
            value={customers.length} 
            color="text-blue-600" 
          />
          <StatCard 
            icon={User} 
            label="Active" 
            value={customers.filter(c => (c.STATUS || c.status) === 'Active').length} 
            color="text-green-600" 
          />
          <StatCard 
            icon={Phone} 
            label="With Phone" 
            value={customers.filter(c => c.PHONE || c.phone).length} 
            color="text-yellow-600" 
          />
          <StatCard 
            icon={DollarSign} 
            label="Total Balance" 
            value={`$${customers.reduce((sum, c) => sum + Number(c.BALANCE || c.balance || 0), 0).toFixed(2)}`} 
            color="text-purple-600" 
          />
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers by name, phone or email..."
              className="w-full md:w-1/2 pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-12">
            <UsersIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">No customers found</h3>
            <p className="text-gray-400 dark:text-gray-500 mt-1">Add your first customer to get started</p>
            <button
              onClick={openAddModal}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <Plus className="w-4 h-4 inline mr-2" /> Add Customer
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Address</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Balance</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => {
                  const customerId = customer.CUS_ID || customer.cus_id || customer.ID;
                  const firstName = customer.FIRST_NAME || customer.first_name || '';
                  const lastName = customer.LAST_NAME || customer.last_name || '';
                  const phone = customer.PHONE || customer.phone || '-';
                  const email = customer.E_MAIL || customer.e_mail || '-';
                  const address = customer.ADDRESS || customer.address || '-';
                  const balance = Number(customer.BALANCE || customer.balance || 0);
                  const status = customer.STATUS || customer.status || 'Active';
                  
                  return (
                    <tr key={customerId} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-indigo-500" />
                          <span className="font-medium text-sm dark:text-white">{firstName} {lastName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm dark:text-gray-300">
                        {phone !== '-' ? (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-green-500" />
                            {phone}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {email !== '-' ? (
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-blue-500" />
                            {email}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500">
                        {address !== '-' ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-red-500" />
                            {address}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-right dark:text-white">
                        ${balance.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          status === 'Active' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                            : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button 
                          onClick={() => openEditModal(customer)} 
                          className="text-blue-500 hover:text-blue-700 p-1 transition"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(customerId)} 
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

      {/* Modal - Add/Edit Customer with Balance */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                <UsersIcon className="w-5 h-5 text-indigo-600" />
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h2>
              <button 
                onClick={() => setShowModal(false)} 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.FIRST_NAME}
                      onChange={(e) => setFormData({...formData, FIRST_NAME: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.LAST_NAME}
                      onChange={(e) => setFormData({...formData, LAST_NAME: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Last name"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Phone
                  </label>
                  <input
                    type="text"
                    value={formData.PHONE}
                    onChange={(e) => setFormData({...formData, PHONE: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter phone number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.E_MAIL}
                    onChange={(e) => setFormData({...formData, E_MAIL: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter email address"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.ADDRESS}
                    onChange={(e) => setFormData({...formData, ADDRESS: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter address"
                  />
                </div>

                {/* BALANCE FIELD - NEW */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Balance (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.BALANCE}
                    onChange={(e) => setFormData({...formData, BALANCE: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Customer's current balance (default: 0.00)
                  </p>
                </div>

                {/* Status Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <select
                    value={formData.STATUS}
                    onChange={(e) => setFormData({...formData, STATUS: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
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
                      {editingCustomer ? 'Update Customer' : 'Create Customer'}
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

export default Customers;