import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, Package, ShoppingCart, DollarSign, 
  AlertCircle, TrendingUp, TrendingDown, 
  Plus, FileText, Clock, Calendar,
  ArrowRight, BarChart3, PieChart
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart,
  PieChart as RePieChart, Pie, Cell
} from 'recharts';

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    lowStockItems: 0,
    pendingOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        axios.get('/api/dashboard/stats'),
        axios.get('/api/orders/recent')
      ]);
      setStats(statsRes.data);
      setRecentOrders(ordersRes.data);
      
      // Generate chart data
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      setChartData(months.map((m, i) => ({
        name: m,
        revenue: Math.floor(Math.random() * 5000) + 1000,
        orders: Math.floor(Math.random() * 30) + 5
      })));
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  const StatCard = ({ icon: Icon, title, value, color, bgColor, subtitle, trend }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all hover:-translate-y-1 group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
          <p className="text-2xl font-bold mt-1 text-gray-800 dark:text-white">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${bgColor} group-hover:scale-110 transition`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          <span className={trend > 0 ? 'text-green-500' : 'text-red-500'}>
            {trend > 0 ? <TrendingUp className="w-3 h-3 inline" /> : <TrendingDown className="w-3 h-3 inline" />}
            {Math.abs(trend)}%
          </span>
          <span className="text-gray-400">vs last month</span>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex flex-wrap justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">
              👋 Welcome back, <span className="text-indigo-100">{user?.username || 'User'}!</span>
            </h1>
            <p className="text-indigo-100 mt-1 opacity-90">Here's what's happening with your store today</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button className="bg-indigo-600 text-white p-4 rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg">
          <Plus className="w-5 h-5" /> New Order
        </button>
        <button className="bg-green-600 text-white p-4 rounded-xl hover:bg-green-700 transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg">
          <Users className="w-5 h-5" /> Add Customer
        </button>
        <button className="bg-purple-600 text-white p-4 rounded-xl hover:bg-purple-700 transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg">
          <Package className="w-5 h-5" /> Add Product
        </button>
        <button className="bg-yellow-600 text-white p-4 rounded-xl hover:bg-yellow-700 transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg">
          <FileText className="w-5 h-5" /> Generate Report
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={Users} 
          title="Total Customers" 
          value={stats.totalCustomers}
          color="text-blue-600"
          bgColor="bg-blue-100 dark:bg-blue-900/30"
          trend={12}
        />
        <StatCard 
          icon={Package} 
          title="Total Products" 
          value={stats.totalProducts}
          color="text-green-600"
          bgColor="bg-green-100 dark:bg-green-900/30"
          trend={5}
        />
        <StatCard 
          icon={ShoppingCart} 
          title="Total Orders" 
          value={stats.totalOrders}
          color="text-purple-600"
          bgColor="bg-purple-100 dark:bg-purple-900/30"
          subtitle={`${stats.pendingOrders} pending`}
          trend={8}
        />
        <StatCard 
          icon={DollarSign} 
          title="Total Revenue" 
          value={`$${stats.totalRevenue.toFixed(2)}`}
          color="text-yellow-600"
          bgColor="bg-yellow-100 dark:bg-yellow-900/30"
          trend={15}
        />
      </div>

      {/* Alerts */}
      {(stats.lowStockItems > 0 || stats.pendingOrders > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.lowStockItems > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg flex items-center justify-between hover:shadow-md transition">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                <span className="text-yellow-700 dark:text-yellow-300 font-medium">
                  ⚠️ {stats.lowStockItems} product(s) running low on stock!
                </span>
              </div>
              <button className="text-sm text-yellow-700 dark:text-yellow-300 hover:text-yellow-900 font-medium flex items-center gap-1">
                View Stock <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
          {stats.pendingOrders > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg flex items-center justify-between hover:shadow-md transition">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                <span className="text-blue-700 dark:text-blue-300 font-medium">
                  ⏳ {stats.pendingOrders} order(s) pending processing!
                </span>
              </div>
              <button className="text-sm text-blue-700 dark:text-blue-300 hover:text-blue-900 font-medium flex items-center gap-1">
                View Orders <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              Revenue Overview
            </h3>
            <span className="text-xs text-gray-400">Last 6 months</span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: 'white'
                }} 
              />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="#818cf8" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-500" />
              Orders Overview
            </h3>
            <span className="text-xs text-gray-400">Last 6 months</span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: 'white'
                }} 
              />
              <Bar dataKey="orders" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex flex-wrap justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-indigo-500" />
            Recent Orders
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Latest 10 orders</span>
            <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-medium flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
        {recentOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-400 dark:text-gray-500">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No orders yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase text-left">Order #</th>
                  <th className="py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase text-left">Customer</th>
                  <th className="py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase text-left">Date</th>
                  <th className="py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase text-right">Amount</th>
                  <th className="py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order, index) => (
                  <tr key={order.OR_ID || order.order_id || index} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <td className="py-3 text-sm font-medium text-indigo-600 dark:text-indigo-400">{order.ORDER_NO || order.order_no}</td>
                    <td className="py-3 text-sm dark:text-gray-300">{order.FIRST_NAME || order.first_name} {order.LAST_NAME || order.last_name}</td>
                    <td className="py-3 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(order.ORDER_DATE || order.order_date).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-sm font-medium text-right dark:text-white">${(order.AMOUNT_US || order.net_amount || 0).toFixed(2)}</td>
                    <td className="py-3 text-sm text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        (order.STATUS || order.status) === 'Completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                        (order.STATUS || order.status) === 'Pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' :
                        'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                      }`}>
                        {order.STATUS || order.status || 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;