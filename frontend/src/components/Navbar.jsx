import React, { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sprout, ShoppingCart, User, ChevronDown, Sliders } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { CartContext } from '../context/CartContext';
import './Navbar.css';

export const Navbar = () => {
  const { currentUser, setCurrentUser } = useContext(AppContext);
  const { cartCount } = useContext(CartContext);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleRoleChange = (role) => {
    let name = 'Sarah Jenkins';
    let email = 'sarah@example.com';
    let id = 'cust-1';

    if (role === 'farmer') {
      name = 'Green Valley Farms';
      email = 'farmer@greenvalley.com';
      id = 'farm-1';
    } else if (role === 'admin') {
      name = 'Admin Console';
      email = 'admin@farmfresh.com';
      id = 'admin-1';
    }

    setCurrentUser({ id, name, email, role });
    setDropdownOpen(false);
    
    // Redirect to appropriate landing pages on switch
    if (role === 'customer') navigate('/');
    if (role === 'farmer') navigate('/farmer');
    if (role === 'admin') navigate('/admin');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active-link' : '';
  };

  return (
    <nav className="navbar" id="farmfresh-navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <Sprout size={28} className="logo-icon" />
          <span className="logo-text">Farm<span>Fresh</span></span>
        </Link>

        {/* Navigation Links based on role */}
        <div className="navbar-links">
          {currentUser.role === 'customer' && (
            <>
              <Link to="/" className={`nav-link ${isActive('/')}`}>Home</Link>
              <Link to="/products" className={`nav-link ${isActive('/products')}`}>Shop Products</Link>
              <Link to="/orders" className={`nav-link ${isActive('/orders')}`}>My Orders</Link>
            </>
          )}

          {currentUser.role === 'farmer' && (
            <>
              <Link to="/farmer" className={`nav-link ${isActive('/farmer')}`}>Dashboard</Link>
              <Link to="/farmer/products" className={`nav-link ${isActive('/farmer/products')}`}>Manage Inventory</Link>
              <Link to="/farmer/orders" className={`nav-link ${isActive('/farmer/orders')}`}>Orders Received</Link>
            </>
          )}

          {currentUser.role === 'admin' && (
            <>
              <Link to="/admin" className={`nav-link ${isActive('/admin')}`}>Admin Hub</Link>
            </>
          )}
        </div>

        {/* User Role Switcher and Actions */}
        <div className="navbar-actions">
          {/* Quick Role Indicator & Switcher */}
          <div className="role-switcher-container">
            <button 
              className="role-badge-btn" 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              id="role-switch-trigger"
            >
              <Sliders size={16} className="role-icon-badge" />
              <span className="role-name">{currentUser.role.toUpperCase()} View</span>
              <ChevronDown size={14} />
            </button>

            {dropdownOpen && (
              <div className="role-dropdown">
                <div className="dropdown-header">Switch User View</div>
                <button 
                  onClick={() => handleRoleChange('customer')}
                  className={`dropdown-item ${currentUser.role === 'customer' ? 'active' : ''}`}
                >
                  Customer View
                </button>
                <button 
                  onClick={() => handleRoleChange('farmer')}
                  className={`dropdown-item ${currentUser.role === 'farmer' ? 'active' : ''}`}
                >
                  Farmer View
                </button>
                <button 
                  onClick={() => handleRoleChange('admin')}
                  className={`dropdown-item ${currentUser.role === 'admin' ? 'active' : ''}`}
                >
                  Admin View
                </button>
              </div>
            )}
          </div>

          {/* Cart Icon (Customer Only) */}
          {currentUser.role === 'customer' && (
            <Link to="/cart" className="cart-nav-btn" id="cart-nav-link">
              <ShoppingCart size={22} />
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>
          )}

          {/* Profile Sign-in Mock Indicator */}
          <div className="user-profile-badge">
            <div className="avatar-circle">
              <User size={18} />
            </div>
            <div className="profile-details-nav">
              <span className="profile-name-nav">{currentUser.name}</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
