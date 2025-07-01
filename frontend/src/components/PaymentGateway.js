import { useState } from 'react'; 
import { useNavigate, useLocation } from 'react-router-dom'; 
import axios from 'axios'; 
import DeliveryDetails from './DeliveryDetails'; // Reusable, independent component 
import './PaymentGateway.css'; 
 
function PaymentGateway({ clearCart }) { 
  const navigate = useNavigate(); 
  const location = useLocation(); 
  const amount = location.state?.totalAmount || 0; 
  const cartItems = location.state?.cartItems || []; 
 
  const [step, setStep] = useState(1); 
  const [deliveryDetails, setDeliveryDetails] = useState({ 
    name: '', 
    address: '', 
    address2: '', 
    city: '', 
    state: '', 
    pin: '', 
    country: 'India', 
    phone: '', 
    instructions: '', 
  }); 
  const [paymentMethod, setPaymentMethod] = useState(''); 
 
  const handleDeliveryNext = () => { 
    const { name, address, city, state, pin, phone } = deliveryDetails; 
    if (!name || !address || !city || !state || !pin || !phone) { 
      alert("⚠️ Please complete all delivery details."); 
      return; 
    } 
    setStep(2); 
  }; 
 
  const saveOrder = () => { 
    const previousOrders = JSON.parse(localStorage.getItem('orders')) || []; 
    const newOrder = { 
      id: Date.now(), 
      items: cartItems, 
      amount, 
      deliveryDetails, 
      paymentMethod, 
      date: new Date().toLocaleString(), 
      status: "Processing", 
    }; 
    localStorage.setItem('orders', JSON.stringify([...previousOrders, newOrder])); 
  }; 
 
  const handlePayment = () => { 
    if (!paymentMethod) { 
      alert("⚠️ Please select a payment method."); 
      return; 
    } 
 
    alert(`✅ Payment successful via ${paymentMethod}!`); 
 
    axios.post('http://127.0.0.1:5001/recommend', { history: cartItems }) 
      .then(res => { 
        saveOrder(); 
        clearCart(); 
        navigate('/order-confirmation', { 
          state: { recommendations: res.data, deliveryDetails }, 
        }); 
      }) 
      .catch(err => { 
        console.error("Recommendation fetch error:", err); 
        saveOrder(); 
        clearCart(); 
        navigate('/order-confirmation', { 
          state: { recommendations: [], deliveryDetails }, 
        }); 
      }); 
  }; 
 
  return ( 
    <div className="payment-gateway">
      <div className="payment-container">
        {/* Progress Bar */}
        <div className="progress-bar">
          <div className="progress-step">
            <div className={`step-circle ${step >= 1 ? 'active' : ''}`}>
              <span>1</span>
            </div>
            <span className="step-label">Delivery Details</span>
          </div>
          <div className="progress-line"></div>
          <div className="progress-step">
            <div className={`step-circle ${step >= 2 ? 'active' : ''}`}>
              <span>2</span>
            </div>
            <span className="step-label">Payment Method</span>
          </div>
        </div>

        {step === 1 && ( 
          <div className="step-container">
            <div className="step-header">
            </div>
            <DeliveryDetails 
              details={deliveryDetails} 
              setDetails={setDeliveryDetails} 
              onContinue={handleDeliveryNext} 
            /> 
          </div>
        )} 
 
        {step === 2 && ( 
          <div className="step-container">
            <div className="step-header">
              <h2>Select Payment Method</h2>
              <p>Choose your preferred payment option</p>
            </div>

            <div className="payment-section">
              <div className="payment-options">
                <div 
                  className={`payment-option ${paymentMethod === 'Card' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('Card')}
                >
                  <div className="payment-icon">💳</div>
                  <div className="payment-info">
                    <h4>Credit/Debit Card</h4>
                    <p>Visa, MasterCard, American Express</p>
                  </div>
                  <div className="payment-radio">
                    <input 
                      type="radio" 
                      name="payment" 
                      checked={paymentMethod === 'Card'}
                      onChange={() => setPaymentMethod('Card')}
                    />
                  </div>
                </div>

                <div 
                  className={`payment-option ${paymentMethod === 'UPI' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('UPI')}
                >
                  <div className="payment-icon">📱</div>
                  <div className="payment-info">
                    <h4>UPI</h4>
                    <p>Pay using UPI apps like GPay, PhonePe, Paytm</p>
                  </div>
                  <div className="payment-radio">
                    <input 
                      type="radio" 
                      name="payment" 
                      checked={paymentMethod === 'UPI'}
                      onChange={() => setPaymentMethod('UPI')}
                    />
                  </div>
                </div>

                <div 
                  className={`payment-option ${paymentMethod === 'NetBanking' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('NetBanking')}
                >
                  <div className="payment-icon">💼</div>
                  <div className="payment-info">
                    <h4>Net Banking</h4>
                    <p>All major banks supported</p>
                  </div>
                  <div className="payment-radio">
                    <input 
                      type="radio" 
                      name="payment" 
                      checked={paymentMethod === 'NetBanking'}
                      onChange={() => setPaymentMethod('NetBanking')}
                    />
                  </div>
                </div>

                <div 
                  className={`payment-option ${paymentMethod === 'COD' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('COD')}
                >
                  <div className="payment-icon">💵</div>
                  <div className="payment-info">
                    <h4>Cash on Delivery</h4>
                    <p>Pay when your order arrives</p>
                  </div>
                  <div className="payment-radio">
                    <input 
                      type="radio" 
                      name="payment" 
                      checked={paymentMethod === 'COD'}
                      onChange={() => setPaymentMethod('COD')}
                    />
                  </div>
                </div>
              </div>

              {paymentMethod && ( 
                <div className="payment-form">
                  <div className="form-group">
                    <input 
                      type="text" 
                      className="payment-input"
                      placeholder={`Enter ${paymentMethod} details...`} 
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary & Payment Button */}
            <div className="order-summary">
              <div className="summary-content">
                <h3>Order Summary</h3>
                <div className="summary-row">
                  <span>Items ({cartItems.length})</span>
                  <span>₹{amount}</span>
                </div>
                <div className="summary-row">
                  <span>Delivery Charges</span>
                  <span className="free">FREE</span>
                </div>
                <div className="summary-divider"></div>
                <div className="summary-row total">
                  <span>Total</span>
                  <span>₹{amount}</span>
                </div>
              </div>
              
              {paymentMethod && (
                <button className="pay-button" onClick={handlePayment}>
                  <span className="pay-text">Pay ₹{amount}</span>
                  <span className="pay-method">via {paymentMethod}</span>
                </button>
              )}
            </div>
          </div>
        )} 
      </div>
    </div>
  ); 
} 
 
export default PaymentGateway;