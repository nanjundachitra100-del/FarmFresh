import React from 'react';
import { Sprout, Mail, Phone, MapPin, Heart } from 'lucide-react';
import './Footer.css';

export const Footer = () => {
  return (
    <footer className="footer" id="farmfresh-footer">
      <div className="footer-container">
        <div className="footer-brand">
          <div className="footer-logo">
            <Sprout size={24} className="logo-icon-footer" />
            <span className="logo-text-footer">Farm<span>Fresh</span></span>
          </div>
          <p className="brand-description">
            Connecting local growers directly with conscious consumers. Discover organic, farm-fresh produce and support sustainable agriculture in your community.
          </p>
        </div>

        <div className="footer-links-group">
          <div className="footer-column">
            <h4>For Customers</h4>
            <ul>
              <li><a href="/products">Browse Catalog</a></li>
              <li><a href="/cart">Shopping Cart</a></li>
              <li><a href="/orders">Track My Order</a></li>
              <li><a href="/#faq">FAQs</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>For Farmers</h4>
            <ul>
              <li><a href="/farmer">Farmer Hub</a></li>
              <li><a href="/farmer/products">Manage Catalog</a></li>
              <li><a href="/farmer/orders">Order Desk</a></li>
              <li><a href="/#grower-guidelines">Grower Guidelines</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>Contact & Support</h4>
            <ul className="contact-list">
              <li>
                <MapPin size={16} />
                <span>100 Green Pasture Way, Suite 400</span>
              </li>
              <li>
                <Phone size={16} />
                <span>+1 (800) 555-FARM</span>
              </li>
              <li>
                <Mail size={16} />
                <span>support@farmfresh.com</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-container">
          <p className="copyright">
            &copy; {new Date().getFullYear()} FarmFresh Inc. All rights reserved.
          </p>
          <p className="made-with">
            Made with <Heart size={14} className="heart-icon" /> for Sustainable Farming
          </p>
        </div>
      </div>
    </footer>
  );
};
