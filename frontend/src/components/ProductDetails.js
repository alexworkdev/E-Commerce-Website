import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import './ProductDetails.css';

function ProductDetails({ addToCart }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedImage, setSelectedImage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    if (id >= 1000) {
      // DummyJSON Product
      axios.get(`https://dummyjson.com/products/${id - 1000}`)
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
          fetchRelatedDummy(fetchedProduct.category, parseInt(id));
          setLoading(false);
        })
        .catch(err => {
          console.error("DummyJSON fetch error:", err);
          setProduct(null);
          setLoading(false);
        });

    } else {
      // MongoDB Product
      axios.get(`http://localhost:5000/api/products/${id}`)
        .then(res => {
          const fetchedProduct = {
            ...res.data,
            id: res.data._id,
            rating: res.data.rating || 4.2
          };
          setProduct(fetchedProduct);
          setSelectedImage(fetchedProduct.image);
          fetchRelatedMongo(fetchedProduct.category, fetchedProduct._id);
          setLoading(false);
        })
        .catch(err => {
          console.error("MongoDB fetch error:", err);
          setProduct(null);
          setLoading(false);
        });
    }
  }, [id]);

  const fetchRelatedDummy = (category, excludeId) => {
    axios.get(`https://dummyjson.com/products/category/${category}`)
      .then(res => {
        const related = res.data.products
          .filter(p => p.id + 1000 !== excludeId)
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
    axios.get(`http://localhost:5000/api/products?category=${category}`)
      .then(res => {
        const related = res.data
          .filter(p => p._id !== excludeId)
          .slice(0, 4)
          .map(p => ({
            id: p._id,
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
          <h2 className="related-title">Customers who viewed this item also viewed</h2>
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
