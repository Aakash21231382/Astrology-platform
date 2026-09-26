const express = require('express');
const { 
    getBanners, 
    getCategories, 
    getCmsPage,
    getPublicProducts,
    getPublicProductById,
    getPublicTemplePujas,
    getPublicTemplePujaById
} = require('../controllers/publicController');

const router = express.Router();

router.get('/banners', getBanners);
router.get('/categories', getCategories);
router.get('/cms/:slug', getCmsPage);

// Products & Pujas (Public)
router.get('/products', getPublicProducts);
router.get('/products/:id', getPublicProductById);
router.get('/pujas', getPublicTemplePujas);
router.get('/pujas/:id', getPublicTemplePujaById);

module.exports = router;
