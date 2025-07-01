import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './MyOrders.css';

function MyOrders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const savedOrders = JSON.parse(localStorage.getItem('orders')) || [];
    setOrders(savedOrders.reverse());
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const updatedOrders = orders.map(order => {
        const nextStatus = getNextStatus(order.status);
        if (nextStatus) {
          return { ...order, status: nextStatus };
        }
        return order;
      });

      setOrders(updatedOrders);
      localStorage.setItem('orders', JSON.stringify([...updatedOrders].reverse()));
    }, 4000); // 4 seconds for demo, change for production

    return () => clearInterval(interval);
  }, [orders]);

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

  const getStatusIcon = (status) => {
    switch (status) {
      case "Processing": return "📦";
      case "Shipped": return "🚚";
      case "Out for Delivery": return "🚛";
      case "Delivered": return "✅";
      default: return "📦";
    }
  };

  const getExpectedDeliveryDate = (status) => {
    const orderDate = new Date();
    const deliveryDate = new Date(orderDate);
    
    switch (status) {
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
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleCancel = (orderId) => {
    if (window.confirm("Are you sure you want to cancel this order?")) {
      const updatedOrders = orders.filter(o => o.id !== orderId);
      setOrders(updatedOrders);
      localStorage.setItem('orders', JSON.stringify(updatedOrders.reverse()));
      alert("Order cancelled successfully.");
    }
  };

  const getFirstItemImage = (order) => {
    if (order.items && order.items.length > 0) {
      const firstItem = order.items[0];
      return firstItem.thumbnail || firstItem.image || "https://via.placeholder.com/80";
    }
    return "https://via.placeholder.com/80";
  };

  const getTotalItems = (order) => {
    return order.items ? order.items.reduce((total, item) => total + item.quantity, 0) : 0;
  };

  return (
    <div className="orders-page">
      <div className="orders-header">
        <h1>Your Orders</h1>
        <p className="orders-subtitle">
          {orders.length} {orders.length === 1 ? 'order' : 'orders'} placed
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="empty-orders">
          <div className="empty-icon">📦</div>
          <h3>No orders yet</h3>
          <p>You haven't placed any orders. Start shopping to see your orders here.</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div className="order-info">
                  <div className="order-meta">
                    <span className="order-date">
                      ORDER PLACED<br />
                      <strong>{order.date}</strong>
                    </span>
                    <span className="order-total">
                      TOTAL<br />
                      <strong>₹{order.amount}</strong>
                    </span>
                    <span className="order-to">
                      DELIVER TO<br />
                      <strong>{order.deliveryDetails?.name}</strong>
                    </span>
                  </div>
                  <div className="order-id">
                    <span>ORDER # {order.id}</span>
                  </div>
                </div>
              </div>

              <div className="order-content">
                <div className="order-image">
                  <img 
                    src={getFirstItemImage(order)} 
                    alt="Order item"
                    className="item-thumbnail"
                  />
                </div>

                <div className="order-details">
                  <div className="status-section">
                    <div className="status-info">
                      <span className="status-icon">{getStatusIcon(order.status)}</span>
                      <div className="status-text">
                        <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                          {order.status}
                        </span>
                        <p className="delivery-estimate">
                          {order.status === "Delivered" ? 
                            "Package was delivered" : 
                            `Expected by ${getExpectedDeliveryDate(order.status)}`
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="order-summary">
                    <p className="items-count">
                      {getTotalItems(order)} item{getTotalItems(order) !== 1 ? 's' : ''} • 
                      Delivered to {order.deliveryDetails?.city}
                    </p>
                  </div>
                </div>

                <div className="order-actions">
                  <Link to={`/order/${order.id}`} className="action-link">
                    <button className="btn-primary">View Details</button>
                  </Link>
                  
                  <button
                    className="btn-secondary"
                    onClick={() => alert(`📦 Order ${order.id} is currently: ${order.status}`)}
                  >
                    Track Package
                  </button>
                  
                  <button
                    className="btn-cancel"
                    onClick={() => handleCancel(order.id)}
                    disabled={order.status !== "Processing"}
                  >
                    Cancel Order
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyOrders;