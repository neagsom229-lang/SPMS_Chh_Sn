import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, Trash2, RefreshCw } from 'lucide-react';

const ActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/activity-logs');
      setLogs(res.data);
    } catch (error) {
      console.error('Error fetching logs:', error);
      setMessage('❌ Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = async () => {
    if (!window.confirm('Clear all activity logs?')) return;
    try {
      await axios.delete('/api/activity-logs');
      setMessage('✅ Logs cleared');
      fetchLogs();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ Failed to clear logs');
    }
  };

  const getActionColor = (action) => {
    const actions = {
      'Login': 'text-blue-500',
      'Created customer': 'text-green-500',
      'Updated customer': 'text-yellow-500',
      'Deleted customer': 'text-red-500',
      'Created product': 'text-green-500',
      'Updated product': 'text-yellow-500',
      'Deleted product': 'text-red-500',
      'Created order': 'text-purple-500',
      'Created user': 'text-green-500',
      'Updated user': 'text-yellow-500',
      'Deleted user': 'text-red-500'
    };
    return actions[action] || 'text-gray-500';
  };

  return (
    <div>
      {message && (
        <div className={`p-3 rounded-lg mb-4 ${message.includes('✅') ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'}`}>
          {message}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Clock className="w-7 h-7 text-indigo-600" />
              Activity Log
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Recent user actions ({logs.length} entries)
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchLogs}
              className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </button>
            <button
              onClick={clearLogs}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Clear Logs
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">No activity logs</h3>
            <p className="text-gray-400 dark:text-gray-500 mt-1">User actions will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Table</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.log_id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <td className="px-4 py-3 font-medium text-sm dark:text-white">
                      {log.username || `User ${log.user_id}`}
                    </td>
                    <td className={`px-4 py-3 text-sm ${getActionColor(log.action)}`}>
                      {log.action}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {log.table_name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(log.action_date).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
              Showing {logs.length} entries
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLog;