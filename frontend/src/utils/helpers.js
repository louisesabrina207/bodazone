// Format utilities for common data transformations
export const paymentStatusUtils = {
  normalize: (status) => {
    if (!status || typeof status !== 'string') return status;

    const normalized = status.toLowerCase();
    if (normalized === 'paid' || normalized === 'completed') return 'verified';

    return normalized;
  },

  isSuccessful: (status) => {
    const normalized = paymentStatusUtils.normalize(status);
    return normalized === 'verified';
  }
};

export const formatters = {
  // Format currency (KES)
  formatKES: (amount) => {
    return `KES ${amount?.toLocaleString?.() || 0}`;
  },

  // Format date
  formatDate: (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  // Format date and time
  formatDateTime: (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Format phone number
  formatPhone: (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 12 && cleaned.startsWith('254')) {
      return `+${cleaned}`;
    }
    if (cleaned.length === 10) {
      return `+254${cleaned.substring(1)}`;
    }
    return phone;
  },

  // Truncate text
  truncate: (text, length = 50) => {
    if (!text || text.length <= length) return text;
    return `${text.substring(0, length)}...`;
  },

  // Format order status
  formatOrderStatus: (status) => {
    const statusMap = {
      pending: 'Pending',
      processing: 'Processing',
      shipped: 'In Transit',
      delivered: 'Delivered',
      cancelled: 'Cancelled'
    };
    return statusMap[status] || status;
  },

  // Format payment status
  formatPaymentStatus: (status) => {
    const normalizedStatus = paymentStatusUtils.normalize(status);
    const statusMap = {
      pending: 'Pending',
      processing: 'Processing',
      verified: 'Paid',
      failed: 'Failed',
      refunded: 'Refunded'
    };
    return statusMap[normalizedStatus] || normalizedStatus || status;
  }
};

// Validation utilities
export const validators = {
  // Email validation
  isValidEmail: (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },

  // Phone validation (Kenya)
  isValidPhone: (phone) => {
    const regex = /^(\+?254|0)?[17]\d{8}$/;
    return regex.test(phone.replace(/\s/g, ''));
  },

  // Password validation (min 6 chars)
  isValidPassword: (password) => {
    return password && password.length >= 6;
  },

  // Name validation
  isValidName: (name) => {
    return name && name.trim().length >= 2;
  },

  // Postal code validation
  isValidPostalCode: (code) => {
    return code && code.trim().length >= 4;
  }
};

// Storage utilities
export const storage = {
  // Get token
  getToken: () => {
    return localStorage.getItem('token');
  },

  // Set token
  setToken: (token) => {
    localStorage.setItem('token', token);
  },

  // Remove token
  removeToken: () => {
    localStorage.removeItem('token');
  },

  // Get user preference
  getPreference: (key, defaultValue = null) => {
    try {
      const value = localStorage.getItem(`pref_${key}`);
      return value ? JSON.parse(value) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  // Set user preference
  setPreference: (key, value) => {
    localStorage.setItem(`pref_${key}`, JSON.stringify(value));
  }
};

// Calculation utilities
export const calculations = {
  // Calculate total with optional delivery fee (default zero)
  calculateTotal: (subtotal, taxRate = 0, deliveryFee = 0) => {
    const tax = Math.round(subtotal * taxRate);
    const total = subtotal + tax + deliveryFee;
    return { subtotal, tax, deliveryFee, total };
  },

  // Calculate discount
  calculateDiscount: (price, discountPercent) => {
    const discount = (price * discountPercent) / 100;
    return price - discount;
  },

  // Calculate shipping cost based on distance
  calculateShippingCost: (distance) => {
    if (distance <= 10) return 150;
    if (distance <= 20) return 250;
    if (distance <= 30) return 350;
    return 450;
  }
};

// Array utilities
export const arrayUtils = {
  // Group by property
  groupBy: (array, property) => {
    return array.reduce((acc, item) => {
      const key = item[property];
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  },

  // Sort by property
  sortBy: (array, property, ascending = true) => {
    return [...array].sort((a, b) => {
      if (a[property] < b[property]) return ascending ? -1 : 1;
      if (a[property] > b[property]) return ascending ? 1 : -1;
      return 0;
    });
  },

  // Filter by multiple conditions
  filterBy: (array, conditions) => {
    return array.filter(item =>
      Object.entries(conditions).every(([key, value]) => item[key] === value)
    );
  },

  // Unique values
  unique: (array, property = null) => {
    if (!property) return [...new Set(array)];
    return [...new Map(array.map(item => [item[property], item])).values()];
  }
};

// Build absolute image URLs from backend-relative paths (e.g. /uploads/file.jpg)
export const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns%3D%22http%3A//www.w3.org/2000/svg%22 width%3D%22300%22 height%3D%22200%22 viewBox%3D%220 0 300 200%22%3E%3Crect width%3D%22300%22 height%3D%22200%22 fill%3D%22%23e5e7eb%22/%3E%3Cpath d%3D%22M90 130l35-40 25 30 20-20 40 50H90z%22 fill%3D%22%23cbd5e1%22/%3E%3Ccircle cx%3D%22120%22 cy%3D%2280%22 r%3D%2212%22 fill%3D%22%23cbd5e1%22/%3E%3Ctext x%3D%22150%22 y%3D%22175%22 text-anchor%3D%22middle%22 font-family%3D%22Arial%2C sans-serif%22 font-size%3D%2216%22 fill%3D%22%236b7280%22%3EImage unavailable%3C/text%3E%3C/svg%3E';

export const resolveImageUrl = (imagePath, fallback = PLACEHOLDER_IMAGE) => {
  if (!imagePath) return fallback;

  if (typeof imagePath !== 'string') return fallback;

  if (
    imagePath.startsWith('http://') ||
    imagePath.startsWith('https://') ||
    imagePath.startsWith('data:') ||
    imagePath.startsWith('blob:')
  ) {
    return imagePath;
  }

  const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const apiOrigin = apiBaseUrl.replace(/\/api\/?$/, '');
  const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;

  if (normalizedPath.startsWith('/uploads/')) {
    return `${apiOrigin}${normalizedPath}`;
  }

  return `${apiBaseUrl}${normalizedPath}`;
};

export const extractPrimaryImage = (product) => {
  if (!product) return null;

  const directImage = product.image;
  if (typeof directImage === 'string' && directImage.trim()) {
    return directImage;
  }

  let images = product.images;
  if (typeof images === 'string') {
    try {
      images = JSON.parse(images);
    } catch {
      images = [];
    }
  }

  if (Array.isArray(images) && images.length > 0) {
    const firstImage = images[0];
    return typeof firstImage === 'string' ? firstImage : null;
  }

  return null;
};

const helpers = {
  formatters,
  validators,
  storage,
  calculations,
  arrayUtils,
  resolveImageUrl,
  extractPrimaryImage
};

export default helpers;
