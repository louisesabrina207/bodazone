import React, { useEffect, useState } from 'react';
import { FaBell, FaTrash, FaCheck } from 'react-icons/fa';
import apiClient from '../services/api';

const InboxPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  });
  const [filter, setFilter] = useState('all'); // all, unread, read

  // Fetch notifications
  const fetchNotifications = async (page = 1, readFilter = null) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to view your notifications.');
      setNotifications([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = { page, limit: 15 };
      if (readFilter === 'unread') {
        params.read = 'false';
      } else if (readFilter === 'read') {
        params.read = 'true';
      }

      const response = await apiClient.get('/notifications', { params });

      setNotifications(response.data.data);
      setPagination(response.data.pagination);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to fetch notifications';
      setError(errorMsg);
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const readFilter = filter === 'all' ? null : filter;
    fetchNotifications(1, readFilter);
  }, [filter]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await apiClient.put(`/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.put('/notifications/read-all');
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await apiClient.delete(`/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order_confirmed':
        return '✓';
      case 'order_processing':
        return '⚙️';
      case 'order_shipped':
      case 'order_out_for_delivery':
        return '📦';
      case 'order_ready_pickup':
        return '🛍️';
      case 'order_released_delivery':
        return '🚚';
      case 'order_delivered':
        return '✅';
      case 'order_cancelled':
        return '❌';
      default:
        return '🔔';
    }
  };

  const getStatusColor = (type) => {
    switch (type) {
      case 'order_confirmed':
      case 'order_shipped':
      case 'order_delivered':
        return 'bg-green-50 border-l-4 border-green-500';
      case 'order_processing':
        return 'bg-blue-50 border-l-4 border-blue-500';
      case 'order_ready_pickup':
      case 'order_out_for_delivery':
      case 'order_released_delivery':
        return 'bg-yellow-50 border-l-4 border-yellow-500';
      case 'order_cancelled':
        return 'bg-red-50 border-l-4 border-red-500';
      default:
        return 'bg-gray-50 border-l-4 border-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FaBell className="w-8 h-8 text-yellow-500" />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Inbox</h1>
                <p className="text-sm text-gray-600">All your order notifications and updates in one place</p>
              </div>
            </div>
            {notifications.some(n => !n.read) && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-4 border-b">
            {['all', 'unread', 'read'].map(filterType => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-4 py-2 font-medium transition ${
                  filter === filterType
                    ? 'text-yellow-600 border-b-2 border-yellow-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
            <p className="text-gray-600 mt-4">Loading your inbox...</p>
          </div>
        )}

        {/* Notifications List */}
        {!loading && notifications.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FaBell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No notifications yet</p>
            <p className="text-gray-400 text-sm">You're all caught up!</p>
          </div>
        )}

        {!loading && notifications.length > 0 && (
          <div className="space-y-4">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className={`rounded-lg shadow-md p-4 transition hover:shadow-lg cursor-pointer ${getStatusColor(notification.type)} ${
                  !notification.read ? 'opacity-100' : 'opacity-90'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <span className="text-2xl mt-1">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1">
                      <a
                        href={`/orders/${notification.orderId}`}
                        className="font-semibold text-gray-800 hover:text-blue-600 block"
                      >
                        {notification.title}
                      </a>
                      <p className="text-gray-600 text-sm mt-1">
                        {notification.message}
                      </p>
                      <p className="text-gray-400 text-xs mt-2">
                        {new Date(notification.createdAt).toLocaleDateString()} at{' '}
                        {new Date(notification.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="text-blue-600 hover:text-blue-800 transition p-2"
                        title="Mark as read"
                      >
                        <FaCheck className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="text-red-600 hover:text-red-800 transition p-2"
                      title="Delete"
                    >
                      <FaTrash className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
              page => (
                <button
                  key={page}
                  onClick={() => fetchNotifications(page, filter === 'all' ? null : filter)}
                  className={`px-3 py-2 rounded-lg transition ${
                    page === pagination.currentPage
                      ? 'bg-yellow-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InboxPage;
