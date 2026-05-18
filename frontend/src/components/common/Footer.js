// frontend/src/components/common/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8 font-inter">
      <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="space-y-4">
          <h3 className="text-2xl font-black text-white italic">QuickCourt</h3>
          <p className="text-gray-400 font-medium">Your premier platform for booking sports venues and connecting with fellow athletes.</p>
        </div>

        <div className="space-y-4">
          <h4 className="text-lg font-bold">Quick Links</h4>
          <ul className="space-y-2 text-gray-400">
            <li><Link to="/venues" className="hover:text-primary transition-colors">Find Venues</Link></li>
            <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
            <li><Link to="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
            <li><Link to="/help" className="hover:text-primary transition-colors">Help Center</Link></li>
          </ul>
        </div>

        <div className="space-y-4">
          <h4 className="text-lg font-bold">For Business</h4>
          <ul className="space-y-2 text-gray-400">
            <li><Link to="/signup" className="hover:text-primary transition-colors">List Your Venue</Link></li>
            <li><Link to="/partner" className="hover:text-primary transition-colors">Become a Partner</Link></li>
            <li><Link to="/business" className="hover:text-primary transition-colors">Business Solutions</Link></li>
          </ul>
        </div>

        <div className="space-y-4">
          <h4 className="text-lg font-bold">Support</h4>
          <ul className="space-y-2 text-gray-400">
            <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
            <li><Link to="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
          </ul>
        </div>
      </div>

      <div className="mt-16 pt-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 md:px-12 text-center text-gray-500 font-medium">
          <p>&copy; {new Date().getFullYear()} QuickCourt. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;