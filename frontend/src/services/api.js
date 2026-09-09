import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('astrology_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle unauth
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token on 401
      // localStorage.removeItem('astrology_token');
    }
    return Promise.reject(error);
  }
);

// API Service Methods
export const authService = {
  login: (data) => api.post('/auth/login', data),
  registerCustomer: (data) => api.post('/auth/register', data),
  registerExpert: (data) => api.post('/auth/expert/signup', data),
  sendOtp: (data) => api.post('/auth/send-otp', data),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  getMe: () => api.get('/users/me')
};

export const expertService = {
  getApprovedList: (params) => api.get('/experts', { params }),
  getPublicProfile: (id) => api.get(`/experts/${id}`),
  getMyProfile: () => api.get('/experts/profile/me'),
  updateProfile: (data) => api.put('/experts/profile', data),
  setAvailability: (data) => api.put('/experts/availability', data),
  getEarnings: () => api.get('/experts/account/earnings'),
  requestWithdrawal: (data) => api.post('/experts/account/withdrawals', data)
};

export const walletService = {
  getWallet: () => api.get('/wallet'),
  addMoneyDirect: (data) => api.post('/wallet/add-money', data),
  createOrder: (data) => api.post('/payments/create-order', data),
  verifyPayment: (data) => api.post('/payments/verify', data)
};

export const consultationService = {
  requestConsultation: (data) => api.post('/consultations/request', data),
  getConsultation: (id) => api.get(`/consultations/${id}`),
  getMessages: (id) => api.get(`/consultations/${id}/messages`),
  getHistory: () => api.get('/consultations/history'),
  getActiveForExpert: () => api.get('/consultations/active-for-expert'),
  submitReview: (data) => api.post('/consultations/reviews', data)
};

export const publicService = {
  getBanners: (placement) => api.get('/public/banners', { params: { placement } }),
  getCategories: () => api.get('/public/categories'),
  getCmsPage: (slug) => api.get(`/public/cms/${slug}`)
};

export const uploadService = {
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const url = res.data?.data?.url || res.data?.url;
      if (url) return url;
    } catch (err) {
      console.warn('Backend proxy upload failed, trying direct container...', err.message);
    }

    const directRes = await axios.post('https://host0008-001-site1.qtempurl.com/api/uploadfile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    if (directRes.data?.result?.variants?.[0]) {
      return directRes.data.result.variants[0];
    }
    if (directRes.data?.url) {
      return directRes.data.url;
    }
    throw new Error('Upload failed: No file URL returned');
  }
};

export default api;
