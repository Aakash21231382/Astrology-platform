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
