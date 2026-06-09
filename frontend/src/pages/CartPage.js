import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { FaTrash, FaArrowLeft, FaShoppingCart } from 'react-icons/fa';

const CartPage = () => {
  const navigate = useNavigate();
  const { items, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCart();

  const deliveryFee = items.reduce(
    (sum, item) => sum + Number(item.deliveryFee || 0) * Number(item.quantity || 0),
    0
  );

  const handleCheckout = () => {
    if (items.length === 0) {
      return;
    }
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-sky-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => navigate('/products')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-medium transition"
          >
            <FaArrowLeft /> Continue Shopping
          </button>

          <div className="bg-white rounded-lg shadow-md p-12 text-center border border-blue-100">
            <FaShoppingCart className="text-6xl text-blue-200 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Cart is Empty</h2>
            <p className="text-gray-600 mb-6">Start shopping for motorbike spare parts</p>
            <button
              onClick={() => navigate('/products')}
              className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition"
            >
              Browse Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sky-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => navigate('/products')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-medium transition"
          >
            <FaArrowLeft /> Continue Shopping
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Shopping Cart</h1>
          <p className="text-gray-600">You have {items.length} item{items.length !== 1 ? 's' : ''} in your cart</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => (
              <div key={item.id} className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-2 break-words">{item.name}</h3>
                    <p className="text-gray-600 mb-2 text-sm">SKU: {item.id}</p>
                    <p className="text-blue-600 font-bold text-lg sm:text-xl">KES {item.price}</p>
                  </div>

                  {/* Quantity Controls - Responsive */}
                  <div className="flex flex-col justify-between sm:items-end">
                    <div className="flex items-center gap-2 mb-4 sm:mb-0 order-first sm:order-none">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 border border-gray-300 rounded hover:bg-gray-100 text-sm"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                        className="w-14 text-center border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 border border-gray-300 rounded hover:bg-gray-100 text-sm"
                      >
                        +
                      </button>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right">
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Subtotal</p>
                      <p className="font-bold text-gray-800 text-sm sm:text-base">KES {(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-600 hover:text-red-700 font-bold"
                  >
                    <FaTrash size={20} />
                  </button>
                </div>
              </div>
            ))}

            {/* Clear Cart Button */}
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear your cart?')) {
                  clearCart();
                }
              }}
              className="w-full py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-bold transition"
            >
              Clear Cart
            </button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:sticky lg:top-20">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-6">Order Summary</h2>

              {/* Items */}
              <div className="space-y-2 mb-4 pb-4 border-b max-h-64 overflow-y-auto">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between text-xs sm:text-sm text-gray-600">
                    <span className="truncate">{item.name} x {item.quantity}</span>
                    <span className="ml-2 font-semibold">KES {(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2 mb-4 pb-4 border-b text-sm sm:text-base">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-bold">KES {getTotalPrice().toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="font-bold">KES {deliveryFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-bold">KES {Math.round(getTotalPrice() * 0.16).toLocaleString()}</span>
                </div>
              </div>

              {/* Grand Total */}
              <div className="mb-6 pb-4 border-b">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-800">Total</span>
                  <span className="text-xl sm:text-2xl font-bold text-blue-600">
                    KES {(getTotalPrice() + deliveryFee + Math.round(getTotalPrice() * 0.16)).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                className="w-full bg-blue-600 text-white font-bold py-2 sm:py-3 rounded-lg hover:bg-blue-700 transition text-sm sm:text-base"
              >
                Proceed to Checkout
              </button>

              {/* Continue Shopping */}
              <button
                onClick={() => navigate('/products')}
                className="w-full mt-3 bg-gray-300 text-gray-800 font-bold py-2 sm:py-3 rounded-lg hover:bg-gray-400 transition text-sm sm:text-base"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
