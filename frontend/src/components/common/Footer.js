// frontend/src/components/common/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>QuickCourt</h3>
          <p>Your premier platform for booking sports venues and connecting with fellow athletes.</p>
        </div>

        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><Link to="/venues">Find Venues</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            <li><Link to="/help">Help Center</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>For Business</h4>
          <ul>
            <li><Link to="/signup">List Your Venue</Link></li>
            <li><Link to="/partner">Become a Partner</Link></li>
            <li><Link to="/business">Business Solutions</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Support</h4>
          <ul>
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/terms">Terms of Service</Link></li>
            <li><Link to="/faq">FAQ</Link></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-container">
          <p>&copy; 2025 QuickCourt. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;