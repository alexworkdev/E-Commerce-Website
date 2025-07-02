import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './ProductList.css';

const backendURL = process.env.REACT_APP_API_BASE_URL;
const mlBackendURL = process.env.REACT_APP_ML_BACKEND_URL;

function ProductList({ addToCart, refreshFlag, searchTerm = '' }) {
  const [allProducts, setAllProducts] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const queryCategory = new URLSearchParams(location.search).get('category');
    setActiveCategory(queryCategory || 'All');
  }, [location.search]);

  const fetchAllProductsAndCategories = async () => {
    try {
      const [mongoRes, dummyRes] = await Promise.all([
        axios.get(`${backendURL}/api/products`),
        axios.get('https://dummyjson.com/products?limit=100')
      ]);

      const mongoProducts = mongoRes.data.map(p => ({
        ...p,
        category: p.category || "Others"
      }));

      const dummyProducts = dummyRes.data.products.map(p => ({
        id: p.id + 1000,
        name: p.title,
        price: p.price,
        image: p.thumbnail,
        description: p.description,
        category: p.category || "Others"
      }));

      const combinedProducts = [...mongoProducts, ...dummyProducts];
      setAllProducts(combinedProducts);

      const combinedCategories = ['All', ...new Set(combinedProducts.map(p => p.category))];
      setCategories(combinedCategories);

    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart')) || [];
      const [recommendRes, dummyRes] = await Promise.all([
        axios.post(`${mlBackendURL}/recommend`, { history: cart }),
        axios.get('https://dummyjson.com/products?limit=100')
      ]);

      const dummyRecommendations = dummyRes.data.products
        .filter(p => !cart.some(c => c.id === p.id + 1000))
        .slice(0, 4)
        .map(p => ({
          id: p.id + 1000,
          name: p.title,
          price: p.price,
          image: p.thumbnail,
          description: p.description,
          category: p.category || "Others"
        }));

      const combinedRecs = Array.isArray(recommendRes.data.recommendations) 
        ? recommendRes.data.recommendations 
        : recommendRes.data;

      setRecommended([...combinedRecs, ...dummyRecommendations]);

    } catch (err) {
      console.error("Recommendation fetch error:", err);
    }
  };

  useEffect(() => {
    setAllProducts([]);
    setCategories([]);
    fetchAllProductsAndCategories();
    fetchRecommendations();
  }, [refreshFlag]);

  const deleteProduct = (id) => {
    if (id >= 1000) return alert("❌ Cannot delete DummyJSON products.");
    if (!window.confirm("Delete this product?")) return;

    axios.delete(`${backendURL}/api/delete-product/${id}`)
      .then(() => {
        alert("✅ Product deleted successfully!");
        fetchAllProductsAndCategories();
      })
      .catch(err => console.error("Delete error:", err));
  };

  const filteredProducts = allProducts.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = activeCategory === 'All' || p.category === activeCategory;
    return matchSearch && matchCategory;
  });

  const handleCategoryClick = (cat) => {
    navigate(cat === 'All' ? '/' : `/?category=${cat}`);
  };

  return (
    <div className="product-container">
      <div className="category-filter">
        {categories.map(cat => (
          <button
            key={cat}
            className={activeCategory === cat ? 'active' : ''}
            onClick={() => handleCategoryClick(cat)}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      <div className="product-section">
        <h2>All Products</h2>
        <div className="product-grid">
          {filteredProducts.map(product => (
            <div key={product.id} className="product-card">
              <img src={product.image} alt={product.name} />
              <h4>{product.name}</h4>
              <p>₹{product.price}</p>
              <p className="category-tag">{product.category}</p>
              <button onClick={() => addToCart(product)}>Add to Cart</button>
              <Link to={`/product/${product.id}`} className="details-link">View Details</Link>
              {product.id < 1000 && (
                <button className="delete-btn" onClick={() => deleteProduct(product.id)}>Delete</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {recommended.length > 0 && (
        <div className="product-section">
          <h2>Recommended for You</h2>
          <div className="product-grid">
            {recommended.map(product => (
              <div key={product.id} className="product-card">
                <img src={product.image} alt={product.name} />
                <h4>{product.name}</h4>
                <p>₹{product.price}</p>
                <p className="category-tag">{product.category}</p>
                <button onClick={() => addToCart(product)}>Add to Cart</button>
                <Link to={`/product/${product.id}`} className="details-link">View Details</Link>
                {product.id < 1000 && (
                  <button className="delete-btn" onClick={() => deleteProduct(product.id)}>Delete</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductList;
