import './ProductCard.css';
import { Link } from 'react-router-dom';
import { useState } from 'react';

function ProductCard({ product, addToCart }) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleAddToCart = () => {
    addToCart(product);
  };

  return (
    <div 
      className={`product-card ${isHovered ? 'hovered' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="product-image-container">
        <Link to={`/product/₹{product.id}`} className="image-link">
          <img 
            src={product.image} 
            alt={product.name}
            className={`product-image ${isImageLoaded ? 'loaded' : ''}`}
            onLoad={() => setIsImageLoaded(true)}
            loading="lazy"
          />
        </Link>
        {product.discount && (
          <div className="discount-badge">
            -{product.discount}%
          </div>
        )}
      </div>
      
      <div className="product-content">
        <Link to={`/product/${product.id}`} className="product-title-link">
          <h3 className="product-title">{product.name}</h3>
        </Link>
        
        {product.rating && (
          <div className="product-rating">
            <div className="stars">
              {[...Array(5)].map((_, i) => (
                <span 
                  key={i} 
                  className={`star ${i < Math.floor(product.rating) ? 'filled' : ''}`}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="rating-count">
              ({product.reviewCount || 0})
            </span>
          </div>
        )}
        
        <div className="price-container">
          {product.originalPrice && (
            <span className="original-price">${product.originalPrice}</span>
          )}
          <span className="current-price">${product.price}</span>
          {product.originalPrice && (
            <span className="savings">
              Save ${(product.originalPrice - product.price).toFixed(2)}
            </span>
          )}
        </div>
        
        {product.freeShipping && (
          <div className="shipping-info">
            <span className="free-shipping">FREE Shipping</span>
          </div>
        )}
        
        <div className="product-actions">
          <button 
            className="add-to-cart-btn"
            onClick={handleAddToCart}
          >
            Add to Cart
          </button>
          <Link to={`/product/${product.id}`} className="view-details-link">
            <button className="view-details-btn">
              View Details
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;