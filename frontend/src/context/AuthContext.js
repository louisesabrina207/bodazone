import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on mount
  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      setUser(response.data.user);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch user:', err);
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const extractAuthPayload = (responseData) => {
    const payload = responseData?.data && typeof responseData.data === 'object'
      ? responseData.data
      : responseData;

    return payload || {};
  };

  const applySession = (payload) => {
    if (!payload?.token || !payload?.user) {
      return false;
    }

    localStorage.setItem('token', payload.token);
    setToken(payload.token);
    setUser(payload.user);
    setError(null);
    localStorage.removeItem('pendingVerificationEmail');
    localStorage.removeItem('pendingTwoFactorEmail');
    return true;
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await authAPI.login({ email, password });
      const payload = extractAuthPayload(response.data);

      if (applySession(payload)) {
        return payload;
      }

      if (payload?.requiresEmailVerification) {
        localStorage.setItem('pendingVerificationEmail', payload.email || email);
      }

      if (payload?.requiresTwoFactor) {
        localStorage.setItem('pendingTwoFactorEmail', payload.email || email);
      }

      return payload;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Login failed';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, phone, password, role = 'rider') => {
    try {
      setLoading(true);
      const response = await authAPI.register({
        name,
        email,
        phone,
        password,
        confirmPassword: password,
        role
      });

      const payload = extractAuthPayload(response.data);

      if (applySession(payload)) {
        return payload;
      }

      if (payload?.requiresEmailVerification) {
        localStorage.setItem('pendingVerificationEmail', payload.email || email);
      }

      return payload;
    } catch (err) {
      // Prefer detailed validation errors when available
      const resp = err.response?.data;
      let errorMsg = resp?.message || 'Registration failed';

      if (resp?.errors && Array.isArray(resp.errors) && resp.errors.length) {
        try {
          const list = resp.errors.map(e => (e.field ? `${e.field}: ${e.message}` : e.message));
          errorMsg = list.join('; ');
        } catch (e) {
          // fallback to generic message
        }
      }

      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const registerWithDocs = async (formData) => {
    try {
      setLoading(true);
      const response = await authAPI.registerSeller(formData);
      const payload = extractAuthPayload(response.data);

      if (applySession(payload)) {
        return payload;
      }

      if (payload?.requiresEmailVerification) {
        localStorage.setItem('pendingVerificationEmail', payload.email || formData.get('email'));
      }

      return payload;
    } catch (err) {
      const resp = err.response?.data;
      let errorMsg = resp?.message || 'Registration with documents failed';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setError(null);
    }
  };

  const sendEmailVerificationCode = async (email) => {
    const response = await authAPI.sendEmailVerificationCode({ email });
    return response.data;
  };

  const verifyEmailCode = async (email, code) => {
    const response = await authAPI.verifyEmailCode({ email, code });
    return response.data;
  };

  const sendTwoFactorCode = async (email) => {
    const response = await authAPI.sendTwoFactorCode({ email });
    return response.data;
  };

  const verifyTwoFactorCode = async (email, code) => {
    const response = await authAPI.verifyTwoFactorCode({ email, code });
    const payload = extractAuthPayload(response.data);
    applySession(payload);
    return payload;
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        isAuthenticated,
        login,
        register,
        registerWithDocs,
        logout,
        setError,
        sendEmailVerificationCode,
        verifyEmailCode,
        sendTwoFactorCode,
        verifyTwoFactorCode
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
