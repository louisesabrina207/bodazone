import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { paymentAPI } from '../services/api';
import { paymentStatusUtils } from '../utils/helpers';

const PaymentContext = createContext();

export const PaymentProvider = ({ children }) => {
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [currentPayment, setCurrentPayment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const pollingIntervalRef = useRef(null);

  const initiatePayment = useCallback(async (orderId, phone, amount) => {
    try {
      setLoading(true);
      const response = await paymentAPI.initiatePayment({
        orderId,
        phoneNumber: phone,
        amount
      });

      setCurrentPayment(response.data?.data || response.data?.payment || null);
      setError(null);
      return response.data;
    } catch (err) {
      const details = err.response?.data?.details;
      const detailText = details?.errorCode
        ? ` (${details.errorCode}${details.requestId ? `, requestId: ${details.requestId}` : ''})`
        : '';
      const errorMsg = `${err.response?.data?.message || 'Failed to initiate payment'}${detailText}`;
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyPayment = useCallback(async (orderId) => {
    try {
      setLoading(true);
      const response = await paymentAPI.verifyPayment(orderId);
      setPaymentStatus(paymentStatusUtils.normalize(response.data?.data?.status || response.data?.status || null));
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify payment');
    } finally {
      setLoading(false);
    }
  }, []);

  const queryPaymentStatus = useCallback(async (checkoutRequestId) => {
    try {
      setLoading(true);
      const response = await paymentAPI.queryPaymentStatus({
        checkoutRequestId
      });
      setPaymentStatus(paymentStatusUtils.normalize(response.data?.data?.status || response.data?.status || null));
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to query payment status');
    } finally {
      setLoading(false);
    }
  }, []);

  const getPaymentHistory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await paymentAPI.getPaymentHistory();
      const history = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data?.payments)
          ? response.data.payments
          : [];
      setPaymentHistory(history);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch payment history');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Start polling for payment status updates
   * Polls every 5 seconds for M-Pesa payment confirmation
   */
  const startPaymentStatusPolling = useCallback((orderId, maxAttempts = 24) => {
    let attempts = 0;
    
    // Clear any existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setInterval(async () => {
      attempts++;
      
      try {
        const response = await paymentAPI.verifyPayment(orderId);
        const status = response.data?.data?.status || response.data?.status;
        const normalizedStatus = paymentStatusUtils.normalize(status);
        
        setPaymentStatus(normalizedStatus);
        
        // Stop polling if payment is confirmed or failed
        if (paymentStatusUtils.isSuccessful(status) || status === 'failed') {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        
        // Stop after max attempts
        if (attempts >= maxAttempts) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      } catch (err) {
        console.error('Payment status polling error:', err);
        // Continue polling despite errors
      }
    }, 5000); // Poll every 5 seconds
  }, []);

  /**
   * Stop payment status polling
   */
  const stopPaymentStatusPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  return (
    <PaymentContext.Provider
      value={{
        paymentHistory,
        currentPayment,
        loading,
        error,
        paymentStatus,
        initiatePayment,
        verifyPayment,
        queryPaymentStatus,
        getPaymentHistory,
        startPaymentStatusPolling,
        stopPaymentStatusPolling,
        setError
      }}
    >
      {children}
    </PaymentContext.Provider>
  );
};

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment must be used within PaymentProvider');
  }
  return context;
};
