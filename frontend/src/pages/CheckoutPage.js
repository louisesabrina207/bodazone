import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useOrder } from '../context/OrderContext';
import { usePayment } from '../context/PaymentContext';
import { useNotification } from '../context/NotificationContext';
import { FaCreditCard, FaPhone, FaMapMarkerAlt, FaArrowLeft } from 'react-icons/fa';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, getTotalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const { createOrder } = useOrder();
  const { initiatePayment, startPaymentStatusPolling, stopPaymentStatusPolling } = usePayment();
  const { success: showSuccess, error: showError } = useNotification();

  const [step, setStep] = useState(1); // 1: Shipping, 2: Payment, 3: Confirmation
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState(null);

  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    county: '',
    postalCode: '',
    notes: ''
  });

  const [paymentData, setPaymentData] = useState({
    paymentMethod: 'mpesa', // Only M-Pesa is supported
    mpesaPhone: user?.phone || ''
  });

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
    }
  }, [items.length, navigate]);

  // Cleanup polling on component unmount
  useEffect(() => {
    return () => {
      stopPaymentStatusPolling();
    };
  }, [stopPaymentStatusPolling]);

  const calculateTotal = () => {
    const subtotal = getTotalPrice();
    const delivery = items.reduce((sum, item) => sum + (Number(item.deliveryFee || 0) * Number(item.quantity || 0)), 0);
    return { subtotal, delivery, total: subtotal + delivery };
  };

  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({ ...prev, [name]: value }));
  };

  const validateShipping = () => {
    if (!formData.fullName.trim()) {
      showError('Full name is required');
      return false;
    }
    if (!formData.phone.trim() || formData.phone.length < 10) {
      showError('Valid phone number is required');
      return false;
    }
    if (!formData.address.trim()) {
      showError('Delivery address is required');
      return false;
    }
    if (!formData.city.trim()) {
      showError('City is required');
      return false;
    }
    if (!formData.county.trim()) {
      showError('County is required');
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateShipping()) return;

    try {
      setLoading(true);

      // Prepare order data - always use M-Pesa as payment method
      const orderData = {
        items: items.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        shippingAddress: {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          county: formData.county,
          postalCode: formData.postalCode
        },
        paymentMethod: 'mpesa', // Only M-Pesa is supported
        notes: formData.notes,
        totalAmount: calculateTotal().total
      };

      // Create order
      const newOrder = await createOrder(orderData);
      setOrderId(newOrder?.orderId || newOrder?.id);
      setStep(2);
      showSuccess('Order created successfully! Proceed to payment.');
    } catch (err) {
      showError(err.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const handleMpesaPayment = async () => {
    if (!paymentData.mpesaPhone.trim() || paymentData.mpesaPhone.length < 10) {
      showError('Valid M-Pesa phone number is required');
      return;
    }

    try {
      setLoading(true);

      // Initiate M-Pesa payment
      const response = await initiatePayment(
        orderId,
        paymentData.mpesaPhone,
        calculateTotal().total
      );

      if (response?.data?.checkoutRequestId || response?.checkoutRequestId) {
        showSuccess('M-Pesa prompt sent! Enter your M-Pesa PIN to complete payment');
        
        // Start automatic polling for payment status confirmation
        startPaymentStatusPolling(orderId);
        
        // Move to confirmation step after a brief delay
        setTimeout(() => {
          setStep(3);
        }, 2000);
      }
    } catch (err) {
      showError(err.message || 'Failed to initiate M-Pesa payment');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteOrder = () => {
    clearCart();
    showSuccess('Order placed successfully!');
    navigate(`/order/${orderId}`);
  };

  const { subtotal, delivery, total } = calculateTotal();

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <button 
          onClick={() => navigate('/cart')}
          className="flex items-center gap-2 text-yellow-600 hover:text-yellow-700 mb-6 text-sm sm:text-base"
        >
          <FaArrowLeft /> Back to Cart
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step Indicators */}
            <div className="flex justify-between items-center mb-6 sm:mb-8 bg-white rounded-lg shadow-md p-4 sm:p-6">
              {[1, 2, 3].map(stepNum => (
                <div key={stepNum} className="flex items-center flex-1">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-white text-xs sm:text-sm ${
                    step >= stepNum ? 'bg-yellow-500' : 'bg-gray-300'
                  }`}>
                    {stepNum}
                  </div>
                  <div className="flex-1 h-1 mx-1 sm:mx-2 bg-gray-300"></div>
                </div>
              ))}
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-white text-xs sm:text-sm ${
                step >= 3 ? 'bg-yellow-500' : 'bg-gray-300'
              }`}>
                ✓
              </div>
            </div>

            {/* Step 1: Shipping Address */}
            {step === 1 && (
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
                  <FaMapMarkerAlt /> Shipping Address
                </h2>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleShippingChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
                        placeholder="Your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleShippingChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
                        placeholder="Your email"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleShippingChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
                        placeholder="254712345678"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleShippingChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
                      placeholder="Enter delivery address"
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleShippingChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">County</label>
                      <input
                        type="text"
                        name="county"
                        value={formData.county}
                        onChange={handleShippingChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
                        placeholder="County"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleShippingChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
                        placeholder="00100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Notes (Optional)</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleShippingChange}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
                      placeholder="Special delivery instructions..."
                    ></textarea>
                  </div>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="w-full mt-6 bg-yellow-500 text-white font-bold py-3 rounded-lg hover:bg-yellow-600 transition disabled:opacity-50"
                >
                  {loading ? 'Creating Order...' : 'Continue to Payment'}
                </button>
              </div>
            )}

            {/* Step 2: Payment */}
            {step === 2 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <FaCreditCard /> M-Pesa Payment
                </h2>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-gray-700">
                    <strong>Note:</strong> BodaZone currently accepts payment through M-Pesa only. 
                    An M-Pesa STK prompt will be sent to your phone to complete the payment.
                  </p>
                </div>

                {/* M-Pesa Payment */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <FaPhone /> M-Pesa Phone Number
                  </label>
                  <input
                    type="tel"
                    name="mpesaPhone"
                    value={paymentData.mpesaPhone}
                    onChange={handlePaymentChange}
                    placeholder="254712345678"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    Enter your M-Pesa registered phone number. An STK push prompt will be sent to complete payment.
                  </p>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 bg-gray-300 text-gray-800 font-bold py-3 rounded-lg hover:bg-gray-400 transition"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleMpesaPayment}
                    disabled={loading}
                    className="flex-1 bg-yellow-500 text-white font-bold py-3 rounded-lg hover:bg-yellow-600 transition disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : `Pay KES ${total.toLocaleString()}`}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="mb-6">
                  <div className="inline-block w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-3xl">✓</span>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-green-600 mb-2">Order Placed Successfully!</h2>
                <p className="text-gray-600 mb-6">Order ID: <span className="font-bold">{orderId}</span></p>
                <p className="text-gray-600 mb-6">
                  Check your email for order confirmation and tracking details.
                </p>

                <button
                  onClick={handleCompleteOrder}
                  className="w-full bg-yellow-500 text-white font-bold py-3 rounded-lg hover:bg-yellow-600 transition"
                >
                  View Order Details
                </button>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:sticky lg:top-20">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">Order Summary</h2>

              {/* Items */}
              <div className="space-y-2 mb-4 sm:mb-6 pb-4 sm:pb-6 border-b max-h-48 sm:max-h-64 overflow-y-auto">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between text-xs sm:text-sm text-gray-600">
                    <span className="truncate">{item.name} x {item.quantity}</span>
                    <span className="ml-2 font-semibold">KES {(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Costs */}
              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 pb-4 sm:pb-6 border-b text-sm sm:text-base">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold">KES {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span className="font-bold">KES {delivery.toLocaleString()}</span>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-800">Total</span>
                <span className="text-xl sm:text-2xl font-bold text-yellow-600">KES {total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
