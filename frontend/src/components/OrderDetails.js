import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './OrderDetails.css';

function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const statusStages = ["Processing", "Shipped", "Out for Delivery", "Delivered"];

  useEffect(() => {
    loadOrder();

    const interval = setInterval(() => {
      updateProgress();
    }, 4000); // Sync with MyOrders, 4s for demo

    return () => clearInterval(interval);
  }, [id]);

  const loadOrder = () => {
    const savedOrders = JSON.parse(localStorage.getItem('orders')) || [];
    const foundOrder = savedOrders.find(o => o.id.toString() === id);
    if (foundOrder) {
      setOrder(foundOrder);
    } else {
      alert("Order not found.");
      navigate('/orders');
    }
  };

  const updateProgress = () => {
    const savedOrders = JSON.parse(localStorage.getItem('orders')) || [];
    const updatedOrders = savedOrders.map(o => {
      if (o.id.toString() === id) {
        const nextStatus = getNextStatus(o.status);
        if (nextStatus) {
          return { ...o, status: nextStatus };
        }
      }
      return o;
    });

    localStorage.setItem('orders', JSON.stringify(updatedOrders));
    const updatedOrder = updatedOrders.find(o => o.id.toString() === id);
    if (updatedOrder) setOrder(updatedOrder);
  };

  const getNextStatus = (current) => {
    const stages = ["Processing", "Shipped", "Out for Delivery", "Delivered"];
    const index = stages.indexOf(current);
    if (index >= 0 && index < stages.length - 1) {
      return stages[index + 1];
    }
    return null;
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Processing": return "status-processing";
      case "Shipped": return "status-shipped";
      case "Out for Delivery": return "status-out";
      case "Delivered": return "status-delivered";
      default: return "";
    }
  };

  const getProgressPercentage = (status) => {
    const index = statusStages.indexOf(status);
    if (index === -1) return 0;
    return ((index + 1) / statusStages.length) * 100;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Processing": return "📦";
      case "Shipped": return "🚚";
      case "Out for Delivery": return "🚛";
      case "Delivered": return "✅";
      default: return "📦";
    }
  };

  const getExpectedDeliveryDate = () => {
    const orderDate = new Date();
    const deliveryDate = new Date(orderDate);
    
    switch (order.status) {
      case "Processing":
        deliveryDate.setDate(orderDate.getDate() + 3);
        break;
      case "Shipped":
        deliveryDate.setDate(orderDate.getDate() + 2);
        break;
      case "Out for Delivery":
        deliveryDate.setDate(orderDate.getDate() + 1);
        break;
      case "Delivered":
        return "Delivered";
      default:
        deliveryDate.setDate(orderDate.getDate() + 3);
    }
    
    return deliveryDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (!order) return <div className="loading">Loading order details...</div>;

  return (
    <div className="order-details-page">
      <div className="order-header">
        <div className="header-left">
          <button className="back-button" onClick={() => navigate('/orders')}>
            ← Back to orders
          </button>
          <h1>Order #{order.id}</h1>
          <p className="order-placed">Order placed on {new Date().toLocaleDateString()}</p>
        </div>
        <div className="header-right">
          <div className="order-total">
            <span className="total-label">Order Total</span>
            <span className="total-amount">₹{order.amount}</span>
          </div>
        </div>
      </div>

      <div className="main-content">
        <div className="left-column">
          <div className="tracking-card">
            <div className="tracking-header">
              <div className="status-icon">{getStatusIcon(order.status)}</div>
              <div className="status-info">
                <h2>{order.status}</h2>
                <p className="delivery-date">
                  {order.status === "Delivered" ? "Delivered" : `Expected by ${getExpectedDeliveryDate()}`}
                </p>
              </div>
            </div>

            <div className="progress-tracker">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${getProgressPercentage(order.status)}%` }}
                ></div>
              </div>
              <div className="progress-stages">
                {statusStages.map((stage, index) => (
                  <div
                    key={stage}
                    className={`stage ${statusStages.indexOf(order.status) >= index ? 'completed' : ''} ${stage === order.status ? 'current' : ''}`}
                  >
                    <div className="stage-dot"></div>
                    <span className="stage-label">{stage}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="items-card">
            <h3>Items in this order</h3>
            <div className="items-list">
              {order.items.map((item, index) => (
                <div key={index} className="item-row">
                  <div className="item-image">
                    <img
                      src={item.thumbnail || item.image || "https://via.placeholder.com/80"}
                      alt={item.title || item.name}
                      onClick={() => navigate(`/product/${item.id}`)}
                      className="clickable-image"
                    />
                  </div>
                  <div className="item-details">
                    <h4 
                      className="item-name clickable"
                      onClick={() => navigate(`/product/${item.id}`)}
                    >
                      {item.title || item.name}
                    </h4>
                    <p className="item-price">₹{item.price}</p>
                    <p className="item-quantity">Qty: {item.quantity}</p>
                  </div>
                  <div className="item-actions">
                    <button 
                      className="btn-view-product"
                      onClick={() => navigate(`/product/${item.id}`)}
                    >
                      View Product
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="right-column">
          <div className="delivery-card">
            <h3>Delivery Address</h3>
            <div className="address-info">
              <p className="recipient-name">{order.deliveryDetails.name}</p>
              <p className="address">
                {order.deliveryDetails.address}<br />
                {order.deliveryDetails.city} - {order.deliveryDetails.pin}
              </p>
              <p className="phone">Phone: {order.deliveryDetails.phone}</p>
            </div>
          </div>

          <div className="order-summary-card">
            <h3>Order Summary</h3>
            <div className="summary-row">
              <span>Items ({order.items.length}):</span>
              <span>₹{order.amount}</span>
            </div>
            <div className="summary-row">
              <span>Delivery:</span>
              <span>FREE</span>
            </div>
            <div className="summary-row total">
              <span>Order Total:</span>
              <span>₹{order.amount}</span>
            </div>
          </div>

          <div className="help-card">
            <h3>Need help?</h3>
            <div className="help-links">
              <button className="help-link">Track your package</button>
              <button className="help-link">Contact us</button>
              <button className="help-link">Return or replace items</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetails;