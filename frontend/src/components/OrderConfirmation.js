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
    const history = JSON.parse(localStorage.getItem('cart')) || [];
    const boughtIds = history.map(p => p.id);

    // Fetch recommendations from MongoDB backend
    axios.post('http://localhost:5000/api/recommend', { history })
      .then(res => {
        const mongoRecommended = res.data.filter(p => !boughtIds.includes(p._id)).map(p => ({
          id: p._id,
          name: p.name,
          price: p.price,
          image: p.image,
          description: p.description,
          category: p.category
        }));

        // Fetch DummyJSON recommendations to show variety
        axios.get('https://dummyjson.com/products?limit=100')
          .then(dummyRes => {
            const dummyRecommended = dummyRes.data.products
              .filter(p => !boughtIds.includes(p.id + 1000))
              .slice(0, 4)
              .map(p => ({
                id: p.id + 1000,
                name: p.title,
                price: p.price,
                image: p.thumbnail,
                description: p.description,
                category: p.category || "Others"
              }));

            setRecommended([...mongoRecommended, ...dummyRecommended]);
            setLoading(false);
          })
          .catch(err => {
            console.error("DummyJSON fetch error:", err);
            setRecommended(mongoRecommended);
            setLoading(false);
          });
      })
      .catch(err => {
        console.error("MongoDB recommendation error:", err);
        setLoading(false);
      });

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
