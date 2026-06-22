import axios from 'axios';
import { updateServerClock } from '../utils/serverClock';

function getApiUrl() {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:5000`;
  }
  return 'http://localhost:5000';
}

export const API_URL = getApiUrl();

export const api = axios.create({
  baseURL: `${API_URL}/api`
});

type LoadingListener = (isLoading: boolean, pendingRequests: number) => void;

const loadingListeners = new Set<LoadingListener>();
let pendingRequests = 0;

function notifyLoadingListeners() {
  loadingListeners.forEach((listener) => listener(pendingRequests > 0, pendingRequests));
}

function startRequestLoading() {
  pendingRequests += 1;
  notifyLoadingListeners();
}

function stopRequestLoading() {
  pendingRequests = Math.max(0, pendingRequests - 1);
  notifyLoadingListeners();
}

export function subscribeToApiLoading(listener: LoadingListener) {
  loadingListeners.add(listener);
  listener(pendingRequests > 0, pendingRequests);
  return () => {
    loadingListeners.delete(listener);
  };
}

function getStoredToken() {
  return localStorage.getItem('poss_token') ?? sessionStorage.getItem('poss_token');
}

function clearStoredAuth() {
  localStorage.removeItem('poss_token');
  localStorage.removeItem('poss_user');
  sessionStorage.removeItem('poss_token');
  sessionStorage.removeItem('poss_user');
}

api.interceptors.request.use((config) => {
  startRequestLoading();
  const token = getStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => {
    updateServerClock(response.headers['x-server-time']);
    stopRequestLoading();
    return response;
  },
  (error) => {
    updateServerClock(error.response?.headers?.['x-server-time']);
    stopRequestLoading();
    if (error.response?.status === 401) {
      clearStoredAuth();
    }
    return Promise.reject(error);
  }
);
