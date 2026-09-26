-- ==========================================================================
-- ALL-IN-ONE ASTROLOGY PLATFORM DATABASE SCRIPT
-- Generated: 2026-09-25T17:33:01.450Z
-- Contains complete schema, tables, stored procedures, indexes, seed data
-- ==========================================================================

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'AstrologyDB')
BEGIN
    CREATE DATABASE [AstrologyDB];
END
GO

USE [AstrologyDB];
GO


-- ==========================================================================
-- SECTION: 01_schema.sql
-- ==========================================================================

-- ==========================================================
-- Astrology & Psychic Consultation Platform - Master Schema
-- Database: Microsoft SQL Server (AstrologyDB)
-- ==========================================================

USE AstrologyDB;
GO

-- 1. Users Table
IF OBJECT_ID('dbo.Users', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        email NVARCHAR(255) NOT NULL UNIQUE,
        passwordHash NVARCHAR(255) NOT NULL,
        role NVARCHAR(50) NOT NULL CHECK (role IN ('CUSTOMER', 'EXPERT', 'ADMIN')),
        fullName NVARCHAR(150) NOT NULL,
        phoneNumber NVARCHAR(50) NULL,
        avatarUrl NVARCHAR(500) NULL,
        isEmailVerified BIT NOT NULL DEFAULT 0,
        status NVARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'BLOCKED')),
        createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX IX_Users_Email ON dbo.Users(email);
    CREATE INDEX IX_Users_Role ON dbo.Users(role);
END;
GO

