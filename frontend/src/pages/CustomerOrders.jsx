import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Package, Calendar, MapPin, CheckCircle, Clock, Truck, FileText, RefreshCw } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import './CustomerOrders.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Map DB lowercase enum values to the display strings the UI expects
const normalizeStatus = (status) => {
  if (!status) return 'Pending';
  const map = {
    pending: 'Pending',
    in_transit: 'In Transit',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
  };
  // Already title-case (legacy local orders) — pass through unchanged
  return map[status.toLowerCase()] || status;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const CustomerOrders = () => {
  const { orders: localOrders, currentUser } = useContext(AppContext);
  const location = useLocation();

  const [remoteOrders, setRemoteOrders] = useState(null); // null = not yet fetched
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  // Determine whether the current user has a real (UUID) account
  const isRealUser =
    currentUser?.id && UUID_PATTERN.test(currentUser.id);

  const fetchOrders = useCallback(async () => {
    if (!isRealUser) return;

    setLoadingOrders(true);
    setFetchError('');

    try {
      const response = await fetch(
        `${API_URL}/api/orders/customer/${currentUser.id}`
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error || `Server error (${response.status})`);
      }

      const data = await response.json();

      // Normalise status values from DB enum to display strings
      const normalised = (data || []).map((order) => ({
        ...order,
        status: normalizeStatus(order.status),
        paymentStatus: order.paymentStatus || 'Paid'
      }));

      setRemoteOrders(normalised);
    } catch (err) {
      console.error('[CustomerOrders] fetch error:', err);
      setFetchError('Could not load orders from the server. Showing local orders instead.');
      setRemoteOrders(null);
    } finally {
      setLoadingOrders(false);
    }
  }, [currentUser?.id, isRealUser]);

  // Fetch on mount
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Handle ?success=true redirect from checkout
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('success') === 'true') {
      setShowSuccessBanner(true);
      // Remove query param cleanly without a re-render loop
      window.history.replaceState({}, document.title, window.location.pathname);
      // Re-fetch so the newly created order appears immediately
      fetchOrders();
    }
  }, [location.search, fetchOrders]);

  // Choose which orders to display: remote (real) if available, else local fallback
  const displayOrders = remoteOrders !== null
    ? remoteOrders
    : localOrders.filter((order) => order.customerId === currentUser?.id);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending':
        return <Clock size={18} className="status-icon pending-color" />;
      case 'In Transit':
        return <Truck size={18} className="status-icon transit-color" />;
      case 'Delivered':
        return <CheckCircle size={18} className="status-icon delivered-color" />;
      default:
        return <Package size={18} className="status-icon" />;
    }
  };

  const getStatusClass = (status) => {
    return `status-badge ${status.replace(/\s+/g, '-').toLowerCase()}`;
  };

  return (
    <div className="orders-page" id="orders-history-page">
      {/* Checkout Success Banner */}
      {showSuccessBanner && (
        <div className="success-banner-alert animate-banner">
          <CheckCircle size={24} className="banner-icon-success" />
          <div className="banner-text">
            <h3>Order Placed Successfully!</h3>
            <p>
              Your payment was completed via the x402 protocol on Algorand Testnet.
              The farmer has been notified and will prepare your order shortly.
            </p>
          </div>
          <button
            onClick={() => setShowSuccessBanner(false)}
            className="close-banner-btn"
          >
            ×
          </button>
        </div>
      )}

      <header className="orders-header">
        <h1>Your Orders History</h1>
        <p>Monitor your purchases, track statuses, and view previous transactions.</p>
      </header>

      {/* Loading / error states */}
      {loadingOrders && (
        <p className="orders-loading-msg">Loading your orders…</p>
      )}

      {!loadingOrders && fetchError && (
        <p className="orders-fetch-error">{fetchError}</p>
      )}

      {!loadingOrders && isRealUser && remoteOrders !== null && (
        <div className="orders-refresh-row">
          <button
            onClick={fetchOrders}
            className="orders-refresh-btn"
            title="Refresh orders"
            aria-label="Refresh orders"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      )}

      {!loadingOrders && displayOrders.length > 0 ? (
        <div className="orders-timeline-list" id="orders-list">
          {displayOrders.map((order) => (
            <div
              key={order.id}
              className="order-timeline-card"
              id={`order-card-${order.id}`}
            >
              {/* Card Top Details */}
              <div className="order-card-header">
                <div className="order-meta-info">
                  <div className="order-id-label">
                    <FileText size={16} />
                    <span>Order #{order.id}</span>
                  </div>
                  <div className="order-date-label">
                    <Calendar size={14} />
                    <span>
                      {new Date(order.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="order-status-badge-wrap">
                  <div className={getStatusClass(order.status)}>
                    {getStatusIcon(order.status)}
                    <span>{order.status}</span>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="order-card-body">
                {/* Delivery Address */}
                <div className="delivery-address-row">
                  <MapPin size={16} className="pin-icon-order" />
                  <div>
                    <span className="address-title">Ship To Address</span>
                    <p className="address-text">{order.deliveryAddress}</p>
                  </div>
                </div>

                {/* Items grid */}
                <div className="order-items-grid">
                  <span className="items-title-order">Ordered Items</span>
                  <div className="items-summary-list">
                    {(order.items || []).map((item, idx) => (
                      <div key={idx} className="item-summary-row">
                        <div className="item-desc-col">
                          <span className="item-dot">•</span>
                          <span className="item-name-summary">{item.name}</span>
                          <span className="item-qty-tag">
                            x{item.quantity} {item.unit}
                          </span>
                        </div>
                        <span className="item-price-sum">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="order-card-footer">
                <div className="order-payment-details">
                  <span className="pm-label">Payment:</span>
                  <span className="pm-status">{order.paymentStatus}</span>
                  <span className="pm-method">({order.paymentMethod})</span>
                </div>
                <div className="order-total-amount">
                  <span className="total-label-order">Total Amount:</span>
                  <span className="total-val-order">
                    ${Number(order.totalAmount).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !loadingOrders && (
          <div className="no-orders-box">
            <span className="no-orders-emoji">📦</span>
            <h3>No Orders Placed Yet</h3>
            <p>
              You haven't purchased anything yet. Head over to our catalog to buy
              fresh produce directly from our local farmers.
            </p>
            <Link to="/products" className="shop-btn-no-orders">
              Shop Fresh Produce
            </Link>
          </div>
        )
      )}
    </div>
  );
};
