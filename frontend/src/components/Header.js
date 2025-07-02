import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth0 } from "@auth0/auth0-react";
import SidePanel from './SidePanel';
import './Header.css';

function Header({ cartItems = [], setSearchTerm }) {
  const [localSearch, setLocalSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [panelOpen, setPanelOpen] = useState(false);
  
  const navigate = useNavigate();
  const { logout, isAuthenticated, user } = useAuth0();

  const backendURL = process.env.REACT_APP_API_BASE_URL;
  const mlBackendURL = process.env.REACT_APP_ML_BACKEND_URL;

  useEffect(() => {
  const fetchAllProducts = async () => {
    try {
      const response = await axios.get(`${backendURL}/api/products`);
      setAllProducts(response.data);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  if (backendURL) {
    fetchAllProducts();
  }
}, [backendURL]);

  const liveFilterSuggestions = async (searchValue) => {
    if (!searchValue.trim()) {
      setSuggestions([]);
      return;
    }

    const searchTerm = searchValue.toLowerCase();

    // Local Filtered Products
    const filtered = allProducts.filter(product =>
      product.name?.toLowerCase().includes(searchTerm) ||
      product.description?.toLowerCase().includes(searchTerm) ||
      product.category?.toLowerCase().includes(searchTerm)
    ).slice(0, 5);

    setSuggestions(filtered);

    // ML Backend Suggestions (Optional)
    try {
      const mlResponse = await axios.post(`${mlBackendURL}/predict`, { query: searchValue });
      if (mlResponse.data?.predictions) {
        const mlSuggestions = mlResponse.data.predictions.map(p => ({
          id: p.id,
          name: p.name,
          category: p.category,
          price: p.price,
          image: p.image,
          isMongo: true
        }));
        setSuggestions(prev => [...filtered, ...mlSuggestions].slice(0, 8));
      }
    } catch (err) {
      console.warn('ML Backend error or not reachable:', err);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setLocalSearch(value);
    liveFilterSuggestions(value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (localSearch.trim()) {
      setSearchTerm(localSearch.trim());
      setSuggestions([]);
      navigate(`/?search=${encodeURIComponent(localSearch.trim())}`);
    }
  };

  const handleSuggestionClick = (product) => {
    setSuggestions([]);
    setLocalSearch('');
    navigate(`/product/${product.id}`);
  };

  const handleOpenPanel = () => setPanelOpen(true);
  const handleClosePanel = () => setPanelOpen(false);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.search-bar')) {
        setSuggestions([]);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        setPanelOpen(false);
        setSuggestions([]);
      }
    };
    if (panelOpen) {
      document.addEventListener('keydown', escHandler);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.removeEventListener('keydown', escHandler);
      document.body.style.overflow = 'unset';
    };
  }, [panelOpen]);

  return (
    <>
      <header className="header">
        <div className="header-left">
          <button onClick={handleOpenPanel} className="menu-btn">☰</button>
          <div className="logo" onClick={() => navigate('/')}>SURAKSHIT STORE</div>
        </div>

        <div className="search-bar" style={{ position: 'relative' }}>
          <form onSubmit={handleSubmit} className="search-form">
            <input
              type="text"
              value={localSearch}
              onChange={handleInputChange}
              placeholder="Search here for products, brands....."
              className="search-input"
              autoComplete="off"
            />
            <button type="submit" className="search-btn">🔍</button>
          </form>

          {suggestions.length > 0 && (
            <div className="suggestion-box">
              {suggestions.map(product => (
                <div
                  key={`${product.id}-${product.isMongo ? 'mongo' : 'dummy'}`}
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(product)}
                >
                  <img
                    src={product.image || '/placeholder-image.jpg'}
                    alt={product.name}
                    onError={(e) => { e.target.src = '/placeholder-image.jpg'; }}
                  />
                  <div className="suggestion-content">
                    <strong className="suggestion-name">{product.name}</strong>
                    <div className="suggestion-category">in {product.category}</div>
                    <div className="suggestion-price">
                      ₹{product.price}
                      {product.isMongo && (
                        <span className="user-added-badge"> (DB)</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <nav className="nav-links">
          <Link to="/" className="nav-btn">Home</Link>
          <Link to="/cart" className="nav-btn">🛒 {cartItems.length}</Link>
          <Link to="/add-product" className="nav-btn add-product-highlight">+ Add Product</Link>
        </nav>
      </header>

      <SidePanel
        closePanel={handleClosePanel}
        isAuthenticated={isAuthenticated}
        user={user}
        logout={logout}
        isOpen={panelOpen}
      />
    </>
  );
}

export default Header;