-- 2. ExpertProfiles Table
IF OBJECT_ID('dbo.ExpertProfiles', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ExpertProfiles (
        id INT IDENTITY(1,1) PRIMARY KEY,
        userId INT NOT NULL UNIQUE FOREIGN KEY REFERENCES dbo.Users(id) ON DELETE CASCADE,
        displayName NVARCHAR(150) NOT NULL,
        title NVARCHAR(200) NULL,
        bio NVARCHAR(MAX) NULL,
        experienceYears INT NOT NULL DEFAULT 0,
        languages NVARCHAR(255) NULL,
        pricePerMinute DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        freeMinutes INT NOT NULL DEFAULT 0,
        approvalStatus NVARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (approvalStatus IN ('PENDING', 'APPROVED', 'REJECTED', 'BLOCKED')),
        rejectionReason NVARCHAR(500) NULL,
        approvedBy INT NULL FOREIGN KEY REFERENCES dbo.Users(id),
        approvedAt DATETIME2 NULL,
        isOnline BIT NOT NULL DEFAULT 0,
        isChatEnabled BIT NOT NULL DEFAULT 1,
        rating DECIMAL(3,2) NOT NULL DEFAULT 5.00,
        totalReviews INT NOT NULL DEFAULT 0,
        totalConsultations INT NOT NULL DEFAULT 0,
        documentUrls NVARCHAR(MAX) NULL,
        createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX IX_ExpertProfiles_Status ON dbo.ExpertProfiles(approvalStatus, isOnline);
END;
GO

-- 3. Categories Table
IF OBJECT_ID('dbo.Categories', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Categories (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        slug NVARCHAR(100) NOT NULL UNIQUE,
        description NVARCHAR(500) NULL,
        imageUrl NVARCHAR(500) NULL,
        isActive BIT NOT NULL DEFAULT 1,
        sortOrder INT NOT NULL DEFAULT 0,
        createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX IX_Categories_Slug ON dbo.Categories(slug);
END;
GO

-- 4. ExpertCategories Table
IF OBJECT_ID('dbo.ExpertCategories', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ExpertCategories (
        expertId INT NOT NULL FOREIGN KEY REFERENCES dbo.ExpertProfiles(id) ON DELETE CASCADE,
        categoryId INT NOT NULL FOREIGN KEY REFERENCES dbo.Categories(id) ON DELETE CASCADE,
        PRIMARY KEY (expertId, categoryId)
    );
END;
GO

-- 5. Services Table
IF OBJECT_ID('dbo.Services', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Services (
        id INT IDENTITY(1,1) PRIMARY KEY,
        expertId INT NOT NULL FOREIGN KEY REFERENCES dbo.ExpertProfiles(id) ON DELETE CASCADE,
        title NVARCHAR(150) NOT NULL,
        description NVARCHAR(MAX) NULL,
        durationMinutes INT NOT NULL DEFAULT 30,
        price DECIMAL(10,2) NOT NULL,
        isActive BIT NOT NULL DEFAULT 1,
        createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END;
GO

-- 6. Wallets Table
IF OBJECT_ID('dbo.Wallets', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Wallets (
        id INT IDENTITY(1,1) PRIMARY KEY,
        userId INT NOT NULL UNIQUE FOREIGN KEY REFERENCES dbo.Users(id) ON DELETE CASCADE,
        balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        currency NVARCHAR(10) NOT NULL DEFAULT 'INR',
        updatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX IX_Wallets_UserId ON dbo.Wallets(userId);
END;
GO

-- 7. WalletTransactions Table (Immutable Ledger)
IF OBJECT_ID('dbo.WalletTransactions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.WalletTransactions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        walletId INT NOT NULL FOREIGN KEY REFERENCES dbo.Wallets(id),
        type NVARCHAR(50) NOT NULL, -- TOPUP, CONSULTATION_DEBIT, REFUND, BONUS, ADJUSTMENT
        amount DECIMAL(12,2) NOT NULL,
        direction NVARCHAR(10) NOT NULL CHECK (direction IN ('CREDIT', 'DEBIT')),
        referenceType NVARCHAR(50) NULL, -- PAYMENT_ORDER, CONSULTATION, MANUAL
        referenceId NVARCHAR(100) NULL,
        status NVARCHAR(50) NOT NULL DEFAULT 'SUCCESS',
        idempotencyKey NVARCHAR(150) NULL UNIQUE,
        balanceAfter DECIMAL(12,2) NOT NULL,
        note NVARCHAR(500) NULL,
        createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX IX_WalletTx_WalletId ON dbo.WalletTransactions(walletId);
    CREATE INDEX IX_WalletTx_Idempotency ON dbo.WalletTransactions(idempotencyKey);
END;
GO

-- 8. PaymentOrders Table
IF OBJECT_ID('dbo.PaymentOrders', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.PaymentOrders (
        id INT IDENTITY(1,1) PRIMARY KEY,
        userId INT NOT NULL FOREIGN KEY REFERENCES dbo.Users(id),
        orderId NVARCHAR(100) NOT NULL UNIQUE,
        paymentId NVARCHAR(100) NULL,
        signature NVARCHAR(255) NULL,
        amount DECIMAL(10,2) NOT NULL,
        currency NVARCHAR(10) NOT NULL DEFAULT 'INR',
        status NVARCHAR(50) NOT NULL DEFAULT 'CREATED' CHECK (status IN ('CREATED', 'PAID', 'FAILED')),
        idempotencyKey NVARCHAR(150) NULL UNIQUE,
        createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END;
GO

-- 9. Consultations Table
IF OBJECT_ID('dbo.Consultations', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Consultations (
        id INT IDENTITY(1,1) PRIMARY KEY,
        customerId INT NOT NULL FOREIGN KEY REFERENCES dbo.Users(id),
        expertId INT NOT NULL FOREIGN KEY REFERENCES dbo.ExpertProfiles(id),
        status NVARCHAR(50) NOT NULL DEFAULT 'REQUESTED' 
            CHECK (status IN ('REQUESTED', 'ACCEPTED', 'ACTIVE', 'ENDING', 'COMPLETED', 'REJECTED', 'CANCELLED')),
        ratePerMinute DECIMAL(10,2) NOT NULL,
        freeMinutesAllowed INT NOT NULL DEFAULT 0,
        freeSecondsUsed INT NOT NULL DEFAULT 0,
        paidSecondsUsed INT NOT NULL DEFAULT 0,
        totalDurationSeconds INT NOT NULL DEFAULT 0,
        grossAmount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        commissionPercentage DECIMAL(5,2) NOT NULL DEFAULT 20.00,
        platformCommission DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        expertEarning DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        requestedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        startedAt DATETIME2 NULL,
        endedAt DATETIME2 NULL,
        endReason NVARCHAR(100) NULL
    );
    CREATE INDEX IX_Consultations_Customer ON dbo.Consultations(customerId);
    CREATE INDEX IX_Consultations_Expert ON dbo.Consultations(expertId);
    CREATE INDEX IX_Consultations_Status ON dbo.Consultations(status);
END;
GO

-- 10. ConsultationUsage Table
IF OBJECT_ID('dbo.ConsultationUsage', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ConsultationUsage (
        id INT IDENTITY(1,1) PRIMARY KEY,
        consultationId INT NOT NULL FOREIGN KEY REFERENCES dbo.Consultations(id) ON DELETE CASCADE,
        checkpointSecond INT NOT NULL,
        isPaid BIT NOT NULL DEFAULT 0,
        billedAmount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        recordedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END;
GO

-- 11. ChatMessages Table
IF OBJECT_ID('dbo.ChatMessages', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ChatMessages (
        id INT IDENTITY(1,1) PRIMARY KEY,
        consultationId INT NOT NULL FOREIGN KEY REFERENCES dbo.Consultations(id) ON DELETE CASCADE,
        senderId INT NOT NULL FOREIGN KEY REFERENCES dbo.Users(id),
        senderRole NVARCHAR(50) NOT NULL,
        messageType NVARCHAR(50) NOT NULL DEFAULT 'TEXT' CHECK (messageType IN ('TEXT', 'IMAGE', 'FILE', 'SYSTEM_EVENT')),
        content NVARCHAR(MAX) NOT NULL,
        fileUrl NVARCHAR(500) NULL,
        status NVARCHAR(50) NOT NULL DEFAULT 'SENT' CHECK (status IN ('SENT', 'DELIVERED', 'READ')),
        sentAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        deliveredAt DATETIME2 NULL,
        readAt DATETIME2 NULL
    );
    CREATE INDEX IX_ChatMessages_Consultation ON dbo.ChatMessages(consultationId, sentAt);
END;
GO

-- 12. Reviews Table
IF OBJECT_ID('dbo.Reviews', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Reviews (
        id INT IDENTITY(1,1) PRIMARY KEY,
        consultationId INT NOT NULL UNIQUE FOREIGN KEY REFERENCES dbo.Consultations(id),
        customerId INT NOT NULL FOREIGN KEY REFERENCES dbo.Users(id),
        expertId INT NOT NULL FOREIGN KEY REFERENCES dbo.ExpertProfiles(id),
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment NVARCHAR(MAX) NULL,
        status NVARCHAR(50) NOT NULL DEFAULT 'APPROVED' CHECK (status IN ('APPROVED', 'HIDDEN')),
        createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX IX_Reviews_ExpertId ON dbo.Reviews(expertId);
END;
GO

-- 13. ExpertEarnings Table
IF OBJECT_ID('dbo.ExpertEarnings', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ExpertEarnings (
        id INT IDENTITY(1,1) PRIMARY KEY,
        expertId INT NOT NULL FOREIGN KEY REFERENCES dbo.ExpertProfiles(id),
        consultationId INT NOT NULL FOREIGN KEY REFERENCES dbo.Consultations(id),
        grossAmount DECIMAL(10,2) NOT NULL,
        platformCommission DECIMAL(10,2) NOT NULL,
        netEarning DECIMAL(10,2) NOT NULL,
        status NVARCHAR(50) NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'WITHDRAWN')),
        createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END;
GO

-- 14. Withdrawals Table
IF OBJECT_ID('dbo.Withdrawals', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Withdrawals (
        id INT IDENTITY(1,1) PRIMARY KEY,
        expertId INT NOT NULL FOREIGN KEY REFERENCES dbo.ExpertProfiles(id),
        amount DECIMAL(10,2) NOT NULL,
        status NVARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'PAID')),
        bankDetails NVARCHAR(MAX) NULL,
        adminNotes NVARCHAR(500) NULL,
        processedBy INT NULL FOREIGN KEY REFERENCES dbo.Users(id),
        processedAt DATETIME2 NULL,
        createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END;
GO

-- 15. Banners Table
IF OBJECT_ID('dbo.Banners', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Banners (
        id INT IDENTITY(1,1) PRIMARY KEY,
        title NVARCHAR(200) NOT NULL,
        subtitle NVARCHAR(500) NULL,
        imageUrl NVARCHAR(500) NOT NULL,
        mobileImageUrl NVARCHAR(500) NULL,
        ctaText NVARCHAR(100) NULL,
        ctaUrl NVARCHAR(500) NULL,
        targetPlacement NVARCHAR(50) NOT NULL DEFAULT 'HOMEPAGE',
        startDate DATETIME2 NULL,
        endDate DATETIME2 NULL,
        isActive BIT NOT NULL DEFAULT 1,
        sortOrder INT NOT NULL DEFAULT 0,
        createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END;
GO

-- 16. Offers Table
IF OBJECT_ID('dbo.Offers', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Offers (
        id INT IDENTITY(1,1) PRIMARY KEY,
        title NVARCHAR(200) NOT NULL,
        offerType NVARCHAR(50) NOT NULL, -- PERCENTAGE, FIXED, FREE_MINUTES, WALLET_BONUS
        discountValue DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        eligibility NVARCHAR(50) NOT NULL DEFAULT 'ALL',
        minTopupAmount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        startDate DATETIME2 NULL,
        endDate DATETIME2 NULL,
        usageLimit INT NOT NULL DEFAULT 0,
        perUserLimit INT NOT NULL DEFAULT 1,
        isActive BIT NOT NULL DEFAULT 1,
        createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END;
GO

-- 17. Coupons Table
IF OBJECT_ID('dbo.Coupons', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Coupons (
        id INT IDENTITY(1,1) PRIMARY KEY,
        code NVARCHAR(50) NOT NULL UNIQUE,
        offerId INT NOT NULL FOREIGN KEY REFERENCES dbo.Offers(id) ON DELETE CASCADE,
        timesUsed INT NOT NULL DEFAULT 0,
        isActive BIT NOT NULL DEFAULT 1,
        createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END;
GO

-- 18. Notifications Table
IF OBJECT_ID('dbo.Notifications', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Notifications (
        id INT IDENTITY(1,1) PRIMARY KEY,
        userId INT NOT NULL FOREIGN KEY REFERENCES dbo.Users(id) ON DELETE CASCADE,
        title NVARCHAR(200) NOT NULL,
        message NVARCHAR(MAX) NOT NULL,
        type NVARCHAR(50) NOT NULL DEFAULT 'INFO',
        isRead BIT NOT NULL DEFAULT 0,
        createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX IX_Notifications_User ON dbo.Notifications(userId, isRead);
END;
GO

-- 19. OtpRecords Table
IF OBJECT_ID('dbo.OtpRecords', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.OtpRecords (
        id INT IDENTITY(1,1) PRIMARY KEY,
        identifier NVARCHAR(255) NOT NULL,
        otpHash NVARCHAR(255) NOT NULL,
        purpose NVARCHAR(50) NOT NULL,
        attempts INT NOT NULL DEFAULT 0,
        isUsed BIT NOT NULL DEFAULT 0,
        expiresAt DATETIME2 NOT NULL,
        createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX IX_OtpRecords_Identifier ON dbo.OtpRecords(identifier, purpose, isUsed);
END;
GO

-- 20. CmsPages Table
IF OBJECT_ID('dbo.CmsPages', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.CmsPages (
        id INT IDENTITY(1,1) PRIMARY KEY,
        slug NVARCHAR(100) NOT NULL UNIQUE,
        title NVARCHAR(200) NOT NULL,
        content NVARCHAR(MAX) NOT NULL,
        metaDescription NVARCHAR(500) NULL,
        updatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX IX_CmsPages_Slug ON dbo.CmsPages(slug);
END;
GO

-- 21. Settings Table
IF OBJECT_ID('dbo.Settings', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Settings (
        [key] NVARCHAR(100) PRIMARY KEY,
        [value] NVARCHAR(MAX) NOT NULL,
        description NVARCHAR(500) NULL,
        updatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END;
GO

-- 22. AuditLogs Table
IF OBJECT_ID('dbo.AuditLogs', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuditLogs (
        id INT IDENTITY(1,1) PRIMARY KEY,
        userId INT NULL FOREIGN KEY REFERENCES dbo.Users(id),
        action NVARCHAR(100) NOT NULL,
        entityType NVARCHAR(100) NULL,
        entityId NVARCHAR(100) NULL,
        details NVARCHAR(MAX) NULL,
        ipAddress NVARCHAR(50) NULL,
        createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END;
GO

GO

-- ==========================================================================
-- SECTION: 02_stored_procedures.sql
-- ==========================================================================

-- ==========================================================
-- Astrology & Psychic Consultation Platform - Stored Procedures
-- Database: Microsoft SQL Server (AstrologyDB)
-- ==========================================================

USE AstrologyDB;
GO

-- 1. sp_RegisterUser
CREATE OR ALTER PROCEDURE dbo.sp_RegisterUser
    @Email NVARCHAR(255),
    @PasswordHash NVARCHAR(255),
    @Role NVARCHAR(50),
    @FullName NVARCHAR(150),
    @PhoneNumber NVARCHAR(50) = NULL,
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

        INSERT INTO dbo.Users (email, passwordHash, role, fullName, phoneNumber, avatarUrl, isEmailVerified, status)
        VALUES (@Email, @PasswordHash, @Role, @FullName, @PhoneNumber, @AvatarUrl, 0, 'ACTIVE');

        DECLARE @NewUserId INT = SCOPE_IDENTITY();

        -- Create default wallet for every user
        INSERT INTO dbo.Wallets (userId, balance, currency)
        VALUES (@NewUserId, 0.00, 'INR');

        -- If EXPERT, create default pending profile
        IF (@Role = 'EXPERT')
        BEGIN
            INSERT INTO dbo.ExpertProfiles (userId, displayName, pricePerMinute, approvalStatus)
            VALUES (@NewUserId, @FullName, 20.00, 'PENDING');
        END

        COMMIT TRANSACTION;

        SELECT id, email, role, fullName, phoneNumber, avatarUrl, isEmailVerified, status, createdAt
        FROM dbo.Users WHERE id = @NewUserId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- 2. sp_GetUserByEmail
CREATE OR ALTER PROCEDURE dbo.sp_GetUserByEmail
    @Email NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        u.id, u.email, u.passwordHash, u.role, u.fullName, u.phoneNumber, u.avatarUrl, 
        u.isEmailVerified, u.status, u.createdAt,
        ep.id AS expertProfileId, ep.approvalStatus, ep.isOnline, ep.pricePerMinute, ep.freeMinutes
    FROM dbo.Users u
    LEFT JOIN dbo.ExpertProfiles ep ON ep.userId = u.id
    WHERE u.email = @Email;
END;
GO

-- 3. sp_GetUserById
CREATE OR ALTER PROCEDURE dbo.sp_GetUserById
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        u.id, u.email, u.role, u.fullName, u.phoneNumber, u.avatarUrl, 
        u.isEmailVerified, u.status, u.createdAt,
        w.balance AS walletBalance,
        ep.id AS expertProfileId, ep.approvalStatus, ep.isOnline, ep.pricePerMinute, ep.freeMinutes
    FROM dbo.Users u
    LEFT JOIN dbo.Wallets w ON w.userId = u.id
    LEFT JOIN dbo.ExpertProfiles ep ON ep.userId = u.id
    WHERE u.id = @UserId;
END;
GO

-- 4. sp_CreateOtp
CREATE OR ALTER PROCEDURE dbo.sp_CreateOtp
    @Identifier NVARCHAR(255),
    @OtpHash NVARCHAR(255),
    @Purpose NVARCHAR(50),
    @ExpiresMinutes INT = 5
AS
BEGIN
    SET NOCOUNT ON;
    -- Invalidate previous unused OTPs for this identifier & purpose
    UPDATE dbo.OtpRecords
    SET isUsed = 1
    WHERE identifier = @Identifier AND purpose = @Purpose AND isUsed = 0;

    INSERT INTO dbo.OtpRecords (identifier, otpHash, purpose, attempts, isUsed, expiresAt)
    VALUES (@Identifier, @OtpHash, @Purpose, 0, 0, DATEADD(MINUTE, @ExpiresMinutes, SYSUTCDATETIME()));
END;
GO

-- 5. sp_VerifyOtp
CREATE OR ALTER PROCEDURE dbo.sp_VerifyOtp
    @Identifier NVARCHAR(255),
    @Purpose NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    -- Return latest active OTP record for verification in Node.js
    SELECT TOP 1 id, identifier, otpHash, purpose, attempts, isUsed, expiresAt
    FROM dbo.OtpRecords
    WHERE identifier = @Identifier AND purpose = @Purpose AND isUsed = 0
    ORDER BY id DESC;
END;
GO

-- 6. sp_ConsumeOtp
CREATE OR ALTER PROCEDURE dbo.sp_ConsumeOtp
    @OtpId INT,
    @Success BIT
AS
BEGIN
    SET NOCOUNT ON;
    IF (@Success = 1)
    BEGIN
        UPDATE dbo.OtpRecords SET isUsed = 1 WHERE id = @OtpId;

        -- If registration verification, mark user verified
        DECLARE @Identifier NVARCHAR(255);
        SELECT @Identifier = identifier FROM dbo.OtpRecords WHERE id = @OtpId;
        UPDATE dbo.Users SET isEmailVerified = 1 WHERE email = @Identifier;
    END
    ELSE
    BEGIN
        UPDATE dbo.OtpRecords SET attempts = attempts + 1 WHERE id = @OtpId;
    END
END;
GO

-- 7. sp_UpsertExpertProfile
CREATE OR ALTER PROCEDURE dbo.sp_UpsertExpertProfile
    @UserId INT,
    @DisplayName NVARCHAR(150),
    @Title NVARCHAR(200) = NULL,
    @Bio NVARCHAR(MAX) = NULL,
    @ExperienceYears INT = 0,
    @Languages NVARCHAR(255) = NULL,
    @PricePerMinute DECIMAL(10,2) = 20.00,
    @FreeMinutes INT = 0,
    @DocumentUrls NVARCHAR(MAX) = NULL,
    @AvatarUrl NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        IF (@AvatarUrl IS NOT NULL)
        BEGIN
            UPDATE dbo.Users SET avatarUrl = @AvatarUrl WHERE id = @UserId;
        END

        IF EXISTS (SELECT 1 FROM dbo.ExpertProfiles WHERE userId = @UserId)
        BEGIN
            UPDATE dbo.ExpertProfiles
            SET displayName = @DisplayName,
                title = @Title,
                bio = @Bio,
                experienceYears = @ExperienceYears,
                languages = @Languages,
                pricePerMinute = @PricePerMinute,
                freeMinutes = @FreeMinutes,
                documentUrls = COALESCE(@DocumentUrls, documentUrls),
                updatedAt = SYSUTCDATETIME()
            WHERE userId = @UserId;
        END
        ELSE
        BEGIN
            INSERT INTO dbo.ExpertProfiles (
                userId, displayName, title, bio, experienceYears, languages, 
                pricePerMinute, freeMinutes, documentUrls, approvalStatus
            )
            VALUES (
                @UserId, @DisplayName, @Title, @Bio, @ExperienceYears, @Languages, 
                @PricePerMinute, @FreeMinutes, @DocumentUrls, 'PENDING'
            );
        END

        COMMIT TRANSACTION;

        SELECT ep.*, u.email, u.avatarUrl
        FROM dbo.ExpertProfiles ep
        JOIN dbo.Users u ON u.id = ep.userId
        WHERE ep.userId = @UserId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- 8. sp_GetPendingExperts (Admin)
CREATE OR ALTER PROCEDURE dbo.sp_GetPendingExperts
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        ep.id, ep.userId, ep.displayName, ep.title, ep.bio, ep.experienceYears, 
        ep.languages, ep.pricePerMinute, ep.freeMinutes, ep.approvalStatus, 
        ep.documentUrls, ep.createdAt,
        u.email, u.phoneNumber, u.avatarUrl, u.createdAt AS userJoinedAt
    FROM dbo.ExpertProfiles ep
    JOIN dbo.Users u ON u.id = ep.userId
    WHERE ep.approvalStatus = 'PENDING'
    ORDER BY ep.createdAt ASC;
END;
GO

-- 9. sp_AdminReviewExpert
CREATE OR ALTER PROCEDURE dbo.sp_AdminReviewExpert
    @ExpertId INT,
    @Action NVARCHAR(50), -- 'APPROVE', 'REJECT', 'BLOCK'
    @RejectionReason NVARCHAR(500) = NULL,
    @AdminUserId INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Status NVARCHAR(50);
    IF (@Action = 'APPROVE') SET @Status = 'APPROVED';
    ELSE IF (@Action = 'REJECT') SET @Status = 'REJECTED';
    ELSE IF (@Action = 'BLOCK') SET @Status = 'BLOCKED';
    ELSE
    BEGIN
        RAISERROR('Invalid review action', 16, 1);
        RETURN;
    END

    UPDATE dbo.ExpertProfiles
    SET approvalStatus = @Status,
        rejectionReason = CASE WHEN @Action = 'REJECT' THEN @RejectionReason ELSE NULL END,
        approvedBy = CASE WHEN @Action = 'APPROVE' THEN @AdminUserId ELSE approvedBy END,
        approvedAt = CASE WHEN @Action = 'APPROVE' THEN SYSUTCDATETIME() ELSE approvedAt END,
        updatedAt = SYSUTCDATETIME()
    WHERE id = @ExpertId;

    -- If blocked, take them offline immediately
    IF (@Status = 'BLOCKED')
    BEGIN
        UPDATE dbo.ExpertProfiles SET isOnline = 0 WHERE id = @ExpertId;
    END

    SELECT id, userId, displayName, approvalStatus, rejectionReason, approvedAt
    FROM dbo.ExpertProfiles WHERE id = @ExpertId;
END;
GO

-- 10. sp_GetApprovedExperts (Public Discovery)
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
        ep.id, ep.userId, ep.displayName, ep.title, ep.bio, ep.experienceYears,
        ep.languages, ep.pricePerMinute, ep.freeMinutes, ep.isOnline, ep.isChatEnabled,
        ep.rating, ep.totalReviews, ep.totalConsultations,
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
      AND (@SearchQuery IS NULL OR ep.displayName LIKE '%' + @SearchQuery + '%' OR ep.title LIKE '%' + @SearchQuery + '%')
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
        CASE WHEN @SortBy = 'PRICE_ASC' THEN ep.pricePerMinute END ASC,
        CASE WHEN @SortBy = 'PRICE_DESC' THEN ep.pricePerMinute END DESC,
        CASE WHEN @SortBy = 'EXPERIENCE' THEN ep.experienceYears END DESC,
        ep.isOnline DESC,
        ep.rating DESC;
END;
GO

-- 11. sp_GetExpertPublicProfile
CREATE OR ALTER PROCEDURE dbo.sp_GetExpertPublicProfile
    @ExpertId INT
AS
BEGIN
    SET NOCOUNT ON;
    -- Expert Info
    SELECT 
        ep.id, ep.userId, ep.displayName, ep.title, ep.bio, ep.experienceYears,
        ep.languages, ep.pricePerMinute, ep.freeMinutes, ep.isOnline, ep.isChatEnabled,
        ep.rating, ep.totalReviews, ep.totalConsultations, ep.approvalStatus,
        u.avatarUrl
    FROM dbo.ExpertProfiles ep
    JOIN dbo.Users u ON u.id = ep.userId
    WHERE ep.id = @ExpertId AND ep.approvalStatus = 'APPROVED';

    -- Categories
    SELECT c.id, c.name, c.slug
    FROM dbo.Categories c
    JOIN dbo.ExpertCategories ec ON ec.categoryId = c.id
    WHERE ec.expertId = @ExpertId;

    -- Services
    SELECT id, title, description, durationMinutes, price
    FROM dbo.Services
    WHERE expertId = @ExpertId AND isActive = 1;

    -- Recent Reviews
    SELECT TOP 10 r.id, r.rating, r.comment, r.createdAt, u.fullName AS customerName
    FROM dbo.Reviews r
    JOIN dbo.Users u ON u.id = r.customerId
    WHERE r.expertId = @ExpertId AND r.status = 'APPROVED'
    ORDER BY r.createdAt DESC;
END;
GO

-- 12. sp_SetExpertAvailability
CREATE OR ALTER PROCEDURE dbo.sp_SetExpertAvailability
    @UserId INT,
    @IsOnline BIT,
    @IsChatEnabled BIT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.ExpertProfiles
    SET isOnline = @IsOnline,
        isChatEnabled = @IsChatEnabled,
        updatedAt = SYSUTCDATETIME()
    WHERE userId = @UserId AND approvalStatus = 'APPROVED';

    SELECT id, userId, isOnline, isChatEnabled
    FROM dbo.ExpertProfiles
    WHERE userId = @UserId;
END;
GO

-- 13. sp_CreateWalletTransaction (Atomic Ledger Mutation)
CREATE OR ALTER PROCEDURE dbo.sp_CreateWalletTransaction
    @UserId INT,
    @Type NVARCHAR(50),
    @Amount DECIMAL(12,2),
    @Direction NVARCHAR(10), -- 'CREDIT' or 'DEBIT'
    @ReferenceType NVARCHAR(50) = NULL,
    @ReferenceId NVARCHAR(100) = NULL,
    @IdempotencyKey NVARCHAR(150) = NULL,
    @Note NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Idempotency check
        IF (@IdempotencyKey IS NOT NULL AND EXISTS (SELECT 1 FROM dbo.WalletTransactions WHERE idempotencyKey = @IdempotencyKey))
        BEGIN
            SELECT wt.*, w.balance 
            FROM dbo.WalletTransactions wt
            JOIN dbo.Wallets w ON w.id = wt.walletId
            WHERE wt.idempotencyKey = @IdempotencyKey;
            COMMIT TRANSACTION;
            RETURN;
        END

        DECLARE @WalletId INT, @CurrentBalance DECIMAL(12,2);
        SELECT @WalletId = id, @CurrentBalance = balance
        FROM dbo.Wallets WITH (UPDLOCK, HOLDLOCK)
        WHERE userId = @UserId;

        IF (@WalletId IS NULL)
        BEGIN
            RAISERROR('Wallet not found for user', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        IF (@Direction = 'DEBIT' AND @CurrentBalance < @Amount)
        BEGIN
            RAISERROR('Insufficient wallet balance', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        DECLARE @NewBalance DECIMAL(12,2);
        IF (@Direction = 'CREDIT')
            SET @NewBalance = @CurrentBalance + @Amount;
        ELSE
            SET @NewBalance = @CurrentBalance - @Amount;

        UPDATE dbo.Wallets
        SET balance = @NewBalance, updatedAt = SYSUTCDATETIME()
        WHERE id = @WalletId;

        INSERT INTO dbo.WalletTransactions (
            walletId, type, amount, direction, referenceType, referenceId, 
            status, idempotencyKey, balanceAfter, note
        )
        VALUES (
            @WalletId, @Type, @Amount, @Direction, @ReferenceType, @ReferenceId,
            'SUCCESS', @IdempotencyKey, @NewBalance, @Note
        );

        DECLARE @TxId INT = SCOPE_IDENTITY();

        COMMIT TRANSACTION;

        SELECT wt.*, @NewBalance AS currentBalance
        FROM dbo.WalletTransactions wt
        WHERE wt.id = @TxId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- 14. sp_GetWalletBalanceAndHistory
CREATE OR ALTER PROCEDURE dbo.sp_GetWalletBalanceAndHistory
    @UserId INT,
    @PageNumber INT = 1,
    @PageSize INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id, userId, balance, currency, updatedAt
    FROM dbo.Wallets WHERE userId = @UserId;

    SELECT wt.*
    FROM dbo.WalletTransactions wt
    JOIN dbo.Wallets w ON w.id = wt.walletId
    WHERE w.userId = @UserId
    ORDER BY wt.createdAt DESC
    OFFSET (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END;
GO

-- 15. sp_RecordPaymentOrder
CREATE OR ALTER PROCEDURE dbo.sp_RecordPaymentOrder
    @UserId INT,
    @OrderId NVARCHAR(100),
    @Amount DECIMAL(10,2),
    @Currency NVARCHAR(10) = 'INR',
    @IdempotencyKey NVARCHAR(150) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.PaymentOrders (userId, orderId, amount, currency, status, idempotencyKey)
    VALUES (@UserId, @OrderId, @Amount, @Currency, 'CREATED', @IdempotencyKey);

    SELECT * FROM dbo.PaymentOrders WHERE orderId = @OrderId;
END;
GO

-- 16. sp_VerifyPaymentOrder
CREATE OR ALTER PROCEDURE dbo.sp_VerifyPaymentOrder
    @OrderId NVARCHAR(100),
    @PaymentId NVARCHAR(100),
    @Signature NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @UserId INT, @Amount DECIMAL(10,2), @Status NVARCHAR(50);
        SELECT @UserId = userId, @Amount = amount, @Status = status
        FROM dbo.PaymentOrders WITH (UPDLOCK, HOLDLOCK)
        WHERE orderId = @OrderId;

        IF (@UserId IS NULL)
        BEGIN
            RAISERROR('Payment order not found', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        IF (@Status = 'PAID')
        BEGIN
            -- Already credited
            COMMIT TRANSACTION;
            SELECT * FROM dbo.PaymentOrders WHERE orderId = @OrderId;
            RETURN;
        END

        UPDATE dbo.PaymentOrders
        SET paymentId = @PaymentId,
            signature = @Signature,
            status = 'PAID',
            updatedAt = SYSUTCDATETIME()
        WHERE orderId = @OrderId;

        -- Credit user wallet atomically
        DECLARE @IdemKey NVARCHAR(150) = 'PAYMENT_' + @PaymentId;
        EXEC dbo.sp_CreateWalletTransaction 
            @UserId = @UserId,
            @Type = 'TOPUP',
            @Amount = @Amount,
            @Direction = 'CREDIT',
            @ReferenceType = 'PAYMENT_ORDER',
            @ReferenceId = @PaymentId,
            @IdempotencyKey = @IdemKey,
            @Note = 'Wallet top-up via Razorpay';

        COMMIT TRANSACTION;

        SELECT * FROM dbo.PaymentOrders WHERE orderId = @OrderId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- 17. sp_CreateConsultation
CREATE OR ALTER PROCEDURE dbo.sp_CreateConsultation
    @CustomerId INT,
    @ExpertId INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Rate DECIMAL(10,2), @FreeMinutes INT, @IsOnline BIT, @IsChatEnabled BIT, @Status NVARCHAR(50);

    SELECT @Rate = pricePerMinute, @FreeMinutes = freeMinutes, @IsOnline = isOnline, 
           @IsChatEnabled = isChatEnabled, @Status = approvalStatus
    FROM dbo.ExpertProfiles
    WHERE id = @ExpertId;

    IF (@Status <> 'APPROVED' OR @IsOnline = 0 OR @IsChatEnabled = 0)
    BEGIN
        RAISERROR('Expert is currently unavailable for consultation', 16, 1);
        RETURN;
    END

    -- Check customer wallet
    DECLARE @CustomerBalance DECIMAL(12,2);
    SELECT @CustomerBalance = balance FROM dbo.Wallets WHERE userId = @CustomerId;

    -- Customer must have at least 1 minute of balance if free minutes = 0
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

-- 18. sp_UpdateConsultationStatus
CREATE OR ALTER PROCEDURE dbo.sp_UpdateConsultationStatus
    @ConsultationId INT,
    @NewStatus NVARCHAR(50),
    @EndReason NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF (@NewStatus = 'ACTIVE')
    BEGIN
        UPDATE dbo.Consultations
        SET status = 'ACTIVE', startedAt = SYSUTCDATETIME()
        WHERE id = @ConsultationId;
    END
    ELSE IF (@NewStatus IN ('COMPLETED', 'CANCELLED', 'REJECTED'))
    BEGIN
        UPDATE dbo.Consultations
        SET status = @NewStatus, 
            endedAt = SYSUTCDATETIME(),
            endReason = @EndReason
        WHERE id = @ConsultationId;
    END
    ELSE
    BEGIN
        UPDATE dbo.Consultations
        SET status = @NewStatus
        WHERE id = @ConsultationId;
    END

    SELECT * FROM dbo.Consultations WHERE id = @ConsultationId;
END;
GO

-- 19. sp_SaveChatMessage
CREATE OR ALTER PROCEDURE dbo.sp_SaveChatMessage
    @ConsultationId INT,
    @SenderId INT,
    @SenderRole NVARCHAR(50),
    @MessageType NVARCHAR(50) = 'TEXT',
    @Content NVARCHAR(MAX),
    @FileUrl NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.ChatMessages (consultationId, senderId, senderRole, messageType, content, fileUrl, status)
    VALUES (@ConsultationId, @SenderId, @SenderRole, @MessageType, @Content, @FileUrl, 'SENT');

    SELECT SCOPE_IDENTITY() AS messageId, SYSUTCDATETIME() AS sentAt;
END;
GO

-- 20. sp_GetChatMessages
CREATE OR ALTER PROCEDURE dbo.sp_GetChatMessages
    @ConsultationId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        cm.id, cm.consultationId, cm.senderId, cm.senderRole, 
        cm.messageType, cm.content, cm.fileUrl, cm.status, cm.sentAt, cm.deliveredAt, cm.readAt,
        u.fullName AS senderName, u.avatarUrl AS senderAvatar
    FROM dbo.ChatMessages cm
    JOIN dbo.Users u ON u.id = cm.senderId
    WHERE cm.consultationId = @ConsultationId
    ORDER BY cm.sentAt ASC;
END;
GO

-- 21. sp_SettleConsultationBilling (Authoritative Single Transaction)
CREATE OR ALTER PROCEDURE dbo.sp_SettleConsultationBilling
    @ConsultationId INT,
    @TotalDurationSeconds INT,
    @EndReason NVARCHAR(100) = 'NORMAL_END'
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE 
            @CustomerId INT, @ExpertId INT, @ExpertUserId INT, @Rate DECIMAL(10,2),
            @FreeMinutesAllowed INT, @FreeSecondsAllowed INT,
            @FreeSecondsUsed INT, @PaidSecondsUsed INT, @BillableMinutes INT,
            @GrossAmount DECIMAL(10,2), @CommissionPct DECIMAL(5,2),
            @PlatformCommission DECIMAL(10,2), @ExpertEarning DECIMAL(10,2),
            @CurrentStatus NVARCHAR(50);

        SELECT 
            @CustomerId = c.customerId, 
            @ExpertId = c.expertId, 
            @ExpertUserId = ep.userId,
            @Rate = c.ratePerMinute,
            @FreeMinutesAllowed = c.freeMinutesAllowed,
            @CommissionPct = c.commissionPercentage,
            @CurrentStatus = c.status
        FROM dbo.Consultations c
        JOIN dbo.ExpertProfiles ep ON ep.id = c.expertId
        WHERE c.id = @ConsultationId;

        IF (@CurrentStatus = 'COMPLETED')
        BEGIN
            -- Already settled
            COMMIT TRANSACTION;
            SELECT * FROM dbo.Consultations WHERE id = @ConsultationId;
            RETURN;
        END

        SET @FreeSecondsAllowed = @FreeMinutesAllowed * 60;

        IF (@TotalDurationSeconds <= @FreeSecondsAllowed)
        BEGIN
            SET @FreeSecondsUsed = @TotalDurationSeconds;
            SET @PaidSecondsUsed = 0;
            SET @BillableMinutes = 0;
            SET @GrossAmount = 0.00;
            SET @PlatformCommission = 0.00;
            SET @ExpertEarning = 0.00;
        END
        ELSE
        BEGIN
            SET @FreeSecondsUsed = @FreeSecondsAllowed;
            SET @PaidSecondsUsed = @TotalDurationSeconds - @FreeSecondsAllowed;
            -- Round up to next whole minute for per-minute billing
            SET @BillableMinutes = CEILING(@PaidSecondsUsed / 60.0);
            SET @GrossAmount = @BillableMinutes * @Rate;
            SET @PlatformCommission = ROUND(@GrossAmount * (@CommissionPct / 100.0), 2);
            SET @ExpertEarning = @GrossAmount - @PlatformCommission;
        END

        -- If paid session, debit customer and credit expert earnings
        IF (@GrossAmount > 0.00)
        BEGIN
            DECLARE @IdempotencyKey NVARCHAR(150) = 'CONSULTATION_' + CAST(@ConsultationId AS NVARCHAR(20));

            -- Debit customer wallet
            EXEC dbo.sp_CreateWalletTransaction
                @UserId = @CustomerId,
                @Type = 'CONSULTATION_DEBIT',
                @Amount = @GrossAmount,
                @Direction = 'DEBIT',
                @ReferenceType = 'CONSULTATION',
                @ReferenceId = @ConsultationId,
                @IdempotencyKey = @IdempotencyKey,
                @Note = 'Live chat consultation billing';

            -- Record expert earning
            INSERT INTO dbo.ExpertEarnings (expertId, consultationId, grossAmount, platformCommission, netEarning, status)
            VALUES (@ExpertId, @ConsultationId, @GrossAmount, @PlatformCommission, @ExpertEarning, 'AVAILABLE');
        END

        -- Update consultation
        UPDATE dbo.Consultations
        SET status = 'COMPLETED',
            totalDurationSeconds = @TotalDurationSeconds,
            freeSecondsUsed = @FreeSecondsUsed,
            paidSecondsUsed = @PaidSecondsUsed,
            grossAmount = @GrossAmount,
            platformCommission = @PlatformCommission,
            expertEarning = @ExpertEarning,
            endedAt = SYSUTCDATETIME(),
            endReason = @EndReason
        WHERE id = @ConsultationId;

        -- Increment expert totals
        UPDATE dbo.ExpertProfiles
        SET totalConsultations = totalConsultations + 1
        WHERE id = @ExpertId;

        COMMIT TRANSACTION;

        SELECT * FROM dbo.Consultations WHERE id = @ConsultationId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- 22. sp_GetBanners (Public / Targeted)
CREATE OR ALTER PROCEDURE dbo.sp_GetBanners
    @Placement NVARCHAR(50) = 'HOMEPAGE'
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id, title, subtitle, imageUrl, mobileImageUrl, ctaText, ctaUrl, targetPlacement, sortOrder
    FROM dbo.Banners
    WHERE isActive = 1 
      AND targetPlacement = @Placement
      AND (startDate IS NULL OR startDate <= SYSUTCDATETIME())
      AND (endDate IS NULL OR endDate >= SYSUTCDATETIME())
    ORDER BY sortOrder ASC, id DESC;
END;
GO

-- 23. sp_AdminUpsertBanner
CREATE OR ALTER PROCEDURE dbo.sp_AdminUpsertBanner
    @Id INT = NULL,
    @Title NVARCHAR(200),
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
        SET title = @Title, subtitle = @Subtitle, imageUrl = @ImageUrl,
            mobileImageUrl = @MobileImageUrl, ctaText = @CtaText, ctaUrl = @CtaUrl,
            targetPlacement = @TargetPlacement, startDate = @StartDate, endDate = @EndDate,
            isActive = @IsActive, sortOrder = @SortOrder
        WHERE id = @Id;

        SELECT * FROM dbo.Banners WHERE id = @Id;
    END
    ELSE
    BEGIN
        INSERT INTO dbo.Banners (title, subtitle, imageUrl, mobileImageUrl, ctaText, ctaUrl, targetPlacement, startDate, endDate, isActive, sortOrder)
        VALUES (@Title, @Subtitle, @ImageUrl, @MobileImageUrl, @CtaText, @CtaUrl, @TargetPlacement, @StartDate, @EndDate, @IsActive, @SortOrder);

        SELECT * FROM dbo.Banners WHERE id = SCOPE_IDENTITY();
    END
END;
GO

-- 24. sp_GetCategories
CREATE OR ALTER PROCEDURE dbo.sp_GetCategories
    @ActiveOnly BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id, name, slug, description, imageUrl, isActive, sortOrder
    FROM dbo.Categories
    WHERE (@ActiveOnly = 0 OR isActive = 1)
    ORDER BY sortOrder ASC, name ASC;
END;
GO

-- 25. sp_AdminUpsertCategory
CREATE OR ALTER PROCEDURE dbo.sp_AdminUpsertCategory
    @Id INT = NULL,
    @Name NVARCHAR(100),
    @Slug NVARCHAR(100),
    @Description NVARCHAR(500) = NULL,
    @ImageUrl NVARCHAR(500) = NULL,
    @IsActive BIT = 1,
    @SortOrder INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    IF (@Id IS NOT NULL AND EXISTS (SELECT 1 FROM dbo.Categories WHERE id = @Id))
    BEGIN
        UPDATE dbo.Categories
        SET name = @Name, slug = @Slug, description = @Description,
            imageUrl = @ImageUrl, isActive = @IsActive, sortOrder = @SortOrder
        WHERE id = @Id;

        SELECT * FROM dbo.Categories WHERE id = @Id;
    END
    ELSE
    BEGIN
        INSERT INTO dbo.Categories (name, slug, description, imageUrl, isActive, sortOrder)
        VALUES (@Name, @Slug, @Description, @ImageUrl, @IsActive, @SortOrder);

        SELECT * FROM dbo.Categories WHERE id = SCOPE_IDENTITY();
    END
END;
GO

-- 26. sp_GetCmsPage
CREATE OR ALTER PROCEDURE dbo.sp_GetCmsPage
    @Slug NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id, slug, title, content, metaDescription, updatedAt
    FROM dbo.CmsPages
    WHERE slug = @Slug;
END;
GO

-- 27. sp_AdminUpsertCmsPage
CREATE OR ALTER PROCEDURE dbo.sp_AdminUpsertCmsPage
    @Slug NVARCHAR(100),
    @Title NVARCHAR(200),
    @Content NVARCHAR(MAX),
    @MetaDescription NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM dbo.CmsPages WHERE slug = @Slug)
    BEGIN
        UPDATE dbo.CmsPages
        SET title = @Title, content = @Content, metaDescription = @MetaDescription, updatedAt = SYSUTCDATETIME()
        WHERE slug = @Slug;
    END
    ELSE
    BEGIN
        INSERT INTO dbo.CmsPages (slug, title, content, metaDescription)
        VALUES (@Slug, @Title, @Content, @MetaDescription);
    END

    SELECT * FROM dbo.CmsPages WHERE slug = @Slug;
END;
GO

-- 28. sp_GetAdminDashboardStats
CREATE OR ALTER PROCEDURE dbo.sp_GetAdminDashboardStats
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        (SELECT COUNT(*) FROM dbo.Users WHERE role = 'CUSTOMER') AS totalCustomers,
        (SELECT COUNT(*) FROM dbo.ExpertProfiles WHERE approvalStatus = 'APPROVED') AS totalApprovedExperts,
        (SELECT COUNT(*) FROM dbo.ExpertProfiles WHERE approvalStatus = 'PENDING') AS pendingExpertApprovals,
        (SELECT COUNT(*) FROM dbo.Consultations WHERE status = 'ACTIVE') AS activeConsultations,
        (SELECT COUNT(*) FROM dbo.Consultations WHERE status = 'COMPLETED') AS totalCompletedConsultations,
        (SELECT COALESCE(SUM(platformCommission), 0) FROM dbo.Consultations WHERE status = 'COMPLETED') AS totalPlatformRevenue,
        (SELECT COALESCE(SUM(grossAmount), 0) FROM dbo.Consultations WHERE status = 'COMPLETED') AS totalGrossVolume,
        (SELECT COUNT(*) FROM dbo.Withdrawals WHERE status = 'PENDING') AS pendingWithdrawals;
END;
GO

-- 29. sp_CreateReview
CREATE OR ALTER PROCEDURE dbo.sp_CreateReview
    @ConsultationId INT,
    @CustomerId INT,
    @Rating INT,
    @Comment NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @ExpertId INT;
        SELECT @ExpertId = expertId FROM dbo.Consultations WHERE id = @ConsultationId AND customerId = @CustomerId;

        IF (@ExpertId IS NULL)
        BEGIN
            RAISERROR('Consultation not found or not belonging to customer', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        INSERT INTO dbo.Reviews (consultationId, customerId, expertId, rating, comment, status)
        VALUES (@ConsultationId, @CustomerId, @ExpertId, @Rating, @Comment, 'APPROVED');

        -- Recalculate expert average rating
        UPDATE dbo.ExpertProfiles
        SET rating = (SELECT ROUND(AVG(CAST(rating AS DECIMAL(3,2))), 2) FROM dbo.Reviews WHERE expertId = @ExpertId AND status = 'APPROVED'),
            totalReviews = (SELECT COUNT(*) FROM dbo.Reviews WHERE expertId = @ExpertId AND status = 'APPROVED')
        WHERE id = @ExpertId;

        COMMIT TRANSACTION;

        SELECT r.*, ep.displayName AS expertName
        FROM dbo.Reviews r
        JOIN dbo.ExpertProfiles ep ON ep.id = r.expertId
        WHERE r.consultationId = @ConsultationId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

GO

-- ==========================================================================
-- SECTION: 03_seed_data.sql
-- ==========================================================================

-- ==========================================================
-- Astrology & Psychic Consultation Platform - Seed Data
-- Database: Microsoft SQL Server (AstrologyDB)
-- ==========================================================

USE AstrologyDB;
GO

-- 1. Default Admin User (Password: admin123)
-- Hash: $2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ecJ58GDuuvz6BVJ4W (admin123)
IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE email = 'admin@astrology.com')
BEGIN
    INSERT INTO dbo.Users (email, passwordHash, role, fullName, phoneNumber, isEmailVerified, status)
    VALUES (
        'admin@astrology.com', 
        '$2a$10$sXt52We2drXmxJMUFnkffea29qnyvvXFyoh1I8gjrcFeyDeU7tIYe', 
        'ADMIN', 
        'Platform Administrator', 
        '+919876543210', 
        1, 
        'ACTIVE'
    );

    DECLARE @AdminId INT = SCOPE_IDENTITY();
    INSERT INTO dbo.Wallets (userId, balance, currency) VALUES (@AdminId, 10000.00, 'INR');
END;
GO

-- 2. Default Categories
IF NOT EXISTS (SELECT 1 FROM dbo.Categories WHERE slug = 'vedic-astrology')
BEGIN
    INSERT INTO dbo.Categories (name, slug, description, imageUrl, isActive, sortOrder)
    VALUES 
    ('Vedic Astrology', 'vedic-astrology', 'Ancient Indian horoscope and planetary guidance for life decisions.', 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=600&q=80', 1, 1),
    ('Tarot Reading', 'tarot-reading', 'Mystic card spreads revealing hidden truths, love paths and energies.', 'https://images.unsplash.com/photo-1601024418020-81fe910901e8?auto=format&fit=crop&w=600&q=80', 1, 2),
    ('Numerology', 'numerology', 'Discover life path numbers, name vibrations, and destiny cycles.', 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=600&q=80', 1, 3),
    ('Palmistry', 'palmistry', 'Chiromancy insights through hand lines, mounts, and future signs.', 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=600&q=80', 1, 4),
    ('Vastu Shastra', 'vastu-shastra', 'Harmonize cosmic energy balance in your home and workplace.', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80', 1, 5),
    ('Psychic & Clairvoyance', 'psychic-clairvoyance', 'Deep spiritual aura reading and intuitive foresight.', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80', 1, 6),
    ('Love & Relationship', 'love-relationship', 'Synastry and relationship compatibility guidance with top experts.', 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=600&q=80', 1, 7),
    ('Career & Wealth', 'career-wealth', 'Timing of career breakthroughs, business growth, and prosperity.', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80', 1, 8);
END;
GO



-- 4. Default Settings
IF NOT EXISTS (SELECT 1 FROM dbo.Settings WHERE [key] = 'site_name')
BEGIN
    INSERT INTO dbo.Settings ([key], [value], description)
    VALUES 
    ('site_name', 'DivyaJyoti Astrology & Psychic Hub', 'Platform Brand Name'),
    ('platform_commission_percent', '20', 'Platform revenue share percentage on consultations'),
    ('min_wallet_topup', '100', 'Minimum wallet recharge in INR'),
    ('default_free_minutes', '5', 'Promotional free minutes for first-time customer consultations'),
    ('low_balance_threshold', '20', 'Low balance warning threshold in INR'),
    ('support_email', 'support@divyajyoti-astrology.com', 'Official customer support email'),
    ('support_phone', '+91 1800 123 4567', 'Official customer support toll-free');
END;
GO

-- 5. Default CMS Pages
IF NOT EXISTS (SELECT 1 FROM dbo.CmsPages WHERE slug = 'about')
BEGIN
    INSERT INTO dbo.CmsPages (slug, title, content, metaDescription)
    VALUES
    ('about', 'About Our Spiritual Marketplace', 'We connect seekers with verified astrologers, tarot readers, numerologists, and psychic mediums worldwide for authentic spiritual clarity and real-time guidance.', 'About the premier astrology and psychic consultation platform.'),
    ('how-it-works', 'How It Works', '1. Browse verified experts by rating and specialty. 2. Recharge your wallet safely using Razorpay. 3. Start an instant real-time live chat session. Pay only for the minutes you use!', 'Simple 3-step guide on how live consultations work.'),
    ('faq', 'Frequently Asked Questions', 'Q: Are consultations private?\nA: Yes, 100% confidential and encrypted.\n\nQ: How does per-minute billing work?\nA: You are charged per minute based on server authoritative timers once promotional free minutes expire.', 'Frequently asked questions about readings, payments, and experts.'),
    ('terms', 'Terms & Conditions', 'All consultations are for guidance and spiritual reflection. Users must be 18 years or older. All financial transactions are secured.', 'Platform terms of service.'),
    ('privacy', 'Privacy Policy', 'We value your spiritual privacy. Your chat logs and personal birth details are never shared with third parties.', 'Platform privacy commitments.'),
    ('refund', 'Refund & Cancellation Policy', 'Wallet top-ups are eligible for refund if unused within 48 hours or in case of verified technical session disruption.', 'Fair refund and cancellation policies.'),
    ('disclaimer', 'Spiritual Disclaimer', 'Astrological and psychic predictions provide spiritual perspective. They should not substitute professional medical, financial, or legal advice.', 'Official astrological disclaimer.');
END;
GO

GO

-- ==========================================================================
-- SECTION: 04_expert_signup_fields.sql
-- ==========================================================================

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

GO

-- ==========================================================================
-- SECTION: 05_admin_expert_enhancements.sql
-- ==========================================================================

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

GO

-- ==========================================================================
-- SECTION: 06_optional_banner_text.sql
-- ==========================================================================

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

GO

-- ==========================================================================
-- SECTION: 07_expert_dashboard_delete_and_auth.sql
-- ==========================================================================

-- ==========================================================
-- Astrology & Psychic Platform - Expert Dashboard, Delete Expert & Auth Resets
-- Migration File: 07_expert_dashboard_delete_and_auth.sql
-- ==========================================================

USE AstrologyDB;
GO

-- 1. Ensure avatarUrl column exists in Users & ExpertProfiles
IF COL_LENGTH('dbo.Users', 'avatarUrl') IS NULL
    ALTER TABLE dbo.Users ADD avatarUrl NVARCHAR(500) NULL;

IF COL_LENGTH('dbo.ExpertProfiles', 'isActive') IS NULL
    ALTER TABLE dbo.ExpertProfiles ADD isActive BIT NOT NULL DEFAULT 1;

IF COL_LENGTH('dbo.ExpertProfiles', 'isOnline') IS NULL
    ALTER TABLE dbo.ExpertProfiles ADD isOnline BIT NOT NULL DEFAULT 0;
GO

-- 2. Procedure: sp_GetExpertFullProfileByUserId
-- Fetches full profile details for logged-in Expert Dashboard
CREATE OR ALTER PROCEDURE dbo.sp_GetExpertFullProfileByUserId
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        ep.id, ep.userId, ep.displayName, ep.screenName, ep.title, ep.bio, 
        ep.dob, ep.gender, ep.address, ep.city, ep.state, ep.country, ep.zipCode, 
        ep.telephone, ep.fax, ep.experienceYears, ep.languages, 
        ep.pricePerMinute, ep.freeMinutes, ep.approvalStatus, 
        ep.isActive, ep.isOnline, ep.rating, ep.totalReviews, ep.totalConsultations,
        ep.documentUrls, ep.createdAt, ep.updatedAt,
        u.email, u.phoneNumber, u.avatarUrl, u.status AS userStatus,
        (
            SELECT c.id, c.name, c.slug 
            FROM dbo.Categories c
            JOIN dbo.ExpertCategories ec ON ec.categoryId = c.id
            WHERE ec.expertId = ep.id
            FOR JSON PATH
        ) AS categoriesJson
    FROM dbo.ExpertProfiles ep
    JOIN dbo.Users u ON u.id = ep.userId
    WHERE ep.userId = @UserId;
END;
GO

-- 3. Procedure: sp_UpsertExpertProfile (Full Profile Update Support)
CREATE OR ALTER PROCEDURE dbo.sp_UpsertExpertProfile
    @UserId INT,
    @DisplayName NVARCHAR(150),
    @ScreenName NVARCHAR(100) = NULL,
    @Title NVARCHAR(200) = NULL,
    @Bio NVARCHAR(MAX) = NULL,
    @ExperienceYears INT = 0,
    @Languages NVARCHAR(255) = NULL,
    @PricePerMinute DECIMAL(10,2) = 20.00,
    @FreeMinutes INT = 0,
    @DocumentUrls NVARCHAR(MAX) = NULL,
    @AvatarUrl NVARCHAR(500) = NULL,
    @PhoneNumber NVARCHAR(50) = NULL,
    @Address NVARCHAR(300) = NULL,
    @City NVARCHAR(100) = NULL,
    @State NVARCHAR(100) = NULL,
    @Country NVARCHAR(100) = NULL,
    @ZipCode NVARCHAR(30) = NULL,
    @IsActive BIT = NULL,
    @IsOnline BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Update user table details (avatar & phone)
        UPDATE dbo.Users
        SET avatarUrl = COALESCE(@AvatarUrl, avatarUrl),
            phoneNumber = COALESCE(@PhoneNumber, phoneNumber),
            fullName = COALESCE(@DisplayName, fullName),
            updatedAt = SYSUTCDATETIME()
        WHERE id = @UserId;

        IF EXISTS (SELECT 1 FROM dbo.ExpertProfiles WHERE userId = @UserId)
        BEGIN
            UPDATE dbo.ExpertProfiles
            SET displayName = @DisplayName,
                screenName = COALESCE(@ScreenName, screenName),
                title = @Title,
                bio = @Bio,
                experienceYears = @ExperienceYears,
                languages = @Languages,
                pricePerMinute = @PricePerMinute,
                freeMinutes = @FreeMinutes,
                documentUrls = COALESCE(@DocumentUrls, documentUrls),
                address = COALESCE(@Address, address),
                city = COALESCE(@City, city),
                state = COALESCE(@State, state),
                country = COALESCE(@Country, country),
                zipCode = COALESCE(@ZipCode, zipCode),
                telephone = COALESCE(@PhoneNumber, telephone),
                isActive = COALESCE(@IsActive, isActive),
                isOnline = COALESCE(@IsOnline, isOnline),
                updatedAt = SYSUTCDATETIME()
            WHERE userId = @UserId;
        END
        ELSE
        BEGIN
            INSERT INTO dbo.ExpertProfiles (
                userId, displayName, screenName, title, bio, experienceYears, languages, 
                pricePerMinute, freeMinutes, documentUrls, address, city, state, country, zipCode,
                telephone, approvalStatus, isActive, isOnline
            )
            VALUES (
                @UserId, @DisplayName, @ScreenName, @Title, @Bio, @ExperienceYears, @Languages, 
                @PricePerMinute, @FreeMinutes, @DocumentUrls, @Address, @City, @State, @Country, @ZipCode,
                @PhoneNumber, 'PENDING', COALESCE(@IsActive, 1), COALESCE(@IsOnline, 0)
            );
        END

        COMMIT TRANSACTION;

        -- Return full updated profile
        EXEC dbo.sp_GetExpertFullProfileByUserId @UserId = @UserId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- 4. Procedure: sp_AdminDeleteExpert
-- Permanently deletes an expert and cleans up linkages
CREATE OR ALTER PROCEDURE dbo.sp_AdminDeleteExpert
    @ExpertId INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @UserId INT;
        SELECT @UserId = userId FROM dbo.ExpertProfiles WHERE id = @ExpertId;

        IF (@ExpertId IS NOT NULL)
        BEGIN
            -- 1. Delete chat messages for consultations involving this expert
            DELETE cm FROM dbo.ChatMessages cm
            JOIN dbo.Consultations c ON c.id = cm.consultationId
            WHERE c.expertId = @ExpertId;

            -- 2. Delete reviews
            DELETE r FROM dbo.Reviews r
            JOIN dbo.Consultations c ON c.id = r.consultationId
            WHERE c.expertId = @ExpertId;

            -- 3. Delete earnings & withdrawals
            DELETE FROM dbo.ExpertEarnings WHERE expertId = @ExpertId;
            DELETE FROM dbo.Withdrawals WHERE expertId = @ExpertId;

            -- 4. Delete consultations
            DELETE FROM dbo.Consultations WHERE expertId = @ExpertId;

            -- 5. Delete category associations
            DELETE FROM dbo.ExpertCategories WHERE expertId = @ExpertId;

            -- 6. Delete ExpertProfile record
            DELETE FROM dbo.ExpertProfiles WHERE id = @ExpertId;

            -- 7. Delete Expert User account if exists
            IF (@UserId IS NOT NULL)
            BEGIN
                DELETE FROM dbo.Wallets WHERE userId = @UserId;
                DELETE FROM dbo.Users WHERE id = @UserId AND role = 'EXPERT';
            END
        END

        COMMIT TRANSACTION;

        SELECT 1 AS success, 'Expert deleted successfully' AS message;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- 5. Procedure: sp_ResetUserPassword
-- Securely resets user passwordHash after OTP verification
CREATE OR ALTER PROCEDURE dbo.sp_ResetUserPassword
    @Email NVARCHAR(255),
    @PasswordHash NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.Users
    SET passwordHash = @PasswordHash,
        updatedAt = SYSUTCDATETIME()
    WHERE email = @Email;

    SELECT id, email, fullName, role, status
    FROM dbo.Users
    WHERE email = @Email;
END;
GO

GO

-- ==========================================================================
-- SECTION: 08_expert_dashboard_features.sql
-- ==========================================================================

-- ==========================================================
-- Astrology Platform - Expert Dashboard Modular Features
-- Migration File: 08_expert_dashboard_features.sql
-- ==========================================================

USE AstrologyDB;
GO

-- 1. Ensure paymentOptionsJson exists in ExpertProfiles
IF COL_LENGTH('dbo.ExpertProfiles', 'paymentOptionsJson') IS NULL
    ALTER TABLE dbo.ExpertProfiles ADD paymentOptionsJson NVARCHAR(MAX) NULL;
GO

-- 2. Create AccountCloseRequests Table
IF OBJECT_ID('dbo.AccountCloseRequests', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.AccountCloseRequests (
        id INT IDENTITY(1,1) PRIMARY KEY,
        expertId INT NOT NULL FOREIGN KEY REFERENCES dbo.ExpertProfiles(id) ON DELETE CASCADE,
        userId INT NOT NULL FOREIGN KEY REFERENCES dbo.Users(id),
        reason NVARCHAR(MAX) NOT NULL,
        status NVARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
        adminNotes NVARCHAR(500) NULL,
        requestedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        processedAt DATETIME2 NULL
    );
    CREATE INDEX IX_AccountClose_Expert ON dbo.AccountCloseRequests(expertId, status);
END;
GO

-- 3. Stored Procedure: sp_GetExpertClients
-- Returns all distinct customers who consulted with this expert with stats
CREATE OR ALTER PROCEDURE dbo.sp_GetExpertClients
    @ExpertId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        u.id AS customerId,
        u.fullName AS customerName,
        u.email AS customerEmail,
        u.phoneNumber AS customerPhone,
        u.avatarUrl AS customerAvatar,
        COUNT(c.id) AS totalSessions,
        COALESCE(SUM(c.totalDurationSeconds), 0) AS totalDurationSeconds,
        COALESCE(SUM(c.grossAmount), 0) AS totalSpent,
        MAX(c.requestedAt) AS lastConsultationAt
    FROM dbo.Consultations c
    JOIN dbo.Users u ON u.id = c.customerId
    WHERE c.expertId = @ExpertId AND c.status IN ('COMPLETED', 'ACTIVE')
    GROUP BY u.id, u.fullName, u.email, u.phoneNumber, u.avatarUrl
    ORDER BY lastConsultationAt DESC;
END;
GO

-- 4. Stored Procedure: sp_GetExpertNotifications (Mailbox)
CREATE OR ALTER PROCEDURE dbo.sp_GetExpertNotifications
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        id, userId, title, message, type, isRead, createdAt
    FROM dbo.Notifications
    WHERE userId = @UserId
    ORDER BY createdAt DESC;
END;
GO

-- 5. Stored Procedure: sp_MarkNotificationRead
CREATE OR ALTER PROCEDURE dbo.sp_MarkNotificationRead
    @NotificationId INT,
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.Notifications
    SET isRead = 1
    WHERE id = @NotificationId AND userId = @UserId;

    SELECT id, isRead FROM dbo.Notifications WHERE id = @NotificationId;
END;
GO

-- 6. Stored Procedure: sp_CreateAccountCloseRequest
CREATE OR ALTER PROCEDURE dbo.sp_CreateAccountCloseRequest
    @ExpertId INT,
    @UserId INT,
    @Reason NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;

    -- Check if an active pending request already exists
    IF EXISTS (SELECT 1 FROM dbo.AccountCloseRequests WHERE expertId = @ExpertId AND status = 'PENDING')
    BEGIN
        SELECT TOP 1 * FROM dbo.AccountCloseRequests 
        WHERE expertId = @ExpertId AND status = 'PENDING';
        RETURN;
    END

    INSERT INTO dbo.AccountCloseRequests (expertId, userId, reason, status)
    VALUES (@ExpertId, @UserId, @Reason, 'PENDING');

    SELECT * FROM dbo.AccountCloseRequests WHERE id = SCOPE_IDENTITY();
END;
GO

-- 7. Stored Procedure: sp_UpdateExpertPaymentOptions
CREATE OR ALTER PROCEDURE dbo.sp_UpdateExpertPaymentOptions
    @ExpertId INT,
    @PaymentOptionsJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.ExpertProfiles
    SET paymentOptionsJson = @PaymentOptionsJson,
        updatedAt = SYSUTCDATETIME()
    WHERE id = @ExpertId;

    SELECT id, userId, paymentOptionsJson
    FROM dbo.ExpertProfiles
    WHERE id = @ExpertId;
END;
GO

-- 8. Stored Procedure: sp_GetExpertPaymentOptions
CREATE OR ALTER PROCEDURE dbo.sp_GetExpertPaymentOptions
    @ExpertId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT id, userId, paymentOptionsJson
    FROM dbo.ExpertProfiles
    WHERE id = @ExpertId;
END;
GO

GO

-- ==========================================================================
-- SECTION: 09_products_and_pujas_tables.sql
-- ==========================================================================

-- ==========================================================
-- Astrology Platform - Products & Temple Pujas Migration
-- Database: Microsoft SQL Server (AstrologyDB)
-- ==========================================================

USE AstrologyDB;
GO

-- 1. Create dbo.Products Table
IF OBJECT_ID('dbo.Products', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Products (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        category NVARCHAR(100) NOT NULL DEFAULT 'Gemstones',
        price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        originalPrice DECIMAL(10,2) NULL,
        rating DECIMAL(3,2) NOT NULL DEFAULT 5.00,
        reviews INT NOT NULL DEFAULT 0,
        planet NVARCHAR(150) NULL,
        weight NVARCHAR(100) NULL,
        inStock BIT NOT NULL DEFAULT 1,
        image NVARCHAR(MAX) NULL,
        description NVARCHAR(MAX) NULL,
        isActive BIT NOT NULL DEFAULT 1,
        createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX IX_Products_Category ON dbo.Products(category);
    CREATE INDEX IX_Products_IsActive ON dbo.Products(isActive);
    PRINT 'Created table dbo.Products successfully.';
END
ELSE
BEGIN
    ALTER TABLE dbo.Products ALTER COLUMN image NVARCHAR(MAX) NULL;
END;
GO

-- 2. Create dbo.TemplePujas Table
IF OBJECT_ID('dbo.TemplePujas', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TemplePujas (
        id INT IDENTITY(1,1) PRIMARY KEY,
        title NVARCHAR(255) NOT NULL,
        temple NVARCHAR(255) NOT NULL,
        benefits NVARCHAR(MAX) NULL,
        price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        originalPrice DECIMAL(10,2) NULL,
        duration NVARCHAR(150) NULL,
        pandits NVARCHAR(150) NULL,
        date NVARCHAR(150) NULL,
        image NVARCHAR(MAX) NULL,
        tags NVARCHAR(500) NULL,
        isActive BIT NOT NULL DEFAULT 1,
        createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX IX_TemplePujas_IsActive ON dbo.TemplePujas(isActive);
    PRINT 'Created table dbo.TemplePujas successfully.';
END
ELSE
BEGIN
    ALTER TABLE dbo.TemplePujas ALTER COLUMN image NVARCHAR(MAX) NULL;
END;
GO

-- 3. Stored Procedures for Products
CREATE OR ALTER PROCEDURE dbo.sp_GetAllProducts
    @Category NVARCHAR(100) = NULL,
    @Search NVARCHAR(255) = NULL,
    @IsActive BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        id,
        name,
        category,
        price,
        originalPrice,
        rating,
        reviews,
        planet,
        weight,
        inStock,
        image,
        description,
        isActive,
        createdAt,
        updatedAt
    FROM dbo.Products
    WHERE (@Category IS NULL OR @Category = 'All' OR category = @Category)
      AND (@IsActive IS NULL OR isActive = @IsActive)
      AND (
          @Search IS NULL OR @Search = '' 
          OR name LIKE '%' + @Search + '%' 
          OR planet LIKE '%' + @Search + '%' 
          OR category LIKE '%' + @Search + '%' 
          OR description LIKE '%' + @Search + '%'
      )
    ORDER BY createdAt DESC;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_GetProductById
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        id,
        name,
        category,
        price,
        originalPrice,
        rating,
        reviews,
        planet,
        weight,
        inStock,
        image,
        description,
        isActive,
        createdAt,
        updatedAt
    FROM dbo.Products
    WHERE id = @Id;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_UpsertProduct
    @Id INT = NULL,
    @Name NVARCHAR(255),
    @Category NVARCHAR(100) = 'Gemstones',
    @Price DECIMAL(10,2),
    @OriginalPrice DECIMAL(10,2) = NULL,
    @Rating DECIMAL(3,2) = 5.00,
    @Reviews INT = 0,
    @Planet NVARCHAR(150) = NULL,
    @Weight NVARCHAR(100) = NULL,
    @InStock BIT = 1,
    @Image NVARCHAR(MAX) = NULL,
    @Description NVARCHAR(MAX) = NULL,
    @IsActive BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    IF @Id IS NOT NULL AND EXISTS (SELECT 1 FROM dbo.Products WHERE id = @Id)
    BEGIN
        UPDATE dbo.Products
        SET 
            name = @Name,
            category = @Category,
            price = @Price,
            originalPrice = @OriginalPrice,
            rating = ISNULL(@Rating, rating),
            reviews = ISNULL(@Reviews, reviews),
            planet = @Planet,
            weight = @Weight,
            inStock = @InStock,
            image = @Image,
            description = @Description,
            isActive = @IsActive,
            updatedAt = SYSUTCDATETIME()
        WHERE id = @Id;

        SELECT * FROM dbo.Products WHERE id = @Id;
    END
    ELSE
    BEGIN
        INSERT INTO dbo.Products (
            name, category, price, originalPrice, rating, reviews, planet, weight, inStock, image, description, isActive
        )
        VALUES (
            @Name, @Category, @Price, @OriginalPrice, ISNULL(@Rating, 5.00), ISNULL(@Reviews, 0), @Planet, @Weight, @InStock, @Image, @Description, @IsActive
        );

        SELECT * FROM dbo.Products WHERE id = SCOPE_IDENTITY();
    END
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_DeleteProduct
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.Products WHERE id = @Id;
    SELECT @@ROWCOUNT AS affectedRows;
END;
GO

-- 4. Stored Procedures for Temple Pujas
CREATE OR ALTER PROCEDURE dbo.sp_GetAllTemplePujas
    @Search NVARCHAR(255) = NULL,
    @IsActive BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        id,
        title,
        temple,
        benefits,
        price,
        originalPrice,
        duration,
        pandits,
        date,
        image,
        tags,
        isActive,
        createdAt,
        updatedAt
    FROM dbo.TemplePujas
    WHERE (@IsActive IS NULL OR isActive = @IsActive)
      AND (
          @Search IS NULL OR @Search = '' 
          OR title LIKE '%' + @Search + '%' 
          OR temple LIKE '%' + @Search + '%' 
          OR benefits LIKE '%' + @Search + '%'
          OR tags LIKE '%' + @Search + '%'
      )
    ORDER BY createdAt DESC;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_GetTemplePujaById
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        id,
        title,
        temple,
        benefits,
        price,
        originalPrice,
        duration,
        pandits,
        date,
        image,
        tags,
        isActive,
        createdAt,
        updatedAt
    FROM dbo.TemplePujas
    WHERE id = @Id;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_UpsertTemplePuja
    @Id INT = NULL,
    @Title NVARCHAR(255),
    @Temple NVARCHAR(255),
    @Benefits NVARCHAR(MAX) = NULL,
    @Price DECIMAL(10,2),
    @OriginalPrice DECIMAL(10,2) = NULL,
    @Duration NVARCHAR(150) = NULL,
    @Pandits NVARCHAR(150) = NULL,
    @Date NVARCHAR(150) = NULL,
    @Image NVARCHAR(MAX) = NULL,
    @Tags NVARCHAR(500) = NULL,
    @IsActive BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    IF @Id IS NOT NULL AND EXISTS (SELECT 1 FROM dbo.TemplePujas WHERE id = @Id)
    BEGIN
        UPDATE dbo.TemplePujas
        SET 
            title = @Title,
            temple = @Temple,
            benefits = @Benefits,
            price = @Price,
            originalPrice = @OriginalPrice,
            duration = @Duration,
            pandits = @Pandits,
            date = @Date,
            image = @Image,
            tags = @Tags,
            isActive = @IsActive,
            updatedAt = SYSUTCDATETIME()
        WHERE id = @Id;

        SELECT * FROM dbo.TemplePujas WHERE id = @Id;
    END
    ELSE
    BEGIN
        INSERT INTO dbo.TemplePujas (
            title, temple, benefits, price, originalPrice, duration, pandits, date, image, tags, isActive
        )
        VALUES (
            @Title, @Temple, @Benefits, @Price, @OriginalPrice, @Duration, @Pandits, @Date, @Image, @Tags, @IsActive
        );

        SELECT * FROM dbo.TemplePujas WHERE id = SCOPE_IDENTITY();
    END
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_DeleteTemplePuja
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.TemplePujas WHERE id = @Id;
    SELECT @@ROWCOUNT AS affectedRows;
END;
GO

-- 5. Seed Initial Products Data if table is empty
IF NOT EXISTS (SELECT 1 FROM dbo.Products)
BEGIN
    INSERT INTO dbo.Products (name, category, price, originalPrice, rating, reviews, planet, weight, inStock, image, description, isActive)
    VALUES
    ('Natural Ceylon Yellow Sapphire (Pukhraj)', 'Gemstones', 8500, 12500, 4.9, 142, 'Jupiter (Guru)', '4.25 Carats', 1, 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=600&q=80', '100% untreated Ceylon Yellow Sapphire, energized by Vedic Brahmins for prosperity, wisdom, and marriage harmony.', 1),
    ('Certified Burmese Ruby (Manikya)', 'Gemstones', 6800, 9500, 4.8, 98, 'Sun (Surya)', '3.5 Carats', 1, 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80', 'Vibrant Pigeon Blood Red Ruby for leadership, vitality, government career success, and royal confidence.', 1),
    ('Italian Red Coral (Moonga)', 'Gemstones', 4200, 6000, 4.9, 187, 'Mars (Mangal)', '6.15 Carats', 1, 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80', 'Authentic triangular Italian Moonga for pacifying Manglik Dosha, building physical vitality and courage.', 1),
    ('Original 5-Mukhi Nepali Rudraksha Mala (108+1)', 'Rudraksha', 1499, 2499, 5.0, 320, 'Lord Shiva', 'Selected 8mm Beads', 1, 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80', 'Siddha energized Nepali 5-Mukhi beads strung in holy silk thread. Ideal for daily japa, peace of mind, and BP balance.', 1),
    ('Rare 1-Mukhi Half-Moon (Kaju) Rudraksha', 'Rudraksha', 5999, 8999, 4.9, 76, 'Supreme Consciousness', 'Certified Collector Grade', 1, 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80', 'The most sacred bead ruled by Lord Shiva Himself. Grants heightened intuition, super-consciousness, and liberation.', 1),
    ('7-Mukhi Mahalaxmi Nepali Rudraksha', 'Rudraksha', 2199, 3499, 4.8, 112, 'Goddess Lakshmi', 'Authentic Nepal Bead', 1, 'https://images.unsplash.com/photo-1615655406736-b37c4fabf923?auto=format&fit=crop&w=600&q=80', 'Ruled by Goddess Lakshmi and Saturn. Nullifies financial blockages, bad luck, and attracts continuous wealth flow.', 1),
    ('24K Gold-Plated Meru Shree Yantra (Solid Brass)', 'Yantras', 3499, 5200, 5.0, 215, 'Sri Vidya / Tripura Sundari', '850 grams', 1, 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80', '3D geometrical pyramid casting of ancient Sri Chakra according to Agamic scriptures. Bestows Vastu dosha correction.', 1),
    ('Vedic Kuber Dhan Varsha Yantra Chowki', 'Yantras', 2499, 3999, 4.8, 154, 'Lord Kubera', '620 grams', 1, 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80', 'Holy brass chowki with Kuber idol, coin, and yantra plate. Perfect for placement in cash lockers and business desks.', 1),
    ('7-Chakra Natural Lava Energy Healing Bracelet', 'Bracelets', 799, 1499, 4.7, 430, 'All 7 Chakras', 'Elastic Standard Fit', 1, 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80', 'Natural Amethyst, Lapis, Turquoise, Imperial Stone, Tiger Eye, Amber, and Onyx. Rebalances subtle energy centers.', 1);

    PRINT 'Seeded initial products into dbo.Products.';
END;
GO

-- 6. Seed Initial Temple Pujas Data if table is empty
IF NOT EXISTS (SELECT 1 FROM dbo.TemplePujas)
BEGIN
    INSERT INTO dbo.TemplePujas (title, temple, benefits, price, originalPrice, duration, pandits, date, image, tags, isActive)
    VALUES
    ('Mahakaleshwar Kaal Sarp & Shani Shanti Mahapuja', 'Shri Mahakaleshwar Jyotirlinga, Ujjain (M.P.)', 'Nullifies malefic effects of Rahu-Ketu, Kaal Sarp Dosha, and delays in career or marriage.', 3100, 5100, '2 Hours Live Ritual', '5 Vedic Acharyas', 'Next Auspicious Amavasya / Somwar', 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80', 'Kaal Sarp Dosha, Shani Sade Sati, Jyotirlinga', 1),
    ('Maa Baglamukhi Shatru Vinashak & Vijay Havan', 'Maa Baglamukhi Temple, Nalkheda (M.P.)', 'Overcomes legal court disputes, hidden adversaries, political hurdles, and financial blockages.', 4500, 7500, '3.5 Hours Tantrik & Vedic Havan', '7 Siddh Brahamans', 'Next Shukla Paksha Ashtami / Chaturdashi', 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80', 'Legal & Court Victory, Shatru Shanti, Protection', 1),
    ('Mangalnath Bhaat Puja for Manglik Dosha Nivaran', 'Shri Mangalnath Mandir, Ujjain (Birthplace of Mars)', 'Removes delays and obstacles in marriage, cleanses extreme Angarak & Mangal Doshas in kundali.', 2700, 4200, '1.5 Hours Rice Abhishek', '3 Vedic Acharyas', 'Every Tuesday (Mangalwar)', 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80', 'Manglik Dosha, Marriage Delays, Relationship Harmony', 1);

    PRINT 'Seeded initial temple pujas into dbo.TemplePujas.';
END;
GO

GO

-- ==========================================================================
-- SECTION: 10_rich_policy_pages.sql
-- ==========================================================================

-- ============================================================
-- Migration 10: Populate Comprehensive Rich Policy & Editorial Content
-- ============================================================

USE [AstrologyDB];
GO

BEGIN TRANSACTION;

-- 1. Terms & Conditions
IF EXISTS (SELECT 1 FROM dbo.CmsPages WHERE slug = 'terms')
BEGIN
    UPDATE dbo.CmsPages
    SET 
        title = 'Terms of Service & User Agreement',
        metaDescription = 'Official Terms and Conditions governing user accounts, consultations, wallet transactions, and conduct on Aakash Astrology platform.',
        content = '1. Acceptance of Terms & Platform Agreement
Welcome to Aakash Spiritual & Astrological Marketplace. By accessing, browsing, or using our mobile-web platform, mobile applications, and real-time consultation services, you agree to be legally bound by these Terms of Service. If you do not agree to any part of these terms, you must discontinue using our services immediately.

2. User Eligibility & Account Responsibility
• Age Requirement: You must be at least 18 years of age to register an account and initiate consultations on Aakash.
• Account Security: You are solely responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.
• Accurate Information: You agree to provide true, accurate, and current information regarding your identity, birth date, time, and birthplace for precise astrological chart calculations.

3. Real-Time Consultations & Wallet Billing Structure
• Server-Authoritative Billing: Live chat and voice/call consultations are billed on a transparent per-minute rate as displayed on each Astrologer’s profile.
• Prepaid Wallet: Consultations are funded via your prepaid in-app wallet balance. The session timer starts strictly when connection is established.
• Promotional Minutes: Any promotional introductory minutes or coupon discounts are applied automatically before standard wallet deductions begin.
• Session Auto-Termination: If your wallet balance reaches zero during an ongoing consultation, the system will provide a courtesy warning and gracefully end the session if additional credits are not added.

4. User Code of Conduct & Respectful Communication
• Zero-Tolerance Policy: We foster a sacred, respectful, and empowering environment. Any use of abusive language, profanity, harassment, hate speech, threats, or sexual misconduct towards astrologers or support staff will result in immediate session termination and permanent account blacklist without refund.
• External Contact Solicitation: Devotees and Astrologers are strictly prohibited from soliciting private off-platform payments, direct personal phone numbers, or external banking details.

5. Astrologer Independence & Spiritual Guidance
Astrologers, Vedic Acharyas, Tarot Readers, and Numerologists listed on Aakash operate as verified independent practitioners. Their advice reflects their authentic interpretations of ancient Vedic traditions and personal spiritual discernment.

6. Intellectual Property Rights
All software, platform architecture, user interfaces, branding, proprietary Vedic calculation algorithms, and content on Aakash are protected by copyright and intellectual property laws.

7. Governing Law & Dispute Jurisdiction
These Terms shall be governed by and construed in accordance with the laws of India. Any legal dispute or claim arising out of your use of the platform shall be subject to the exclusive jurisdiction of the competent courts of India.',
        updatedAt = GETUTCDATE()
    WHERE slug = 'terms';
END
ELSE
BEGIN
    INSERT INTO dbo.CmsPages (slug, title, content, metaDescription)
    VALUES (
        'terms',
        'Terms of Service & User Agreement',
        '1. Acceptance of Terms & Platform Agreement
Welcome to Aakash Spiritual & Astrological Marketplace. By accessing, browsing, or using our mobile-web platform, mobile applications, and real-time consultation services, you agree to be legally bound by these Terms of Service. If you do not agree to any part of these terms, you must discontinue using our services immediately.

2. User Eligibility & Account Responsibility
• Age Requirement: You must be at least 18 years of age to register an account and initiate consultations on Aakash.
• Account Security: You are solely responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.
• Accurate Information: You agree to provide true, accurate, and current information regarding your identity, birth date, time, and birthplace for precise astrological chart calculations.

3. Real-Time Consultations & Wallet Billing Structure
• Server-Authoritative Billing: Live chat and voice/call consultations are billed on a transparent per-minute rate as displayed on each Astrologer’s profile.
• Prepaid Wallet: Consultations are funded via your prepaid in-app wallet balance. The session timer starts strictly when connection is established.
• Promotional Minutes: Any promotional introductory minutes or coupon discounts are applied automatically before standard wallet deductions begin.
• Session Auto-Termination: If your wallet balance reaches zero during an ongoing consultation, the system will provide a courtesy warning and gracefully end the session if additional credits are not added.

4. User Code of Conduct & Respectful Communication
• Zero-Tolerance Policy: We foster a sacred, respectful, and empowering environment. Any use of abusive language, profanity, harassment, hate speech, threats, or sexual misconduct towards astrologers or support staff will result in immediate session termination and permanent account blacklist without refund.
• External Contact Solicitation: Devotees and Astrologers are strictly prohibited from soliciting private off-platform payments, direct personal phone numbers, or external banking details.

5. Astrologer Independence & Spiritual Guidance
Astrologers, Vedic Acharyas, Tarot Readers, and Numerologists listed on Aakash operate as verified independent practitioners. Their advice reflects their authentic interpretations of ancient Vedic traditions and personal spiritual discernment.

6. Intellectual Property Rights
All software, platform architecture, user interfaces, branding, proprietary Vedic calculation algorithms, and content on Aakash are protected by copyright and intellectual property laws.

7. Governing Law & Dispute Jurisdiction
These Terms shall be governed by and construed in accordance with the laws of India. Any legal dispute or claim arising out of your use of the platform shall be subject to the exclusive jurisdiction of the competent courts of India.',
        'Official Terms and Conditions governing user accounts, consultations, wallet transactions, and conduct on Aakash Astrology platform.'
    );
END;

-- 2. Privacy Policy
IF EXISTS (SELECT 1 FROM dbo.CmsPages WHERE slug = 'privacy')
BEGIN
    UPDATE dbo.CmsPages
    SET 
        title = 'Privacy & Data Protection Policy',
        metaDescription = 'Our sacred commitment to keeping your birth records, personal consultations, and payment information 100% confidential and secure.',
        content = '1. Sacred Commitment to Your Spiritual Privacy
At Aakash, we recognize that astrological consultations and personal life queries involve profound trust. We treat your personal data, spiritual inquiries, and birth information with utmost sanctity, confidentiality, and state-of-the-art security.

2. Information We Collect
• Account Identifiers: Full Name, verified Mobile Number, Email Address, and Avatar image.
• Astrological Birth Coordinates: Date of Birth, Exact Time of Birth, City and State of Birth, Gender, and Gotra (required solely for computing precise Vedic Kundalis, planetary Dashas, and executing Temple Sankalp).
• Consultation Logs: Encrypted real-time chat histories, consultation timestamps, and astrologer review notes.
• Transaction Records: Razorpay payment gateway order IDs, recharge timestamps, and wallet invoice ledgers.

3. How We Use & Protect Your Information
• Delivering Precision Vedic Calculations: Generating Vedic birth charts, planetary transits, and matchmaking compatibility.
• Real-time Consultation Facilitation: Enabling seamless, secure chat and audio connections with your chosen Astrologer.
• Delivery of Remedial Orders: Shipping certified gemstones, authentic Rudrakshas, and sanctified Temple Prasad to your home delivery address.
• Service Enhancements: Preventing fraudulent access and ensuring server stability.

4. Absolute Non-Disclosure & Zero Data Selling Policy
• We NEVER sell, lease, rent, or trade your personal birth data, contact details, or consultation transcripts to any third-party advertisers, data aggregators, or external marketing entities.
• Your consultation conversations remain strictly private between you and the expert you chose to consult.

5. Payment Security & Banking Compliance
All monetary transactions, wallet recharges, and purchases are encrypted using 256-bit SSL technology and processed directly via RBI-authorized, PCI-DSS compliant payment gateways (Razorpay). Aakash never stores credit/debit card numbers, CVVs, or Net Banking credentials on its servers.

6. Your Rights & Data Deletion Requests
You have full ownership of your personal data. You can update your profile, export your consultation history, or request complete account deletion at any time via your Customer Dashboard or by writing to privacy@aakashastrology.com.',
        updatedAt = GETUTCDATE()
    WHERE slug = 'privacy';
END
ELSE
BEGIN
    INSERT INTO dbo.CmsPages (slug, title, content, metaDescription)
    VALUES (
        'privacy',
        'Privacy & Data Protection Policy',
        '1. Sacred Commitment to Your Spiritual Privacy
At Aakash, we recognize that astrological consultations and personal life queries involve profound trust. We treat your personal data, spiritual inquiries, and birth information with utmost sanctity, confidentiality, and state-of-the-art security.

2. Information We Collect
• Account Identifiers: Full Name, verified Mobile Number, Email Address, and Avatar image.
• Astrological Birth Coordinates: Date of Birth, Exact Time of Birth, City and State of Birth, Gender, and Gotra (required solely for computing precise Vedic Kundalis, planetary Dashas, and executing Temple Sankalp).
• Consultation Logs: Encrypted real-time chat histories, consultation timestamps, and astrologer review notes.
• Transaction Records: Razorpay payment gateway order IDs, recharge timestamps, and wallet invoice ledgers.

3. How We Use & Protect Your Information
• Delivering Precision Vedic Calculations: Generating Vedic birth charts, planetary transits, and matchmaking compatibility.
• Real-time Consultation Facilitation: Enabling seamless, secure chat and audio connections with your chosen Astrologer.
• Delivery of Remedial Orders: Shipping certified gemstones, authentic Rudrakshas, and sanctified Temple Prasad to your home delivery address.
• Service Enhancements: Preventing fraudulent access and ensuring server stability.

4. Absolute Non-Disclosure & Zero Data Selling Policy
• We NEVER sell, lease, rent, or trade your personal birth data, contact details, or consultation transcripts to any third-party advertisers, data aggregators, or external marketing entities.
• Your consultation conversations remain strictly private between you and the expert you chose to consult.

5. Payment Security & Banking Compliance
All monetary transactions, wallet recharges, and purchases are encrypted using 256-bit SSL technology and processed directly via RBI-authorized, PCI-DSS compliant payment gateways (Razorpay). Aakash never stores credit/debit card numbers, CVVs, or Net Banking credentials on its servers.

6. Your Rights & Data Deletion Requests
You have full ownership of your personal data. You can update your profile, export your consultation history, or request complete account deletion at any time via your Customer Dashboard or by writing to privacy@aakashastrology.com.',
        'Our sacred commitment to keeping your birth records, personal consultations, and payment information 100% confidential and secure.'
    );
END;

-- 3. Refund & Cancellation Policy
IF EXISTS (SELECT 1 FROM dbo.CmsPages WHERE slug = 'refund')
BEGIN
    UPDATE dbo.CmsPages
    SET 
        title = 'Refund & Cancellation Policy',
        metaDescription = 'Clear, fair, and transparent guidelines on wallet refunds, technical disruption reversals, and order cancellations.',
        content = '1. Transparent & Customer-First Refund Philosophy
At Aakash, we strive to deliver an exceptional spiritual consultation experience. We provide a fair, clear, and transparent refund and cancellation policy for our devotees and users.

2. Unused Wallet Balance Refunds
• 48-Hour Guarantee: If you recharged your wallet and have not utilized the deposited funds for any consultation, you are eligible to request a 100% refund of the unspent principal amount within 48 hours of transaction.
• Source Account Reversal: Refunds are credited back to the original funding source (Bank Account, UPI ID, or Credit/Debit Card) via Razorpay within 5–7 business days.
• Non-Refundable Credits: Promotional bonus wallet credits, cashback rewards, and referral vouchers are non-refundable and cannot be converted into cash.

3. Session Disruptions & Technical Failures
• Early Drop Protection: If a live consultation disconnects within the first 2 minutes due to verified technical server errors or network drops, the deducted minutes are automatically credited back to your in-app wallet balance.
• Astrologer No-Show: If an expert fails to respond or accept a scheduled session, 100% of the locked fee will be promptly returned to your active wallet balance.

4. Nature of Completed Consultations
Astrology, Tarot Reading, and Psychic guidance are esoteric, interpretive spiritual services. Once a consultation session is completed in full by an expert without technical disruption, the time consumed is considered rendered and is non-refundable.

5. Temple Puja & Vedic Ritual Bookings
• Consecrated Temple Pujas involve prior temple arrangements, samagri preparation, and Acharya scheduling.
• Cancellations requested at least 24 hours prior to the scheduled puja date are eligible for a 100% wallet credit or refund.
• Once the Sankalp has been solemnly undertaken and Vedic rituals commence, puja bookings cannot be cancelled or refunded.

6. How to Request a Refund or Report an Issue
To raise a refund request or report a technical session disruption, simply navigate to Dashboard > Support Tickets or email support@aakashastrology.com with your registered phone number and Consultation ID within 48 hours.',
        updatedAt = GETUTCDATE()
    WHERE slug = 'refund';
END
ELSE
BEGIN
    INSERT INTO dbo.CmsPages (slug, title, content, metaDescription)
    VALUES (
        'refund',
        'Refund & Cancellation Policy',
        '1. Transparent & Customer-First Refund Philosophy
At Aakash, we strive to deliver an exceptional spiritual consultation experience. We provide a fair, clear, and transparent refund and cancellation policy for our devotees and users.

2. Unused Wallet Balance Refunds
• 48-Hour Guarantee: If you recharged your wallet and have not utilized the deposited funds for any consultation, you are eligible to request a 100% refund of the unspent principal amount within 48 hours of transaction.
• Source Account Reversal: Refunds are credited back to the original funding source (Bank Account, UPI ID, or Credit/Debit Card) via Razorpay within 5–7 business days.
• Non-Refundable Credits: Promotional bonus wallet credits, cashback rewards, and referral vouchers are non-refundable and cannot be converted into cash.

3. Session Disruptions & Technical Failures
• Early Drop Protection: If a live consultation disconnects within the first 2 minutes due to verified technical server errors or network drops, the deducted minutes are automatically credited back to your in-app wallet balance.
• Astrologer No-Show: If an expert fails to respond or accept a scheduled session, 100% of the locked fee will be promptly returned to your active wallet balance.

4. Nature of Completed Consultations
Astrology, Tarot Reading, and Psychic guidance are esoteric, interpretive spiritual services. Once a consultation session is completed in full by an expert without technical disruption, the time consumed is considered rendered and is non-refundable.

5. Temple Puja & Vedic Ritual Bookings
• Consecrated Temple Pujas involve prior temple arrangements, samagri preparation, and Acharya scheduling.
• Cancellations requested at least 24 hours prior to the scheduled puja date are eligible for a 100% wallet credit or refund.
• Once the Sankalp has been solemnly undertaken and Vedic rituals commence, puja bookings cannot be cancelled or refunded.

6. How to Request a Refund or Report an Issue
To raise a refund request or report a technical session disruption, simply navigate to Dashboard > Support Tickets or email support@aakashastrology.com with your registered phone number and Consultation ID within 48 hours.',
        'Clear, fair, and transparent guidelines on wallet refunds, technical disruption reversals, and order cancellations.'
    );
END;

-- 4. Spiritual Disclaimer
IF EXISTS (SELECT 1 FROM dbo.CmsPages WHERE slug = 'disclaimer')
BEGIN
    UPDATE dbo.CmsPages
    SET 
        title = 'Spiritual & Astrological Disclaimer',
        metaDescription = 'Important legal and spiritual disclosures regarding astrological readings, guidance nature, and personal free will.',
        content = '1. Spiritual & Advisory Nature of Consultations
All astrological predictions, Vedic Kundali readings, Tarot interpretations, Numerological reports, and psychic consultations provided on Aakash are intended strictly for spiritual reflection, self-discovery, and personal guidance. They represent ancient esoteric traditions and intuitive philosophical perspectives.

2. Not a Substitute for Professional Legal, Financial, or Medical Counsel
• Medical Advice: Astrological consultations must NEVER be used to diagnose, treat, or manage physical or mental health disorders. Always consult a qualified medical doctor.
• Financial & Investment Advice: Astrological forecasts regarding career or wealth are philosophical reflections and must never replace certified financial planners, tax consultants, or licensed investment brokers.
• Legal Matters: For legal disputes, court proceedings, or contracts, always consult licensed attorneys.

3. Free Will, Human Agency & Personal Decision-Making
We believe wholeheartedly in the supremacy of human free will and conscious action (Karma). Any decisions, choices, investments, or life steps undertaken following an astrological consultation are the sole prerogative and responsibility of the user. Aakash and its registered experts bear no liability for outcomes resulting from your individual life decisions.

4. Prohibition of Unethical Claims & Black Magic
Aakash adheres to strict ethical Vedic standards. We strictly forbid and reject all claims of black magic, fear-mongering, fatalistic curses, or superstitious exploitation. Our mission is exclusively to uplift, enlighten, and provide spiritual peace.

5. Mandatory 18+ Age Requirement
Our services are reserved exclusively for mature individuals aged 18 years and above. By engaging in a consultation, you confirm that you meet the minimum age requirement.',
        updatedAt = GETUTCDATE()
    WHERE slug = 'disclaimer';
END
ELSE
BEGIN
    INSERT INTO dbo.CmsPages (slug, title, content, metaDescription)
    VALUES (
        'disclaimer',
        'Spiritual & Astrological Disclaimer',
        '1. Spiritual & Advisory Nature of Consultations
All astrological predictions, Vedic Kundali readings, Tarot interpretations, Numerological reports, and psychic consultations provided on Aakash are intended strictly for spiritual reflection, self-discovery, and personal guidance. They represent ancient esoteric traditions and intuitive philosophical perspectives.

2. Not a Substitute for Professional Legal, Financial, or Medical Counsel
• Medical Advice: Astrological consultations must NEVER be used to diagnose, treat, or manage physical or mental health disorders. Always consult a qualified medical doctor.
• Financial & Investment Advice: Astrological forecasts regarding career or wealth are philosophical reflections and must never replace certified financial planners, tax consultants, or licensed investment brokers.
• Legal Matters: For legal disputes, court proceedings, or contracts, always consult licensed attorneys.

3. Free Will, Human Agency & Personal Decision-Making
We believe wholeheartedly in the supremacy of human free will and conscious action (Karma). Any decisions, choices, investments, or life steps undertaken following an astrological consultation are the sole prerogative and responsibility of the user. Aakash and its registered experts bear no liability for outcomes resulting from your individual life decisions.

4. Prohibition of Unethical Claims & Black Magic
Aakash adheres to strict ethical Vedic standards. We strictly forbid and reject all claims of black magic, fear-mongering, fatalistic curses, or superstitious exploitation. Our mission is exclusively to uplift, enlighten, and provide spiritual peace.

5. Mandatory 18+ Age Requirement
Our services are reserved exclusively for mature individuals aged 18 years and above. By engaging in a consultation, you confirm that you meet the minimum age requirement.',
        'Important legal and spiritual disclosures regarding astrological readings, guidance nature, and personal free will.'
    );
END;

COMMIT TRANSACTION;
GO

GO

-- ==========================================================================
-- SECTION: 11_expert_weekly_schedules.sql
-- ==========================================================================

-- ==========================================================
-- Migration 11: Expert Weekly Availability & Auto-Schedule System
-- ==========================================================

USE [AstrologyDB];
GO

BEGIN TRANSACTION;

-- 1. Add autoScheduleEnabled and weeklySchedule to ExpertProfiles if not present
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.ExpertProfiles') 
    AND name = 'autoScheduleEnabled'
)
BEGIN
    ALTER TABLE dbo.ExpertProfiles
    ADD autoScheduleEnabled BIT NOT NULL CONSTRAINT DF_ExpertProfiles_AutoSchedule DEFAULT 0;
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.ExpertProfiles') 
    AND name = 'weeklySchedule'
)
BEGIN
    ALTER TABLE dbo.ExpertProfiles
    ADD weeklySchedule NVARCHAR(MAX) NULL;
END;

COMMIT TRANSACTION;
GO

-- 2. Stored Procedure: sp_GetExpertSchedule
CREATE OR ALTER PROCEDURE dbo.sp_GetExpertSchedule
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        ep.id AS expertId,
        ep.userId,
        ep.displayName,
        ep.isOnline,
        ep.approvalStatus,
        ep.autoScheduleEnabled,
        ep.weeklySchedule
    FROM dbo.ExpertProfiles ep
    WHERE ep.userId = @UserId;
END;
GO

-- 3. Stored Procedure: sp_UpdateExpertSchedule
CREATE OR ALTER PROCEDURE dbo.sp_UpdateExpertSchedule
    @UserId INT,
    @AutoScheduleEnabled BIT,
    @WeeklySchedule NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.ExpertProfiles
    SET 
        autoScheduleEnabled = @AutoScheduleEnabled,
        weeklySchedule = @WeeklySchedule,
        updatedAt = SYSUTCDATETIME()
    WHERE userId = @UserId;

    SELECT 
        ep.id AS expertId,
        ep.userId,
        ep.displayName,
        ep.isOnline,
        ep.autoScheduleEnabled,
        ep.weeklySchedule
    FROM dbo.ExpertProfiles ep
    WHERE ep.userId = @UserId;
END;
GO

-- 4. Stored Procedure: sp_GetAllAutoScheduleExperts
CREATE OR ALTER PROCEDURE dbo.sp_GetAllAutoScheduleExperts
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        ep.id AS expertId,
        ep.userId,
        ep.displayName,
        ep.isOnline,
        ep.approvalStatus,
        ep.autoScheduleEnabled,
        ep.weeklySchedule
    FROM dbo.ExpertProfiles ep
    WHERE ep.approvalStatus = 'APPROVED'
      AND ep.autoScheduleEnabled = 1
      AND ep.weeklySchedule IS NOT NULL;
END;
GO

-- 5. Stored Procedure: sp_SetExpertOnlineByProfileId
CREATE OR ALTER PROCEDURE dbo.sp_SetExpertOnlineByProfileId
    @ExpertId INT,
    @IsOnline BIT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.ExpertProfiles
    SET 
        isOnline = @IsOnline,
        updatedAt = SYSUTCDATETIME()
    WHERE id = @ExpertId;

    SELECT id AS expertId, userId, isOnline, autoScheduleEnabled
    FROM dbo.ExpertProfiles
    WHERE id = @ExpertId;
END;
GO

GO

-- ==========================================================================
-- SECTION: 12_update_expert_procedures.sql
-- ==========================================================================

USE [AstrologyDB];
GO

-- Update sp_GetExpertPublicProfile to return weeklySchedule & autoScheduleEnabled
CREATE OR ALTER PROCEDURE dbo.sp_GetExpertPublicProfile
    @ExpertId INT
AS
BEGIN
    SET NOCOUNT ON;
    -- Expert Info
    SELECT 
        ep.id, ep.userId, ep.displayName, ep.screenName, ep.title, ep.bio, ep.experienceYears,
        ep.languages, ep.pricePerMinute, ep.freeMinutes, ep.isOnline, ep.isActive, ep.isChatEnabled,
        ep.rating, ep.totalReviews, ep.totalConsultations, ep.approvalStatus,
        ep.city, ep.state, ep.country, ep.autoScheduleEnabled, ep.weeklySchedule,
        u.avatarUrl
    FROM dbo.ExpertProfiles ep
    JOIN dbo.Users u ON u.id = ep.userId
    WHERE ep.id = @ExpertId AND ep.approvalStatus = 'APPROVED';

    -- Categories
    SELECT c.id, c.name, c.slug
    FROM dbo.Categories c
    JOIN dbo.ExpertCategories ec ON ec.categoryId = c.id
    WHERE ec.expertId = @ExpertId;

    -- Services
    SELECT id, title, description, durationMinutes, price
    FROM dbo.Services
    WHERE expertId = @ExpertId AND isActive = 1;

    -- Recent Reviews
    SELECT TOP 10 r.id, r.rating, r.comment, r.createdAt, u.fullName AS customerName
    FROM dbo.Reviews r
    JOIN dbo.Users u ON u.id = r.customerId
    WHERE r.expertId = @ExpertId AND r.status = 'APPROVED'
    ORDER BY r.createdAt DESC;
END;
GO

-- Update sp_GetApprovedExperts to return weeklySchedule & autoScheduleEnabled
CREATE OR ALTER PROCEDURE dbo.sp_GetApprovedExperts
    @CategorySlug NVARCHAR(100) = NULL,
    @SearchQuery NVARCHAR(150) = NULL,
    @MinPrice DECIMAL(10,2) = NULL,
    @MaxPrice DECIMAL(10,2) = NULL,
    @SortBy NVARCHAR(50) = 'RATING'
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        ep.id, ep.userId, ep.displayName, ep.screenName, ep.title, ep.bio, ep.experienceYears,
        ep.languages, ep.pricePerMinute, ep.freeMinutes, ep.isOnline, ep.isActive, ep.isChatEnabled,
        ep.rating, ep.totalReviews, ep.totalConsultations,
        ep.city, ep.state, ep.country, ep.autoScheduleEnabled, ep.weeklySchedule,
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

GO
