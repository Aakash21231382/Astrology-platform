const axios = require('axios');

const API = 'http://127.0.0.1:5000/api';

async function testExpertFlow() {
    console.log('====================================================');
    console.log(' Testing Full Expert Signup & Active/Inactive Rules');
    console.log('====================================================');

    try {
        // 1. Expert Signup with all fields from the image
        const timestamp = Date.now();
        const expertData = {
            email: `sharma_astrologer_${timestamp}@astrology.com`,
            password: 'SecurePassword123!',
            userName: 'AcharyaSharma',
            firstName: 'Aakash',
            lastName: 'Sharma',
            title: 'Celebrity Vedic Astrologer & Tarot Master',
            dob: '12/15/1988',
            gender: 'Male',
            address: '42 Cosmic Divine Avenue, Near Temple',
            city: 'New Delhi',
            state: 'Delhi',
            country: 'India',
            zipCode: '110001',
            telephone: '+91 9876543299',
            fax: '+91 11 23456789',
            avatarUrl: 'https://host0008-001-site1.qtempurl.com/File_container/096d4edb-bc94-433e-b714-fb8dd7486f92.png'
        };

        const signupRes = await axios.post(`${API}/auth/expert/signup`, expertData);
        console.log('[PASS] 1. Expert Signup Successful:');
        console.log('       Email:', signupRes.data.data.user.email);
        console.log('       ScreenName:', signupRes.data.data.user.screenName);
        console.log('       ApprovalStatus:', signupRes.data.data.user.approvalStatus);
        console.log('       isOnline:', signupRes.data.data.user.isOnline, '(Offline on signup)');
        console.log('       isActive:', signupRes.data.data.user.isActive);

        const expertToken = signupRes.data.data.token;
        const expertId = signupRes.data.data.user.expertProfileId;

        // 2. Customer attempts consultation before admin approval -> must fail
        const customerSignup = await axios.post(`${API}/auth/register`, {
            email: `customer_flow_${timestamp}@astrology.com`,
            password: 'CustomerPass123',
            role: 'CUSTOMER',
            fullName: 'Rajesh Malhotra'
        });
        const customerToken = customerSignup.data.data.token;

        // Top-up customer wallet
        await axios.post(`${API}/wallet/add-money`, { amount: 500 }, {
            headers: { Authorization: `Bearer ${customerToken}` }
        });

        try {
            await axios.post(`${API}/consultations/request`, { expertId }, {
                headers: { Authorization: `Bearer ${customerToken}` }
            });
            console.error('[FAIL] Consultation should have failed for unapproved expert!');
            process.exit(1);
        } catch (err) {
            console.log('[PASS] 2. Blocked Unapproved Expert Consultation:', err.response?.data?.message);
        }

        // 3. Admin logs in and APPROVES expert
        const adminLogin = await axios.post(`${API}/auth/login`, {
            email: 'admin@astrology.com',
            password: 'admin123'
        });
        const adminToken = adminLogin.data.data.token;

        await axios.patch(`${API}/admin/experts/${expertId}/review`, {
            action: 'APPROVE'
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('[PASS] 3. Admin successfully APPROVED the expert.');

        // 4. Expert is approved but INACTIVE / OFFLINE (isOnline = 0)
        // Customer attempts to start chat / consultation -> must be strictly blocked!
        try {
            await axios.post(`${API}/consultations/request`, { expertId }, {
                headers: { Authorization: `Bearer ${customerToken}` }
            });
            console.error('[FAIL] Consultation should have been blocked for OFFLINE/INACTIVE expert!');
            process.exit(1);
        } catch (err) {
            console.log('[PASS] 4. Blocked Inactive/Offline Expert Consultation:', err.response?.data?.message);
        }

        // Check public profile canConsult flag
        const pubProfile = await axios.get(`${API}/experts/${expertId}`);
        console.log('[PASS] 5. Public Profile Status: isOnline =', pubProfile.data.data.isOnline, '| canConsult =', pubProfile.data.data.canConsult);

        // 6. Expert goes ACTIVE & ONLINE (toggles availability)
        await axios.put(`${API}/experts/availability`, {
            isOnline: true,
            isActive: true
        }, {
            headers: { Authorization: `Bearer ${expertToken}` }
        });
        console.log('[PASS] 6. Expert toggled ONLINE & ACTIVE.');

        const activeProfile = await axios.get(`${API}/experts/${expertId}`);
        console.log('[PASS] 7. Public Profile Updated: isOnline =', activeProfile.data.data.isOnline, '| canConsult =', activeProfile.data.data.canConsult);

        // 8. Now Customer can initiate consultation & pay!
        const consultRes = await axios.post(`${API}/consultations/request`, { expertId }, {
            headers: { Authorization: `Bearer ${customerToken}` }
        });
        console.log('[PASS] 8. Consultation initiated successfully! Session ID:', consultRes.data.data.id, 'Status:', consultRes.data.data.status);

        // 9. Expert toggles back to INACTIVE / OFFLINE
        await axios.put(`${API}/experts/availability`, {
            isOnline: false
        }, {
            headers: { Authorization: `Bearer ${expertToken}` }
        });
        console.log('[PASS] 9. Expert went OFFLINE / INACTIVE.');

        try {
            await axios.post(`${API}/consultations/request`, { expertId }, {
                headers: { Authorization: `Bearer ${customerToken}` }
            });
            console.error('[FAIL] Consultation should have been blocked after expert went offline!');
            process.exit(1);
        } catch (err) {
            console.log('[PASS] 10. Again blocked consultation after expert went offline:', err.response?.data?.message);
        }

        console.log('====================================================');
        console.log(' ALL SIGNUP & ACTIVE/INACTIVE VALIDATIONS PASSED!   ');
        console.log('====================================================');
        process.exit(0);
    } catch (error) {
        console.error('Test error:', error.response?.data || error.message);
        process.exit(1);
    }
}

testExpertFlow();
