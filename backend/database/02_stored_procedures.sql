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
