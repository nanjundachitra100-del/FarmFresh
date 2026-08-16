import React, { useContext } from 'react';
import { ShoppingBag, Calendar, MapPin, CheckCircle2, Clock, Truck, ClipboardList } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { ALL_DEMO_FARM_IDS } from '../constants/demoIds';
import './FarmerOrders.css';

export const FarmerOrders = () => {
  const { orders, products, updateOrderStatus } = useContext(AppContext);

  // Filter products belonging to this demo farmer (include legacy demo ids and known UUID)
  const farmerProductIds = products
    .filter((p) => ALL_DEMO_FARM_IDS.includes(p.farmerId))
    .map((p) => p.id);

  // Filter orders that have items from this farmer
  const farmerOrders = orders.filter((order) =>
    order.items.some((item) => farmerProductIds.includes(item.productId))
  );

  const handleStatusChange = (orderId, newStatus) => {
    updateOrderStatus(orderId, newStatus);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending':
        return <Clock size={16} />;
      case 'In Transit':
        return <Truck size={16} />;
      case 'Delivered':
        return <CheckCircle2 size={16} />;
      default:
        return <ClipboardList size={16} />;
    }
  };

  return (
    <div className="farmer-orders-page" id="farmer-orders-hub">
      <header className="orders-desk-header">
        <h1>Orders Received</h1>
        <p>Monitor customer orders for your crops and update delivery tracking statuses.</p>
      </header>

      {farmerOrders.length > 0 ? (
        <div className="orders-desk-list" id="farmer-orders-list">
          {farmerOrders.map((order) => {
            // Find items from this farmer
            const farmerItems = order.items.filter((item) =>
              farmerProductIds.includes(item.productId)
            );
            
            // Total amount for this farmer's products in the order
            const farmerOrderSubtotal = farmerItems.reduce(
              (sum, item) => sum + item.price * item.quantity,
              0
            );

            return (
              <div key={order.id} className="order-desk-card" id={`farmer-order-${order.id}`}>
                {/* Header details */}
                <div className="desk-card-header">
                  <div className="desk-meta-top">
                    <span className="desk-order-id">Order ID: #{order.id}</span>
                    <span className="desk-order-date">
                      <Calendar size={12} />
                      {new Date(order.date).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="desk-status-selector-wrap">
                    <span className="desk-status-label">Delivery Tracking:</span>
                    <div className="status-select-container">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className={`status-select-control ${order.status.toLowerCase().replace(/\s+/g, '-')}`}
                        id={`status-select-${order.id}`}
                      >
                        <option value="Pending">Pending Dispatch</option>
                        <option value="In Transit">In Transit</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Body details */}
                <div className="desk-card-body">
                  {/* Customer shipping info */}
                  <div className="customer-info-box-desk">
                    <span className="box-title-desk">Shipping Destination</span>
                    <div className="customer-meta-row-desk">
                      <MapPin size={16} className="desk-pin-icon" />
                      <div>
                        <strong>{order.customerName}</strong>
                        <p>{order.deliveryAddress}</p>
                      </div>
                    </div>
                  </div>

                  {/* Items catalog list */}
                  <div className="items-list-box-desk">
                    <span className="box-title-desk">Your Farm Items In Order</span>
                    <div className="desk-items-table">
                      {farmerItems.map((item, idx) => (
                        <div key={idx} className="desk-item-row">
                          <span className="desk-item-name">{item.name}</span>
                          <span className="desk-item-qty">x{item.quantity} {item.unit}</span>
                          <span className="desk-item-sum">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer details */}
                <div className="desk-card-footer">
                  <div className="desk-payment-info">
                    <span>Payment Status:</span>
                    <span className="badge-paid">{order.paymentStatus}</span>
                    <span className="pm-label">({order.paymentMethod})</span>
                  </div>

                  <div className="desk-earnings-info">
                    <span>Your Earnings:</span>
                    <span className="earnings-val">${farmerOrderSubtotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-desk-box">
          <ShoppingBag size={48} className="empty-desk-icon" />
          <h3>No Orders Received</h3>
          <p>You haven't received any orders yet. Once customers purchase your items, they will appear here instantly.</p>
        </div>
      )}
    </div>
  );
};
