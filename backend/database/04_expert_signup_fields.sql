-- ==========================================================
-- Astrology & Psychic Consultation Platform - Expert Signup Fields & Active State
-- ==========================================================

USE AstrologyDB;
GO

-- 1. Add extra profile fields to Users if not present
IF COL_LENGTH('dbo.Users', 'userName') IS NULL
    ALTER TABLE dbo.Users ADD userName NVARCHAR(100) NULL;

IF COL_LENGTH('dbo.Users', 'firstName') IS NULL
    ALTER TABLE dbo.Users ADD firstName NVARCHAR(100) NULL;

IF COL_LENGTH('dbo.Users', 'lastName') IS NULL
    ALTER TABLE dbo.Users ADD lastName NVARCHAR(100) NULL;
GO

-- 2. Add full registration fields to ExpertProfiles if not present
IF COL_LENGTH('dbo.ExpertProfiles', 'screenName') IS NULL
    ALTER TABLE dbo.ExpertProfiles ADD screenName NVARCHAR(100) NULL;

IF COL_LENGTH('dbo.ExpertProfiles', 'dob') IS NULL
    ALTER TABLE dbo.ExpertProfiles ADD dob NVARCHAR(50) NULL;

IF COL_LENGTH('dbo.ExpertProfiles', 'gender') IS NULL
    ALTER TABLE dbo.ExpertProfiles ADD gender NVARCHAR(20) NULL;

IF COL_LENGTH('dbo.ExpertProfiles', 'address') IS NULL
    ALTER TABLE dbo.ExpertProfiles ADD address NVARCHAR(300) NULL;

IF COL_LENGTH('dbo.ExpertProfiles', 'city') IS NULL
    ALTER TABLE dbo.ExpertProfiles ADD city NVARCHAR(100) NULL;

IF COL_LENGTH('dbo.ExpertProfiles', 'state') IS NULL
    ALTER TABLE dbo.ExpertProfiles ADD state NVARCHAR(100) NULL;

IF COL_LENGTH('dbo.ExpertProfiles', 'country') IS NULL
    ALTER TABLE dbo.ExpertProfiles ADD country NVARCHAR(100) NULL;

IF COL_LENGTH('dbo.ExpertProfiles', 'zipCode') IS NULL
    ALTER TABLE dbo.ExpertProfiles ADD zipCode NVARCHAR(30) NULL;

IF COL_LENGTH('dbo.ExpertProfiles', 'telephone') IS NULL
    ALTER TABLE dbo.ExpertProfiles ADD telephone NVARCHAR(50) NULL;

IF COL_LENGTH('dbo.ExpertProfiles', 'fax') IS NULL
    ALTER TABLE dbo.ExpertProfiles ADD fax NVARCHAR(50) NULL;

IF COL_LENGTH('dbo.ExpertProfiles', 'isActive') IS NULL
    ALTER TABLE dbo.ExpertProfiles ADD isActive BIT NOT NULL DEFAULT 1;
GO

