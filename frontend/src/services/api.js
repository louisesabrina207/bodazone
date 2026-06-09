import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    Accept: 'application/json'
  }
});

// Add token and normalize content type for requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
      // Let axios set the correct multipart boundary header
      delete config.headers['Content-Type'];
    } else {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth Services
export const authAPI = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  logout: () => apiClient.get('/auth/logout'),
  getCurrentUser: () => apiClient.get('/auth/me'),
  refreshToken: () => apiClient.post('/auth/refresh-token'),
  sendEmailVerificationCode: (data) => apiClient.post('/auth/send-email-verification', data),
  verifyEmailCode: (data) => apiClient.post('/auth/verify-email', data),
  sendTwoFactorCode: (data) => apiClient.post('/auth/send-two-factor-code', data),
  verifyTwoFactorCode: (data) => apiClient.post('/auth/verify-two-factor', data)
};

// multipart seller registration
authAPI.registerSeller = (formData) => {
  return apiClient.post('/auth/register-seller', formData);
};

// Product Services
export const productAPI = {
  getAllProducts: (params) => apiClient.get('/products', { params }),
  getProductById: (id) => apiClient.get(`/products/${id}`),
  getById: (id) => apiClient.get(`/products/${id}`),
  createProduct: (data) => apiClient.post('/products', data),
  updateProduct: (id, data) => apiClient.put(`/products/${id}`, data),
  deleteProduct: (id) => apiClient.delete(`/products/${id}`),
  getSellerProducts: (sellerId, params) => apiClient.get(`/products/seller/${sellerId}`, { params }),
  getMyProducts: (params) => apiClient.get('/products/seller/me', { params }),
  uploadProductImages: (productId, formData) => apiClient.post(`/products/${productId}/images`, formData),
  getCategories: () => apiClient.get('/products/categories'),
  getAllShops: (params) => apiClient.get('/products/shops/all', { params })
};

// Order Services
export const orderAPI = {
  createOrder: (data) => apiClient.post('/orders', data),
  getMyOrders: (params) => apiClient.get('/orders', { params }),
  getOrderById: (id) => apiClient.get(`/orders/${id}`),
  cancelOrder: (id, data) => apiClient.post(`/orders/${id}/cancel`, data)
};

// Payment Services
export const paymentAPI = {
  initiatePayment: (data) => apiClient.post('/payments/initiate', data),
  retryPayment: (data) => apiClient.post('/payments/retry', data),
  verifyPayment: (orderId) => apiClient.get(`/payments/${orderId}/verify`),
  queryPaymentStatus: (data) => apiClient.post('/payments/query-status', data),
  getPaymentHistory: (params) => apiClient.get('/payments/history', { params })
};

// Delivery Services
export const deliveryAPI = {
  getDelivery: (id) => apiClient.get(`/deliveries/${id}`),
  trackDelivery: (trackingNumber) => apiClient.get(`/deliveries/track/${trackingNumber}`),
  updateDeliveryStatus: (id, data) => apiClient.put(`/deliveries/${id}/status`, data)
};

// Review Services
export const reviewAPI = {
  createReview: (data) => apiClient.post('/reviews', data),
  getProductReviews: (productId, params) => apiClient.get(`/reviews/product/${productId}`, { params }),
  getSellerReviews: (sellerId, params) => apiClient.get(`/reviews/seller/${sellerId}`, { params })
};

// User Services
export const userAPI = {
  getProfile: () => apiClient.get('/users/profile'),
  updateProfile: (data) => apiClient.put('/users/profile', data),
  getAddresses: () => apiClient.get('/users/addresses'),
  addAddress: (data) => apiClient.post('/users/addresses', data),
  updateAddress: (id, data) => apiClient.put(`/users/addresses/${id}`, data),
  deleteAddress: (id) => apiClient.delete(`/users/addresses/${id}`)
};

// Seller Services
export const sellerAPI = {
  getDashboard: () => apiClient.get('/sellers/me/dashboard'),
  getMyShop: () => apiClient.get('/sellers/me/shop'),
  updateMyShop: (data) => apiClient.put('/sellers/me/shop', data),
  getMyDocuments: () => apiClient.get('/sellers/me/documents'),
  uploadDocuments: (formData) => apiClient.post('/sellers/me/documents', formData),
  getMyOrders: (params) => apiClient.get('/sellers/me/orders', { params }),
  updateOrderStatus: (orderId, data) => apiClient.put(`/sellers/orders/${orderId}/status`, data),
  downloadInventoryInvoice: () => apiClient.get('/sellers/me/inventory-invoice', { responseType: 'blob' })
};

// Admin Services
export const adminAPI = {
  getDashboard: () => apiClient.get('/admin/dashboard'),
  getUsers: (params) => apiClient.get('/admin/users', { params }),
  getSellers: (params) => apiClient.get('/admin/sellers', { params }),
  toggleSellerApproval: (id) => apiClient.patch(`/admin/sellers/${id}/approval`),
  suspendSeller: (id) => apiClient.patch(`/admin/sellers/${id}/suspend`),
  getTransactions: (params) => apiClient.get('/admin/transactions', { params }),
  getOrders: (params) => apiClient.get('/admin/orders', { params }),
  getReports: (params) => apiClient.get('/admin/reports', { params }),
  getOrdersTracking: (params) => apiClient.get('/admin/orders/tracking', { params }),
  getOrderTracking: (orderId) => apiClient.get(`/admin/orders/${orderId}/tracking`),
  getOrdersStatus: () => apiClient.get('/admin/orders/status')
  ,
  getSellerDocuments: (sellerId) => apiClient.get(`/admin/sellers/${sellerId}/documents`)
  ,
  approveSellerDocument: (sellerId, docId) => apiClient.patch(`/admin/sellers/${sellerId}/documents/${docId}/approve`),
  rejectSellerDocument: (sellerId, docId, body) => apiClient.patch(`/admin/sellers/${sellerId}/documents/${docId}/reject`, body)
  ,
  verifySeller: (sellerId) => apiClient.patch(`/admin/sellers/${sellerId}/verify`)
};

export default apiClient;
