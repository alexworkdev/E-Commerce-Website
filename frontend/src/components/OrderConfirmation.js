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

    // Robust recommendation fetching with multiple fallbacks
    const fetchRecommendations = async () => {
      // Skip ML backend if no purchase history (saves resources)
      if (history.length > 0) {
        try {
          // Try ML backend first with shorter timeout
          const mlResponse = await Promise.race([
            axios.post('http://localhost:5001/recommend', { history }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('ML timeout')), 1500)
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
          console.log("ML backend unavailable:", mlError.message);
        }
      }

      // Try main API with timeout and retry logic
      let retryCount = 0;
      const maxRetries = 2;
      
      while (retryCount < maxRetries) {
        try {
          const nodeResponse = await Promise.race([
            axios.get('https://e-commerce-website-3-uo7o.onrender.com/api/products', {
              timeout: 5000,
              headers: {
                'Cache-Control': 'no-cache'
              }
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('API timeout')), 5000)
            )
          ]);
          
          if (isMounted && nodeResponse.data && Array.isArray(nodeResponse.data)) {
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
          retryCount++;
          console.log(`Main API attempt ${retryCount} failed:`, nodeError.message);
          if (retryCount < maxRetries) {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      // Final fallback - DummyJSON with error handling
      try {
        console.log("Using DummyJSON fallback");
        const dummyResponse = await Promise.race([
          axios.get('https://dummyjson.com/products?limit=30&skip=0'),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('DummyJSON timeout')), 8000)
          )
        ]);
        
        if (isMounted && dummyResponse.data?.products) {
          const dummyProducts = dummyResponse.data.products.map(p => ({
            id: p.id + 1000,
            name: p.title,
            price: p.price,
            image: p.thumbnail,
            description: p.description,
            category: p.category || "Electronics"
          }));
          
          const smartRecommendations = generateSmartRecommendations(history, dummyProducts);
          setRecommended(smartRecommendations);
          setLoading(false);
          return;
        }
      } catch (finalError) {
        console.error("DummyJSON also failed:", finalError.message);
      }

      // Last resort - hardcoded recommendations to prevent empty state
      if (isMounted) {
        console.log("Using hardcoded fallback recommendations");
        const hardcodedRecommendations = [
          {
            id: 9001,
            name: "Premium Wireless Headphones",
            price: 2999,
            image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop",
            description: "High-quality wireless headphones with noise cancellation",
            category: "Electronics"
          },
          {
            id: 9002,
            name: "Smart Fitness Watch",
            price: 1999,
            image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop",
            description: "Track your health and fitness goals with this smart watch",
            category: "Electronics"
          },
          {
            id: 9003,
            name: "Portable Bluetooth Speaker",
            price: 1499,
            image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=300&h=300&fit=crop",
            description: "Compact speaker with premium sound quality",
            category: "Electronics"
          },
          {
            id: 9004,
            name: "Wireless Phone Charger",
            price: 899,
            image: "https://images.unsplash.com/photo-1609592424916-9a4853aeb811?w=300&h=300&fit=crop",
            description: "Fast wireless charging pad for all compatible devices",
            category: "Electronics"
          },
          {
            id: 9005,
            name: "USB-C Cable Set",
            price: 599,
            image: "https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=300&h=300&fit=crop",
            description: "Durable USB-C cables for all your devices",
            category: "Accessories"
          },
          {
            id: 9006,
            name: "Phone Case Premium",
            price: 799,
            image: "https://images.unsplash.com/photo-1556656793-08538906a9f8?w=300&h=300&fit=crop",
            description: "Protective case with elegant design",
            category: "Accessories"
          }
        ];
        
        setRecommended(hardcodedRecommendations);
        setLoading(false);
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
