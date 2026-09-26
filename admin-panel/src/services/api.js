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

// Response interceptor for catching 401 unauth & 403 token issues
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || '';

      if (
        status === 401 ||
        (status === 403 && (
          message.toLowerCase().includes('token') ||
          message.toLowerCase().includes('access denied') ||
          message.toLowerCase().includes('authorized') ||
          message.toLowerCase().includes('suspended')
        ))
      ) {
        localStorage.removeItem('astrology_admin_token');
        localStorage.removeItem('astrology_admin_user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
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
    const url = response.data?.data?.url || response.data?.url;
    if (url) {
      return url;
    }
  } catch (proxyError) {
    console.warn('Backend proxy upload fallback, trying direct container...', proxyError.message);
  }

  // Direct container fallback
  try {
    const directRes = await axios.post(UPLOAD_API_URL, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    if (directRes.data?.result?.variants?.[0]) {
      return directRes.data.result.variants[0];
    }
    if (directRes.data?.url) {
      return directRes.data.url;
    }
  } catch (err) {
    console.warn('Direct upload also failed, using local file reader', err.message);
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
  getAllCmsPages: () => api.get('/admin/cms'),
  getCmsPage: (slug) => api.get(`/public/cms/${slug}`),
  upsertCmsPage: (cmsData) => api.post('/admin/cms', cmsData),
  deleteCmsPage: (slug) => api.delete(`/admin/cms/${slug}`),
  getSettings: () => api.get('/admin/settings'),
  updateSetting: (key, value, description) =>
    api.put('/admin/settings', { key, value, description }),

  // Consultations & Chat Transcripts
  getConsultations: (params) => api.get('/admin/consultations', { params }),
  getConsultationMessages: (id) => api.get(`/admin/consultations/${id}/messages`),

  // Expert Account Close Requests
  getAccountCloseRequests: () => api.get('/admin/account-close-requests'),
  processAccountCloseRequest: (id, status, adminNotes) =>
    api.patch(`/admin/account-close-requests/${id}`, { status, adminNotes }),

  // Expert Reviews & Ratings
  getReviews: () => api.get('/admin/reviews'),
  deleteReview: (id) => api.delete(`/admin/reviews/${id}`),

  // Broadcasts & Mailbox
  getBroadcasts: () => api.get('/admin/notifications'),
  getNotifications: () => api.get('/admin/notifications'),
  sendBroadcast: (data) => api.post('/admin/notifications/broadcast', data),

  // Expert Uploaded Documents
  getExpertDocuments: () => api.get('/admin/expert-documents'),

  // Products (Astro Shop) Management
  getProducts: (params) => api.get('/admin/products', { params }),
  getProductById: (id) => api.get(`/admin/products/${id}`),
  createProduct: (data) => api.post('/admin/products', data),
  updateProduct: (id, data) => api.put(`/admin/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),

  // Temple Pujas Management
  getPujas: (params) => api.get('/admin/pujas', { params }),
  getPujaById: (id) => api.get(`/admin/pujas/${id}`),
  createPuja: (data) => api.post('/admin/pujas', data),
  updatePuja: (id, data) => api.put(`/admin/pujas/${id}`, data),
  deletePuja: (id) => api.delete(`/admin/pujas/${id}`)
};

export default api;



