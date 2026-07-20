import React, { useState, useEffect, useRef } from 'react';
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
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  User,
  Settings,
  HelpCircle,
  Menu,
  X,
  Sparkles,
  Zap,
  Activity,
  ChevronDown,
  AlertTriangle,
  DollarSign
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

// ============================================
// LAYOUT COMPONENT
// ============================================
const Layout = ({ children, user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New order #1234 placed', time: '2 min ago', read: false, type: 'order' },
    { id: 2, title: 'Low stock alert: Product X', time: '1 hour ago', read: false, type: 'alert' },
    { id: 3, title: 'Payment received $450', time: '3 hours ago', read: true, type: 'payment' },
    { id: 4, title: 'New customer registered', time: '5 hours ago', read: true, type: 'customer' },
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const headerRef = useRef(null);

  // ===== MENU ITEMS =====
  const menu = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', color: 'text-indigo-400' },
    { path: '/orders', icon: ShoppingCart, label: 'Orders', color: 'text-purple-400' },
    { path: '/products', icon: Package, label: 'Products', color: 'text-emerald-400' },
    { path: '/customers', icon: Users, label: 'Customers', color: 'text-blue-400' },
    { path: '/stock', icon: Warehouse, label: 'Stock', color: 'text-amber-400' },
    { path: '/suppliers', icon: Truck, label: 'Suppliers', color: 'text-cyan-400' },
    { path: '/reports', icon: FileText, label: 'Reports', color: 'text-rose-400' },
    { path: '/users', icon: Shield, label: 'Users', color: 'text-red-400' },
    { path: '/activity', icon: Clock, label: 'Activity', color: 'text-orange-400' },
    { path: '/warranty', icon: Shield, label: 'Warranty', color: 'text-teal-400' },
    { path: '/analytics', icon: TrendingUp, label: 'Analytics', color: 'text-pink-400' },
  ];

  // ===== TIME UPDATE =====
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ===== MOUSE TRACKING FOR 3D EFFECT =====
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // ===== CLOSE MENUS ON ESCAPE =====
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setShowNotifications(false);
        setShowUserMenu(false);
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // ===== HANDLERS =====
  const handleLogout = () => {
    navigate('/login');
  };

  const handleNotificationClick = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const userName = user?.username || 'Guest';
  const userRole = user?.role || user?.role_name || 'User';
  const userInitial = userName.charAt(0).toUpperCase();
  const userEmail = user?.email || 'user@example.com';

  // ===== GET CURRENT PAGE LABEL =====
  const currentPage = menu.find(item => item.path === location.pathname)?.label || 'Dashboard';
  const currentIcon = menu.find(item => item.path === location.pathname)?.icon || LayoutDashboard;
  const CurrentIcon = currentIcon;

  // ===== GET STATUS COLOR =====
  const getStatusColor = (type) => {
    const colors = {
      order: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
      alert: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
      payment: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
      customer: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    };
    return colors[type] || colors.order;
  };

  // ===== GET NOTIFICATION ICON =====
  const getNotificationIcon = (type) => {
    const icons = {
      order: <ShoppingCart className="w-4 h-4" />,
      alert: <AlertTriangle className="w-4 h-4" />,
      payment: <DollarSign className="w-4 h-4" />,
      customer: <User className="w-4 h-4" />,
    };
    return icons[type] || icons.order;
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      
      {/* ===== SIDEBAR ===== */}
      <aside 
        className={`
          ${isSidebarOpen ? 'w-64' : 'w-20'} 
          bg-gradient-to-b from-indigo-900 via-indigo-800 to-indigo-900 
          text-white flex flex-col shadow-2xl transition-all duration-300 ease-in-out
          ${isMobileMenuOpen ? 'fixed inset-0 z-50 w-64' : 'relative'}
        `}
      >
        {/* Sidebar Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-20 bg-indigo-700 text-white rounded-full p-1 shadow-lg hover:bg-indigo-600 transition-all duration-300 hover:scale-110 hidden lg:block"
        >
          {isSidebarOpen ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        {/* Mobile Close Button */}
        {isMobileMenuOpen && (
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute top-4 right-4 text-white/70 hover:text-white lg:hidden"
          >
            <X className="w-6 h-6" />
          </button>
        )}

        {/* Logo */}
        <div className={`
          p-4 border-b border-indigo-800/50 transition-all duration-300
          ${!isSidebarOpen ? 'text-center' : ''}
        `}>
          <div className="flex items-center gap-3">
            <div className={`
              w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 
              flex items-center justify-center shadow-lg shadow-indigo-500/25
              ${!isSidebarOpen ? 'mx-auto' : ''}
            `}>
              <span className="text-xl">🏪</span>
            </div>
            <div className={`
              transition-all duration-300 overflow-hidden
              ${!isSidebarOpen ? 'w-0 opacity-0' : 'w-auto opacity-100'}
            `}>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
                SPMS
              </h1>
              <p className="text-[10px] text-indigo-300/70 leading-tight">Sale & Product Management</p>
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div className={`
          p-4 border-b border-indigo-800/50 transition-all duration-300
          ${!isSidebarOpen ? 'text-center' : ''}
        `}>
          <div className="flex items-center gap-3">
            <div className={`
              relative ${!isSidebarOpen ? 'mx-auto' : ''}
            `}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <span className="text-sm font-bold">{userInitial}</span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-indigo-900 animate-pulse" />
            </div>
            <div className={`
              transition-all duration-300 overflow-hidden
              ${!isSidebarOpen ? 'w-0 opacity-0' : 'w-auto opacity-100'}
            `}>
              <p className="text-sm font-medium truncate">{userName}</p>
              <p className="text-[10px] text-indigo-300/70 truncate">{userRole}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-700 scrollbar-track-transparent">
          {menu.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                  ${isActive 
                    ? 'bg-white/10 text-white shadow-lg shadow-indigo-500/10' 
                    : 'text-indigo-200 hover:bg-white/5 hover:text-white'
                  }
                  ${!isSidebarOpen ? 'justify-center' : ''}
                `}
              >
                <div className={`
                  relative
                  ${isActive ? 'scale-110' : 'group-hover:scale-110'}
                  transition-transform duration-200
                `}>
                  <Icon className={`w-5 h-5 ${isActive ? item.color : ''}`} />
                  {isActive && (
                    <span className="absolute -inset-1 bg-indigo-500/20 rounded-full blur-sm -z-10" />
                  )}
                </div>
                <span className={`
                  transition-all duration-300 overflow-hidden whitespace-nowrap
                  ${!isSidebarOpen ? 'w-0 opacity-0' : 'w-auto opacity-100'}
                  text-sm font-medium
                `}>
                  {item.label}
                </span>
                {isActive && (
                  <span className={`
                    ml-auto w-1 h-6 bg-indigo-400 rounded-full shadow-lg shadow-indigo-400/50
                    ${!isSidebarOpen ? 'hidden' : ''}
                  `} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-indigo-800/50 space-y-1">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className={`
              flex items-center gap-3 w-full px-3 py-2.5 rounded-xl 
              text-indigo-200 hover:bg-white/5 hover:text-white transition-all duration-200
              ${!isSidebarOpen ? 'justify-center' : ''}
            `}
          >
            {darkMode ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
            <span className={`
              transition-all duration-300 overflow-hidden whitespace-nowrap
              ${!isSidebarOpen ? 'w-0 opacity-0' : 'w-auto opacity-100'}
              text-sm
            `}>
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className={`
              flex items-center gap-3 w-full px-3 py-2.5 rounded-xl 
              text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-all duration-200
              ${!isSidebarOpen ? 'justify-center' : ''}
            `}
          >
            <LogOut className="w-5 h-5" />
            <span className={`
              transition-all duration-300 overflow-hidden whitespace-nowrap
              ${!isSidebarOpen ? 'w-0 opacity-0' : 'w-auto opacity-100'}
              text-sm
            `}>
              Logout
            </span>
          </button>
        </div>

        {/* Version */}
        <div className={`
          p-2 text-center text-[10px] text-indigo-400/50 border-t border-indigo-800/30
          ${!isSidebarOpen ? 'hidden' : ''}
        `}>
          v2.0.0 • © 2024 SPMS
        </div>
      </aside>

      {/* ===== MOBILE OVERLAY ===== */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* ===== HEADER ===== */}
        <header 
          ref={headerRef}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 p-3 sticky top-0 z-30 shadow-sm"
          style={{
            transform: `perspective(800px) rotateX(${(mousePosition.y / window.innerHeight - 0.5) * 0.5}deg)`,
            transition: 'transform 0.1s ease-out'
          }}
        >
          <div className="flex items-center justify-between">
            {/* Left Section */}
            <div className="flex items-center gap-3">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
              >
                <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>

              {/* Page Title with Icon */}
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30">
                  <CurrentIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                    {currentPage}
                  </h2>
                  <p className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Search */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 w-48 lg:w-64 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* Mobile Search Toggle */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="md:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
              >
                <Search className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                >
                  <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold shadow-lg shadow-rose-500/30 animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 top-12 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-slideDown">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                      <h4 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                        <Bell className="w-4 h-4 text-indigo-500" />
                        Notifications
                        {unreadCount > 0 && (
                          <span className="text-xs bg-rose-500 text-white px-2 py-0.5 rounded-full">
                            {unreadCount} new
                          </span>
                        )}
                      </h4>
                      {unreadCount > 0 && (
                        <button 
                          onClick={markAllRead}
                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">
                          <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">No notifications</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => handleNotificationClick(n.id)}
                            className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-all duration-200 border-l-4 ${
                              !n.read ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10' : 'border-transparent'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-xl ${getStatusColor(n.type)}`}>
                                {getNotificationIcon(n.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm truncate ${!n.read ? 'font-semibold text-gray-800 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                                  {n.title}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                              </div>
                              {!n.read && (
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-3 border-t border-gray-100 dark:border-gray-700 text-center">
                      <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                        View all notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                    <span className="text-xs font-bold text-white">{userInitial}</span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200 leading-tight">
                      {userName}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">
                      {userRole}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
                </button>

                {/* User Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 top-12 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-slideDown">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                          <span className="text-sm font-bold text-white">{userInitial}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-white">{userName}</p>
                          <p className="text-xs text-gray-400">{userEmail}</p>
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full">
                            {userRole}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <button className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                        <User className="w-4 h-4" />
                        Profile
                      </button>
                      <button className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                        <Settings className="w-4 h-4" />
                        Settings
                      </button>
                      <button className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                        <HelpCircle className="w-4 h-4" />
                        Help & Support
                      </button>
                    </div>
                    <div className="p-2 border-t border-gray-100 dark:border-gray-700">
                      <button 
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Time & Status */}
              <div className="hidden lg:flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{currentTime.toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Search Bar */}
          {isSearchOpen && (
            <div className="mt-3 md:hidden animate-slideDown">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  autoFocus
                />
              </div>
            </div>
          )}
        </header>

        {/* ===== MAIN CONTENT AREA ===== */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
          <div className="animate-fadeIn">
            {children}
          </div>
        </main>
      </div>

      {/* ===== CSS ANIMATIONS ===== */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
        }

        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
        .animate-slideDown { animation: slideDown 0.3s ease-out forwards; }
        .animate-pulse { animation: pulse 2s ease-in-out infinite; }

        /* Custom Scrollbar */
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #c4c4c4;
          border-radius: 2px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #a0a0a0;
        }
        .dark .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #4b5563;
        }
        .dark .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }

        /* Sidebar scrollbar */
        .scrollbar-thumb-indigo-700::-webkit-scrollbar-thumb {
          background: #4338ca;
        }
        .scrollbar-thumb-indigo-700::-webkit-scrollbar-track {
          background: transparent;
        }

        /* Smooth transitions */
        * {
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>
    </div>
  );
};

export default Layout;