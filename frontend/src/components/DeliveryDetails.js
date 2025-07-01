import React from 'react';
import './DeliveryDetails.css';

function DeliveryDetails({ details, setDetails, onContinue }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onContinue();
  };

  const handleInputChange = (field, value) => {
    setDetails({ ...details, [field]: value });
  };

  return (
    <div className="delivery-page">
      <div className="delivery-container">
        {/* Header Section */}
        <div className="delivery-header">
          <h1 className="delivery-title">Delivery Information</h1>
          <p className="delivery-subtitle">When finished, click the "Continue" button.</p>
        </div>

        {/* Main Form Container */}
        <div className="form-card">
          <form className="delivery-form" onSubmit={handleSubmit}>
            <div className="form-fields">
              <div className="form-group">
                <label htmlFor="name" className="input-label">
                  Full Name:
                </label>
                <input
                  id="name"
                  type="text"
                  value={details.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  className="delivery-input"
                  autoComplete="name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="address" className="input-label">
                  Address Line 1:
                  <span className="label-subtitle">(or company name) House name/number and street, P.O. box, company name, c/o</span>
                </label>
                <input
                  id="address"
                  type="text"
                  value={details.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  required
                  className="delivery-input"
                  autoComplete="street-address"
                />
              </div>

              <div className="form-group">
                <label htmlFor="address2" className="input-label">
                  Address Line 2:
                  <span className="label-subtitle">(optional) Apartment, suite, unit, building, floor, etc.</span>
                </label>
                <input
                  id="address2"
                  type="text"
                  value={details.address2 || ''}
                  onChange={(e) => handleInputChange('address2', e.target.value)}
                  className="delivery-input"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city" className="input-label">
                    Town/City:
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={details.city || ''}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    required
                    className="delivery-input"
                    autoComplete="address-level2"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="state" className="input-label">
                    State:
                  </label>
                  <input
                    id="state"
                    type="text"
                    value={details.state || ''}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    required
                    className="delivery-input"
                    autoComplete="address-level1"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="pin" className="input-label">
                    Postcode:
                  </label>
                  <input
                    id="pin"
                    type="text"
                    value={details.pin || ''}
                    onChange={(e) => handleInputChange('pin', e.target.value)}
                    required
                    className="delivery-input small-input"
                    pattern="\d{4,6}"
                    title="Enter valid PIN code"
                    autoComplete="postal-code"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="country" className="input-label">
                    Country:
                  </label>
                  <select
                    id="country"
                    value={details.country || 'India'}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="delivery-select"
                    autoComplete="country"
                  >
                    <option value="India">India</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="Japan">Japan</option>
                    <option value="South Korea">South Korea</option>
                    <option value="Russia">Russia</option>
                    <option value="Sri Lanka">Sri Lanka</option>
                    <option value="Thailand">Thailand</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="phone" className="input-label">
                  Phone Number:
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={details.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  required
                  className="delivery-input"
                  pattern="^\+?\d{7,15}$"
                  title="Enter valid phone number"
                  autoComplete="tel"
                />
              </div>

              <div className="checkbox-group">
                <div className="checkbox-item">
                  <input
                    type="radio"
                    id="same-address"
                    name="addressType"
                    value="same"
                    defaultChecked
                    className="radio-input"
                  />
                  <label htmlFor="same-address" className="checkbox-label">
                    Yes
                  </label>
                </div>
                <div className="checkbox-item">
                  <input
                    type="radio"
                    id="different-address"
                    name="addressType"
                    value="different"
                    className="radio-input"
                  />
                  <label htmlFor="different-address" className="checkbox-label">
                    No 
                  </label>
                </div>
                <p className="checkbox-description">Is this address also your invoice address?</p>
              </div>
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button type="submit" className="continue-btn">
                Continue
              </button>
              
              <div className="address-accuracy">
                <h4 className="accuracy-title">Address Accuracy</h4>
                <p className="accuracy-text">
                  Incorrectly entered addresses may delay your order, so please double-check for accuracy.
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default DeliveryDetails;   