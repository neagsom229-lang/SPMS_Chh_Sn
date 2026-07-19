import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, Plus, Edit2, Trash2, X, Save, RefreshCw } from 'lucide-react';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullname: '',
    role_id: '2'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/users');
      console.log('👥 Users loaded:', res.data);
      setUsers(res.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      showMessage('❌ Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username.trim()) {
      showMessage('❌ Username is required', 'error');
      return;
    }
    if (!editingUser && !formData.password) {
      showMessage('❌ Password is required for new users', 'error');
      return;
    }
    
    try {
      const submitData = {
        username: formData.username.trim(),
        password: formData.password,
        fullname: formData.fullname.trim() || formData.username.trim(),
        role_id: formData.role_id
      };
      
      console.log('📤 Submitting:', submitData);
      
      let response;
      if (editingUser) {
        response = await axios.put(`/api/users/${editingUser.user_id}`, submitData);
        showMessage('✅ User updated successfully!');
      } else {
        response = await axios.post('/api/users', submitData);
        showMessage('✅ User created successfully!');
      }
      
      console.log('📥 Response:', response.data);
      
      setShowModal(false);
      setEditingUser(null);
      setFormData({ username: '', password: '', fullname: '', role_id: '2' });
      fetchUsers();
    } catch (error) {
      console.error('❌ Error:', error.response?.data || error.message);
      showMessage(`❌ ${error.response?.data?.error || 'Failed to save user'}`, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await axios.delete(`/api/users/${id}`);
      showMessage('✅ User deleted successfully!');
      fetchUsers();
    } catch (error) {
      showMessage(`❌ ${error.response?.data?.error || 'Failed to delete user'}`, 'error');
    }
  };

  // FIXED: Get role badge based on role string or role_id
  const getRoleBadge = (roleId, role) => {
    // If role is a string (from Access), map it
    if (typeof role === 'string') {
      const roleMap = {
        'Admin': 1,
        'Cashier': 2,
        'Viewer': 3
      };
      roleId = roleMap[role] || 2;
    }
    
    const roles = {
      1: { color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400', label: 'Admin' },
      2: { color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400', label: 'Cashier' },
      3: { color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400', label: 'Viewer' }
    };
    const roleData = roles[roleId] || roles[2];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleData.color}`}>
        {roleData.label}
      </span>
    );
  };

  return (
    <div>
      {message && (
        <div className={`p-3 rounded-lg mb-4 ${messageType === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'}`}>
          {message}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Shield className="w-7 h-7 text-indigo-600" />
              User Management
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage system users and their roles
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchUsers}
              className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </button>
            <button
              onClick={() => { 
                setEditingUser(null); 
                setFormData({ username: '', password: '', fullname: '', role_id: '2' }); 
                setShowModal(true); 
              }}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <Plus className="w-4 h-4 mr-2" /> Add User
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">No users found</h3>
            <p className="text-gray-400 dark:text-gray-500 mt-1">Add your first user to get started</p>
            <button
              onClick={() => { setEditingUser(null); setFormData({ username: '', password: '', fullname: '', role_id: '2' }); setShowModal(true); }}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <Plus className="w-4 h-4 inline mr-2" /> Add User
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Username</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Full Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.user_id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <td className="px-4 py-3">
                      <span className="font-medium text-sm dark:text-white">{user.username || user.Username}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {user.fullname || user.FullName || '-'}
                    </td>
                    <td className="px-4 py-3">
                      {getRoleBadge(user.role_id, user.role || user.Role)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${(user.status || user.Status) === 'ACTIVE' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                        {user.status || user.Status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => { 
                          setEditingUser(user); 
                          setFormData({ 
                            username: user.username || user.Username || '', 
                            password: '', 
                            fullname: user.fullname || user.FullName || '',
                            role_id: String(user.role_id || (user.Role === 'Admin' ? 1 : user.Role === 'Cashier' ? 2 : 3) || 2)
                          }); 
                          setShowModal(true); 
                        }} 
                        className="text-blue-500 hover:text-blue-700 p-1 transition"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(user.user_id)} 
                        className="text-red-500 hover:text-red-700 p-1 ml-2 transition"
                        title="Delete"
                        disabled={user.user_id === 1}
                      >
                        <Trash2 className={`w-4 h-4 ${user.user_id === 1 ? 'opacity-30 cursor-not-allowed' : ''}`} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
              Total: {users.length} user(s)
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                {editingUser ? 'Edit User' : 'Add New User'}
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    placeholder="Enter username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.fullname}
                    onChange={(e) => setFormData({...formData, fullname: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {editingUser ? 'Password (leave blank to keep current)' : 'Password *'}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    placeholder={editingUser ? 'Leave blank to keep current' : 'Enter password'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                  <select
                    value={formData.role_id}
                    onChange={(e) => setFormData({...formData, role_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  >
                    <option value="1">Admin</option>
                    <option value="2">Cashier</option>
                    <option value="3">Viewer</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t dark:border-gray-700">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition dark:text-white"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingUser ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;