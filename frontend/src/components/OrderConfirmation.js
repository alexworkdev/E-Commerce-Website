import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './OrderConfirmation.css';

function OrderConfirmation({ addToCart, clearCart }) {
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buttonStates, setButtonStates] = useState({});
  const navigate = useNavigate();

  // Smart recommendation algorithm 
  const generateSmartRecommendations = (purchasedItems, allProducts) => {
    if (!purchasedItems.length) {
      // No purchase history - return first 6 products consistently
      return allProducts.slice(0, 6);
    }

    const purchasedIds = new Set(purchasedItems.map(item => item.id));
    const purchasedCategories = [...new Set(purchasedItems.map(item => item.category))];
    const avgPurchasePrice = purchasedItems.reduce((sum, item) => sum + (item.price || 0), 0) / purchasedItems.length;
    
    // Filter out already purchased items
    const availableProducts = allProducts.filter(product => !purchasedIds.has(product.id));
    
    // Score products based on similarity to purchased items
    const scoredProducts = availableProducts.map(product => {
      let score = 0;
      
      // Category match (high priority)
      if (purchasedCategories.includes(product.category)) {
        score += 50;
      }
      
      // Price similarity 
      if (avgPurchasePrice > 0) {
        const priceDiff = Math.abs((product.price || 0) - avgPurchasePrice);
        const priceScore = Math.max(0, 30 - (priceDiff / avgPurchasePrice) * 30);
        score += priceScore;
      }
      
      // Add product ID as tiebreaker for consistent ordering
      score += (product.id % 100) / 100;
      
      return { ...product, score };
    });
    
    // Sort by score (highest first) and return top 6
    return scoredProducts
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(({ score, ...product }) => product);
  };

  useEffect(() => {
    let isMounted = true;
    
    // Get purchase history from localStorage (not the current cart)
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

    console.log('Purchase history for recommendations:', history);

    // Single API call strategy with proper timeout and error handling
    const fetchRecommendations = async () => {
      try {
        // Try ML backend first with timeout
        const mlResponse = await Promise.race([
          axios.post('http://localhost:5001/recommend', { history }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('ML timeout')), 2000)
          )
        ]);
        
        if (isMounted && mlResponse.data) {
          const mlRecommendations = mlResponse.data.recommendations || mlResponse.data;
          if (Array.isArray(mlRecommendations) && mlRecommendations.length > 0) {
            const formattedRecommendations = mlRecommendations.slice(0, 6).map(p => ({
              id: p.id,
              name: p.name,
              price: p.price,
              image: p.image,
              description: p.description,
              category: p.category
            }));
            setRecommended(formattedRecommendations);
            setLoading(false);
            return;
          }
        }
      } catch (mlError) {
        console.log("ML backend unavailable, using fallback");
      }

      // Fallback to main API with smart recommendations
      try {
        const nodeResponse = await axios.get('https://e-commerce-website-3-uo7o.onrender.com/api/products');
        
        if (isMounted && nodeResponse.data) {
          const smartRecommendations = generateSmartRecommendations(history, nodeResponse.data);
          const formattedRecommendations = smartRecommendations.map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            image: p.image,
            description: p.description,
            category: p.category
          }));
          
          setRecommended(formattedRecommendations);
          setLoading(false);
          return;
        }
      } catch (nodeError) {
        console.log("Main API unavailable, using final fallback");
      }

      // Final fallback with consistent selection
      try {
        const dummyResponse = await axios.get('https://dummyjson.com/products?limit=20');
        
        if (isMounted && dummyResponse.data?.products) {
          const dummyProducts = dummyResponse.data.products.map(p => ({
            id: p.id + 1000,
            name: p.title,
            price: p.price,
            image: p.thumbnail,
            description: p.description,
            category: p.category || "Others"
          }));
          
          const smartRecommendations = generateSmartRecommendations(history, dummyProducts);
          setRecommended(smartRecommendations);
          setLoading(false);
        }
      } catch (finalError) {
        console.error("All recommendation sources failed:", finalError);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchRecommendations();

    // Clear cart after storing purchase history
    if (clearCart) {
      clearCart();
    }

    return () => {
      isMounted = false;
    };
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
