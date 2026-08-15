import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Eye, Tag, AlertCircle } from 'lucide-react';
import { CartContext } from '../context/CartContext';
import { AppContext } from '../context/AppContext';
import { RatingStars } from './RatingStars';
import './ProductCard.css';

export const ProductCard = ({ product }) => {
  const { addToCart } = useContext(CartContext);
  const { currentUser } = useContext(AppContext);

  const { id, name, category, price, unit, quantity, image, farmerName, rating, reviewsCount } = product;
  const isOutOfStock = quantity === 0;

  return (
    <div className={`product-card ${isOutOfStock ? 'out-of-stock-card' : ''}`} id={`product-${id}`}>
      {/* Category Badge */}
      <div className="card-badge">
        <Tag size={12} />
        <span>{category}</span>
      </div>

      {/* Image Wrap */}
      <div className="card-image-wrap">
        <img src={image} alt={name} loading="lazy" />
        {isOutOfStock && (
          <div className="stock-overlay">
            <AlertCircle size={20} />
            <span>Sold Out</span>
          </div>
        )}
        <div className="card-hover-actions">
          <Link to={`/products/${id}`} className="hover-action-btn view-btn" title="View details">
            <Eye size={18} />
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="card-content">
        <span className="farmer-name-tag">{farmerName}</span>
        <h3 className="product-title-card">
          <Link to={`/products/${id}`}>{name}</Link>
        </h3>
        
        <div className="rating-wrap-card">
          <RatingStars rating={rating} count={reviewsCount} />
        </div>

        <div className="card-footer-layout">
          <div className="price-tag-card">
            <span className="price-amount">${price.toFixed(2)}</span>
            <span className="price-unit">/ {unit}</span>
          </div>

          {currentUser.role === 'customer' && (
            <button
              onClick={() => addToCart(product, 1)}
              disabled={isOutOfStock}
              className={`add-to-cart-btn ${isOutOfStock ? 'disabled' : ''}`}
              title={isOutOfStock ? 'Out of stock' : 'Add to cart'}
            >
              <ShoppingCart size={16} />
              <span>{isOutOfStock ? 'Sold Out' : 'Add'}</span>
            </button>
          )}

          {currentUser.role === 'farmer' && (
            <Link to={`/farmer/products?edit=${id}`} className="edit-shortcut-btn">
              Manage
            </Link>
          )}
        </div>

        {/* Stock status indicator */}
        <div className="stock-indicator">
          {isOutOfStock ? (
            <span className="stock-tag out">Out of Stock</span>
          ) : quantity <= 5 ? (
            <span className="stock-tag low">Only {quantity} left!</span>
          ) : (
            <span className="stock-tag in">In Stock ({quantity} {unit}s available)</span>
          )}
        </div>
      </div>
    </div>
  );
};
