import { useNavigate } from 'react-router-dom';
import './SidePanel.css';

function SidePanel({ closePanel, isAuthenticated, user, logout, isOpen }) {
  const navigate = useNavigate();

  const safeClose = () => {
    console.log('safeClose called');
    console.log('closePanel prop:', closePanel);
    console.log('typeof closePanel:', typeof closePanel);
    if (typeof closePanel === 'function') {
      console.log('Calling closePanel function');
      closePanel();
    } else {
      console.error('closePanel is not a function:', closePanel);
      // Fallback: try to find and hide the panel directly
      const overlay = document.querySelector('.side-panel-overlay');
      if (overlay) {
        console.log('Fallback: hiding panel directly');
        overlay.style.display = 'none';
      }
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
    safeClose();
  };

  return (
    <div className={`side-panel-overlay ${isOpen ? 'open' : 'closed'}`} onClick={safeClose}>
      <div className="side-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header Section */}
        <div className="panel-header">
          <div className="user-greeting">
            <div className="greeting-text">
              <span className="hello-text">Hello,</span>
              <span className="user-name">{user?.name || 'Guest'}</span>
            </div>
          </div>
          <button 
            className="close-btn" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Close button clicked');
              safeClose();
            }}
            aria-label="Close panel"
            type="button"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        {/* Navigation Links */}
        <div className="panel-content">
          <ul className="panel-links">
            <li className="panel-link-item" onClick={() => handleNavigation('/')}>
              <span className="link-icon">🏠</span>
              <span className="link-text">Home</span>
              <span className="link-arrow">›</span>
            </li>
            <li className="panel-link-item" onClick={() => handleNavigation('/cart')}>
              <span className="link-icon">🛒</span>
              <span className="link-text">My Cart</span>
              <span className="link-arrow">›</span>
            </li>
            <li className="panel-link-item" onClick={() => handleNavigation('/orders')}>
              <span className="link-icon">📦</span>
              <span className="link-text">My Orders</span>
              <span className="link-arrow">›</span>
            </li>
            <li className="panel-link-item" onClick={() => handleNavigation('/add-product')}>
              <span className="link-icon">➕</span>
              <span className="link-text">Add Product</span>
              <span className="link-arrow">›</span>
            </li>
          </ul>

          {isAuthenticated && (
            <div className="logout-section">
              <ul className="panel-links">
                <li 
                  className="panel-link-item logout-item" 
                  onClick={() => {
                    logout({ returnTo: window.location.origin });
                    safeClose();
                  }}
                >
                  <span className="link-icon">🚪</span>
                  <span className="link-text">Sign Out</span>
                  <span className="link-arrow">›</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SidePanel;