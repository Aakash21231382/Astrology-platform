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
    upsertCms,
    getSettings,
    updateSetting,
    getWithdrawals,
    processWithdrawal
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
router.post('/cms', upsertCms);

// Global Settings
router.get('/settings', getSettings);
router.put('/settings', updateSetting);

// Withdrawals
router.get('/withdrawals', getWithdrawals);
router.patch('/withdrawals/:id', processWithdrawal);

module.exports = router;
