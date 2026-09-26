const express = require('express');
const {
    getDashboardStats,
    getAllExperts,
    getPendingExperts,
    reviewExpert,
    toggleExpertActive,
    deleteExpert,
    getAllUsers,
    updateUserStatus,
    getAllBanners,
    upsertBanner,
    deleteBanner,
    getAllCategories,
    upsertCategory,
    deleteCategory,
    getAllCms,
    upsertCms,
    deleteCms,
    getSettings,
    updateSetting,
    getWithdrawals,
    processWithdrawal,
    getAllConsultations,
    getConsultationMessages,
    getAccountCloseRequests,
    processAccountCloseRequest,
    getAllReviews,
    deleteReview,
    getBroadcastNotifications,
    sendBroadcastNotification,
    getExpertDocuments,
    getAllProducts,
    getProductById,
    upsertProduct,
    deleteProduct,
    getAllTemplePujas,
    getTemplePujaById,
    upsertTemplePuja,
    deleteTemplePuja
} = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const router = express.Router();

router.use(authenticateToken, requireRole('ADMIN'));

// Dashboard KPIs
router.get('/dashboard', getDashboardStats);

// Expert Approvals & Status
router.get('/experts', getAllExperts);
router.get('/experts/pending', getPendingExperts);
router.patch('/experts/:id/review', reviewExpert);
router.patch('/experts/:id/active', toggleExpertActive);
router.delete('/experts/:id', deleteExpert);

// Products (Astro Shop) Management
router.get('/products', getAllProducts);
router.get('/products/:id', getProductById);
router.post('/products', upsertProduct);
router.put('/products/:id', upsertProduct);
router.delete('/products/:id', deleteProduct);

// Temple Pujas Management
router.get('/pujas', getAllTemplePujas);
router.get('/pujas/:id', getTemplePujaById);
router.post('/pujas', upsertTemplePuja);
router.put('/pujas/:id', upsertTemplePuja);
router.delete('/pujas/:id', deleteTemplePuja);

// User Management
router.get('/users', getAllUsers);
router.patch('/users/:id/status', updateUserStatus);

// Banner Management
router.get('/banners', getAllBanners);
router.post('/banners', upsertBanner);
router.delete('/banners/:id', deleteBanner);

// Categories Management
router.get('/categories', getAllCategories);
router.post('/categories', upsertCategory);
router.delete('/categories/:id', deleteCategory);

// CMS Page Management
router.get('/cms', getAllCms);
router.post('/cms', upsertCms);
router.delete('/cms/:slug', deleteCms);

// Global Settings
router.get('/settings', getSettings);
router.put('/settings', updateSetting);

// Withdrawals
router.get('/withdrawals', getWithdrawals);
router.patch('/withdrawals/:id', processWithdrawal);

// Consultations & Chat Sessions
router.get('/consultations', getAllConsultations);
router.get('/consultations/:id/messages', getConsultationMessages);

// Expert Account Closure Requests
router.get('/account-close-requests', getAccountCloseRequests);
router.patch('/account-close-requests/:id', processAccountCloseRequest);

// Expert Reviews & Ratings Moderation
router.get('/reviews', getAllReviews);
router.delete('/reviews/:id', deleteReview);

// Broadcast Notifications to Experts
router.get('/notifications', getBroadcastNotifications);
router.post('/notifications/broadcast', sendBroadcastNotification);

// Expert Verification Documents Repository
router.get('/expert-documents', getExpertDocuments);

module.exports = router;
