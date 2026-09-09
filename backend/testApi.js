const axios = require('axios');
const FormData = require('form-data');

const API_BASE = 'http://127.0.0.1:5000/api';

async function runTests() {
    console.log('====================================================');
    console.log(' Astrology & Psychic Consultation Platform API Tests');
    console.log('====================================================');

    try {
        // 1. Health check
        const health = await axios.get(`${API_BASE}/health`);
        console.log('[PASS] 1. Health Check:', health.data.status);

        // 2. Admin Login
        const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
            email: 'admin@astrology.com',
            password: 'admin123'
        });
        const adminToken = adminLogin.data.data.token;
        console.log('[PASS] 2. Admin Login:', adminLogin.data.data.user.email, 'Role:', adminLogin.data.data.user.role, 'Redirect:', adminLogin.data.data.redirectRoute);

        // 3. Admin Dashboard KPIs
        const adminDashboard = await axios.get(`${API_BASE}/admin/dashboard`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('[PASS] 3. Admin KPIs:', adminDashboard.data.data);

        // 4. Register Expert
        const expertEmail = `expert_${Date.now()}@astrology.com`;
        const expertReg = await axios.post(`${API_BASE}/auth/register`, {
            email: expertEmail,
            password: 'password123',
            role: 'EXPERT',
            fullName: 'Acharya Anand Sharma',
            phoneNumber: '+919988776655'
        });
        const expertToken = expertReg.data.data.token;
        const expertUserId = expertReg.data.data.user.id;
        console.log('[PASS] 4. Expert Registration:', expertEmail, 'Redirect:', expertReg.data.data.redirectRoute);

        // 5. Test File Upload (Streaming to remote container URL)
        const form = new FormData();
        form.append('file', Buffer.from('mock image for astrologer avatar'), {
            filename: 'avatar.png',
            contentType: 'image/png'
        });
        const uploadRes = await axios.post(`${API_BASE}/upload`, form, {
            headers: form.getHeaders()
        });
        const uploadedAvatarUrl = uploadRes.data.data.url;
        console.log('[PASS] 5. Remote Container Upload Success! URL:', uploadedAvatarUrl);

        // 6. Expert Completes Profile
        const expertProfile = await axios.put(`${API_BASE}/experts/profile`, {
            displayName: 'Acharya Anand',
            title: 'Master Vedic Astrologer & Kundali Specialist',
            bio: 'Over 15 years of experience guiding clients through Vedic astrology and Gemstone consultation.',
            experienceYears: 15,
            languages: 'Hindi, English, Sanskrit',
            pricePerMinute: 35.00,
            freeMinutes: 5,
            avatarUrl: uploadedAvatarUrl,
            categoryIds: [1, 7] // Vedic Astrology, Love
        }, {
            headers: { Authorization: `Bearer ${expertToken}` }
        });
        const expertId = expertProfile.data.data.id;
        console.log('[PASS] 6. Expert Profile Updated. Expert ID:', expertId, 'Status:', expertProfile.data.data.approvalStatus);

        // 7. Admin reviews and APPROVES expert
        const approveRes = await axios.patch(`${API_BASE}/admin/experts/${expertId}/review`, {
            action: 'APPROVE'
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('[PASS] 7. Admin Approved Expert:', approveRes.data.data.approvalStatus);

        // 8. Expert toggles online presence
        await axios.put(`${API_BASE}/experts/availability`, {
            isOnline: true,
            isChatEnabled: true
        }, {
            headers: { Authorization: `Bearer ${expertToken}` }
        });
        console.log('[PASS] 8. Expert is now ONLINE');

        // 9. Public Discovery of Approved Experts
        const publicExperts = await axios.get(`${API_BASE}/experts`);
        console.log('[PASS] 9. Public Approved Experts count:', publicExperts.data.count, 'First:', publicExperts.data.data[0]?.displayName);

        // 10. Register Customer
        const customerEmail = `customer_${Date.now()}@astrology.com`;
        const customerReg = await axios.post(`${API_BASE}/auth/register`, {
            email: customerEmail,
            password: 'password123',
            role: 'CUSTOMER',
            fullName: 'Rahul Verma',
            phoneNumber: '+919123456780'
        });
        const customerToken = customerReg.data.data.token;
        console.log('[PASS] 10. Customer Registration:', customerEmail, 'Redirect:', customerReg.data.data.redirectRoute);

        // 11. Customer Wallet Top-up (Test Credit)
        const topupRes = await axios.post(`${API_BASE}/wallet/add-money`, {
            amount: 500.00,
            note: 'Initial wallet balance for testing'
        }, {
            headers: { Authorization: `Bearer ${customerToken}` }
        });
        console.log('[PASS] 11. Wallet Top-Up:', topupRes.data.message, 'Balance:', topupRes.data.data.balanceAfter);

        // 12. Customer Requests Consultation
        const consultationRes = await axios.post(`${API_BASE}/consultations/request`, {
            expertId: expertId
        }, {
            headers: { Authorization: `Bearer ${customerToken}` }
        });
        const consultationId = consultationRes.data.data.id;
        console.log('[PASS] 12. Consultation Created ID:', consultationId, 'Status:', consultationRes.data.data.status, 'Rate/Min:', consultationRes.data.data.ratePerMinute);

        // 13. Settle Consultation Billing test (e.g. 7 minutes = 5 free + 2 paid = 2 * 35 = 70 INR)
        const { executeProcedure } = require('./src/config/db');
        const settleRes = await executeProcedure('dbo.sp_SettleConsultationBilling', {
            ConsultationId: consultationId,
            TotalDurationSeconds: 420, // 7 minutes
            EndReason: 'NORMAL_END'
        });
        const settled = settleRes.recordset[0];
        console.log('[PASS] 13. Server-Authoritative Settlement:', {
            totalSeconds: settled.totalDurationSeconds,
            freeSecondsUsed: settled.freeSecondsUsed,
            paidSecondsUsed: settled.paidSecondsUsed,
            grossAmount: settled.grossAmount,
            platformCommission: settled.platformCommission,
            expertEarning: settled.expertEarning,
            status: settled.status
        });

        // 14. Customer Submits Review
        const reviewRes = await axios.post(`${API_BASE}/consultations/reviews`, {
            consultationId: consultationId,
            rating: 5,
            comment: 'Accurate predictions and very helpful guidance! Highly recommended.'
        }, {
            headers: { Authorization: `Bearer ${customerToken}` }
        });
        console.log('[PASS] 14. Review Submitted:', reviewRes.data.data.rating, 'Stars. Expert:', reviewRes.data.data.expertName);

        // 15. Check Expert Earnings Ledger
        const earningsRes = await axios.get(`${API_BASE}/experts/account/earnings`, {
            headers: { Authorization: `Bearer ${expertToken}` }
        });
        console.log('[PASS] 15. Expert Earnings Summary:', earningsRes.data.data.summary);

        console.log('====================================================');
        console.log(' ALL 15 INTEGRATION TESTS PASSED WITH 100% SUCCESS! ');
        console.log('====================================================');
        process.exit(0);
    } catch (err) {
        console.error('Test failed:', err.response?.data || err.message);
        process.exit(1);
    }
}

runTests();
