USE AstrologyDB;
GO

-- 1. Update sp_GetPendingExperts to return all registration fields
CREATE OR ALTER PROCEDURE dbo.sp_GetPendingExperts
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        ep.id, ep.userId, ep.displayName, ep.screenName, ep.title, ep.bio, ep.dob, ep.gender,
        ep.address, ep.city, ep.state, ep.country, ep.zipCode, ep.telephone, ep.fax,
        ep.experienceYears, ep.languages, ep.pricePerMinute, ep.freeMinutes, ep.approvalStatus, 
        ep.isActive, ep.isOnline, ep.documentUrls, ep.createdAt,
        u.email, u.phoneNumber, u.avatarUrl, u.createdAt AS userJoinedAt
    FROM dbo.ExpertProfiles ep
    JOIN dbo.Users u ON u.id = ep.userId
    WHERE ep.approvalStatus = 'PENDING'
    ORDER BY ep.createdAt DESC;
END;
GO

-- 2. sp_AdminGetAllExperts to view all experts with filters
CREATE OR ALTER PROCEDURE dbo.sp_AdminGetAllExperts
    @ApprovalStatus NVARCHAR(50) = NULL,
    @IsActive BIT = NULL,
    @Search NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        ep.id, ep.userId, ep.displayName, ep.screenName, ep.title, ep.bio, ep.dob, ep.gender,
        ep.address, ep.city, ep.state, ep.country, ep.zipCode, ep.telephone, ep.fax,
        ep.experienceYears, ep.languages, ep.pricePerMinute, ep.freeMinutes, ep.approvalStatus, 
        ep.isActive, ep.isOnline, ep.rating, ep.totalReviews, ep.totalConsultations,
        ep.documentUrls, ep.createdAt, ep.updatedAt,
        u.email, u.phoneNumber, u.avatarUrl, u.status AS userStatus
    FROM dbo.ExpertProfiles ep
    JOIN dbo.Users u ON u.id = ep.userId
    WHERE (@ApprovalStatus IS NULL OR ep.approvalStatus = @ApprovalStatus)
      AND (@IsActive IS NULL OR ep.isActive = @IsActive)
      AND (@Search IS NULL OR ep.displayName LIKE '%' + @Search + '%' OR ep.screenName LIKE '%' + @Search + '%' OR u.email LIKE '%' + @Search + '%')
    ORDER BY ep.createdAt DESC;
END;
GO
