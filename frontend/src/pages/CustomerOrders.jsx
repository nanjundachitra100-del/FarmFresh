import React, { useContext, useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Package, Calendar, MapPin, CheckCircle, Clock, Truck, FileText } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import './CustomerOrders.css';

export const CustomerOrders = () => {
  const { orders, currentUser } = useContext(AppContext);
  const location = useLocation();
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  // Check URL query params for ?success=true
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('success') === 'true') {
      setShowSuccessBanner(true);
      // Remove query param cleanly
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location.search]);

  // Filter orders to only show current customer's orders
  const customerOrders = orders.filter(
    (order) => order.customerId === currentUser.id
  );

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
            <p>Your payment was simulated via x402 protocol. The farmer has been notified and will prepare your package shortly.</p>
          </div>
          <button onClick={() => setShowSuccessBanner(false)} className="close-banner-btn">×</button>
        </div>
      )}

      <header className="orders-header">
        <h1>Your Orders History</h1>
        <p>Monitor your purchases, track statuses, and view previous transactions.</p>
      </header>

      {customerOrders.length > 0 ? (
        <div className="orders-timeline-list" id="orders-list">
          {customerOrders.map((order) => (
            <div key={order.id} className="order-timeline-card" id={`order-card-${order.id}`}>
              {/* Card Top Details */}
              <div className="order-card-header">
                <div className="order-meta-info">
                  <div className="order-id-label">
                    <FileText size={16} />
                    <span>Order #{order.id}</span>
                  </div>
                  <div className="order-date-label">
                    <Calendar size={14} />
                    <span>{new Date(order.date).toLocaleDateString()}</span>
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
                    {order.items.map((item, idx) => (
                      <div key={idx} className="item-summary-row">
                        <div className="item-desc-col">
                          <span className="item-dot">•</span>
                          <span className="item-name-summary">{item.name}</span>
                          <span className="item-qty-tag">x{item.quantity} {item.unit}</span>
                        </div>
                        <span className="item-price-sum">${(item.price * item.quantity).toFixed(2)}</span>
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
                  <span className="total-val-order">${order.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-orders-box">
          <span className="no-orders-emoji">📦</span>
          <h3>No Orders Placed Yet</h3>
          <p>You haven't purchased anything yet. Head over to our catalog to buy fresh produce directly from our local farmers.</p>
          <Link to="/products" className="shop-btn-no-orders">
            Shop Fresh Produce
          </Link>
        </div>
      )}
    </div>
  );
};
