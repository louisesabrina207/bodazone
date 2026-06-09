import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaUser, FaHome, FaBars, FaStore, FaCompass, FaTimes, FaChartBar } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Navigation = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { getTotalItems } = useCart();
  const [showMenu, setShowMenu] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setShowMenu(false);
  };

  const handleHomeClick = (e) => {
    e.preventDefault();
    if (isAuthenticated) {
      if (user?.role === 'admin') navigate('/admin-dashboard');
      else if (user?.role === 'seller') navigate('/seller-dashboard');
      else navigate('/discover');
    } else {
      navigate('/');
    }
    setShowMenu(false);
  };

  /**
   * Get primary navigation links based on role
   */
  const getPrimaryNavItems = () => {
    if (!isAuthenticated) {
      // Unauthenticated users: browse only
      return [
        { label: 'Browse', path: '/', icon: <FaCompass /> },
        { label: 'Shops', path: '/shops', icon: <FaStore /> },
        { label: 'Products', path: '/products', icon: null }
      ];
    }

    if (user?.role === 'admin') {
      // Admins: only dashboard
      return [
        { label: 'Dashboard', path: '/admin-dashboard', icon: <FaChartBar />, highlight: true }
      ];
    }

    if (user?.role === 'seller') {
      // Sellers: only shop dashboard
      return [
        { label: 'My Shop', path: '/seller-dashboard', icon: <FaStore />, highlight: true }
      ];
    }

    // Riders: shopping & discovery
    return [
      { label: 'Browse', path: '/', icon: <FaCompass /> },
      { label: 'Shops', path: '/shops', icon: <FaStore /> },
      { label: 'Products', path: '/products', icon: null }
    ];
  };

  /**
   * Get secondary action items (icons in desktop nav)
   * Note: Inbox is now integrated into a separate page, not a navbar icon
   */
  const getSecondaryItems = () => {
    const items = [];

    // Cart badge only for riders (Inbox is now a full page in dropdown menu)
    if (isAuthenticated && user?.role === 'rider') {
      items.push({
        type: 'icon',
        label: 'Cart',
        path: '/cart',
        icon: <FaShoppingCart className="text-2xl" />,
        badge: getTotalItems() > 0 ? getTotalItems() : null
      });
    }

    return items;
  };

  /**
   * Get dropdown menu items based on role
   */
  const getDropdownItems = () => {
    const items = [
      { label: 'My Profile', path: '/profile' }
    ];

    if (isAuthenticated && user?.role === 'rider') {
      items.push(
        { label: 'My Orders', path: '/orders' },
        { label: 'Inbox & Notifications', path: '/inbox' }
      );
    }

    return items;
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo / Home Button */}
          <button 
            onClick={handleHomeClick}
            className="flex items-center space-x-2 hover:opacity-80 transition"
          >
            <FaHome className="text-2xl text-yellow-400" />
            <span className="font-bold text-xl text-white">BodaZone</span>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Primary Navigation Items (Dynamic based on role) */}
            {getPrimaryNavItems().map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 font-medium hover:opacity-80 transition ${
                  item.highlight
                    ? 'bg-yellow-400 text-blue-900 px-3 py-1 rounded shadow'
                    : 'text-white'
                }`}
              >
                {item.icon} {item.label}
              </Link>
            ))}

            {isAuthenticated ? (
              <>
                {/* Secondary Items (Icons - Cart only, Inbox moved to dropdown) */}
                {getSecondaryItems().map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="relative hover:opacity-80 transition"
                    title={item.label}
                  >
                    {item.icon}
                    {item.badge && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}

                {/* User Dropdown Menu */}
                <div className="relative group">
                  <button className="flex items-center space-x-2 text-white hover:text-yellow-400 font-medium transition">
                    <FaUser />
                    <span>{user?.name?.split(' ')[0] || 'User'}</span>
                  </button>
                  
                  {/* Dropdown Content */}
                  <div className="hidden group-hover:block absolute right-0 bg-white rounded-lg shadow-2xl py-2 w-56 z-50 border-2 border-blue-200">
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b-2 border-blue-100 bg-gradient-to-r from-blue-50 to-blue-100">
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">
                        {user?.role === 'admin' ? '👨‍💼 Admin' : user?.role === 'seller' ? '🏪 Seller' : '🛍️ Buyer'}
                      </p>
                      <p className="text-sm text-gray-800 font-bold mt-1">{user?.name}</p>
                      <p className="text-xs text-blue-600">{user?.email}</p>
                    </div>

                    {/* Dropdown Menu Items */}
                    <div className="py-2">
                      {getDropdownItems().map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          className="block px-4 py-2.5 text-gray-800 hover:bg-blue-100 hover:border-l-4 hover:border-blue-600 text-sm transition font-medium"
                          onClick={() => setShowMenu(false)}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>

                    {/* Logout Button */}
                    <div className="border-t-2 border-blue-100 pt-2">
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2.5 text-red-600 hover:bg-red-50 hover:border-l-4 hover:border-red-600 font-bold text-sm transition"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Unauthenticated Users: Login & Register */}
                <Link
                  to="/login"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium text-sm"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-medium text-sm"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-white hover:text-yellow-400 transition"
            >
              {showMenu ? <FaTimes className="text-2xl" /> : <FaBars className="text-2xl" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMenu && (
          <div className="md:hidden pb-4 border-t border-blue-500 bg-blue-50">
            {/* User Status (if authenticated) */}
            {isAuthenticated && (
              <div className="px-4 py-3 bg-white border-b border-blue-200">
                <p className="text-sm text-gray-600 font-medium">
                  {user?.role === 'admin' ? '👨‍💼 Admin Account' : user?.role === 'seller' ? '🏪 Seller Account' : '🛍️ Buyer Account'}
                </p>
                <p className="text-sm font-bold text-gray-800">{user?.name}</p>
              </div>
            )}

            {/* Mobile Navigation Items */}
            <div className="py-2">
              {getPrimaryNavItems().map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 text-gray-800 hover:bg-blue-200 font-medium transition ${
                    item.highlight ? 'bg-blue-200' : ''
                  }`}
                  onClick={() => setShowMenu(false)}
                >
                  {item.icon} {item.label}
                </Link>
              ))}
            </div>

            {isAuthenticated ? (
              <>
                {/* Secondary Items for Mobile (Cart only) */}
                <div className="border-t border-blue-200 py-2">
                  {getSecondaryItems().map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="flex items-center justify-between px-4 py-2 text-gray-800 hover:bg-blue-200 font-medium transition"
                      onClick={() => setShowMenu(false)}
                    >
                      {item.label}
                      {item.badge && (
                        <span className="bg-red-500 text-white rounded-full px-2 py-0.5 text-xs font-bold">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>

                {/* Dropdown Items for Mobile */}
                <div className="border-t border-blue-200 py-2">
                  {getDropdownItems().map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="block px-4 py-2 text-gray-800 hover:bg-blue-200 font-medium transition"
                      onClick={() => setShowMenu(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>

                {/* Logout Button for Mobile */}
                <div className="border-t border-blue-200 pt-2">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-100 font-medium transition"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Auth Buttons for Mobile */}
                <div className="border-t border-yellow-200 py-2 space-y-2">
                  <Link
                    to="/login"
                    className="block px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 font-medium rounded text-center"
                    onClick={() => setShowMenu(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block px-4 py-2 bg-green-600 text-white hover:bg-green-700 font-medium rounded text-center"
                    onClick={() => setShowMenu(false)}
                  >
                    Register
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
