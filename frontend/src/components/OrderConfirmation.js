import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './OrderConfirmation.css';

function OrderConfirmation({ addToCart, clearCart }) {
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buttonStates, setButtonStates] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    // Get purchase history from localStorage 
    let history = JSON.parse(localStorage.getItem('purchaseHistory')) || [];
    
    // If no purchase history exists, try to get the last cart items before they were cleared
    if (history.length === 0) {
      history = JSON.parse(localStorage.getItem('lastPurchasedItems')) || [];
    }

    // Store the current cart items as purchase history before clearing
    const currentCart = JSON.parse(localStorage.getItem('cart')) || [];
    if (currentCart.length > 0) {
      // Add current cart items to purchase history
      const existingHistory = JSON.parse(localStorage.getItem('purchaseHistory')) || [];
      const updatedHistory = [...existingHistory, ...currentCart];
      localStorage.setItem('purchaseHistory', JSON.stringify(updatedHistory));
      
      // Also store as last purchased items for immediate use
      localStorage.setItem('lastPurchasedItems', JSON.stringify(currentCart));
      
      // Use the current cart as history for recommendations
      history = currentCart;
    }

    const boughtIds = history.map(p => p.id);

    console.log('Purchase history for recommendations:', history);

    // Fetch recommendations from ML backend (correct port and endpoint)
    axios.post('http://localhost:5001/recommend', { history })
      .then(res => {
        // ML backend returns recommendations directly
        const mlRecommendations = res.data.recommendations || res.data;
        const formattedRecommendations = mlRecommendations.map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          image: p.image,
          description: p.description,
          category: p.category
        }));

        setRecommended(formattedRecommendations);
        setLoading(false);
      })
      .catch(err => {
        console.error("ML backend recommendation error:", err);
        
        // Fallback: Try to get products directly from your Node.js backend
        axios.get('https://e-commerce-website-3-uo7o.onrender.com/api/products')
          .then(nodeRes => {
            const allProducts = nodeRes.data;
            // Filter out purchased items and get random recommendations
            const availableProducts = allProducts.filter(p => !boughtIds.includes(p.id));
            
            // Shuffle and take first 6 as recommendations
            const shuffled = availableProducts.sort(() => 0.5 - Math.random());
            const fallbackRecommended = shuffled.slice(0, 6).map(p => ({
              id: p.id,
              name: p.name,
              price: p.price,
              image: p.image,
              description: p.description,
              category: p.category
            }));

            setRecommended(fallbackRecommended);
            setLoading(false);
          })
          .catch(fallbackErr => {
            console.error("Fallback recommendation error:", fallbackErr);
            
            // Final fallback: Use DummyJSON
            axios.get('https://dummyjson.com/products?limit=8')
              .then(dummyRes => {
                const finalFallback = dummyRes.data.products
                  .slice(0, 6)
                  .map(p => ({
                    id: p.id + 1000,
                    name: p.title,
                    price: p.price,
                    image: p.thumbnail,
                    description: p.description,
                    category: p.category || "Others"
                  }));

                setRecommended(finalFallback);
                setLoading(false);
              })
              .catch(finalErr => {
                console.error("Final fallback error:", finalErr);
                setLoading(false);
              });
          });
      });

    // Clear cart after storing purchase history
    if (clearCart) {
      clearCart();
    }
  }, [clearCart]);

  const handleViewDetails = (product) => {
    navigate(`/product/${product.id}`);
  };

  const handleAddToCart = (product, event) => {
    addToCart(product);

    setButtonStates(prev => ({
      ...prev,
      [product.id]: { isAdded: true, disabled: true }
    }));

    setTimeout(() => {
      setButtonStates(prev => ({
        ...prev,
        [product.id]: { isAdded: false, disabled: false }
      }));
    }, 1000);
  };

  const ProductCard = ({ product }) => {
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const buttonState = buttonStates[product.id] || { isAdded: false, disabled: false };

    return (
      <div className={`product-card ${isHovered ? 'hovered' : ''}`}
           onMouseEnter={() => setIsHovered(true)}
           onMouseLeave={() => setIsHovered(false)}>
        <div className="product-image-container">
          <div className="image-link" onClick={() => handleViewDetails(product)}>
            <img 
              src={product.image}
              alt={product.name}
              className={`product-image ${isImageLoaded ? 'loaded' : ''}`}
              onLoad={() => setIsImageLoaded(true)}
              loading="lazy"
            />
          </div>
        </div>

        <div className="product-content">
          <div className="product-title-link" onClick={() => handleViewDetails(product)}>
            <h3 className="product-title">{product.name}</h3>
          </div>

          <div className="price-container">
            <span className="current-price">₹{product.price}</span>
          </div>

          <div className="product-actions">
            <button className="add-to-cart-btn"
                    onClick={(e) => handleAddToCart(product, e)}
                    disabled={buttonState.disabled}>
              {buttonState.isAdded ? 'Added' : 'Add to Cart'}
            </button>
            <button className="view-details-btn"
                    onClick={() => handleViewDetails(product)}>
              View Details
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="order-confirmation">
      <div className="success-banner">
        <div className="success-content">
          <div className="checkmark">✓</div>
          <div className="success-text">
            <h1>Order placed, thanks!</h1>
            <p>Your order has been received and is being processed.</p>
          </div>
        </div>
      </div>

      <div className="recommendations-container">
        <h2 className="section-title">Customers also bought</h2>
        
        {loading ? (
          <div className="loading">Loading recommendations...</div>
        ) : (
          <div className="products-row">
            {recommended.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      <div className="continue-shopping">
        <button className="continue-btn" onClick={() => navigate('/')}>
          Continue shopping
        </button>
      </div>
    </div>
  );
}

export default OrderConfirmation;
