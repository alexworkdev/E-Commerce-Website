import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ProductCard from './ProductCard';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const ML_BACKEND_URL = process.env.REACT_APP_ML_BACKEND_URL;

function ProductList() {
  const [products, setProducts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [category, setCategory] = useState('All');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recLoading, setRecLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [category]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/products`, {
        params: { category }
      });
      setProducts(res.data);
      console.log("✅ Products fetched:", res.data.length);

      if (res.data.length > 0) {
        fetchRecommendations(res.data.slice(0, 3)); // Simulate user history with first 3
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/categories`);
      setCategories(['All', ...res.data]);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchRecommendations = async (history) => {
    setRecLoading(true);
    try {
      const res = await axios.post(`${ML_BACKEND_URL}/recommend`, {
        history,
        user_id: "demo_user"
      });
      setRecommendations(res.data.recommendations || []);
      console.log("🎯 Recommendations fetched:", res.data.recommendations.length);
    } catch (err) {
      console.error('Recommendation fetch error:', err);
    }
    setRecLoading(false);
  };

  const handleProductClick = (id, isMongo) => {
    navigate(`/product/${id}?isMongo=${isMongo}`);
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-3">Product Catalog</h2>

      <div className="mb-3">
        <select className="form-select w-50" value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map(cat => (
            <option key={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {loading ? <p>Loading products...</p> : (
        <div className="row">
          {products.map(p => (
            <div key={p.id} className="col-md-4 mb-3">
              <ProductCard product={p} onClick={() => handleProductClick(p.id, p.isMongo)} />
            </div>
          ))}
        </div>
      )}

      <h3 className="mt-5">Recommended For You</h3>

      {recLoading ? <p>Loading recommendations...</p> : (
        <div className="row">
          {recommendations.map(p => (
            <div key={p.id} className="col-md-4 mb-3">
              <ProductCard product={p} onClick={() => handleProductClick(p.id, p.isMongo)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductList;
