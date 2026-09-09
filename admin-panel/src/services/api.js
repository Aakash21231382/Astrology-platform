import axios from 'axios';

export const API_BASE_URL = 'http://127.0.0.1:5000/api';
export const UPLOAD_API_URL = 'https://host0008-001-site1.qtempurl.com/api/uploadfile';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for attaching admin JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('astrology_admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for catching 401 unauth
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('astrology_admin_token');
      localStorage.removeItem('astrology_admin_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Custom File Upload Service matching exact platform specs
export async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  try {
    // Try backend proxy first
    const token = localStorage.getItem('astrology_admin_token');
    const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    if (response.data?.url) {
      return response.data.url;
    }
  } catch (proxyError) {
    console.warn('Backend proxy upload fallback, trying direct container...', proxyError.message);
  }

  // Direct container fallback
  const directRes = await axios.post(UPLOAD_API_URL, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  if (directRes.data?.result?.variants?.[0]) {
    return directRes.data.result.variants[0];
  }
  throw new Error('Upload failed: No file URL returned');
}

// Admin API Methods
export const adminApi = {
  // Auth
  login: (email, password) => api.post('/auth/login', { email, password }),
  getProfile: () => api.get('/auth/profile'),

  // Dashboard Stats
  getDashboardStats: () => api.get('/admin/dashboard'),

  // Experts
  getAllExperts: (params) => api.get('/admin/experts', { params }),
  getPendingExperts: () => api.get('/admin/experts/pending'),
  reviewExpert: (expertId, action, rejectionReason) =>
    api.patch(`/admin/experts/${expertId}/review`, { action, rejectionReason }),
  toggleExpertActive: (expertId, isActive) =>
    api.patch(`/admin/experts/${expertId}/active`, { isActive }),
  deleteExpert: (expertId) => api.delete(`/admin/experts/${expertId}`),

  // Users
  getAllUsers: (params) => api.get('/admin/users', { params }),
  updateUserStatus: (userId, status) =>
    api.patch(`/admin/users/${userId}/status`, { status }),

  // Banners
  getBanners: () => api.get('/admin/banners'),
  upsertBanner: (bannerData) => api.post('/admin/banners', bannerData),
  deleteBanner: (bannerId) => api.delete(`/admin/banners/${bannerId}`),

  // Categories
  getCategories: () => api.get('/admin/categories'),
  upsertCategory: (categoryData) => api.post('/admin/categories', categoryData),
  deleteCategory: (categoryId) => api.delete(`/admin/categories/${categoryId}`),

  // Withdrawals
  getWithdrawals: () => api.get('/admin/withdrawals'),
  processWithdrawal: (id, status, adminNotes) =>
    api.patch(`/admin/withdrawals/${id}`, { status, adminNotes }),

  // CMS & Settings
  getCmsPage: (slug) => api.get(`/public/cms/${slug}`),
  upsertCmsPage: (cmsData) => api.post('/admin/cms', cmsData),
  getSettings: () => api.get('/admin/settings'),
  updateSetting: (key, value, description) =>
    api.put('/admin/settings', { key, value, description })
};

export default api;
