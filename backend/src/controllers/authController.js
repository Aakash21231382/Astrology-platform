const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { executeProcedure } = require('../config/db');
const { sendOtpEmail } = require('../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'astrology_jwt_secret_key_super_secure_2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'astrology_refresh_jwt_secret_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function generateTokens(user) {
    const payload = {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '30d' });

    return { accessToken, refreshToken };
}

function getRedirectRoute(role, approvalStatus) {
    if (role === 'ADMIN') return '/admin/dashboard';
    if (role === 'CUSTOMER') return '/dashboard';
    if (role === 'EXPERT') {
        if (approvalStatus === 'APPROVED') return '/expert/dashboard';
        if (approvalStatus === 'REJECTED') return '/expert/rejected';
        return '/expert/verification-pending';
    }
    return '/';
}

/**
 * Register Customer or Expert
 * POST /api/auth/register
 */
async function register(req, res, next) {
    try {
        const { email, password, role = 'CUSTOMER', fullName, phoneNumber, avatarUrl } = req.body;

        if (!email || !password || !fullName) {
            return res.status(400).json({
                success: false,
                message: 'Email, password, and full name are required.'
            });
        }

        const validRole = role.toUpperCase() === 'EXPERT' ? 'EXPERT' : 'CUSTOMER';
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const result = await executeProcedure('dbo.sp_RegisterUser', {
            Email: email.toLowerCase().trim(),
            PasswordHash: passwordHash,
            Role: validRole,
            FullName: fullName.trim(),
            PhoneNumber: phoneNumber || null,
            AvatarUrl: avatarUrl || null
        });

        const newUser = result.recordset[0];

        // Generate 6-digit OTP for email verification
        const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await bcrypt.hash(rawOtp, 8);

        await executeProcedure('dbo.sp_CreateOtp', {
            Identifier: newUser.email,
            OtpHash: otpHash,
            Purpose: 'REGISTRATION',
            ExpiresMinutes: 5
        });

        // Fire and forget email delivery
        sendOtpEmail(newUser.email, rawOtp, 'Account Registration').catch(console.error);

        const { accessToken, refreshToken } = generateTokens(newUser);
        const redirectRoute = getRedirectRoute(newUser.role, 'PENDING');

        return res.status(201).json({
            success: true,
            message: 'Registration successful. An OTP has been sent to your email.',
            data: {
                user: {
                    id: newUser.id,
                    email: newUser.email,
                    fullName: newUser.fullName,
                    role: newUser.role,
                    status: newUser.status,
                    isEmailVerified: newUser.isEmailVerified,
                    avatarUrl: newUser.avatarUrl
                },
                redirectRoute,
                token: accessToken,
                refreshToken
            }
        });
    } catch (error) {
        if (error.message && error.message.includes('Email already exists')) {
            return res.status(409).json({
                success: false,
                message: 'This email is already registered. Please login.'
            });
        }
        next(error);
    }
}

/**
 * Register Expert with full profile fields
 * POST /api/auth/expert/signup
 */
async function registerExpert(req, res, next) {
    try {
        const {
            email,
            password,
            userName,
            firstName,
            lastName,
            title,
            dob,
            gender,
            address,
            city,
            state,
            country,
            zipCode,
            telephone,
            fax,
            avatarUrl
        } = req.body;

        if (!email || !password || !userName || !firstName) {
            return res.status(400).json({
                success: false,
                message: 'Email, password, username, and first name are required.'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const result = await executeProcedure('dbo.sp_RegisterExpert', {
            Email: email.toLowerCase().trim(),
            PasswordHash: passwordHash,
            UserName: userName.trim(),
            FirstName: firstName.trim(),
            LastName: lastName ? lastName.trim() : '',
            Title: title || null,
            Dob: dob || null,
            Gender: gender || 'Male',
            Address: address || null,
            City: city || null,
            State: state || null,
            Country: country || 'India',
            ZipCode: zipCode || null,
            Telephone: telephone || null,
            Fax: fax || null,
            AvatarUrl: avatarUrl || null
        });

        const newExpert = result.recordset[0];

        // Generate 6-digit OTP for email verification
        const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await bcrypt.hash(rawOtp, 8);

        await executeProcedure('dbo.sp_CreateOtp', {
            Identifier: newExpert.email,
            OtpHash: otpHash,
            Purpose: 'REGISTRATION',
            ExpiresMinutes: 5
        });

        // Fire and forget email delivery
        sendOtpEmail(newExpert.email, rawOtp, 'Expert Registration').catch(console.error);

        const { accessToken, refreshToken } = generateTokens({
            id: newExpert.userId,
            email: newExpert.email,
            role: newExpert.role,
            status: newExpert.status
        });

        return res.status(201).json({
            success: true,
            message: 'Expert registration submitted successfully. Application is pending Admin verification.',
            data: {
                user: newExpert,
                redirectRoute: '/expert/verification-pending',
                token: accessToken,
                refreshToken
            }
        });
    } catch (error) {
        if (error.message && error.message.includes('Email already exists')) {
            return res.status(409).json({
                success: false,
                message: 'This email is already registered. Please login.'
            });
        }
        next(error);
    }
}

/**
 * Login for Customer, Expert, or Admin
 * POST /api/auth/login
 */
async function login(req, res, next) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required.'
            });
        }

        const result = await executeProcedure('dbo.sp_GetUserByEmail', {
            Email: email.toLowerCase().trim()
        });

        const user = result.recordset[0];

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        if (user.status === 'BLOCKED') {
            return res.status(403).json({
                success: false,
                message: 'Your account has been suspended by administration.'
            });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        const { accessToken, refreshToken } = generateTokens(user);
        const redirectRoute = getRedirectRoute(user.role, user.approvalStatus);

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role,
                    status: user.status,
                    isEmailVerified: user.isEmailVerified,
                    avatarUrl: user.avatarUrl,
                    approvalStatus: user.approvalStatus
                },
                redirectRoute,
                token: accessToken,
                refreshToken
            }
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Send OTP
 * POST /api/auth/send-otp
 */
