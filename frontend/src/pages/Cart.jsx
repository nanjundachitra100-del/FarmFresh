import React, { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, MapPin, CreditCard } from 'lucide-react';
import { CartContext } from '../context/CartContext';
import { AppContext } from '../context/AppContext';
import './Cart.css';

export const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, clearCart, cartTotal } = useContext(CartContext);
  const { addOrder } = useContext(AppContext);
  const navigate = useNavigate();

  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const handleCheckout = (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;
    if (!address.trim()) {
      setCheckoutError('Please provide a delivery address.');
      return;
    }
    if (!phone.trim()) {
      setCheckoutError('Please provide a contact phone number.');
      return;
    }

    setIsPlacingOrder(true);
    setCheckoutError('');

    // Simulate short network delay
    setTimeout(() => {
      const orderItems = cartItems.map((item) => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.cartQuantity,
        unit: item.unit
      }));

      addOrder({
        deliveryAddress: `${address} (Phone: ${phone})`,
        items: orderItems,
        totalAmount: cartTotal
      });

      // Clear the shopping cart
      clearCart();
      setIsPlacingOrder(false);
      
      // Redirect to orders history
      navigate('/orders?success=true');
    }, 1200);
  };

  if (cartItems.length === 0) {
    return (
      <div className="cart-page empty-cart-page" id="cart-container">
        <div className="empty-cart-card">
          <ShoppingBag size={48} className="empty-cart-icon" />
          <h2>Your Cart is Empty</h2>
          <p>You haven't added any fresh farm harvests to your cart yet. Browse our catalog to find fresh organic items.</p>
          <Link to="/products" className="shop-fresh-btn">
            Browse Harvests
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page" id="cart-container">
      <header className="cart-header">
        <h1>Your Shopping Cart</h1>
        <p>Review your selected fresh produce items and check out directly.</p>
      </header>

      <div className="cart-layout-grid">
        {/* Left Column - Cart Items */}
        <div className="cart-items-column">
          <div className="cart-items-card">
            <div className="items-card-header">
              <h3>Selected Harvests ({cartItems.length})</h3>
              <button onClick={clearCart} className="clear-cart-text-btn">
                Clear Cart
              </button>
            </div>

            <div className="cart-items-list">
              {cartItems.map((item) => (
                <div key={item.id} className="cart-item-row" id={`cart-item-${item.id}`}>
                  <img src={item.image} alt={item.name} className="cart-item-img" />
                  
                  <div className="cart-item-info">
                    <span className="cart-item-farmer">{item.farmerName}</span>
                    <h4 className="cart-item-name">
                      <Link to={`/products/${item.id}`}>{item.name}</Link>
                    </h4>
                    <span className="cart-item-price-unit">${item.price.toFixed(2)} / {item.unit}</span>
                  </div>

                  <div className="cart-item-actions-row">
                    {/* Qty Picker */}
                    <div className="qty-picker-cart">
                      <button 
                        onClick={() => updateQuantity(item.id, item.cartQuantity - 1)}
                        disabled={item.cartQuantity <= 1}
                      >
                        -
                      </button>
                      <span className="qty-val-cart">{item.cartQuantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.cartQuantity + 1)}
                        disabled={item.cartQuantity >= item.quantity}
                      >
                        +
                      </button>
                    </div>

                    <div className="cart-item-total-price">
                      ${(item.price * item.cartQuantity).toFixed(2)}
                    </div>

                    <button 
                      onClick={() => removeFromCart(item.id)} 
                      className="remove-item-btn"
                      title="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Checkout Summary & Address Form */}
        <div className="checkout-summary-column">
          <div className="checkout-card">
            <h3>Order Summary</h3>
            
            <div className="summary-details">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Delivery Fee</span>
                <span className="free-delivery-tag">FREE</span>
              </div>
              <div className="summary-row total-row">
                <span>Total Amount</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Address form */}
            <form onSubmit={handleCheckout} className="checkout-form">
              <h4 className="form-section-title">
                <MapPin size={16} /> Delivery & Contact Details
              </h4>
              
              <div className="form-group-cart">
                <label htmlFor="address-input">Street Address</label>
                <input
                  type="text"
                  id="address-input"
                  placeholder="e.g. 128 Birch Ln, Suite 3, Seattle, WA"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>

              <div className="form-group-cart">
                <label htmlFor="phone-input">Contact Phone</label>
                <input
                  type="tel"
                  id="phone-input"
                  placeholder="e.g. +1 (555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone} // let's use standard onChange
                  onInput={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="payment-stub-alert">
                <CreditCard size={16} className="stub-alert-icon" />
                <div>
                  <h5>x402 Protocol Active</h5>
                  <p>In simulation mode. Order confirmation automatically clears mock payment authorization.</p>
                </div>
              </div>

              {checkoutError && <p className="checkout-error-msg">{checkoutError}</p>}

              <button 
                type="submit" 
                className={`checkout-submit-btn ${isPlacingOrder ? 'loading' : ''}`}
                disabled={isPlacingOrder}
              >
                <span>{isPlacingOrder ? 'Processing Order...' : 'Confirm Order & Place Purchase'}</span>
                <ArrowRight size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
