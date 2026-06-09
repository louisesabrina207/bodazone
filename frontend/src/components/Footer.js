import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-r from-blue-800 to-blue-900 text-blue-100 mt-12">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* About Section */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-yellow-400 text-2xl">⚡</span> About BodaZone
            </h3>
            <p className="text-sm leading-relaxed mb-4">
              BodaZone is Kenya's leading e-commerce platform for motorbike spare parts. We connect sellers with customers looking for quality products and fast delivery.
            </p>
            <div className="flex gap-3">
              <a href="https://facebook.com/bodazone" target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-yellow-400 transition">
                <FaFacebook size={20} />
              </a>
              <a href="https://twitter.com/bodazone" target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-yellow-400 transition">
                <FaTwitter size={20} />
              </a>
              <a href="https://instagram.com/bodazone" target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-yellow-400 transition">
                <FaInstagram size={20} />
              </a>
              <a href="https://linkedin.com/company/bodazone" target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-yellow-400 transition">
                <FaLinkedin size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/discover" className="text-blue-300 hover:text-yellow-400 transition">
                  Discover Products
                </Link>
              </li>
              <li>
                <Link to="/shops" className="text-blue-300 hover:text-yellow-400 transition">
                  Browse Shops
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-blue-300 hover:text-yellow-400 transition">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/" className="text-blue-300 hover:text-yellow-400 transition">
                  Home
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Support */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">Support</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <FaPhone className="text-yellow-400" />
                <a href="tel:+254712345678" className="text-blue-300 hover:text-yellow-400 transition">
                  +254 798 668 162
                </a>
              </li>
              <li className="flex items-center gap-2">
                <FaEnvelope className="text-yellow-400" />
                <a href="mailto:support@bodazone.com" className="text-blue-300 hover:text-yellow-400 transition">
                  support@bodazone.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <FaMapMarkerAlt className="text-yellow-400 mt-1" />
                <span>Nairobi, Kenya</span>
              </li>
            </ul>
          </div>

          {/* For Sellers */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">For Sellers</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/register?role=seller" className="text-blue-300 hover:text-yellow-400 transition">
                  Start Selling
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-blue-300 hover:text-yellow-400 transition">
                  Seller Login
                </Link>
              </li>
              <li>
                <a href="mailto:bodazone.info@gmail.com" className="text-blue-300 hover:text-yellow-400 transition">
                  Seller Support
                </a>
              </li>
            </ul>
          </div>
        </div>
     
        {/* Bottom Footer */}
        <div className="border-t border-blue-700 pt-8 flex flex-col md:flex-row justify-between items-center text-sm">
          <p className="text-blue-200">
            &copy; {currentYear} BodaZone. All rights reserved. | Building the future of motorbike commerce in Kenya
          </p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <span className="text-blue-300">M-Pesa Payments Accepted</span>
          </div>
        </div>
      </div>

      {/* Top Footer Bar - Payment Methods */}
      <div className="bg-blue-950 border-t border-blue-700 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-blue-300">
          <p>Secure payments via M-Pesa  | Fast delivery across Kenya | Verified sellers</p>
        </div> 
      </div>
    </footer>
  );
};

export default Footer;
