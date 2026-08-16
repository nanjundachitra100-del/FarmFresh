import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, ShoppingBag, Sprout, Star, ArrowUpRight, TrendingUp } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { ALL_DEMO_FARM_IDS } from '../constants/demoIds';
import { RatingStars } from '../components/RatingStars';
import './FarmerDashboard.css';

export const FarmerDashboard = () => {
  const { products, orders, reviews } = useContext(AppContext);

  // Filter products belonging to this demo farmer (include legacy demo ids and known UUID)
  const farmerProducts = products.filter((p) => ALL_DEMO_FARM_IDS.includes(p.farmerId));
  
  // Filter reviews belonging to farmer's products
  const farmerProductIds = farmerProducts.map((p) => p.id);
  const farmerReviews = reviews.filter((r) => farmerProductIds.includes(r.productId));

  // Filter orders containing farmer's products
  const farmerOrders = orders.filter((order) =>
    order.items.some((item) => farmerProductIds.includes(item.productId))
  );

  // Calculations
  const activeProductsCount = farmerProducts.length;
  const totalOrdersCount = farmerOrders.length;
  
  const totalEarnings = farmerOrders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((sum, order) => {
      // Sum only items belonging to this farmer
      const farmerItemsSum = order.items
        .filter((item) => farmerProductIds.includes(item.productId))
        .reduce((s, item) => s + item.price * item.quantity, 0);
      return sum + farmerItemsSum;
    }, 0);

  const avgRating = farmerProducts.length > 0
    ? parseFloat((farmerProducts.reduce((sum, p) => sum + p.rating, 0) / farmerProducts.length).toFixed(1))
    : 5.0;

  // Get recent 3 orders
  const recentOrders = [...farmerOrders]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3);

  // Get recent 3 reviews
  const recentReviews = [...farmerReviews]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3);

  return (
    <div className="farmer-dashboard-page" id="farmer-hub">
      <header className="dashboard-header-row">
        <div>
          <h1>Farmer Management Desk</h1>
          <p>Welcome back, <strong>Green Valley Farms</strong>! Here is your organic shop summary.</p>
        </div>
        <div className="dashboard-status-indicator">
          <span className="dot-active"></span>
          <span>Farm Shop Online</span>
        </div>
      </header>

      {/* Grid of 4 counters */}
      <section className="dashboard-counters-grid">
        <div className="counter-card shadow-card-dash">
          <div className="counter-icon-wrap bg-green-light">
            <DollarSign size={24} className="green-color" />
          </div>
          <div className="counter-details">
            <span className="counter-label">Gross Farm Earnings</span>
            <h3>${totalEarnings.toFixed(2)}</h3>
            <span className="counter-trend green-color">
              <TrendingUp size={14} /> +12.4% this month
            </span>
          </div>
        </div>

        <div className="counter-card shadow-card-dash">
          <div className="counter-icon-wrap bg-orange-light">
            <ShoppingBag size={24} className="orange-color" />
          </div>
          <div className="counter-details">
            <span className="counter-label">Total Orders</span>
            <h3>{totalOrdersCount}</h3>
            <span className="counter-trend">Pending dispatch</span>
          </div>
        </div>

        <div className="counter-card shadow-card-dash">
          <div className="counter-icon-wrap bg-blue-light">
            <Sprout size={24} className="blue-color" />
          </div>
          <div className="counter-details">
            <span className="counter-label">Catalog Harvests</span>
            <h3>{activeProductsCount}</h3>
            <span className="counter-trend">Active listings</span>
          </div>
        </div>

        <div className="counter-card shadow-card-dash">
          <div className="counter-icon-wrap bg-yellow-light">
            <Star size={24} className="yellow-color" />
          </div>
          <div className="counter-details">
            <span className="counter-label">Farmer Rating</span>
            <h3>{avgRating} / 5.0</h3>
            <span className="counter-trend">Across all products</span>
          </div>
        </div>
      </section>

      {/* Double Column layout */}
      <div className="dashboard-columns-grid">
        {/* Left: Recent Orders received */}
        <section className="dashboard-column-card">
          <div className="card-column-header">
            <h3>Recent Customer Orders</h3>
            <Link to="/farmer/orders" className="view-all-link-dash">
              View All Orders <ArrowUpRight size={14} />
            </Link>
          </div>
          
          {recentOrders.length > 0 ? (
            <div className="orders-summary-list-dash">
              {recentOrders.map((order) => {
                const farmerItems = order.items.filter((item) => farmerProductIds.includes(item.productId));
                const orderTotalForFarmer = farmerItems.reduce((s, i) => s + i.price * i.quantity, 0);

                return (
                  <div key={order.id} className="order-row-dash">
                    <div className="order-row-meta">
                      <span className="order-row-id">Order #{order.id}</span>
                      <span className="order-row-date">
                        {new Date(order.date).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="order-row-items-text">
                      {farmerItems.map((item, idx) => (
                        <span key={idx}>
                          {item.name} (x{item.quantity})
                        </span>
                      ))}
                    </div>

                    <div className="order-row-footer-dash">
                      <span className="order-row-amount">${orderTotalForFarmer.toFixed(2)}</span>
                      <span className={`status-badge-mini ${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-dash-list-box">
              <p>No customer orders received yet.</p>
            </div>
          )}
        </section>

        {/* Right: Customer Reviews */}
        <section className="dashboard-column-card">
          <div className="card-column-header">
            <h3>Recent Product Reviews</h3>
            <Link to="/farmer/products" className="view-all-link-dash">
              Manage Inventory
            </Link>
          </div>

          {recentReviews.length > 0 ? (
            <div className="reviews-summary-list-dash">
              {recentReviews.map((rev) => {
                const productForReview = products.find((p) => p.id === rev.productId);
                return (
                  <div key={rev.id} className="review-row-dash">
                    <div className="review-row-header">
                      <span className="review-product-name-dash">
                        {productForReview ? productForReview.name : 'Unknown Product'}
                      </span>
                      <span className="review-row-date-dash">
                        {new Date(rev.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="review-rating-row-dash">
                      <RatingStars rating={rev.rating} />
                      <span className="reviewer-name-dash">by {rev.customerName}</span>
                    </div>
                    <p className="review-row-comment">"{rev.comment}"</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-dash-list-box">
              <p>No feedback ratings received yet.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
