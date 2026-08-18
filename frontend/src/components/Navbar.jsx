import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sprout, ShoppingCart, User, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AppContext } from '../context/AppContext';
import { CartContext } from '../context/CartContext';
import './Navbar.css';

export const Navbar = () => {
  const { currentUser } = useContext(AppContext);
  const { cartCount } = useContext(CartContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    if (supabase) await supabase.auth.signOut();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path ? 'active-link' : '';

  return (
    <nav className="navbar" id="farmfresh-navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <Sprout size={28} className="logo-icon" />
          <span className="logo-text">Farm<span>Fresh</span></span>
        </Link>

        {/* Navigation Links based on role */}
        <div className="navbar-links">
          {currentUser?.role === 'customer' && (
            <>
              <Link to="/" className={`nav-link ${isActive('/')}`}>Home</Link>
              <Link to="/products" className={`nav-link ${isActive('/products')}`}>Shop Products</Link>
              <Link to="/orders" className={`nav-link ${isActive('/orders')}`}>My Orders</Link>
            </>
          )}
          {currentUser?.role === 'farmer' && (
            <>
              <Link to="/farmer" className={`nav-link ${isActive('/farmer')}`}>Dashboard</Link>
              <Link to="/farmer/products" className={`nav-link ${isActive('/farmer/products')}`}>Manage Inventory</Link>
              <Link to="/farmer/orders" className={`nav-link ${isActive('/farmer/orders')}`}>Orders Received</Link>
            </>
          )}
          {currentUser?.role === 'admin' && (
            <Link to="/admin" className={`nav-link ${isActive('/admin')}`}>Admin Hub</Link>
          )}
        </div>

        {/* Actions */}
        <div className="navbar-actions">
          {currentUser ? (
            <>
              {/* Cart (Customer Only) */}
              {currentUser.role === 'customer' && (
                <Link to="/cart" className="cart-nav-btn" id="cart-nav-link">
                  <ShoppingCart size={22} />
                  {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                </Link>
              )}

              {/* User badge */}
              <div className="user-profile-badge">
                <div className="avatar-circle">
                  <User size={18} />
                </div>
                <div className="profile-details-nav">
                  <span className="profile-name-nav">{currentUser.name}</span>
                  <span className="profile-role-nav">{currentUser.role}</span>
                </div>
              </div>

              {/* Sign Out */}
              <button
                className="signout-btn"
                onClick={handleSignOut}
                title="Sign out"
                id="signout-btn"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <Link to="/login" className="nav-signin-btn" id="signin-nav-link">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};
