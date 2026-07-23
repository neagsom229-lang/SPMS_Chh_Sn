import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  Warehouse, 
  ClipboardList, 
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
  ChevronDown,
  AlertTriangle,
  DollarSign,
  UserCircle
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

// ============================================
// LAYOUT COMPONENT
// ============================================
const Layout = ({ children, user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(null);
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

  // ===== LOAD AVATAR FROM LOCAL STORAGE =====
  useEffect(() => {
    const loadAvatar = () => {
      try {
        const saved = localStorage.getItem('userAvatar');
        if (saved) {
          setAvatarPreview(saved);
        }
      } catch (error) {
        console.error('Error loading avatar:', error);
      }
    };
    loadAvatar();

    const handleStorageChange = (e) => {
      if (e.key === 'userAvatar') {
        loadAvatar();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // ===== MENU ITEMS =====
  const menu = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', color: 'text-indigo-400' },
    { path: '/orders', icon: ShoppingCart, label: 'Orders', color: 'text-purple-400' },
    { path: '/products', icon: Package, label: 'Products', color: 'text-emerald-400' },
    { path: '/customers', icon: Users, label: 'Customers', color: 'text-blue-400' },
    { path: '/stock', icon: Warehouse, label: 'Stock', color: 'text-amber-400' },
    { path: '/suppliers', icon: Truck, label: 'Suppliers', color: 'text-cyan-400' },
    { path: '/reports', icon: ClipboardList, label: 'Reports', color: 'text-rose-400' },
    { path: '/users', icon: Shield, label: 'Users', color: 'text-red-400' },
    { path: '/activity', icon: Clock, label: 'Activity', color: 'text-orange-400' },
    { path: '/warranty', icon: Shield, label: 'Warranty', color: 'text-teal-400' },
    { path: '/analytics', icon: TrendingUp, label: 'Analytics', color: 'text-pink-400' },
    { path: '/profile', icon: UserCircle, label: 'Profile', color: 'text-indigo-400' },
  ];

  // ===== TIME UPDATE =====
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ===== MOUSE TRACKING =====
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
        setIsSidebarOpen(false);
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
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const userName = user?.username || 'Guest';
  const userRole = user?.role || user?.role_name || 'User';
  const userInitial = userName.charAt(0).toUpperCase();
  const userEmail = user?.email || 'user@example.com';

  const currentPage = menu.find(item => item.path === location.pathname)?.label || 'Dashboard';
  const currentIcon = menu.find(item => item.path === location.pathname)?.icon || LayoutDashboard;
  const CurrentIcon = currentIcon;

  const getStatusColor = (type) => {
    const colors = {
      order: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
      alert: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
      payment: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
      customer: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    };
    return colors[type] || colors.order;
  };

  const getNotificationIcon = (type) => {
    const icons = {
      order: <ShoppingCart className="w-4 h-4" />,
      alert: <AlertTriangle className="w-4 h-4" />,
      payment: <DollarSign className="w-4 h-4" />,
      customer: <User className="w-4 h-4" />,
    };
    return icons[type] || icons.order;
  };

  // ===== GET AVATAR OR INITIALS =====
  const getAvatarDisplay = () => {
    if (avatarPreview) {
      return (
        <img 
          src={avatarPreview} 
          alt="Profile" 
          className="w-full h-full object-cover"
        />
      );
    }
    return <span className="text-sm font-bold">{userInitial}</span>;
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      
      {/* ===== SIDEBAR OVERLAY ===== */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ===== SIDEBAR ===== */}
      <aside 
        className={`
          fixed lg:relative inset-y-0 left-0 z-50
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          w-64 
          bg-gradient-to-b from-indigo-900 via-indigo-800 to-indigo-900 
          text-white flex flex-col shadow-2xl transition-all duration-300 ease-in-out
          shrink-0
        `}
      >
        {/* Mobile Close Button */}
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="absolute top-4 right-4 text-white/70 hover:text-white lg:hidden"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Logo */}
        <div className="p-4 border-b border-indigo-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 flex-shrink-0">
              <span className="text-xl">🏪</span>
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
                SPMS
              </h1>
              <p className="text-[10px] text-indigo-300/70 leading-tight">Sale & Product</p>
            </div>
          </div>
        </div>

        {/* ===== USER PROFILE - CLICKABLE WITH AVATAR ===== */}
        <Link 
          to="/profile"
          className="block p-4 border-b border-indigo-800/50 hover:bg-indigo-800/30 transition-all duration-200 group"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-110 transition-transform duration-300 overflow-hidden">
                {getAvatarDisplay()}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-indigo-900 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate group-hover:text-indigo-200 transition-colors">
                {userName}
              </p>
              <p className="text-[10px] text-indigo-300/70 truncate">
                {userRole}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-indigo-400/50 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1" />
          </div>
        </Link>

        {/* ===== NAVIGATION - FIXED WITH KEYS ===== */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menu.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path} // ✅ THIS FIXES THE WARNING!
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                  ${isActive 
                    ? 'bg-white/10 text-white shadow-lg shadow-indigo-500/10' 
                    : 'text-indigo-200 hover:bg-white/5 hover:text-white'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? item.color : ''}`} />
                <span className="text-sm font-medium">{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-1 h-6 bg-indigo-400 rounded-full shadow-lg shadow-indigo-400/50" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-indigo-800/50 space-y-1">
          <button
            onClick={toggleDarkMode}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-indigo-200 hover:bg-white/5 hover:text-white transition-all duration-200"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            <span className="text-sm">{darkMode ? 'Light' : 'Dark'}</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* ===== HEADER ===== */}
        <header 
          ref={headerRef}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 px-3 sm:px-4 py-2 sm:py-3 sticky top-0 z-30 shadow-sm"
        >
          <div className="flex items-center justify-between gap-2">
            {/* Left Section */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-1.5 sm:p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 lg:hidden"
              >
                <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>

              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex-shrink-0">
                  <CurrentIcon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 dark:text-white truncate">
                    {currentPage}
                  </h2>
                  <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 hidden xs:block truncate">
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {/* Search */}
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 w-32 md:w-40 lg:w-48 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Mobile Search Toggle */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="sm:hidden p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
              >
                <Search className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                >
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-rose-500 text-white text-[8px] sm:text-[10px] flex items-center justify-center font-bold shadow-lg shadow-rose-500/30 animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 max-w-[calc(100vw-1rem)] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-slideDown">
                    <div className="p-3 sm:p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                      <h4 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2 text-sm sm:text-base">
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
                    <div className="max-h-60 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">
                          <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">No notifications</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id} // ✅ Already has key
                            onClick={() => handleNotificationClick(n.id)}
                            className={`px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-all duration-200 border-l-4 ${
                              !n.read ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10' : 'border-transparent'
                            }`}
                          >
                            <div className="flex items-start gap-2 sm:gap-3">
                              <div className={`p-1.5 sm:p-2 rounded-xl ${getStatusColor(n.type)} flex-shrink-0`}>
                                {getNotificationIcon(n.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs sm:text-sm truncate ${!n.read ? 'font-semibold text-gray-800 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                                  {n.title}
                                </p>
                                <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">{n.time}</p>
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
                      <button className="text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
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
                  className="flex items-center gap-1 sm:gap-2 p-1 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 overflow-hidden">
                    {avatarPreview ? (
                      <img 
                        src={avatarPreview} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] sm:text-xs font-bold text-white">{userInitial}</span>
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 leading-tight truncate max-w-[60px] md:max-w-[100px]">
                      {userName}
                    </p>
                    <p className="text-[8px] sm:text-[10px] text-gray-400 dark:text-gray-500 leading-tight">
                      {userRole}
                    </p>
                  </div>
                  <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 hidden sm:block" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 sm:w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-slideDown">
                    <div className="p-3 sm:p-4 border-b border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 flex-shrink-0 overflow-hidden">
                          {avatarPreview ? (
                            <img 
                              src={avatarPreview} 
                              alt="Profile" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs sm:text-sm font-bold text-white">{userInitial}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 dark:text-white text-sm sm:text-base truncate">{userName}</p>
                          <p className="text-[10px] sm:text-xs text-gray-400 truncate">{userEmail}</p>
                          <span className="text-[8px] sm:text-[10px] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full inline-block">
                            {userRole}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-1 sm:p-2">
                      <button 
                        onClick={() => { setShowUserMenu(false); navigate('/profile'); }}
                        className="flex items-center gap-2 sm:gap-3 w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                      >
                        <User className="w-3 h-3 sm:w-4 sm:h-4" />
                        Profile
                      </button>
                      <button className="flex items-center gap-2 sm:gap-3 w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                        <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                        Settings
                      </button>
                      <button className="flex items-center gap-2 sm:gap-3 w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                        <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                        Help
                      </button>
                    </div>
                    <div className="p-1 sm:p-2 border-t border-gray-100 dark:border-gray-700">
                      <button 
                        onClick={handleLogout}
                        className="flex items-center gap-2 sm:gap-3 w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                      >
                        <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
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
            <div className="mt-2 sm:hidden animate-slideDown">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>
          )}
        </header>

        {/* ===== MAIN CONTENT ===== */}
        <main className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6">
          <div className="max-w-7xl mx-auto animate-fadeInUp">
            {children}
          </div>
        </main>
      </div>

      {/* ===== CSS ANIMATIONS ===== */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .animate-fadeInUp { animation: fadeInUp 0.4s ease-out forwards; }
        .animate-slideDown { animation: slideDown 0.3s ease-out forwards; }

        @media (max-width: 640px) {
          button, a, input, select {
            min-height: 44px;
          }
        }

        * {
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>
    </div>
  );
};

export default Layout;