import { useState } from 'react';
import { useNavigate } from 'react-router-dom';  
import './Cart.css';

function Cart({ cartItems = [], updateCartItems }) {
  const navigate = useNavigate();  

  const [savedItems, setSavedItems] = useState([]);
  const [coupon, setCoupon] = useState('');
  const [discountApplied, setDiscountApplied] = useState(0);

  const handleQuantityChange = (index, event) => {
    const newCart = [...cartItems];
    newCart[index].quantity = parseInt(event.target.value) || 1;
    updateCartItems(newCart);
  };

  const moveToSaved = (index) => {
    const newCart = [...cartItems];
    const savedItem = newCart.splice(index, 1)[0];
    setSavedItems([...savedItems, savedItem]);
    updateCartItems(newCart);
  };

  const removeFromCart = (index) => {
    const newCart = [...cartItems];
    newCart.splice(index, 1);
    updateCartItems(newCart);
  };

  const applyCoupon = () => {
    if (coupon === 'SAVE10') {
      setDiscountApplied(0.10);
      alert('✅ 10% discount applied!');
    } else if (coupon === 'SAVE20') {
      setDiscountApplied(0.20);
      alert('✅ 20% discount applied!');
    } else {
      alert('❌ Invalid coupon');
    }
  };

  const goToPayment = () => {
    if (cartItems.length === 0) {
      alert("Cart is empty. Add items before checkout.");
      return;
    }
    navigate('/payment', { state: { totalAmount: finalAmount, cartItems } });
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * (item.quantity || 1), 0
  );
  const discount = subtotal * discountApplied;
  const finalAmount = subtotal - discount;

  return (
    <div className="cart-container">
      <div className="cart-main">
        {/* Left - Cart Items */}
        <div className="cart-items-section">
          <div className="cart-items-container">
            {cartItems.length === 0 ? (
              <div className="empty-cart">
                <div className="empty-cart-title">
                  Your Surakshit Cart is empty
                </div>
                <div className="empty-cart-subtitle">
                  Your Shopping Cart lives to serve. Give it purpose — fill it with books, electronics, videos, etc. and make it happy.
                </div>
              </div>
            ) : (
              <>
                <div className="cart-items-header">
                  <div className="cart-items-title">
                    Shopping Cart ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
                  </div>
                  <div className="cart-items-subtitle">
                    Price
                  </div>
                </div>

                {cartItems.map((item, index) => (
                  <div key={index} className={`cart-item ${index < cartItems.length - 1 ? 'cart-item-border' : ''}`}>
                    <div className="cart-item-image-container">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="cart-item-image"
                      />
                    </div>

                    <div className="cart-item-details">
                      <h3 className="cart-item-name">{item.name}</h3>
                      
                      <div className="cart-item-stock">
                        In Stock
                      </div>

                      <div className="cart-item-shipping">
                        Eligible for FREE Shipping
                      </div>

                      <div className="cart-item-actions">
                        <div className="quantity-selector">
                          <label className="quantity-label">Qty:</label>
                          <select
                            value={item.quantity || 1}
                            onChange={(e) => handleQuantityChange(index, e)}
                            className="quantity-select"
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(q => (
                              <option key={q} value={q}>{q}</option>
                            ))}
                          </select>
                        </div>

                        <div className="action-divider"></div>

                        <button 
                          onClick={() => removeFromCart(index)}
                          className="action-button"
                        >
                          Delete
                        </button>

                        <div className="action-divider"></div>

                        <button 
                          onClick={() => moveToSaved(index)}
                          className="action-button"
                        >
                          Save for later
                        </button>
                      </div>
                    </div>

                    <div className="cart-item-price">
                      <div className="item-total-price">
                        ₹{(item.price * (item.quantity || 1)).toFixed(2)}
                      </div>
                      <div className={`item-list-price ${item.quantity > 1 ? '' : 'strikethrough'}`}>
                        List: ₹{item.price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}

                <div className="cart-subtotal">
                  <div className="subtotal-text">
                    Subtotal ({cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0)} {cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0) === 1 ? 'item' : 'items'}): 
                    <span className="subtotal-amount">
                      ₹{subtotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Saved for Later Section */}
          {savedItems.length > 0 && (
            <div className="saved-items-container">
              <h3 className="saved-items-title">
                Saved for later ({savedItems.length} {savedItems.length === 1 ? 'item' : 'items'})
              </h3>

              {savedItems.map((item, index) => (
                <div key={index} className={`saved-item ${index < savedItems.length - 1 ? 'saved-item-border' : ''}`}>
                  <div className="saved-item-image-container">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="saved-item-image"
                    />
                  </div>

                  <div className="saved-item-details">
                    <h4 className="saved-item-name">{item.name}</h4>
                    
                    <div className="saved-item-price">
                      ₹{item.price.toFixed(2)}
                    </div>

                    <div className="saved-item-actions">
                      <button onClick={() => {
                        updateCartItems([...cartItems, { ...item, quantity: 1 }]);
                        setSavedItems(savedItems.filter((_, i) => i !== index));
                      }} className="action-button">
                        Move to Cart
                      </button>

                      <div className="action-divider"></div>

                      <button onClick={() => setSavedItems(savedItems.filter((_, i) => i !== index))} className="action-button">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right - Summary Box */}
        <div className="cart-summary-section">
          <div className="cart-summary">
            <div className="summary-subtotal">
              {discountApplied > 0 ? (
                <>
                  Subtotal ({cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0)} {cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0) === 1 ? 'item' : 'items'}): 
                  <span className="summary-amount">
                    ₹{subtotal.toFixed(2)}
                  </span>
                  <br />
                  Discount Applied: 
                  <span className="summary-discount">
                    -₹{discount.toFixed(2)}
                  </span>
                  <br />
                  <strong>
                    Total: 
                    <span className="summary-final-amount">
                      ₹{finalAmount.toFixed(2)}
                    </span>
                  </strong>
                </>
              ) : (
                <>
                  Subtotal ({cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0)} {cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0) === 1 ? 'item' : 'items'}): 
                  <span className="summary-amount">
                    ₹{subtotal.toFixed(2)}
                  </span>
                </>
              )}
            </div>

            <button onClick={goToPayment} className="checkout-button">
              Proceed to checkout
            </button>

            <div className="coupon-section">
              <div className="coupon-title">
                Apply Coupon Code
              </div>
              
              <input
                type="text"
                placeholder="Enter coupon code"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                className="coupon-input"
              />
              
              <button onClick={applyCoupon} className="coupon-button">
                Apply
              </button>

              <div className="coupon-hint">
                Valid codes: SAVE10 (10% off), SAVE20 (20% off)
              </div>

              {discountApplied > 0 && (
                <div className="discount-applied">
                  Discount Applied: -₹{discount.toFixed(2)}
                </div>
              )}

              {discountApplied > 0 && (
                <div className="final-total">
                  Final Total: 
                  <span className="final-amount">
                    ₹{finalAmount.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cart;
