import React, { createContext, useContext, useState, useCallback } from 'react';
import { orderAPI, deliveryAPI } from '../services/api';

const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await orderAPI.getMyOrders();
      const list = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data?.orders)
          ? response.data.orders
          : [];
      setOrders(list);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, []);

  const getOrderDetails = useCallback(async (orderId) => {
    try {
      setLoading(true);
      const response = await orderAPI.getOrderById(orderId);
      const order = response.data?.data || response.data?.order || null;
      setCurrentOrder(order);
      setError(null);
      return order;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  }, []);

  const createOrder = useCallback(async (orderData) => {
    try {
      setLoading(true);
      const response = await orderAPI.createOrder(orderData);
      const payload = response.data?.data || response.data?.order || null;
      if (payload) {
        setCurrentOrder(payload);
      }
      setError(null);
      return payload;
    } catch (err) {
      const backendErrors = err.response?.data?.errors;
      const details = Array.isArray(backendErrors)
        ? backendErrors.map((e) => `${e.field}: ${e.message}`).join(' | ')
        : '';
      const errorMsg = details || err.response?.data?.message || 'Failed to create order';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [orders]);

  const cancelOrder = useCallback(async (orderId, reason = '') => {
    try {
      setLoading(true);
      await orderAPI.cancelOrder(orderId, { reason });
      setOrders(orders.map(o => 
        o.id === orderId ? { ...o, status: 'cancelled' } : o
      ));
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel order');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [orders]);

  const trackDelivery = useCallback(async (trackingNumber) => {
    try {
      setLoading(true);
      const response = await deliveryAPI.trackDelivery(trackingNumber);
      setError(null);
      return response.data?.data || response.data?.delivery || null;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to track delivery');
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh delivery info and update current order with latest delivery status
  const refreshDeliveryStatus = useCallback(async (orderId) => {
    try {
      setLoading(true);
      const order = await getOrderDetails(orderId);
      // The unified endpoint now includes delivery status
      if (order && order.Delivery) {
        setError(null);
        return order.Delivery;
      }
      return null;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to refresh delivery status');
    } finally {
      setLoading(false);
    }
  }, [getOrderDetails]);

  return (
    <OrderContext.Provider
      value={{
        orders,
        currentOrder,
        loading,
        error,
        fetchOrders,
        getOrderDetails,
        createOrder,
        cancelOrder,
        trackDelivery,
        refreshDeliveryStatus,
        setError
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within OrderProvider');
  }
  return context;
};
