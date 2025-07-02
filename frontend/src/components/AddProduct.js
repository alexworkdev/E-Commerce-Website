import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './AddProduct.css';

// Fetch Backend URLs from .env
const backendURL = process.env.REACT_APP_API_BASE_URL;
const mlBackendURL = process.env.REACT_APP_ML_BACKEND_URL;

function AddProduct({ onProductAdded }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const [dummyRes, mongoRes] = await Promise.all([
          axios.get('https://dummyjson.com/products/categories'),
          axios.get(`${backendURL}/api/products`)
        ]);

        const dummyCategories = dummyRes.data.map(cat =>
          cat.charAt(0).toUpperCase() + cat.slice(1)
        );

        const mongoCategories = [...new Set(
          mongoRes.data.map(p =>
            p.category ? p.category.charAt(0).toUpperCase() + p.category.slice(1) : null
          ).filter(Boolean)
        )];

        const combined = [...new Set([...dummyCategories, ...mongoCategories])];
        setCategories(combined);

      } catch (err) {
        console.error("Category fetch error:", err);
      }
    };

    fetchCategories();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim() || !price || !image.trim() || !description.trim() || !category.trim()) {
      toast.error("❌ Please fill all fields");
      return;
    }

    setIsLoading(true);

    const payload = {
      name: name.trim(),
      price: parseFloat(price),
      image: image.trim(),
      description: description.trim(),
      category: category.trim()
    };

    axios.post(`${backendURL}/api/add-product`, payload)
      .then(() => {
        toast.success("✅ Product added successfully!");
        if (onProductAdded) onProductAdded();
        navigate('/');
      })
      .catch(err => {
        console.error("Add product error:", err);
        toast.error("❌ Failed to add product");
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <div className="add-product-container">
      <div className="add-product-card">
        <div className="card-header">
          <h1 className="card-title">Add New Product</h1>
          <p className="card-subtitle">Fill in the details to add a new product to your inventory</p>
        </div>

        <form onSubmit={handleSubmit} className="product-form">

          <div className="form-group">
            <label className="form-label">Product Category <span className="required">*</span></label>
            <input
              list="category-list"
              placeholder="Select or type a category"
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="form-input"
              disabled={isLoading}
            />
            <datalist id="category-list">
              {categories.map(cat => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>

          <div className="form-group">
            <label className="form-label">Product Name <span className="required">*</span></label>
            <input
              type="text"
              placeholder="Enter product name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="form-input"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Price <span className="required">*</span></label>
            <div className="price-input-wrapper">
              <span className="currency-symbol">₹</span>
              <input
                type="number"
                placeholder="0.00"
                value={price}
                min="0"
                step="0.01"
                onChange={e => setPrice(e.target.value)}
                className="form-input price-input"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Image URL <span className="required">*</span></label>
            <input
              type="url"
              placeholder="https://example.com/image.jpg"
              value={image}
              onChange={e => setImage(e.target.value)}
              className="form-input"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Product Description <span className="required">*</span></label>
            <textarea
              placeholder="Describe your product..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows="4"
              className="form-textarea"
              disabled={isLoading}
            ></textarea>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn btn-secondary"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span> Adding Product...
                </>
              ) : (
                'Add Product'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddProduct;
