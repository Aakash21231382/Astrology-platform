import React from 'react';
import { Link } from 'react-router-dom';
import { 
  IoShieldCheckmarkOutline, 
  IoSparkles, 
  IoLockClosedOutline,
  IoLogoInstagram, 
  IoLogoFacebook, 
  IoLogoYoutube, 
  IoLogoWhatsapp,
  IoWalletOutline,
  IoCheckmarkCircle
} from 'react-icons/io5';
import '../assets/css/footer.css';

export default function Footer() {
  return (
    <footer className="astro-footer">
      <div className="astro-container">
        <div className="footer-grid">
          {/* Brand & Logo Column */}
          <div className="footer-brand">
            <Link to="/" className="footer-logo-link" title="Aakash">
              <span className="footer-brand-text">Aakash</span>
            </Link>
            
            <p className="footer-brand-desc">
              India's premier verified spiritual and psychic sanctuary connecting seekers with authentic Vedic astrologers, master clairvoyants, tarot visionaries, and numerologists worldwide.
            </p>

            <div className="footer-trust-badges">
              <div className="footer-trust-item">
                <IoShieldCheckmarkOutline style={{ fontSize: '17px' }} />
                <span>100% Confidential & Private Sessions</span>
              </div>
              <div className="footer-trust-item gold">
                <IoSparkles style={{ fontSize: '17px' }} />
                <span>500+ Rigorously Screened Astrologers</span>
              </div>
            </div>

            <div className="footer-social-links">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="footer-social-btn" aria-label="Instagram">
                <IoLogoInstagram />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="footer-social-btn" aria-label="Facebook">
                <IoLogoFacebook />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="footer-social-btn" aria-label="YouTube">
                <IoLogoYoutube />
              </a>
              <a href="https://whatsapp.com" target="_blank" rel="noopener noreferrer" className="footer-social-btn" aria-label="WhatsApp">
                <IoLogoWhatsapp />
              </a>
            </div>
          </div>

          {/* Column 1: Quick Navigation */}
          <div className="footer-col">
            <h4>Explore</h4>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/experts">Find Astrologers</Link></li>
              <li><Link to="/shop">Astro Remedies Store</Link></li>
              <li><Link to="/puja">Temple Puja Booking</Link></li>
              <li><Link to="/categories">Spiritual Categories</Link></li>
              <li><Link to="/offers">Special Offers</Link></li>
              <li><Link to="/how-it-works">How It Works</Link></li>
              <li><Link to="/faq">Frequently Asked Questions</Link></li>
            </ul>
          </div>


          {/* Column 2: Astrologer / Readers Portal */}
          <div className="footer-col">
            <h4>For Readers</h4>
            <ul className="footer-links">
              <li><Link to="/expert/signup">Join as Astrologer</Link></li>
              <li><Link to="/login">Reader Portal Login</Link></li>
              <li><Link to="/terms">Code of Ethics</Link></li>
              <li><Link to="/about">About Our Sanctuary</Link></li>
            </ul>
          </div>

          {/* Column 3: Trust & Legal Policies */}
          <div className="footer-col">
            <h4>Trust & Legal</h4>
            <ul className="footer-links">
              <li><Link to="/terms">Terms & Conditions</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/refund">Refund Policy</Link></li>
              <li><Link to="/disclaimer">Spiritual Disclaimer</Link></li>
              <li><Link to="/about">About Us</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-divider" />

        {/* Footer Bottom Bar */}
        <div className="footer-bottom">
          <div className="footer-bottom-copy">
            © {new Date().getFullYear()} <strong>Aakash</strong>. All Rights Reserved.
          </div>

          <div className="footer-bottom-features">
            <span className="footer-feature-chip">
              <IoLockClosedOutline /> 256-Bit SSL Encrypted
            </span>
            <span className="footer-feature-chip">
              <IoWalletOutline /> Instant Razorpay Wallet
            </span>
            <span className="footer-feature-chip">
              <IoCheckmarkCircle /> Verified Masters
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