-- 3. Dedicated Stored Procedure: sp_RegisterExpert
CREATE OR ALTER PROCEDURE dbo.sp_RegisterExpert
    @Email NVARCHAR(255),
    @PasswordHash NVARCHAR(255),
    @UserName NVARCHAR(100),
    @FirstName NVARCHAR(100),
    @LastName NVARCHAR(100),
    @Title NVARCHAR(200) = NULL,
    @Dob NVARCHAR(50) = NULL,
    @Gender NVARCHAR(20) = NULL,
    @Address NVARCHAR(300) = NULL,
    @City NVARCHAR(100) = NULL,
    @State NVARCHAR(100) = NULL,
    @Country NVARCHAR(100) = NULL,
    @ZipCode NVARCHAR(30) = NULL,
    @Telephone NVARCHAR(50) = NULL,
    @Fax NVARCHAR(50) = NULL,
    @AvatarUrl NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        IF EXISTS (SELECT 1 FROM dbo.Users WHERE email = @Email)
        BEGIN
            RAISERROR('Email already exists', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        DECLARE @FullName NVARCHAR(250) = LTRIM(RTRIM(CONCAT(@FirstName, ' ', @LastName)));
        IF (@FullName = '') SET @FullName = @UserName;

        -- Insert into Users
        INSERT INTO dbo.Users (
            email, passwordHash, role, fullName, phoneNumber, avatarUrl, 
            isEmailVerified, status, userName, firstName, lastName
        )
        VALUES (
            @Email, @PasswordHash, 'EXPERT', @FullName, @Telephone, @AvatarUrl,
            0, 'ACTIVE', @UserName, @FirstName, @LastName
        );

        DECLARE @NewUserId INT = SCOPE_IDENTITY();

        -- Create default wallet
        INSERT INTO dbo.Wallets (userId, balance, currency)
        VALUES (@NewUserId, 0.00, 'INR');

        -- Create Expert Profile with all details
        INSERT INTO dbo.ExpertProfiles (
            userId, displayName, screenName, title, dob, gender, address, city, state, country,
            zipCode, telephone, fax, pricePerMinute, freeMinutes, approvalStatus, isOnline, isActive
        )
        VALUES (
            @NewUserId, @FullName, @UserName, @Title, @Dob, @Gender, @Address, @City, @State, @Country,
            @ZipCode, @Telephone, @Fax, 20.00, 0, 'PENDING', 0, 1
        );

        DECLARE @NewExpertProfileId INT = SCOPE_IDENTITY();

        COMMIT TRANSACTION;

        SELECT 
            u.id AS userId, u.email, u.role, u.fullName, u.userName, u.firstName, u.lastName,
            u.phoneNumber, u.avatarUrl, u.status, u.createdAt,
            ep.id AS expertProfileId, ep.screenName, ep.title, ep.dob, ep.gender,
            ep.address, ep.city, ep.state, ep.country, ep.zipCode, ep.telephone, ep.fax,
            ep.approvalStatus, ep.isOnline, ep.isActive, ep.pricePerMinute, ep.freeMinutes
        FROM dbo.Users u
        JOIN dbo.ExpertProfiles ep ON ep.id = @NewExpertProfileId
        WHERE u.id = @NewUserId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- 4. Update sp_CreateConsultation to strictly enforce ACTIVE and ONLINE check
CREATE OR ALTER PROCEDURE dbo.sp_CreateConsultation
    @CustomerId INT,
    @ExpertId INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE 
        @Rate DECIMAL(10,2), @FreeMinutes INT, @IsOnline BIT, @IsActive BIT, 
        @Status NVARCHAR(50), @DisplayName NVARCHAR(150);

    SELECT 
        @Rate = pricePerMinute, 
        @FreeMinutes = freeMinutes, 
        @IsOnline = isOnline, 
        @IsActive = isActive,
        @Status = approvalStatus,
        @DisplayName = displayName
    FROM dbo.ExpertProfiles
    WHERE id = @ExpertId;

    -- Strict verification check
    IF (@Status <> 'APPROVED')
    BEGIN
        RAISERROR('Expert is not yet approved by platform administration.', 16, 1);
        RETURN;
    END

    -- Strict Active / Online check
    IF (@IsActive = 0 OR @IsOnline = 0)
    BEGIN
        RAISERROR('Expert is currently INACTIVE or OFFLINE. Live chat and payments are temporarily disabled for this expert.', 16, 1);
        RETURN;
    END

    -- Check customer wallet balance
    DECLARE @CustomerBalance DECIMAL(12,2);
    SELECT @CustomerBalance = balance FROM dbo.Wallets WHERE userId = @CustomerId;

    -- Must have at least 1 minute of balance if free minutes = 0
    IF (@FreeMinutes = 0 AND (@CustomerBalance IS NULL OR @CustomerBalance < @Rate))
    BEGIN
        RAISERROR('Insufficient wallet balance to initiate chat. Please add money.', 16, 1);
        RETURN;
    END

    INSERT INTO dbo.Consultations (
        customerId, expertId, status, ratePerMinute, freeMinutesAllowed, 
        freeSecondsUsed, paidSecondsUsed, totalDurationSeconds, grossAmount, 
        commissionPercentage, platformCommission, expertEarning
    )
    VALUES (
        @CustomerId, @ExpertId, 'REQUESTED', @Rate, @FreeMinutes,
        0, 0, 0, 0.00, 20.00, 0.00, 0.00
    );

    DECLARE @ConsultationId INT = SCOPE_IDENTITY();

    SELECT c.*, ep.displayName AS expertName, u.fullName AS customerName
    FROM dbo.Consultations c
    JOIN dbo.ExpertProfiles ep ON ep.id = c.expertId
    JOIN dbo.Users u ON u.id = c.customerId
    WHERE c.id = @ConsultationId;
END;
GO

-- 5. Update sp_SetExpertAvailability to support active and online toggles
CREATE OR ALTER PROCEDURE dbo.sp_SetExpertAvailability
    @UserId INT,
    @IsOnline BIT,
    @IsActive BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.ExpertProfiles
    SET isOnline = @IsOnline,
        isActive = COALESCE(@IsActive, isActive),
        updatedAt = SYSUTCDATETIME()
    WHERE userId = @UserId AND approvalStatus = 'APPROVED';

    SELECT id, userId, displayName, isOnline, isActive, approvalStatus
    FROM dbo.ExpertProfiles
    WHERE userId = @UserId;
END;
GO

-- 6. Admin can also toggle Expert Active / Inactive
CREATE OR ALTER PROCEDURE dbo.sp_AdminToggleExpertActive
    @ExpertId INT,
    @IsActive BIT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.ExpertProfiles
    SET isActive = @IsActive,
        -- If deactivated by admin, force offline as well
        isOnline = CASE WHEN @IsActive = 0 THEN 0 ELSE isOnline END,
        updatedAt = SYSUTCDATETIME()
    WHERE id = @ExpertId;

    SELECT id, userId, displayName, isOnline, isActive, approvalStatus
    FROM dbo.ExpertProfiles
    WHERE id = @ExpertId;
END;
GO

-- 7. Update sp_GetApprovedExperts to only show approved experts with their current active/online status
CREATE OR ALTER PROCEDURE dbo.sp_GetApprovedExperts
    @CategorySlug NVARCHAR(100) = NULL,
    @SearchQuery NVARCHAR(150) = NULL,
    @MinPrice DECIMAL(10,2) = NULL,
    @MaxPrice DECIMAL(10,2) = NULL,
    @SortBy NVARCHAR(50) = 'RATING' -- 'RATING', 'PRICE_ASC', 'PRICE_DESC', 'EXPERIENCE'
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        ep.id, ep.userId, ep.displayName, ep.screenName, ep.title, ep.bio, ep.experienceYears,
        ep.languages, ep.pricePerMinute, ep.freeMinutes, ep.isOnline, ep.isActive, ep.isChatEnabled,
        ep.rating, ep.totalReviews, ep.totalConsultations,
        ep.city, ep.state, ep.country,
        u.avatarUrl,
        (
            SELECT c.name, c.slug 
            FROM dbo.Categories c
            JOIN dbo.ExpertCategories ec ON ec.categoryId = c.id
            WHERE ec.expertId = ep.id
            FOR JSON PATH
        ) AS categoriesJson
    FROM dbo.ExpertProfiles ep
    JOIN dbo.Users u ON u.id = ep.userId
    WHERE ep.approvalStatus = 'APPROVED'
      AND (@SearchQuery IS NULL OR ep.displayName LIKE '%' + @SearchQuery + '%' OR ep.title LIKE '%' + @SearchQuery + '%' OR ep.screenName LIKE '%' + @SearchQuery + '%')
      AND (@MinPrice IS NULL OR ep.pricePerMinute >= @MinPrice)
      AND (@MaxPrice IS NULL OR ep.pricePerMinute <= @MaxPrice)
      AND (
          @CategorySlug IS NULL OR EXISTS (
              SELECT 1 FROM dbo.ExpertCategories ec
              JOIN dbo.Categories c ON c.id = ec.categoryId
              WHERE ec.expertId = ep.id AND c.slug = @CategorySlug
          )
      )
    ORDER BY 
        ep.isOnline DESC,
        ep.isActive DESC,
        CASE WHEN @SortBy = 'PRICE_ASC' THEN ep.pricePerMinute END ASC,
        CASE WHEN @SortBy = 'PRICE_DESC' THEN ep.pricePerMinute END DESC,
        CASE WHEN @SortBy = 'EXPERIENCE' THEN ep.experienceYears END DESC,
        ep.rating DESC;
END;
GO
