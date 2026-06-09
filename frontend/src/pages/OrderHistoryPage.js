import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrder } from '../context/OrderContext';
import { FaBox, FaTruck, FaCheckCircle, FaTimesCircle, FaClock } from 'react-icons/fa';

const OrderHistoryPage = () => {
  const navigate = useNavigate();
  const { orders, loading, error, fetchOrders } = useOrder();
  const [filter, setFilter] = useState('all'); // all, pending, shipped, delivered, cancelled

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(order => order.status === filter);

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending':
        return <FaClock className="text-yellow-500" />;
      case 'shipped':
        return <FaTruck className="text-blue-500" />;
      case 'delivered':
        return <FaCheckCircle className="text-green-500" />;
      case 'cancelled':
        return <FaTimesCircle className="text-red-500" />;
      default:
        return <FaBox className="text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      shipped: { bg: 'bg-blue-100', text: 'text-blue-800' },
      delivered: { bg: 'bg-green-100', text: 'text-green-800' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800' }
    };
    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
    return `px-3 py-1 rounded text-sm font-bold ${config.bg} ${config.text}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Orders</h1>
          <p className="text-gray-600">Track your orders and manage purchases</p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6 p-4 flex gap-2 overflow-x-auto">
          {[
            { value: 'all', label: 'All Orders' },
            { value: 'pending', label: 'Pending' },
            { value: 'shipped', label: 'Shipped' },
            { value: 'delivered', label: 'Delivered' },
            { value: 'cancelled', label: 'Cancelled' }
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-4 py-2 rounded-lg font-bold whitespace-nowrap transition ${
                filter === tab.value
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
              <p className="mt-4 text-gray-600">Loading orders...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredOrders.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FaBox className="text-6xl text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Orders Found</h2>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? "You haven't placed any orders yet." 
                : `No ${filter} orders.`}
            </p>
            <button
              onClick={() => navigate('/products')}
              className="bg-yellow-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-yellow-600 transition"
            >
              Start Shopping
            </button>
          </div>
        )}

        {/* Orders List */}
        {!loading && filteredOrders.length > 0 && (
          <div className="space-y-4">
            {filteredOrders.map(order => (
              (() => {
                const orderItems = order.items || order.OrderItems || [];
                return (
              <div 
                key={order.id}
                onClick={() => navigate(`/order/${order.id}`)}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition cursor-pointer p-6"
              >
                <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                  {/* Order Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(order.status)}
                      <span className={getStatusBadge(order.status)}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Order ID</p>
                        <p className="font-bold text-gray-800">{order.id}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Order Date</p>
                        <p className="font-bold text-gray-800">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Items</p>
                        <p className="font-bold text-gray-800">{orderItems.length || 0} items</p>
                      </div>
                    </div>

                    {/* Items Preview */}
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">Items:</p>
                      <div className="flex flex-wrap gap-2">
                        {orderItems.slice(0, 3).map((item, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                            {item.productName || `Product ${idx + 1}`} x {item.quantity}
                          </span>
                        ))}
                        {orderItems.length > 3 && (
                          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                            +{orderItems.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Amount and Action */}
                  <div className="md:text-right w-full md:w-auto">
                    <p className="text-xs text-gray-600 mb-1">Total Amount</p>
                    <p className="text-2xl font-bold text-yellow-600 mb-4">
                      KES {(order.totalAmount || 0).toLocaleString()}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/order/${order.id}`);
                      }}
                      className="w-full bg-yellow-500 text-white font-bold py-2 rounded-lg hover:bg-yellow-600 transition"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
                );
              })()
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistoryPage;
