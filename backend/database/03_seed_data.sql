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

-- 3. Default Banners
IF NOT EXISTS (SELECT 1 FROM dbo.Banners WHERE title LIKE 'Connect with Verified Astrologers%')
BEGIN
    INSERT INTO dbo.Banners (title, subtitle, imageUrl, ctaText, ctaUrl, targetPlacement, isActive, sortOrder)
    VALUES 
    (
        'Connect with Verified Astrologers & Psychics 24/7',
        'Instant answers for Love, Career & Life via Private Live Chat. First 5 Minutes Free!',
        'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1400&q=80',
        'Consult Now',
        '/experts',
        'HOMEPAGE',
        1,
        1
    ),
    (
        '100% Confidential Live Spiritual Guidance',
        'Get clarity from India''s most trusted psychics, tarot masters and Vedic astrologers.',
        'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1400&q=80',
        'Explore Categories',
        '/categories',
        'HOMEPAGE',
        1,
        2
    );
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