async function sendOtp(req, res, next) {
    try {
        const { email, purpose = 'REGISTRATION' } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required.'
            });
        }

        const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await bcrypt.hash(rawOtp, 8);

        await executeProcedure('dbo.sp_CreateOtp', {
            Identifier: email.toLowerCase().trim(),
            OtpHash: otpHash,
            Purpose: purpose.toUpperCase(),
            ExpiresMinutes: 5
        });

        await sendOtpEmail(email, rawOtp, purpose);

        return res.status(200).json({
            success: true,
            message: 'A 6-digit OTP code has been sent to your email.'
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Verify OTP
 * POST /api/auth/verify-otp
 */
async function verifyOtp(req, res, next) {
    try {
        const { email, otp, purpose = 'REGISTRATION' } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Email and OTP code are required.'
            });
        }

        const result = await executeProcedure('dbo.sp_VerifyOtp', {
            Identifier: email.toLowerCase().trim(),
            Purpose: purpose.toUpperCase()
        });

        const record = result.recordset[0];

        if (!record) {
            return res.status(400).json({
                success: false,
                message: 'No active OTP found. Please request a new one.'
            });
        }

        if (new Date() > new Date(record.expiresAt)) {
            return res.status(400).json({
                success: false,
                message: 'OTP has expired. Please request a new code.'
            });
        }

        if (record.attempts >= 5) {
            return res.status(429).json({
                success: false,
                message: 'Too many failed attempts. Please request a new OTP.'
            });
        }

        const isMatch = await bcrypt.compare(otp.trim(), record.otpHash);

        if (!isMatch) {
            await executeProcedure('dbo.sp_ConsumeOtp', {
                OtpId: record.id,
                Success: 0
            });
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP code. Please try again.'
            });
        }

        // Consume OTP successfully and update email verified
        await executeProcedure('dbo.sp_ConsumeOtp', {
            OtpId: record.id,
            Success: 1
        });

        return res.status(200).json({
            success: true,
            message: 'Email verified successfully.'
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Request Password Reset OTP
 * POST /api/auth/forgot-password
 */
async function forgotPassword(req, res, next) {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Registered email address is required.'
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Check if user exists
        const checkRes = await executeProcedure('dbo.sp_GetUserByEmail', {
            Email: normalizedEmail
        });
        const user = checkRes.recordset[0];
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No account found with this email address.'
            });
        }

        const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await bcrypt.hash(rawOtp, 8);

        await executeProcedure('dbo.sp_CreateOtp', {
            Identifier: normalizedEmail,
            OtpHash: otpHash,
            Purpose: 'PASSWORD_RESET',
            ExpiresMinutes: 10
        });

        await sendOtpEmail(normalizedEmail, rawOtp, 'Password Reset');

        return res.status(200).json({
            success: true,
            message: 'A 6-digit password reset OTP has been sent to your email.'
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Verify OTP and Reset Password
 * POST /api/auth/reset-password
 */
async function resetPassword(req, res, next) {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Email, OTP code, and new password are required.'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long.'
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Verify OTP
        const result = await executeProcedure('dbo.sp_VerifyOtp', {
            Identifier: normalizedEmail,
            Purpose: 'PASSWORD_RESET'
        });

        const record = result.recordset[0];
        if (!record) {
            return res.status(400).json({
                success: false,
                message: 'No active password reset request found. Please request a new code.'
            });
        }

        if (new Date() > new Date(record.expiresAt)) {
            return res.status(400).json({
                success: false,
                message: 'OTP has expired. Please request a new code.'
            });
        }

        const isMatch = await bcrypt.compare(otp.trim(), record.otpHash);
        if (!isMatch) {
            await executeProcedure('dbo.sp_ConsumeOtp', {
                OtpId: record.id,
                Success: 0
            });
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP code. Please try again.'
            });
        }

        // Consume OTP
        await executeProcedure('dbo.sp_ConsumeOtp', {
            OtpId: record.id,
            Success: 1
        });

        // Hash new password
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // Update password in DB
        await executeProcedure('dbo.sp_ResetUserPassword', {
            Email: normalizedEmail,
            PasswordHash: passwordHash
        });

        return res.status(200).json({
            success: true,
            message: 'Your password has been reset successfully! You can now log in.'
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Change Password (for authenticated users & experts)
 * POST /api/auth/change-password
 */
async function changePassword(req, res, next) {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required.'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters long.'
            });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({
                success: false,
                message: 'New password cannot be the same as your current password.'
            });
        }

        // Fetch user from DB to verify current password
        const userRes = await executeProcedure('dbo.sp_GetUserByEmail', {
            Email: req.user.email
        });

        const user = userRes.recordset[0];
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User account not found.'
            });
        }

        // Verify current password hash
        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect. Please try again.'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        // Update password in database
        await executeProcedure('dbo.sp_ResetUserPassword', {
            Email: user.email,
            PasswordHash: newPasswordHash
        });

        return res.status(200).json({
            success: true,
            message: 'Password changed successfully!'
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    register,
    registerExpert,
    login,
    sendOtp,
    verifyOtp,
    forgotPassword,
    resetPassword,
    changePassword
};
