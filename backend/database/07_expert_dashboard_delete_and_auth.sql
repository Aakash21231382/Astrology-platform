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
