import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import Footer from './components/Footer';

// Context Providers
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { OrderProvider } from './context/OrderContext';
import { PaymentProvider } from './context/PaymentContext';
import { NotificationProvider, useNotification } from './context/NotificationContext';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import OrderDetailPage from './pages/OrderDetailPage';
import ProfilePage from './pages/ProfilePage';
import SellerDashboardPage from './pages/SellerDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ShopsDiscoveryPage from './pages/ShopsDiscoveryPage';
import InboxPage from './pages/InboxPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import VerifyTwoFactorPage from './pages/VerifyTwoFactorPage';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const roleHome = user?.role === 'admin'
    ? '/admin-dashboard'
    : user?.role === 'seller'
      ? '/seller-dashboard'
      : '/products';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
          <p className="mt-4 text-xl text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to={roleHome} replace />;
  }

  return children;
};

// Rider-only Route Component (blocks access to admins and sellers)
const RiderRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
          <p className="mt-4 text-xl text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Allow unauthenticated users to browse
  if (!isAuthenticated) {
    return children;
  }

  // If authenticated, only riders can access
  if (user?.role !== 'rider') {
    const roleHome = user?.role === 'admin' ? '/admin-dashboard' : '/seller-dashboard';
    return <Navigate to={roleHome} replace />;
  }

  return children;
};

// Notification Toast Component
const NotificationToast = () => {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map(notif => (
        <div
          key={notif.id}
          className={`px-6 py-4 rounded-lg shadow-lg text-white font-bold animate-slide-in ${
            notif.type === 'success' ? 'bg-green-500' :
            notif.type === 'error' ? 'bg-red-500' :
            notif.type === 'warning' ? 'bg-yellow-500' :
            'bg-blue-500'
          }`}
          onClick={() => removeNotification(notif.id)}
        >
          {notif.message}
        </div>
      ))}
    </div>
  );
};

const AppContent = () => {
  return (
    <>
      <NotificationToast />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/verify-two-factor" element={<VerifyTwoFactorPage />} />
        <Route path="/products" element={<RiderRoute><ProductsPage /></RiderRoute>} />
        <Route path="/product/:id" element={<RiderRoute><ProductDetailPage /></RiderRoute>} />
        <Route path="/products/:id" element={<RiderRoute><ProductDetailPage /></RiderRoute>} />
        
        {/* Discovery Routes (Riders/Unauthenticated only) */}
        <Route path="/shops" element={<RiderRoute><ShopsDiscoveryPage /></RiderRoute>} />

        {/* Protected Buyer Routes */}
        <Route 
          path="/cart" 
          element={
            <ProtectedRoute requiredRole="rider">
              <CartPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/checkout" 
          element={
            <ProtectedRoute requiredRole="rider">
              <CheckoutPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/orders" 
          element={
            <ProtectedRoute requiredRole="rider">
              <OrderHistoryPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/order/:id" 
          element={
            <ProtectedRoute requiredRole="rider">
              <OrderDetailPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />

        {/* Seller Routes */}
        <Route 
          path="/seller-dashboard" 
          element={
            <ProtectedRoute requiredRole="seller">
              <SellerDashboardPage />
            </ProtectedRoute>
          } 
        />

        {/* Admin Routes */}
        <Route 
          path="/admin-dashboard" 
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboardPage />
            </ProtectedRoute>
          } 
        />

        {/* Inbox/Notifications */}
        <Route 
          path="/inbox" 
          element={
            <ProtectedRoute>
              <InboxPage />
            </ProtectedRoute>
          } 
        />

        {/* 404 Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <CartProvider>
          <OrderProvider>
            <PaymentProvider>
              <Router 
                future={{
                  v7_startTransition: true,
                  v7_relativeSplatPath: true
                }}
              >
                <div className="flex flex-col min-h-screen">
                  <Navigation />
                  <main className="flex-1">
                    <AppContent />
                  </main>
                  <Footer />
                </div>
              </Router>
            </PaymentProvider>
          </OrderProvider>
        </CartProvider>
      </AuthProvider>
    </NotificationProvider>
  );
}

export default App;
