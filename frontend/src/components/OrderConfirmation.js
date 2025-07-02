import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './OrderConfirmation.css';

function OrderConfirmation({ addToCart, clearCart }) {
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buttonStates, setButtonStates] = useState({});
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Enhanced smart recommendation algorithm with better error handling
  const generateSmartRecommendations = (purchasedItems, allProducts) => {
    try {
      if (!Array.isArray(allProducts) || allProducts.length === 0) {
        console.warn('No products available for recommendations');
        return [];
      }

      if (!purchasedItems || !Array.isArray(purchasedItems) || purchasedItems.length === 0) {
        // No purchase history - return first 6 products consistently
        return allProducts.slice(0, 6);
      }

      const purchasedIds = new Set(purchasedItems.map(item => item?.id).filter(Boolean));
      const purchasedCategories = [...new Set(purchasedItems.map(item => item?.category).filter(Boolean))];
      const validPrices = purchasedItems.map(item => item?.price).filter(price => typeof price === 'number' && price > 0);
      const avgPurchasePrice = validPrices.length > 0 ? validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length : 0;
      
      // Filter out already purchased items and ensure valid products
      const availableProducts = allProducts.filter(product => 
        product && 
        product.id && 
        !purchasedIds.has(product.id) &&
        product.name &&
        typeof product.price === 'number'
      );
      
      if (availableProducts.length === 0) {
        console.warn('No available products after filtering');
        return [];
      }

      // Score products based on similarity to purchased items
      const scoredProducts = availableProducts.map(product => {
        let score = 0;
        
        // Category match (high priority)
        if (purchasedCategories.length > 0 && product.category && purchasedCategories.includes(product.category)) {
          score += 50;
        }
        
        // Price similarity 
        if (avgPurchasePrice > 0 && product.price > 0) {
          const priceDiff = Math.abs(product.price - avgPurchasePrice);
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
    } catch (error) {
      console.error('Error in generateSmartRecommendations:', error);
      return allProducts?.slice(0, 6) || [];
    }
  };

  // Enhanced axios instance with better defaults
  const createAxiosInstance = (timeout = 5000) => {
    return axios.create({
      timeout,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  };

  // Improved hardcoded fallback with more variety
  const getHardcodedRecommendations = () => {
    return [
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
  };

  // Safe localStorage operations
  const safeGetFromStorage = (key, defaultValue = []) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading from localStorage key "${key}":`, error);
      return defaultValue;
    }
  };

  const safeSetToStorage = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`Error writing to localStorage key "${key}":`, error);
      return false;
    }
  };

  useEffect(() => {
    let isMounted = true;
    let abortController = new AbortController();
    
    // Get purchase history from localStorage with error handling
    let history = safeGetFromStorage('purchaseHistory', []);
    
    // If no purchase history exists, try to get the last cart items before they were cleared
    if (history.length === 0) {
      history = safeGetFromStorage('lastPurchasedItems', []);
    }

    // Store the current cart items as purchase history before clearing
    const currentCart = safeGetFromStorage('cart', []);
    if (currentCart.length > 0) {
      // Add current cart items to purchase history
      const existingHistory = safeGetFromStorage('purchaseHistory', []);
      const updatedHistory = [...existingHistory, ...currentCart];
      safeSetToStorage('purchaseHistory', updatedHistory);
      
      // Also store as last purchased items for immediate use
      safeSetToStorage('lastPurchasedItems', currentCart);
      
      // Use the current cart as history for recommendations
      history = currentCart;
    }

    console.log('Purchase history for recommendations:', history);

    // Enhanced recommendation fetching with better error handling
    const fetchRecommendations = async () => {
      try {
        setError(null);

        // Skip ML backend if no purchase history (saves resources)
        if (history.length > 0) {
          try {
            console.log('Attempting ML backend...');
            const mlAxios = createAxiosInstance(2000); // Shorter timeout for ML
            const mlResponse = await mlAxios.post('http://localhost:5001/recommend', 
              { history },
              { signal: abortController.signal }
            );
            
            if (isMounted && mlResponse.data) {
              const mlRecommendations = mlResponse.data.recommendations || mlResponse.data;
              if (Array.isArray(mlRecommendations) && mlRecommendations.length > 0) {
                const formattedRecommendations = mlRecommendations.slice(0, 6).map(p => ({
                  id: p.id,
                  name: p.name || 'Unnamed Product',
                  price: typeof p.price === 'number' ? p.price : 0,
                  image: p.image || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=300&fit=crop',
                  description: p.description || 'No description available',
                  category: p.category || 'General'
                }));
                
                console.log('✅ ML recommendations loaded successfully');
                setRecommended(formattedRecommendations);
                setLoading(false);
                return;
              }
            }
          } catch (mlError) {
            if (mlError.name !== 'CanceledError') {
              console.log("ML backend unavailable:", mlError.message);
            }
          }
        }

        // Try main API with enhanced error handling
        let retryCount = 0;
        const maxRetries = 2;
        
        while (retryCount < maxRetries && isMounted) {
          try {
            console.log(`Attempting main API (attempt ${retryCount + 1})...`);
            const nodeAxios = createAxiosInstance(6000);
            const nodeResponse = await nodeAxios.get(
              'https://e-commerce-website-3-uo7o.onrender.com/api/products',
              { signal: abortController.signal }
            );
            
            if (isMounted && nodeResponse.data && Array.isArray(nodeResponse.data)) {
              const smartRecommendations = generateSmartRecommendations(history, nodeResponse.data);
              const formattedRecommendations = smartRecommendations.map(p => ({
                id: p.id,
                name: p.name || 'Unnamed Product',
                price: typeof p.price === 'number' ? p.price : 0,
                image: p.image || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=300&fit=crop',
                description: p.description || 'No description available',
                category: p.category || 'General'
              }));
              
              console.log('✅ Main API recommendations loaded successfully');
              setRecommended(formattedRecommendations);
              setLoading(false);
              return;
            }
          } catch (nodeError) {
            if (nodeError.name === 'CanceledError') {
              return; // Component unmounted
            }
            
            retryCount++;
            console.log(`Main API attempt ${retryCount} failed:`, nodeError.message);
            
            if (retryCount < maxRetries) {
              // Wait before retry with exponential backoff
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            }
          }
        }

        // Enhanced DummyJSON fallback with better error handling
        if (isMounted) {
          try {
            console.log("Attempting DummyJSON fallback...");
            const dummyAxios = createAxiosInstance(8000);
            
            // Use different endpoints to avoid resource exhaustion
            const endpoints = [
              'https://dummyjson.com/products?limit=20&skip=0',
              'https://dummyjson.com/products?limit=15&skip=5',
              'https://dummyjson.com/products?limit=10&skip=10'
            ];
            
            let dummyResponse = null;
            for (const endpoint of endpoints) {
              try {
                dummyResponse = await dummyAxios.get(endpoint, { signal: abortController.signal });
                if (dummyResponse.data?.products) {
                  break;
                }
              } catch (endpointError) {
                console.log(`DummyJSON endpoint failed: ${endpoint}`, endpointError.message);
                continue;
              }
            }
            
            if (isMounted && dummyResponse?.data?.products) {
              const dummyProducts = dummyResponse.data.products.map(p => ({
                id: (p.id || Math.random() * 10000) + 1000,
                name: p.title || 'Product',
                price: typeof p.price === 'number' ? p.price : Math.floor(Math.random() * 1000) + 100,
                image: p.thumbnail || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=300&fit=crop',
                description: p.description || 'No description available',
                category: p.category || "Electronics"
              }));
              
              const smartRecommendations = generateSmartRecommendations(history, dummyProducts);
              console.log('✅ DummyJSON fallback recommendations loaded successfully');
              setRecommended(smartRecommendations);
              setLoading(false);
              return;
            }
          } catch (finalError) {
            if (finalError.name !== 'CanceledError') {
              console.warn("DummyJSON also failed:", finalError.message);
            }
          }
        }

        // Last resort - hardcoded recommendations to prevent empty state
        if (isMounted) {
          console.log("Using hardcoded fallback recommendations");
          const hardcodedRecommendations = getHardcodedRecommendations();
          setRecommended(hardcodedRecommendations);
          setLoading(false);
        }

      } catch (error) {
        if (isMounted && error.name !== 'CanceledError') {
          console.error('Unexpected error in fetchRecommendations:', error);
          setError('Unable to load recommendations');
          setRecommended(getHardcodedRecommendations());
          setLoading(false);
        }
      }
    };

    fetchRecommendations();

    // Clear cart after storing purchase history
    if (clearCart) {
      try {
        clearCart();
      } catch (clearError) {
        console.warn('Error clearing cart:', clearError);
      }
    }

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [clearCart]);

  const handleViewDetails = (product) => {
    try {
      if (product && product.id) {
        navigate(`/product/${product.id}`);
      }
    } catch (error) {
      console.error('Error navigating to product details:', error);
    }
  };

  const handleAddToCart = (product, event) => {
    try {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }

      if (addToCart && product) {
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
        }, 1500);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const ProductCard = ({ product }) => {
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [imageError, setImageError] = useState(false);
    const buttonState = buttonStates[product.id] || { isAdded: false, disabled: false };

    const handleImageError = () => {
      setImageError(true);
    };

    const defaultImage = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=300&fit=crop';

    return (
      <div className={`product-card ${isHovered ? 'hovered' : ''}`}
           onMouseEnter={() => setIsHovered(true)}
           onMouseLeave={() => setIsHovered(false)}>
        <div className="product-image-container">
          <div className="image-link" onClick={() => handleViewDetails(product)}>
            <img 
              src={imageError ? defaultImage : (product.image || defaultImage)}
              alt={product.name || 'Product'}
              className={`product-image ${isImageLoaded ? 'loaded' : ''}`}
              onLoad={() => setIsImageLoaded(true)}
              onError={handleImageError}
              loading="lazy"
            />
          </div>
        </div>

        <div className="product-content">
          <div className="product-title-link" onClick={() => handleViewDetails(product)}>
            <h3 className="product-title">{product.name || 'Unnamed Product'}</h3>
          </div>

          <div className="price-container">
            <span className="current-price">
              ₹{typeof product.price === 'number' ? product.price : 0}
            </span>
          </div>

          <div className="product-actions">
            <button className="add-to-cart-btn"
                    onClick={(e) => handleAddToCart(product, e)}
                    disabled={buttonState.disabled}>
              {buttonState.isAdded ? 'Added ✓' : 'Add to Cart'}
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
          <div className="loading">
            <div className="loading-spinner"></div>
            <span>Loading recommendations...</span>
          </div>
        ) : error ? (
          <div className="error-message">
            <p>{error}</p>
            <p>Showing popular products instead.</p>
          </div>
        ) : null}

        {!loading && (
          <div className="products-row">
            {recommended.length > 0 ? (
              recommended.map(product => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="no-recommendations">
                <p>No recommendations available at the moment.</p>
                <button onClick={() => navigate('/')} className="browse-btn">
                  Browse Products
                </button>
              </div>
            )}
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
