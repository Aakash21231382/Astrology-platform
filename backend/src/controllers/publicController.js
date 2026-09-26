const { executeProcedure } = require('../config/db');

/**
 * Get active banners for placement
 * GET /api/public/banners?placement=HOMEPAGE
 */
async function getBanners(req, res, next) {
    try {
        const placement = req.query.placement || 'HOMEPAGE';
        const result = await executeProcedure('dbo.sp_GetBanners', {
            Placement: placement.toUpperCase()
        });

        return res.status(200).json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get all active categories
 * GET /api/public/categories
 */
async function getCategories(req, res, next) {
    try {
        const result = await executeProcedure('dbo.sp_GetCategories', {
            ActiveOnly: 1
        });

        return res.status(200).json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get CMS Page Content by Slug
 * GET /api/public/cms/:slug
 */
async function getCmsPage(req, res, next) {
    try {
        const slug = req.params.slug;
        const result = await executeProcedure('dbo.sp_GetCmsPage', {
            Slug: slug.toLowerCase()
        });

        const page = result.recordset[0];
        if (!page) {
            return res.status(404).json({
                success: false,
                message: 'Page not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: page
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get all active products for public shop
 * GET /api/public/products
 */
async function getPublicProducts(req, res, next) {
    try {
        const { category, search } = req.query;
        const result = await executeProcedure('dbo.sp_GetAllProducts', {
            Category: category || null,
            Search: search || null,
            IsActive: 1
        });

        return res.status(200).json({
            success: true,
            count: result.recordset.length,
            data: result.recordset
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get product by ID
 * GET /api/public/products/:id
 */
async function getPublicProductById(req, res, next) {
    try {
        const id = parseInt(req.params.id, 10);
        const result = await executeProcedure('dbo.sp_GetProductById', {
            Id: id
        });

        const product = result.recordset[0];
        if (!product || !product.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get all active temple pujas for public page
 * GET /api/public/pujas
 */
async function getPublicTemplePujas(req, res, next) {
    try {
        const { search } = req.query;
        const result = await executeProcedure('dbo.sp_GetAllTemplePujas', {
            Search: search || null,
            IsActive: 1
        });

        return res.status(200).json({
            success: true,
            count: result.recordset.length,
            data: result.recordset
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get temple puja by ID
 * GET /api/public/pujas/:id
 */
async function getPublicTemplePujaById(req, res, next) {
    try {
        const id = parseInt(req.params.id, 10);
        const result = await executeProcedure('dbo.sp_GetTemplePujaById', {
            Id: id
        });

        const puja = result.recordset[0];
        if (!puja || !puja.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Temple Puja not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: puja
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getBanners,
    getCategories,
    getCmsPage,
    getPublicProducts,
    getPublicProductById,
    getPublicTemplePujas,
    getPublicTemplePujaById
};
