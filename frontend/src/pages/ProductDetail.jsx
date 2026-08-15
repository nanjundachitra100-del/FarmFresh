import React, { useContext, useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Calendar, User, Star, Sprout, MapPin } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { CartContext } from '../context/CartContext';
import { RatingStars } from '../components/RatingStars';
import { productService } from '../services/productService';
import './ProductDetail.css';

export const ProductDetail = () => {
  const { id } = useParams();
  const { products, reviews, addReview, currentUser } = useContext(AppContext);
  const { addToCart } = useContext(CartContext);

  const [fetchedProduct, setFetchedProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [qtyToOrder, setQtyToOrder] = useState(1);
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');

  // Find product from AppContext or fetch from API
  const localProduct = products.find((p) => p.id === id);
  const product = localProduct || fetchedProduct;

  useEffect(() => {
    if (!localProduct && id) {
      setLoading(true);
      productService
        .getProductById(id)
        .then((data) => {
          if (data) setFetchedProduct(data);
        })
        .catch((err) => {
          console.warn('[ProductDetail] Could not load from API:', err.message);
        })
        .finally(() => setLoading(false));
    }
  }, [id, localProduct]);

  if (loading) {
    return (
      <div className="product-detail-page" style={{ textAlign: 'center', padding: '100px 20px' }}>
        <h3>Loading Product Details...</h3>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail-page error-detail-page">
        <div className="error-card">
          <h2>Product Not Found</h2>
          <p>The product you are looking for does not exist or has been removed by the farmer.</p>
          <Link to="/products" className="back-catalog-btn-err">
            <ArrowLeft size={16} /> Back to Catalog
          </Link>
        </div>
      </div>
    );
  }

  // Get product reviews
  const productReviews = reviews.filter((r) => r.productId === product.id);

  const isOutOfStock = product.quantity === 0;

  const handleAddToCart = () => {
    addToCart(product, qtyToOrder);
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!userComment.trim()) {
      setReviewMessage('Please enter a review comment.');
      return;
    }

    addReview({
      productId: product.id,
      rating: userRating,
      comment: userComment
    });

    setUserComment('');
    setUserRating(5);
    setReviewMessage('Thank you! Your review has been added.');
    setTimeout(() => setReviewMessage(''), 3000);
  };

  return (
    <div className="product-detail-page" id={`detail-page-${product.id}`}>
      {/* Back button */}
      <Link to="/products" className="back-catalog-link">
        <ArrowLeft size={16} />
        <span>Back to Shop</span>
      </Link>

      {/* Main product card details */}
      <section className="detail-grid">
        {/* Left column - Image */}
        <div className="detail-image-card">
          <div className="detail-category-badge">{product.category}</div>
          <img src={product.image} alt={product.name} />
          {isOutOfStock && <div className="detail-stock-overlay">Out of Stock</div>}
        </div>

        {/* Right column - Info */}
        <div className="detail-info-card">
          <div className="detail-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <Sprout size={16} color="var(--primary)" />
              <span className="detail-farmer-name">{product.farmerName}</span>
            </div>
            <h1>{product.name}</h1>
            <div className="detail-rating-row">
              <RatingStars rating={product.rating || 5.0} count={productReviews.length} />
            </div>
          </div>

          <p className="detail-description">{product.description}</p>

          <div className="detail-price-stock-box">
            <div className="detail-price">
              <span className="price-val">${product.price.toFixed(2)}</span>
              <span className="price-unit">/ {product.unit}</span>
            </div>

            <div className="detail-stock-status">
              {isOutOfStock ? (
                <span className="badge-status out">Out of Stock</span>
              ) : product.quantity <= 5 ? (
                <span className="badge-status low">Only {product.quantity} left!</span>
              ) : (
                <span className="badge-status in">In Stock ({product.quantity} available)</span>
              )}
            </div>
          </div>

          {/* Customer only quantity selector */}
          {currentUser.role === 'customer' && (
            <div className="detail-checkout-actions">
              {!isOutOfStock ? (
                <>
                  <div className="qty-picker">
                    <button 
                      onClick={() => setQtyToOrder(prev => Math.max(1, prev - 1))}
                      disabled={qtyToOrder <= 1}
                    >
                      -
                    </button>
                    <span className="qty-val">{qtyToOrder}</span>
                    <button 
                      onClick={() => setQtyToOrder(prev => Math.min(product.quantity, prev + 1))}
                      disabled={qtyToOrder >= product.quantity}
                    >
                      +
                    </button>
                  </div>
                  
                  <button onClick={handleAddToCart} className="add-to-cart-action-btn">
                    <ShoppingCart size={18} />
                    <span>Add to Shopping Cart</span>
                  </button>
                </>
              ) : (
                <button disabled className="add-to-cart-action-btn disabled">
                  Product Sold Out
                </button>
              )}
            </div>
          )}

          {currentUser.role === 'farmer' && (
            <div className="farmer-admin-actions">
              <Link to={`/farmer/products?edit=${product.id}`} className="manage-catalog-btn">
                Manage This Harvest
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Reviews section */}
      <section className="reviews-section">
        <h2>Reviews & Ratings</h2>
        
        <div className="reviews-grid-detail">
          {/* Write review (Customers only) */}
          {currentUser.role === 'customer' && (
            <div className="write-review-card">
              <h3>Share Your Feedback</h3>
              <form onSubmit={handleReviewSubmit}>
                <div className="form-group-review">
                  <label>Your Rating</label>
                  <div className="star-rating-selector">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setUserRating(star)}
                        className="star-selector-btn"
                      >
                        <Star 
                          size={24} 
                          fill={star <= userRating ? 'var(--warning)' : 'none'} 
                          color={star <= userRating ? 'var(--warning)' : 'var(--text-light)'} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group-review">
                  <label htmlFor="review-textarea">Comment</label>
                  <textarea
                    id="review-textarea"
                    rows="4"
                    placeholder="Describe your experience with this fresh harvest..."
                    value={userComment}
                    onChange={(e) => setUserComment(e.target.value)}
                    required
                  ></textarea>
                </div>

                <button type="submit" className="submit-review-btn">
                  Submit Review
                </button>

                {reviewMessage && <p className="review-alert-msg">{reviewMessage}</p>}
              </form>
            </div>
          )}

          {/* List reviews */}
          <div className="reviews-list-card">
            <h3>Customer Reviews ({productReviews.length})</h3>
            {productReviews.length > 0 ? (
              <div className="reviews-feed">
                {productReviews.map((rev) => (
                  <div key={rev.id} className="feed-review-item">
                    <div className="feed-header">
                      <div className="user-icon-feed">
                        <User size={16} />
                        <span className="reviewer-name">{rev.customerName}</span>
                      </div>
                      <span className="review-date-feed">
                        <Calendar size={12} />
                        {new Date(rev.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="feed-rating">
                      <RatingStars rating={rev.rating} />
                    </div>
                    <p className="feed-text">{rev.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-reviews-feed-box">
                <p>No reviews yet for this harvest. Be the first to share your opinion!</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
