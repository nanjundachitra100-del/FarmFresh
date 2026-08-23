import React, { useContext, useState } from 'react';
import { Shield, Users, Sprout, TrendingUp, AlertTriangle, Check, Trash } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import './AdminDashboard.css';

export const AdminDashboard = () => {
  const { products, orders, reviews, deleteReview } = useContext(AppContext);

  // Mock reported reviews list
  const [reportedReviews, setReportedReviews] = useState([
    {
      id: 'rev-2',
      productId: 'prod-4',
      productName: 'Farm-Fresh Free-Range Brown Eggs',
      customerName: 'Sarah Jenkins',
      comment: 'Rich, orange yolks. You can tell these chickens are raised well!',
      reason: 'Suspiciously positive spam comment'
    },
    {
      id: 'rev-3',
      productId: 'prod-2',
      productName: 'Fresh Honeycrisp Apples',
      customerName: 'David Lee',
      comment: 'Very sweet and crispy. Shipping was fast too. Will order again.',
      reason: 'Competitor report: off-topic advertising'
    }
  ]);

  const handleDismissReport = (reviewId) => {
    setReportedReviews((prev) => prev.filter((r) => r.id !== reviewId));
  };

  const handleDeleteReview = (reviewId) => {
    // Delete globally from AppContext
    deleteReview(reviewId);
    // Remove from local reports view
    setReportedReviews((prev) => prev.filter((r) => r.id !== reviewId));
  };

  // Stats
  const totalUsers = 184; // Mocked
  const totalFarmers = 18; // Mocked
  const totalCatalogSize = products.length;
  
  const platformGMV = orders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

  return (
    <div className="admin-dashboard-page" id="admin-hub-container">
      <header className="admin-header-row">
        <div className="admin-title-col">
          <Shield size={32} className="admin-shield-icon" />
          <div>
            <h1>Admin Operations Hub</h1>
            <p>Monitor platform statistics, verify transactions, and moderate community reports.</p>
          </div>
        </div>
        <div className="admin-status-badge">System Integrity: OK</div>
      </header>

      {/* Grid of Stats */}
      <section className="admin-stats-grid">
        <div className="admin-stat-card shadow-card-admin">
          <div className="stat-icon-wrap bg-blue-admin">
            <Users size={22} className="blue-admin-color" />
          </div>
          <div className="stat-details">
            <span className="stat-label">Total platform Users</span>
            <h3>{totalUsers}</h3>
            <span className="stat-trend">{totalFarmers} active farmers</span>
          </div>
        </div>

        <div className="admin-stat-card shadow-card-admin">
          <div className="stat-icon-wrap bg-green-admin">
            <TrendingUp size={22} className="green-admin-color" />
          </div>
          <div className="stat-details">
            <span className="stat-label">Gross Merchandise Value</span>
            <h3>${platformGMV.toFixed(2)}</h3>
            <span className="stat-trend green-admin-color">x402 protocol payments</span>
          </div>
        </div>

        <div className="admin-stat-card shadow-card-admin">
          <div className="stat-icon-wrap bg-orange-admin">
            <Sprout size={22} className="orange-admin-color" />
          </div>
          <div className="stat-details">
            <span className="stat-label">Verified Listings</span>
            <h3>{totalCatalogSize}</h3>
            <span className="stat-trend">Across 4 main categories</span>
          </div>
        </div>

        <div className="admin-stat-card shadow-card-admin">
          <div className="stat-icon-wrap bg-red-admin">
            <AlertTriangle size={22} className="red-admin-color" />
          </div>
          <div className="stat-details">
            <span className="stat-label">Reported Reviews</span>
            <h3>{reportedReviews.length}</h3>
            <span className="stat-trend red-admin-color">Requires moderation</span>
          </div>
        </div>
      </section>

      {/* Main Admin Contents */}
      <div className="admin-main-grid">
        {/* Moderate Reviews */}
        <section className="admin-card-section">
          <div className="admin-card-header">
            <h3>Reported Review Moderation Queue</h3>
          </div>

          {reportedReviews.length > 0 ? (
            <div className="reported-reviews-list">
              {reportedReviews.map((report) => (
                <div key={report.id} className="reported-review-item" id={`report-card-${report.id}`}>
                  <div className="report-meta-header">
                    <span className="report-target-product">{report.productName}</span>
                    <span className="report-reporter">By: {report.customerName}</span>
                  </div>
                  
                  <p className="report-review-text">"{report.comment}"</p>
                  
                  <div className="report-flag-reason">
                    <AlertTriangle size={14} />
                    <span>Reason: {report.reason}</span>
                  </div>

                  <div className="report-actions-row">
                    <button 
                      onClick={() => handleDismissReport(report.id)}
                      className="report-action-btn keep-btn"
                      id={`dismiss-report-btn-${report.id}`}
                    >
                      <Check size={14} /> Keep Review
                    </button>
                    <button 
                      onClick={() => handleDeleteReview(report.id)}
                      className="report-action-btn delete-btn"
                      id={`delete-report-btn-${report.id}`}
                    >
                      <Trash size={14} /> Delete & Ban
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="admin-empty-box">
              <Check size={32} className="admin-ok-icon" />
              <p>Review moderation queue is clean. All reports resolved!</p>
            </div>
          )}
        </section>

        {/* Payments monitor logs */}
        <section className="admin-card-section">
          <div className="admin-card-header">
            <h3>x402 Payment Monitor</h3>
          </div>

          <div className="payments-log-list">
            <div className="payments-table-wrap">
              <table className="payments-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Protocol</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="payment-row">
                      <td><strong>#{order.id}</strong></td>
                      <td>{order.customerName}</td>
                      <td className="protocol-code">{order.paymentMethod || 'x402'}</td>
                      <td><strong>${Number(order.totalAmount || 0).toFixed(2)}</strong></td>
                      <td>
                        <span className="payment-verified-badge">
                          {order.paymentStatus === 'Paid' || order.paymentStatus === 'paid' ? 'Verified' : order.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
