import React, { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, MapPin, CreditCard } from 'lucide-react';
import { useWallet } from '@txnlab/use-wallet-react';
import { WalletId } from '@txnlab/use-wallet';
import { CartContext } from '../context/CartContext';
import { AppContext } from '../context/AppContext';
import { createPaymentFetch } from '../lib/x402Payment';
import './Cart.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, clearCart, cartTotal } = useContext(CartContext);
  const { currentUser, products, productsHydrated, appendOrder } = useContext(AppContext);
  const { activeAccount, wallets, signTransactions, isReady } = useWallet();
  const peraWallet = wallets.find((wallet) => wallet.id === WalletId.PERA);
  const navigate = useNavigate();

  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('idle');
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);

  const isProcessing = paymentStatus === 'processing' || isConnectingWallet;

  const handleConnectWallet = async () => {
    if (!isReady) {
      setCheckoutError('Wallet system is still loading. Please try again.');
      return;
    }

    if (!peraWallet) {
      setCheckoutError('Pera Wallet is not available.');
      return;
    }

    setIsConnectingWallet(true);
    setCheckoutError('');

    try {
      await peraWallet.connect();
    } catch (error) {
      setCheckoutError(error.message || 'Wallet connection was cancelled.');
    } finally {
      setIsConnectingWallet(false);
    }
  };

  const handleCheckout = async (e) => {
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

    if (!productsHydrated) {
      setCheckoutError('The product catalog is still loading. Please try checkout again in a moment.');
      return;
    }

    const validProductIds = new Set(products.map((product) => product.id));
    const hasInvalidCartItem = cartItems.some(
      (item) => !UUID_PATTERN.test(item.id) || !validProductIds.has(item.id)
    );

    if (hasInvalidCartItem) {
      setCheckoutError('Your cart contains stale products. Please re-add the current catalog items before checkout.');
      return;
    }

    if (!isReady) {
      setCheckoutError('Wallet system is still loading. Please try again.');
      return;
    }

    let account = activeAccount;

    if (!account) {
      try {
        setIsConnectingWallet(true);
        if (!peraWallet) {
          throw new Error('Pera Wallet is not available.');
        }
        const accounts = await peraWallet.connect();
        account = accounts[0] ?? null;
      } catch (error) {
        setCheckoutError(error.message || 'Wallet connection was cancelled.');
        setPaymentStatus('cancelled');
        return;
      } finally {
        setIsConnectingWallet(false);
      }
    }

    if (!account) {
      setCheckoutError('Connect Pera Wallet on Algorand Testnet to complete checkout.');
      setPaymentStatus('cancelled');
      return;
    }

    setPaymentStatus('processing');
    setCheckoutError('');

    try {
      const orderItems = cartItems.map((item) => ({
        productId: item.id,
        quantity: item.cartQuantity
      }));

      const orderPayload = {
        customerId: currentUser?.id || 'guest-customer',
        ordersName: `Order from ${address}`,
        deliveryAddress: address,
        contactPlace: phone,
        items: orderItems
      };

      if (import.meta.env.DEV) {
        console.info('[checkout] x402 order item IDs', orderItems);
      }

      const paymentFetch = createPaymentFetch(account, signTransactions);
      const ordersEndpoint = `${API_URL}/api/orders`;

      const orderResponse = await paymentFetch(ordersEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderPayload)
      });

      if (orderResponse.status === 402) {
        setPaymentStatus('failed');
        throw new Error('Payment was not accepted. Please ensure your wallet has Testnet USDC and try again.');
      }

      if (!orderResponse.ok) {
        const result = await orderResponse.json().catch(() => ({}));
        setPaymentStatus('failed');
        throw new Error(result?.error || 'Order creation failed. Please try again.');
      }

      // Parse the created order from the response and sync into local context
      // so the cart badge and AppContext.orders stay consistent immediately.
      // CustomerOrders will also do a fresh backend fetch on redirect.
      const responseBody = await orderResponse.json().catch(() => ({}));
      if (responseBody?.order) {
        appendOrder(responseBody.order);
      }

      setPaymentStatus('success');
      clearCart();
      navigate('/orders?success=true');
    } catch (error) {
      const message = error.message || 'Order could not be placed. Please try again.';
      const isCancelled = /cancel|reject|denied|closed/i.test(message);
      setPaymentStatus(isCancelled ? 'cancelled' : 'failed');
      setCheckoutError(message);
    }
  };

  const paymentStatusMessage = {
    processing: 'Processing Algorand Testnet payment...',
    success: 'Payment successful.',
    failed: 'Payment failed.',
    cancelled: 'Payment cancelled.'
  }[paymentStatus];

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
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="payment-stub-alert">
                <CreditCard size={16} className="stub-alert-icon" />
                <div>
                  <h5>x402 Algorand Testnet Payment</h5>
                  {activeAccount ? (
                    <p>
                      Wallet connected: {activeAccount.address.slice(0, 8)}...
                      {activeAccount.address.slice(-6)}
                    </p>
                  ) : (
                    <p>Connect Pera Wallet on Algorand Testnet to pay with USDC via x402.</p>
                  )}
                  {paymentStatus !== 'idle' && (
                    <p>{paymentStatusMessage}</p>
                  )}
                </div>
              </div>

              {!activeAccount && (
                <button
                  type="button"
                  className="checkout-submit-btn"
                  onClick={handleConnectWallet}
                  disabled={isConnectingWallet || !isReady}
                >
                  {isConnectingWallet ? 'Connecting Wallet...' : 'Connect Pera Wallet'}
                </button>
              )}

              {checkoutError && <p className="checkout-error-msg">{checkoutError}</p>}

              <button 
                type="submit" 
                className={`checkout-submit-btn ${isProcessing ? 'loading' : ''}`}
                disabled={isProcessing}
              >
                <span>
                  {paymentStatus === 'processing'
                    ? 'Processing Payment...'
                    : 'Confirm Order & Pay with x402'}
                </span>
                <ArrowRight size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
