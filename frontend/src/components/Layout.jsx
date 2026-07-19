import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  Warehouse, 
  FileText, 
  Truck, 
  LogOut,
  Moon,
  Sun,
  Shield,
  Clock,
  TrendingUp  // ← ADDED
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Layout = ({ children, user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useTheme();
  
  const menu = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/orders', icon: ShoppingCart, label: 'Orders' },
    { path: '/products', icon: Package, label: 'Products' },
    { path: '/customers', icon: Users, label: 'Customers' },
    { path: '/stock', icon: Warehouse, label: 'Stock' },
    { path: '/suppliers', icon: Truck, label: 'Suppliers' },
    { path: '/reports', icon: FileText, label: 'Reports' },
    { path: '/users', icon: Shield, label: 'Users' },
    { path: '/activity', icon: Clock, label: 'Activity' },
    { path: '/warranty', icon: Shield, label: 'Warranty' },
    { path: '/analytics', icon: TrendingUp, label: 'Analytics' },  // ← ADDED
  ];

  const handleLogout = () => {
    navigate('/login');
  };

  const userName = user?.username || 'Guest';
  const userRole = user?.role || user?.role_name || 'User';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-indigo-900 text-white flex flex-col shadow-xl">
        <div className="p-4 border-b border-indigo-800">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="text-2xl">🏪</span> SPMS
          </h1>
          <p className="text-xs text-indigo-300 mt-1">Sale & Product Management</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menu.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition text-sm ${
                  isActive 
                    ? 'bg-indigo-800 text-white' 
                    : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-indigo-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-indigo-700 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold">{userInitial}</span>
            </div>
            <div>
              <p className="text-sm font-medium">{userName}</p>
              <p className="text-xs text-indigo-300">{userRole}</p>
            </div>
          </div>
          
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-indigo-200 hover:bg-indigo-800 rounded-lg transition mb-2"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-indigo-200 hover:bg-indigo-800 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 p-4 sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              {menu.find(item => item.path === location.pathname)?.label || 'Dashboard'}
            </h2>
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span>📅 {new Date().toLocaleDateString('en-US', { 
                weekday: 'short', 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })}</span>
            </div>
          </div>
        </header>
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;