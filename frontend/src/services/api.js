
import axios from 'axios';
import { Capacitor } from '@capacitor/core';

export const isNativePlatform = () => {
  if (typeof window === 'undefined') return false;

  try {
    if (
      typeof Capacitor?.isNativePlatform === 'function' &&
      Capacitor.isNativePlatform()
    ) {
      return true;
    }
  } catch {
    // Fall back to checking the browser environment.
  }

  return (
    window.location.protocol === 'capacitor:' ||
    window.location.protocol === 'ionic:'
  );
};

export const getApiBaseUrl = () => {
  if (typeof window === 'undefined') return '/api';

  const stored = localStorage.getItem('civicchain_api_url');

  if (stored?.trim()) return stored.trim().replace(/\/+$/, '');

  const configured = import.meta.env.VITE_API_URL;

  if (configured?.trim()) {
    return configured.trim().replace(/\/+$/, '');
  }

  if (isNativePlatform()) {
    // Android emulator only. A physical phone needs your laptop's LAN IP.
    return 'http://10.0.2.2:5000/api';
  }

  return '/api';
};

export const setApiBaseUrl = (url) => {
  if (typeof window === 'undefined') return;

  if (!url?.trim()) {
    localStorage.removeItem('civicchain_api_url');
    return;
  }

  let clean = url.trim().replace(/\/+$/, '');

  if (!clean.endsWith('/api')) {
    clean = `${clean}/api`;
  }

  localStorage.setItem('civicchain_api_url', clean);
};

export const testConnection = async (testUrl) => {
  const target = (testUrl || getApiBaseUrl()).replace(/\/+$/, '');
  const healthEndpoint = target.endsWith('/api')
    ? `${target}/health`
    : `${target}/api/health`;

  const startTime = Date.now();

  try {
    const response = await axios.get(healthEndpoint, { timeout: 5000 });

    return {
      ok: true,
      latency: Date.now() - startTime,
      data: response.data,
      endpoint: healthEndpoint
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error.response?.data?.error ||
        error.message ||
        'Connection failed',
      endpoint: healthEndpoint
    };
  }
};

const api = axios.create({
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000
});

api.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();

  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('civicchain_token')
      : null;

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Do not automatically erase a session for every 401 response.
    // Login failures and other unauthorized API responses need separate handling.
    return Promise.reject(error);
  }
);

export default api;
