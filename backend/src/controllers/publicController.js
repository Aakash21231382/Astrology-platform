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

module.exports = {
    getBanners,
    getCategories,
    getCmsPage
};
