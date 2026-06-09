import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrder } from '../context/OrderContext';
import { useNotification } from '../context/NotificationContext';
import { FaBox, FaTruck, FaCheckCircle, FaArrowLeft, FaFilePdf } from 'react-icons/fa';
import { reviewAPI, default as apiClient, paymentAPI } from '../services/api';
import { formatters, paymentStatusUtils } from '../utils/helpers';

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentOrder, getOrderDetails, trackDelivery, refreshDeliveryStatus, cancelOrder, loading } = useOrder();
  const { success: showSuccess, error: showError } = useNotification();

  const [delivery, setDelivery] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);
  const [retryingPayment, setRetryingPayment] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const orderItems = currentOrder?.items || currentOrder?.OrderItems || [];
  const trackingNumber = currentOrder?.trackingNumber || currentOrder?.Delivery?.trackingNumber;

  const fetchDeliveryInfo = useCallback(async () => {
    if (!trackingNumber) return;

    try {
      const deliveryInfo = await trackDelivery(trackingNumber);
      setDelivery(deliveryInfo);
    } catch (err) {
      console.error('Failed to track delivery:', err);
    }
  }, [trackingNumber, trackDelivery]);

  const handleRefreshDelivery = useCallback(async () => {
    try {
      setRefreshing(true);
      const updatedDelivery = await refreshDeliveryStatus(id);
      if (updatedDelivery) {
        setDelivery(updatedDelivery);
        showSuccess('Delivery status refreshed');
      }
    } catch (err) {
      showError('Failed to refresh delivery status');
    } finally {
      setRefreshing(false);
    }
  }, [id, refreshDeliveryStatus, showSuccess, showError]);

  useEffect(() => {
    if (id) {
      getOrderDetails(id);
    }
  }, [id, getOrderDetails]);

  useEffect(() => {
    if (trackingNumber) {
      fetchDeliveryInfo();
    }
  }, [trackingNumber, fetchDeliveryInfo]);

  // Auto-refresh delivery status every 30 seconds if order is not delivered
  useEffect(() => {
    if (!id || !currentOrder || currentOrder.status === 'delivered' || currentOrder.status === 'cancelled') {
      return;
    }

    const interval = setInterval(() => {
      handleRefreshDelivery();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [id, currentOrder, handleRefreshDelivery]);

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    try {
      await cancelOrder(id, 'User requested cancellation');
      showSuccess('Order cancelled successfully');
      getOrderDetails(id);
    } catch (err) {
      showError(err.message || 'Failed to cancel order');
    }
  };

  const handleDownloadReceipt = async () => {
    try {
      setDownloadingReceipt(true);
      const response = await apiClient.get(`/receipts/${id}/download`, { responseType: 'blob' });

      // Create blob and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Receipt-${currentOrder.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSuccess('Receipt downloaded successfully');
    } catch (err) {
      let errorMessage = 'Failed to download receipt';

      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          errorMessage = parsed?.message || errorMessage;
        } catch (parseError) {
          errorMessage = err.message || errorMessage;
        }
      } else {
        errorMessage = err.response?.data?.message || err.message || errorMessage;
      }

      showError(errorMessage);
    } finally {
      setDownloadingReceipt(false);
    }
  };

  const handleRetryPayment = async () => {
    const retryPhone = currentOrder?.shippingAddress?.phone || currentOrder?.User?.phone;

    if (!retryPhone) {
      showError('No phone number available for payment retry');
      return;
    }

    try {
      setRetryingPayment(true);
      await paymentAPI.retryPayment({ orderId: id });
      showSuccess('Payment retry sent to your phone');
      getOrderDetails(id);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to retry payment');
    } finally {
      setRetryingPayment(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!comment.trim()) {
      showError('Please enter a review');
      return;
    }

    try {
      // Submit review for first product in order
      if (orderItems.length > 0) {
        const firstItem = orderItems[0];
        const reviewData = {
          productId: firstItem.productId || firstItem.Product?.id,
          orderId: id,
          rating,
          title: `Rating: ${rating} stars`,
          comment,
          quality: rating,
          deliverySpeed: rating,
          sellerService: rating
        };

        await reviewAPI.createReview(reviewData);
        showSuccess('Review submitted successfully');
        setShowReviewForm(false);
        setComment('');
        setRating(5);
        getOrderDetails(id);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to submit review');
    }
  };

  const getDeliveryStatus = (status) => {
    const statusConfig = {
      pending: { icon: FaBox, color: 'text-yellow-500', label: 'Pending' },
      processing: { icon: FaBox, color: 'text-blue-500', label: 'Processing' },
      shipped: { icon: FaTruck, color: 'text-blue-500', label: 'In Transit' },
      in_transit: { icon: FaTruck, color: 'text-blue-500', label: 'In Transit' },
      delivered: { icon: FaCheckCircle, color: 'text-green-500', label: 'Delivered' },
      cancelled: { icon: FaBox, color: 'text-red-500', label: 'Cancelled' }
    };

    return statusConfig[status] || statusConfig.pending;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!currentOrder) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => navigate('/orders')}
            className="flex items-center gap-2 text-yellow-600 hover:text-yellow-700 mb-6"
          >
            <FaArrowLeft /> Back to Orders
          </button>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            Order not found
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = getDeliveryStatus(currentOrder.status);
  const StatusIcon = statusConfig.icon;
  const normalizedPaymentStatus = paymentStatusUtils.normalize(currentOrder.paymentStatus);
  const hasSuccessfulPayment = paymentStatusUtils.isSuccessful(currentOrder.paymentStatus);
  const hasFailedPayment = normalizedPaymentStatus === 'failed';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <button 
          onClick={() => navigate('/orders')}
          className="flex items-center gap-2 text-yellow-600 hover:text-yellow-700 mb-6"
        >
          <FaArrowLeft /> Back to Orders
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Header */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 mb-1">Order #{currentOrder.id}</h1>
                  <p className="text-gray-600">Placed on {new Date(currentOrder.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end mb-2">
                    <StatusIcon className={`${statusConfig.color} text-2xl`} />
                    <span className={`text-lg font-bold ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                </div>
              </div>

              {trackingNumber && (
                <p className="text-sm text-gray-600">
                  <strong>Tracking #:</strong> {trackingNumber}
                </p>
              )}
            </div>

            {/* Delivery Timeline */}
            {delivery && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Delivery Status</h2>
                  <button
                    onClick={handleRefreshDelivery}
                    disabled={refreshing}
                    className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white rounded text-sm transition"
                  >
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>

                {(() => {
                  const deliverySteps = ['pending', 'processing', 'in_transit', 'delivered'];
                  const stepLabels = {
                    pending: 'Order Received',
                    processing: 'Order Processing',
                    in_transit: 'In Transit',
                    delivered: 'Delivered'
                  };

                  const currentDeliveryStatus = delivery.status || 'pending';
                  const currentIndex = Math.max(deliverySteps.indexOf(currentDeliveryStatus), 0);

                  return (
                <div className="space-y-6">
                  {deliverySteps.map((step, idx) => {
                    const isActive = currentDeliveryStatus === step;
                    const isPassed = idx <= currentIndex;
                    
                    return (
                      <div key={idx} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                            isActive ? 'bg-yellow-500' : isPassed ? 'bg-green-500' : 'bg-gray-300'
                          }`}>
                            {isPassed || isActive ? '✓' : idx + 1}
                          </div>
                          {idx < 3 && (
                            <div className={`w-1 h-16 mt-2 ${
                              isPassed || isActive ? 'bg-green-500' : 'bg-gray-300'
                            }`}></div>
                          )}
                        </div>
                        <div className="flex-1 pb-8">
                          <p className={`font-bold ${isActive ? 'text-yellow-600' : isPassed ? 'text-green-600' : 'text-gray-600'}`}>
                            {stepLabels[step]}
                          </p>
                          {isActive && (
                            <p className="text-sm text-gray-600 mt-2">
                              Expected delivery: {delivery.estimatedDeliveryDate ? new Date(delivery.estimatedDeliveryDate).toLocaleDateString() : 'TBD'}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                  );
                })()}
              </div>
            )}

            {/* Items */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Order Items</h2>
              
              <div className="space-y-4">
                {orderItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center pb-4 border-b last:border-b-0">
                    <div>
                      <p className="font-bold text-gray-800">{item.productName || `Product ${idx + 1}`}</p>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-800">KES {(item.price * item.quantity).toLocaleString()}</p>
                      <p className="text-sm text-gray-600">KES {item.price} each</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Shipping Address</h2>
              
              <div className="text-gray-700">
                <p className="font-bold">{currentOrder.shippingAddress?.fullName}</p>
                <p>{currentOrder.shippingAddress?.address}</p>
                <p>{currentOrder.shippingAddress?.city}, {currentOrder.shippingAddress?.county} {currentOrder.shippingAddress?.postalCode}</p>
                <p className="mt-2">Phone: {currentOrder.shippingAddress?.phone}</p>
                <p>Email: {currentOrder.shippingAddress?.email}</p>
              </div>

              {currentOrder.notes && (
                <div className="mt-4 p-3 bg-amber-50 rounded">
                  <p className="text-sm text-gray-600"><strong>Delivery Notes:</strong> {currentOrder.notes}</p>
                </div>
              )}
            </div>

            {/* Review Section */}
            {currentOrder.status === 'delivered' && !showReviewForm && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="w-full bg-amber-500 text-white font-bold py-3 rounded-lg hover:bg-amber-600 transition"
              >
                Write a Review
              </button>
            )}

            {showReviewForm && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Write a Review</h2>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className={`text-3xl transition ${
                          star <= rating ? 'text-yellow-500' : 'text-gray-300'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Review</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows="4"
                    placeholder="Share your experience with this order..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
                  ></textarea>
                </div>

                <button
                  onClick={handleSubmitReview}
                  className="w-full bg-yellow-500 text-white font-bold py-2 rounded-lg hover:bg-yellow-600 transition"
                >
                  Submit Review
                </button>
              </div>
            )}
          </div>

          {/* Sidebar - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Order Summary</h2>

              <div className="space-y-3 mb-6 pb-6 border-b">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-bold">KES {currentOrder.subtotal?.toLocaleString() || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="font-bold">KES {Number(currentOrder.deliveryFee || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-bold">KES {currentOrder.tax?.toLocaleString() || 'N/A'}</span>
                </div>
              </div>

              <div className="mb-6 pb-6 border-b">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-800">Total</span>
                  <span className="text-2xl font-bold text-yellow-600">
                    KES {currentOrder.totalAmount?.toLocaleString() || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Payment Status */}
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">Payment Status</p>
                <p className={`font-bold ${
                  hasSuccessfulPayment ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {formatters.formatPaymentStatus(normalizedPaymentStatus)}
                </p>
              </div>

              {hasFailedPayment && (
                <div className="mb-6 p-4 rounded-lg border border-red-200 bg-red-50">
                  <p className="text-sm text-red-700 mb-3">Your last payment attempt failed. You can retry it now.</p>
                  <button
                    onClick={handleRetryPayment}
                    disabled={retryingPayment}
                    className="w-full bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400 font-bold py-2 rounded-lg transition"
                  >
                    {retryingPayment ? 'Retrying...' : 'Retry Payment'}
                  </button>
                </div>
              )}

              {/* Download Receipt Button */}
              {/* M-Pesa Sandbox: Allow receipt download for both successful and failed payments */}
              {(hasSuccessfulPayment || hasFailedPayment) && (
                <div className="mb-6">
                  <button
                    onClick={handleDownloadReceipt}
                    disabled={downloadingReceipt}
                    className="w-full bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-400 font-bold py-2 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <FaFilePdf /> {downloadingReceipt ? 'Downloading...' : 'Download Receipt'}
                  </button>
                  {hasFailedPayment && (
                    <p className="text-xs text-gray-600 mt-2">Note: You can download the receipt even though payment is pending/failed</p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2">
                {currentOrder.status !== 'cancelled' && ['pending', 'processing'].includes(currentOrder.status) && (
                  <button
                    onClick={handleCancelOrder}
                    className="w-full bg-red-100 text-red-700 hover:bg-red-200 font-bold py-2 rounded-lg transition"
                  >
                    Cancel Order
                  </button>
                )}
                <button
                  onClick={() => navigate('/products')}
                  className="w-full bg-yellow-500 text-white hover:bg-yellow-600 font-bold py-2 rounded-lg transition"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
