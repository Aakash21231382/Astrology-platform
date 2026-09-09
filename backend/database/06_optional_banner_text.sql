USE AstrologyDB;
GO

-- 1. Make title column nullable in dbo.Banners
ALTER TABLE dbo.Banners ALTER COLUMN title NVARCHAR(200) NULL;
GO

-- 2. Update sp_AdminUpsertBanner to allow @Title to be NULL
CREATE OR ALTER PROCEDURE dbo.sp_AdminUpsertBanner
    @Id INT = NULL,
    @Title NVARCHAR(200) = NULL,
    @Subtitle NVARCHAR(500) = NULL,
    @ImageUrl NVARCHAR(500),
    @MobileImageUrl NVARCHAR(500) = NULL,
    @CtaText NVARCHAR(100) = NULL,
    @CtaUrl NVARCHAR(500) = NULL,
    @TargetPlacement NVARCHAR(50) = 'HOMEPAGE',
    @StartDate DATETIME2 = NULL,
    @EndDate DATETIME2 = NULL,
    @IsActive BIT = 1,
    @SortOrder INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    IF (@Id IS NOT NULL AND EXISTS (SELECT 1 FROM dbo.Banners WHERE id = @Id))
    BEGIN
        UPDATE dbo.Banners
        SET title = @Title, 
            subtitle = @Subtitle, 
            imageUrl = @ImageUrl,
            mobileImageUrl = @MobileImageUrl, 
            ctaText = @CtaText, 
            ctaUrl = @CtaUrl,
            targetPlacement = @TargetPlacement, 
            startDate = @StartDate, 
            endDate = @EndDate,
            isActive = @IsActive, 
            sortOrder = @SortOrder
        WHERE id = @Id;

        SELECT * FROM dbo.Banners WHERE id = @Id;
    END
    ELSE
    BEGIN
        INSERT INTO dbo.Banners (
            title, subtitle, imageUrl, mobileImageUrl, ctaText, ctaUrl, 
            targetPlacement, startDate, endDate, isActive, sortOrder
        )
        VALUES (
            @Title, @Subtitle, @ImageUrl, @MobileImageUrl, @CtaText, @CtaUrl, 
            @TargetPlacement, @StartDate, @EndDate, @IsActive, @SortOrder
        );

        SELECT * FROM dbo.Banners WHERE id = SCOPE_IDENTITY();
    END
END;
GO
