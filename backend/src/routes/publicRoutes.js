const express = require('express');
const { getBanners, getCategories, getCmsPage } = require('../controllers/publicController');

const router = express.Router();

router.get('/banners', getBanners);
router.get('/categories', getCategories);
router.get('/cms/:slug', getCmsPage);

module.exports = router;
