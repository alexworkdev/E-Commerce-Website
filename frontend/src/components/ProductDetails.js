import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import './ProductDetails.css';

const backendURL = process.env.REACT_APP_API_BASE_URL;
const mlBackendURL = process.env.REACT_APP_ML_BACKEND_URL; 

function ProductDetails({ addToCart }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedImage, setSelectedImage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  setLoading(true);

  const isDummyId = !isNaN(id) && parseInt(id) >= 1000 && parseInt(id) <= 1100; 
  // Limit to expected DummyJSON range

  if (isDummyId) {
    const dummyId = parseInt(id) - 1000;
    if (dummyId <= 0 || dummyId > 100) {
      console.warn(`DummyJSON ID ${dummyId} is out of bounds`);
      setProduct(null);
      setLoading(false);
      return;
    }

    axios.get(`https://dummyjson.com/products/${dummyId}`)
      .then(res => {
        const fetchedProduct = {
          id: parseInt(id),
          name: res.data.title,
          price: res.data.price,
          image: res.data.thumbnail,
          description: res.data.description,
          category: res.data.category || "Others",
          rating: res.data.rating || 0
        };
        setProduct(fetchedProduct);
        setSelectedImage(fetchedProduct.image);
        
        // Track view and fetch ML recommendations for DummyJSON products
        trackProductView(fetchedProduct.id);
        fetchMLRecommendations(fetchedProduct);
        
        setLoading(false);
      })
      .catch(err => {
        console.error("DummyJSON fetch error:", err);
        setProduct(null);
        setLoading(false);
      });

  } else {
    // MongoDB Product
    axios.get(`${backendURL}/api/products/${id}`)
      .then(res => {
        const fetchedProduct = {
          ...res.data,
          id: res.data._id || res.data.id,
          rating: res.data.rating || 4.2
        };
        setProduct(fetchedProduct);
        setSelectedImage(fetchedProduct.image);
        
        // Track view and fetch ML recommendations for MongoDB products
        trackProductView(fetchedProduct.id);
        fetchMLRecommendations(fetchedProduct);
        
        setLoading(false);
      })
      .catch(err => {
        console.error("MongoDB fetch error:", err);
        setProduct(null);
        setLoading(false);
      });
  }
}, [id]);

  // Track product view for ML system
  const trackProductView = async (productId) => {
    // Check if ML backend URL is configured
    if (!mlBackendURL) {
      console.warn('ML Backend URL not configured, skipping view tracking');
      return;
    }

    try {
      // Fix: Use correct endpoint URL without /product/undefined/
      const trackingUrl = `${mlBackendURL}/track-view`;
      
      await axios.post(trackingUrl, {
        product_id: productId.toString() // Ensure it's a string
      });
      console.log(`✅ Tracked view for product ${productId}`);
    } catch (err) {
      console.error("Failed to track view:", err);
      // Don't break the user experience if tracking fails
    }
  };

  // Fetch ML-based recommendations
  const fetchMLRecommendations = async (currentProduct) => {
    // Check if ML backend URL is configured
    if (!mlBackendURL) {
      console.warn('ML Backend URL not configured, falling back to category-based recommendations');
      // Fallback to category-based recommendations
      if (currentProduct.id.toString().length > 10) {
        fetchRelatedMongo(currentProduct.category, currentProduct.id);
      } else {
        fetchRelatedDummy(currentProduct.category, parseInt(currentProduct.id));
      }
      return;
    }

    try {
      // Get user's purchase history from localStorage (or your state management)
      const purchaseHistory = JSON.parse(localStorage.getItem('purchaseHistory') || '[]');
      
      // Add current product to history for better recommendations
      const historyWithCurrent = [...purchaseHistory, {
        id: currentProduct.id,
        name: currentProduct.name,
        category: currentProduct.category,
        price: currentProduct.price
      }];

      // Fix: Use correct endpoint URL
      const recommendUrl = `${mlBackendURL}/recommend`;
      
      const response = await axios.post(recommendUrl, {
        history: historyWithCurrent,
        user_id: localStorage.getItem('userId') || 'anonymous',
        limit: 4 // Get 4 recommendations for related products section
      });

      if (response.data && response.data.recommendations) {
        // Convert ML recommendations to the format expected by your UI
        const formattedRecommendations = response.data.recommendations.map(rec => ({
          id: rec.id,
          name: rec.name,
          price: rec.price,
          image: rec.image,
          description: rec.description,
          category: rec.category,
          rating: rec.rating || 4.2,
          recommendation_reason: rec.recommendation_reason
        }));

        setRelatedProducts(formattedRecommendations);
        console.log(`✅ Fetched ${formattedRecommendations.length} ML recommendations`);
      }
    } catch (err) {
      console.error("Failed to fetch ML recommendations:", err);
      // Fallback to category-based recommendations
      if (currentProduct.id.toString().length > 10) {
        // MongoDB product
        fetchRelatedMongo(currentProduct.category, currentProduct.id);
      } else {
        // DummyJSON product
        fetchRelatedDummy(currentProduct.category, parseInt(currentProduct.id));
      }
    }
  };

  // Fallback functions (keep existing logic as backup)
  const fetchRelatedDummy = (category, excludeId) => {
    axios.get(`https://dummyjson.com/products/category/${category}`)
      .then(res => {
        const related = res.data.products
          .filter(p => (p.id + 1000).toString() !== excludeId.toString())
          .slice(0, 4)
          .map(p => ({
            id: p.id + 1000,
            name: p.title,
            price: p.price,
            image: p.thumbnail,
            description: p.description,
            category: p.category,
            rating: p.rating
          }));
        setRelatedProducts(related);
      })
      .catch(err => console.error("Related DummyJSON fetch error:", err));
  };

  const fetchRelatedMongo = (category, excludeId) => {
    if (!backendURL) return;

    axios.get(`${backendURL}/api/products?category=${category}`)
      .then(res => {
        const related = res.data
          .filter(p => p.id.toString() !== excludeId.toString())
          .slice(0, 4)
          .map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            image: p.image,
            description: p.description,
            category: p.category,
            rating: p.rating || 4.2
          }));
        setRelatedProducts(related);
      })
      .catch(err => console.error("Related MongoDB fetch error:", err));
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="star-rating">
        {'★'.repeat(fullStars)}
        {hasHalfStar && '☆'}
        {'☆'.repeat(emptyStars)}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="not-found-container">
        <div className="not-found-content">
          <h2>Product Not Found</h2>
          <p>The product you're looking for doesn't exist or has been removed.</p>
          <button onClick={() => navigate('/')} className="back-home-btn">
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="product-details-container">
      <div className="breadcrumb">
        <Link to="/" className="breadcrumb-link">Home</Link>
        <span className="breadcrumb-separator">›</span>
        <button onClick={() => navigate(`/?category=${product.category}`)} className="breadcrumb-category">
          {product.category}
        </button>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-current">{product.name}</span>
      </div>

      <div className="product-main">
        <div className="product-images">
          <div className="main-image-container">
            <img src={selectedImage} alt={product.name} className="main-image" />
          </div>
        </div>

        <div className="product-info">
          <h1 className="product-title">{product.name}</h1>

          <div className="rating-section">
            {renderStars(product.rating)}
            <span className="rating-text">({product.rating} out of 5)</span>
          </div>

          <div className="price-section">
            <span className="price-symbol">₹</span>
            <span className="price-value">{product.price}</span>
          </div>

          <div className="product-description">
            <h3>About this item</h3>
            <p>{product.description}</p>
          </div>

          <div className="product-category">
            <span className="category-label">Category:</span>
            <button onClick={() => navigate(`/?category=${product.category}`)} className="category-tag">
              {product.category}
            </button>
          </div>

          <div className="add-to-cart-section">
            <button onClick={() => addToCart(product)} className="add-to-cart-btn">
              <span className="cart-icon">🛒</span>
              Add to Cart
            </button>
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div className="related-products-section">
          <h2 className="related-title">Recommended for you</h2>
          <div className="related-products-grid">
            {relatedProducts.map(rp => (
              <div key={rp.id} className="related-product-card">
                <div className="related-product-image">
                  <img src={rp.image} alt={rp.name} />
                </div>
                <div className="related-product-info">
                  <h4 className="related-product-title">{rp.name}</h4>
                  <div className="related-product-rating">{renderStars(rp.rating)}</div>
                  <div className="related-product-price">₹{rp.price}</div>
                  {rp.recommendation_reason && (
                    <div className="recommendation-reason">{rp.recommendation_reason}</div>
                  )}
                  <Link to={`/product/${rp.id}`} className="view-details-btn">View Details</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductDetails;
