const nodemailer = require('nodemailer');

let transporter = null;

if (process.env.MAIL_USER && process.env.MAIL_APP_PASSWORD) {
    transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.MAIL_PORT || '587', 10),
        secure: process.env.MAIL_PORT === '465',
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_APP_PASSWORD
        }
    });
}

/**
 * Send an OTP email to the user
 * @param {string} toEmail 
 * @param {string} otp 
 * @param {string} purpose 
 */
async function sendOtpEmail(toEmail, otp, purpose = 'Verification') {
    const subject = `Your ${purpose} Code: ${otp}`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #6d28d9; text-align: center;">Astrology & Psychic Consultation</h2>
            <p>Hello,</p>
            <p>Your one-time verification code for <strong>${purpose}</strong> is:</p>
            <div style="background-color: #f3e8ff; padding: 15px; font-size: 28px; font-weight: bold; letter-spacing: 5px; text-align: center; color: #581c87; border-radius: 6px; margin: 20px 0;">
                ${otp}
            </div>
            <p style="color: #666; font-size: 14px;">This code will expire in 5 minutes. If you did not request this, please ignore this email.</p>
        </div>
    `;

    console.log(`[EmailService] OTP for [${toEmail}] (${purpose}): >>> ${otp} <<<`);

    if (transporter) {
        try {
            await transporter.sendMail({
                from: process.env.MAIL_FROM || '"Astrology Platform" <noreply@astrology.com>',
                to: toEmail,
                subject,
                html
            });
            console.log(`[EmailService] Successfully delivered email to ${toEmail}`);
        } catch (error) {
            console.error('[EmailService] Failed to send email via SMTP:', error.message);
        }
    }
    return true;
}

/**
 * Send Email Notification to Expert when a customer starts live chat
 * @param {string} toEmail 
 * @param {string} expertName 
 * @param {string} customerName 
 * @param {number|string} consultationId 
 */
async function sendNewChatNotificationEmail(toEmail, expertName, customerName, consultationId) {
    const appUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const roomUrl = `${appUrl}/consultation/${consultationId}`;
    const subject = `⚡ New Live Consultation Request from ${customerName || 'A Seeker'}!`;
    const html = `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="background: #041639; padding: 16px 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
                <h2 style="color: #ffd700; margin: 0; font-size: 20px; letter-spacing: 0.5px;">Aakash Psychics & Astrology</h2>
                <p style="color: #e2e8f0; margin: 4px 0 0 0; font-size: 12px;">Live Consultation Alert</p>
            </div>
            <p style="font-size: 15px; color: #1e293b;">Dear <strong>${expertName || 'Expert'}</strong>,</p>
            <p style="font-size: 14px; color: #475569; line-height: 1.6;">
                A seeker (<strong>${customerName || 'A Customer'}</strong>) has just requested and started a live consultation chat session with you on the platform!
            </p>
            <div style="background: #f8fafc; border-left: 4px solid #f59e0b; padding: 14px 18px; margin: 20px 0; border-radius: 4px;">
                <div style="font-size: 13px; color: #64748b;">Consultation Session ID:</div>
                <div style="font-size: 18px; font-weight: 700; color: #0f172a;">#${consultationId}</div>
            </div>
            <div style="text-align: center; margin: 28px 0;">
                <a href="${roomUrl}" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 30px; display: inline-block; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4);">
                    ⚡ Join Live Chat Room Now
                </a>
            </div>
            <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
                Please join promptly to connect with your client. If the button doesn't work, copy this link into your browser:<br/>
                <a href="${roomUrl}" style="color: #6366f1; word-break: break-all;">${roomUrl}</a>
            </p>
        </div>
    `;

    console.log(`[EmailService] Live Chat notification for expert [${toEmail}] from [${customerName}] (Consultation #${consultationId})`);

    if (transporter) {
        try {
            await transporter.sendMail({
                from: process.env.MAIL_FROM || '" Psychics Alert" <noreply@astrology.com>',
                to: toEmail,
                subject,
                html
            });
            console.log(`[EmailService] Chat notification delivered to expert ${toEmail}`);
        } catch (error) {
            console.error('[EmailService] Failed to send chat notification email via SMTP:', error.message);
        }
    }
    return true;
}

module.exports = {
    sendOtpEmail,
    sendNewChatNotificationEmail
};
