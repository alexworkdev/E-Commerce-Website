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

  // Use environment variables like ProductDetails.js
  const backendURL = process.env.REACT_APP_API_BASE_URL;
  const mlBackendURL = process.env.REACT_APP_ML_BACKEND_URL;

  // Enhanced axios instance with better defaults for ML backend
  const createMLAxiosInstance = () => {
    return axios.create({
      timeout: 15000, // Reduced timeout
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      maxRedirects: 0, // Prevent redirect loops
      validateStatus: (status) => status >= 200 && status < 300
    });
  };

  // Enhanced axios instance with better defaults for regular backend
  const createAxiosInstance = (timeout = 6000) => {
    return axios.create({
      timeout, // Reduced default timeout
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 300
    });
  };

  // Request queue to prevent resource exhaustion
  const requestQueue = [];
  let activeRequests = 0;
  const MAX_CONCURRENT_REQUESTS = 3;

  const queueRequest = (requestFn) => {
    return new Promise((resolve, reject) => {
      requestQueue.push({ requestFn, resolve, reject });
      processQueue();
    });
  };

  const processQueue = async () => {
    if (activeRequests >= MAX_CONCURRENT_REQUESTS || requestQueue.length === 0) {
      return;
    }

    activeRequests++;
    const { requestFn, resolve, reject } = requestQueue.shift();

    try {
      const result = await requestFn();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      activeRequests--;
      // Process next request in queue
      setTimeout(processQueue, 100);
    }
  };

  // Simplified retry logic with resource management
  const axiosRetry = async (axiosInstance, config, maxRetries = 2) => {
    return queueRequest(async () => {
      let lastError;
      
      for (let i = 0; i < maxRetries; i++) {
        try {
          return await axiosInstance(config);
        } catch (error) {
          lastError = error;
          console.warn(`Request attempt ${i + 1} failed:`, error.message);
          
          // Don't retry on certain errors or resource errors
          if (error.response?.status === 404 || 
              error.response?.status === 400 || 
              error.code === 'ERR_INSUFFICIENT_RESOURCES') {
            break;
          }
          
          // Shorter wait time to prevent resource buildup
          if (i < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
          }
        }
      }
      
      throw lastError;
    });
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

  // Simplified ML recommendations with resource management
  const fetchMLRecommendations = async (purchaseHistory) => {
    // Check if ML backend URL is configured
    if (!mlBackendURL) {
      console.warn('ML Backend URL not configured, falling back to category-based recommendations');
      return await fetchFallbackRecommendations(purchaseHistory);
    }

    try {
      console.log('🔍 Fetching ML recommendations for order confirmation...');
      
      // Single request approach - no separate health check to save resources
      const mlAxios = createMLAxiosInstance();
      
      // Prepare history in the format expected by ML backend
      const historyWithDetails = purchaseHistory.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        price: item.price,
        description: item.description || '',
        image: item.image || ''
      }));

      // Direct recommendation request
      const recommendUrl = `${mlBackendURL}/recommend`;
      
      const response = await axiosRetry(mlAxios, {
        method: 'post',
        url: recommendUrl,
        data: {
          history: historyWithDetails,
          user_id: localStorage.getItem('userId') || 'anonymous',
          limit: 6 // Get 6 recommendations for order confirmation
        },
        timeout: 20000 // Reduced timeout
      }, 1); // Only 1 retry to save resources

      if (response.data && response.data.recommendations) {
        // Convert ML recommendations to the format expected by UI
        const formattedRecommendations = response.data.recommendations.map(rec => ({
          id: rec.id,
          name: rec.name,
          price: rec.price,
          image: rec.image,
          description: rec.description,
          category: rec.category,
          rating: rec.rating || 4.2,
          recommendation_reason: rec.recommendation_reason || 'Recommended for you'
        }));

        console.log(`✅ Fetched ${formattedRecommendations.length} ML recommendations`);
        return formattedRecommendations;
      }
    } catch (err) {
      console.error("Failed to fetch ML recommendations:", err);
      
      // Skip fallback attempts if we're hitting resource limits
      if (err.code === 'ERR_INSUFFICIENT_RESOURCES') {
        console.error('Browser resource limit reached - using hardcoded recommendations');
        return getHardcodedRecommendations();
      }
      
      // Try fallback only for other errors
      return await fetchFallbackRecommendations(purchaseHistory);
    }
  };

  // Resource-aware fallback recommendations
  const fetchFallbackRecommendations = async (purchaseHistory) => {
    console.log('🔄 Using fallback recommendation methods...');
    
    // Try fallback methods with resource awareness
    let recommendations = [];
    
    try {
      // 1. Try category-based from MongoDB first (most relevant)
      if (purchaseHistory.length > 0) {
        const categories = [...new Set(purchaseHistory.map(item => item.category).filter(Boolean))];
        recommendations = await fetchCategoryBasedRecommendations(categories, purchaseHistory);
      }
      
      // 2. If no recommendations and no resource errors, try DummyJSON
      if (recommendations.length === 0) {
        recommendations = await fetchDummyJSONRecommendations();
      }
    } catch (fallbackError) {
      console.warn('Fallback methods failed:', fallbackError.message);
    }
    
    // 3. Final fallback to hardcoded (always works)
    if (recommendations.length === 0) {
      recommendations = getHardcodedRecommendations();
    }
    
    return recommendations;
  };

  const fetchCategoryBasedRecommendations = async (categories, excludeItems) => {
    if (!backendURL || categories.length === 0) return [];
    
    try {
      const excludeIds = excludeItems.map(item => item.id.toString());
      const allRecommendations = [];
      const backendAxios = createAxiosInstance();
      
      // Limit to first 2 categories to reduce requests
      const limitedCategories = categories.slice(0, 2);
      
      for (const category of limitedCategories) {
        try {
          const response = await axiosRetry(backendAxios, {
            method: 'get',
            url: `${backendURL}/api/products?category=${category}`,
            timeout: 6000 // Shorter timeout
          }, 1); // Only 1 retry
          
          const categoryProducts = response.data
            .filter(p => !excludeIds.includes(p.id.toString()))
            .slice(0, 3) // Get more from each category since we're limiting categories
            .map(p => ({
              id: p.id,
              name: p.name,
              price: p.price,
              image: p.image,
              description: p.description,
              category: p.category,
              rating: p.rating || 4.2
            }));
          allRecommendations.push(...categoryProducts);
        } catch (categoryError) {
          console.warn(`Failed to fetch category ${category}:`, categoryError.message);
          // Don't throw, just continue with other categories
        }
      }
      
      console.log(`✅ Fetched ${allRecommendations.length} category-based recommendations`);
      return allRecommendations.slice(0, 6);
    } catch (err) {
      console.error("Category-based recommendations failed:", err);
      return [];
    }
  };

  const fetchDummyJSONRecommendations = async () => {
    try {
      const dummyAxios = createAxiosInstance();
      const response = await axiosRetry(dummyAxios, {
        method: 'get',
        url: 'https://dummyjson.com/products?limit=12', // Get more to have variety
        timeout: 6000 // Shorter timeout
      }, 1); // Only 1 retry
      
      const dummyProducts = response.data.products.map(p => ({
        id: p.id + 1000, // Convert to frontend format
        name: p.title,
        price: p.price,
        image: p.thumbnail,
        description: p.description,
        category: p.category,
        rating: p.rating || 4.2
      }));
      
      // Shuffle and take 6
      const shuffled = dummyProducts.sort(() => Math.random() - 0.5);
      console.log(`✅ Fetched ${shuffled.slice(0, 6).length} DummyJSON recommendations`);
      return shuffled.slice(0, 6);
    } catch (err) {
      console.error("DummyJSON recommendations failed:", err);
      return [];
    }
  };

  // Improved hardcoded fallback with more variety
  const getHardcodedRecommendations = () => {
    console.log('📦 Using hardcoded recommendations as final fallback');
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

  useEffect(() => {
    let isMounted = true;
    let abortController = new AbortController();
    
    const fetchRecommendations = async () => {
      try {
        setError(null);
        setLoading(true);

        // Get purchase history from localStorage
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

        console.log('🛒 Purchase history for recommendations:', history);

        // Fetch recommendations using ML backend or fallback
        const recommendations = await fetchMLRecommendations(history);
        
        if (isMounted) {
          setRecommended(recommendations);
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

    // Start fetching recommendations
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
  }, [clearCart, mlBackendURL, backendURL]);

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

          {product.recommendation_reason && (
            <div className="recommendation-reason">
              <small>{product.recommendation_reason}</small>
            </div>
          )}

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
