import React, { useState } from 'react';
import { Gauge, Settings, ChevronLeft, ChevronRight, Heart, Check } from 'lucide-react';

const VehicleCard = ({ vehicle, favorites, onFavoriteToggle }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [keeperMessage, setKeeperMessage] = useState(false);

  // Helper functions to extract seller data
  const getSellerField = (fieldName) => {
    const metaData = vehicle.meta_data || [];

    // Debug: Log what fields are available
    if (fieldName === 'acount_name_seller') {
      console.log('🔍 Available meta fields for vehicle:', vehicle.title);
      console.log('Meta data keys:', metaData.map(m => m.key));
    }

    const sellerField = metaData.find(meta => meta.key === fieldName);
    const value = sellerField?.value || '';

    // Debug: Log the specific field we're looking for
    if (fieldName === 'acount_name_seller') {
      console.log(`📝 Field '${fieldName}' value:`, value);
    }

    return value;
  };

  const getCondition = () => {
    const condition = getSellerField('condition');
    if (condition && condition.trim() !== '') {
      return condition;
    }
    // Check other possible condition field names
    const vehicleCondition = getSellerField('vehicle_condition') || getSellerField('condition_seller');
    if (vehicleCondition && vehicleCondition.trim() !== '') {
      return vehicleCondition;
    }
    // Only use stock status as last resort, with different text
    return vehicle.stock_status === 'instock' ? 'In Stock' : 'Sold';
  };

  const getDrivetrain = () => {
    return getSellerField('drivetrain') || getSellerField('drive_type') || 'N/A';
  };

  const getSellerName = () => {
    // Primary field: exactly as used in WordPress shortcode [seller_field field="acount_name_seller"]
    const primarySellerName = getSellerField('acount_name_seller');

    if (primarySellerName && primarySellerName.trim() !== '') {
      console.log('✅ Found acount_name_seller:', primarySellerName);
      return primarySellerName;
    }

    // Try alternative field names as fallbacks
    const altSellerName = getSellerField('account_name_seller') ||
                         getSellerField('seller_name') ||
                         getSellerField('dealer_name');

    if (altSellerName && altSellerName.trim() !== '') {
      console.log('⚠️ Using alternative seller field:', altSellerName);
      return altSellerName;
    }

    // Fallback to vehicle.dealer, but make sure it's not the features text
    const dealerFallback = vehicle.dealer || 'Dealer';

    // Check if dealer field contains features (long text with commas)
    if (dealerFallback.includes(',') && dealerFallback.length > 50) {
      console.log('❌ Dealer field contains features, using generic name');
      return 'Dealer'; // Return generic name if it's features text
    }

    console.log('🔄 Using fallback dealer name:', dealerFallback);
    return dealerFallback;
  };

  const getSellerLocation = () => {
    const state = getSellerField('state_seller');
    const zip = getSellerField('zip_seller');
    if (state && zip) {
      return `${state}, ${zip}`;
    }
    return vehicle.location || 'Location not available';
  };

  const getSellerType = () => {
    return getSellerField('account_type_seller') || 'Dealer';
  };

  const getSellerPhone = () => {
    return getSellerField('phone_number_seller') || vehicle.phone || '(253) 555-0100';
  };

  // Distance calculation functionality (matching WordPress shortcode [vehicle_distance])
  const getUserZip = () => {
    // Match the WordPress system: check URL params, then cookies, then localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const zipFromUrl = urlParams.get('customer_zip') || urlParams.get('user_zip');
    if (zipFromUrl) return zipFromUrl;

    // Check cookies (matching WordPress cookie system)
    const getCookie = (name) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
      return null;
    };
    const zipFromCookie = getCookie('customer_zip');
    if (zipFromCookie) return zipFromCookie;

    // Fallback to localStorage
    try {
      return localStorage.getItem('customer_zip');
    } catch (e) {
      return null;
    }
  };

  const getSellerCoordinates = () => {
    // Get coordinates from seller account (matching WordPress field names)
    const lat = getSellerField('car_location_latitude') ||
               getSellerField('seller_latitude') ||
               getSellerField('latitude') ||
               getSellerField('lat');

    const lng = getSellerField('car_location_longitude') ||
               getSellerField('seller_longitude') ||
               getSellerField('longitude') ||
               getSellerField('lng');

    if (lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
      return {
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      };
    }
    return null;
  };

  // Haversine formula for distance calculation (matching WordPress implementation)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Get user coordinates from ZIP (simplified version - in full implementation, this would call your geocoding API)
  const getUserCoordinatesFromZip = (zip) => {
    // This is a simplified lookup table for common ZIP codes
    // In your full implementation, this would call your WordPress geocoding API
    const zipCoords = {
      '98498': { lat: 47.127, lng: -122.529 }, // Lakewood, WA
      '98032': { lat: 47.384, lng: -122.235 }, // Kent, WA
      '98001': { lat: 47.312, lng: -122.335 }, // Auburn, WA
      '98004': { lat: 47.614, lng: -122.214 }, // Bellevue, WA
      '98101': { lat: 47.610, lng: -122.334 }, // Seattle, WA
      '98027': { lat: 47.544, lng: -122.147 }, // Issaquah, WA
      '98055': { lat: 47.418, lng: -122.235 }, // Renton, WA
      '98052': { lat: 47.669, lng: -122.121 }, // Redmond, WA
    };
    return zipCoords[zip] || null;
  };

  const getDistanceDisplay = () => {
    const userZip = getUserZip();
    if (!userZip) return null;

    const userCoords = getUserCoordinatesFromZip(userZip);
    const sellerCoords = getSellerCoordinates();

    if (!userCoords || !sellerCoords) return null;

    const distance = calculateDistance(
      userCoords.lat, userCoords.lng,
      sellerCoords.lat, sellerCoords.lng
    );

    return Math.round(distance) + ' miles away';
  };

  const toggleFavorite = () => {
    const wasAlreadyFavorited = favorites[vehicle.id];
    onFavoriteToggle(vehicle.id, vehicle);
    
    if (!wasAlreadyFavorited) {
      setKeeperMessage(true);
      setTimeout(() => setKeeperMessage(false), 2000);
    }
  };

  const currentIndex = currentImageIndex;
  const totalImages = vehicle.images?.length || 1;

  const nextImage = () => {
    setCurrentImageIndex((currentIndex + 1) % totalImages);
  };

  const prevImage = () => {
    setCurrentImageIndex(currentIndex === 0 ? totalImages - 1 : currentIndex - 1);
  };

  return (
    <>
      <style>{`
        .vehicle-card {
          width: 100%;
          max-width: 380px;
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          overflow: hidden;
          transition: box-shadow 200ms ease-in-out;
          box-sizing: border-box;
        }

        .vehicle-card:hover {
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }

        @media (max-width: 640px) {
          .vehicle-card {
            max-width: 100%;
            width: 100%;
            margin: 0;
          }
        }

        .image-container {
          position: relative;
          width: 100%;
          height: 200px;
          overflow: hidden;
          border-radius: 12px 12px 0 0;
        }

        .vehicle-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          aspect-ratio: 16/9;
        }

        .featured-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          background: #CF0D0D;
          color: white;
          padding: 6px 12px;
          border-radius: 50px;
          font-size: 12px;
          font-weight: 500;
        }

        .nav-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 24px;
          height: 24px;
          background: rgba(0, 0, 0, 0.5);
          color: white;
          border: none;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 200ms ease-in-out;
          padding: 0;
        }

        .nav-arrow:hover {
          background: rgba(0, 0, 0, 0.7);
        }

        .nav-arrow-left {
          left: 8px;
        }

        .nav-arrow-right {
          right: 8px;
        }

        .nav-arrow svg {
          width: 16px;
          height: 16px;
        }

        .image-counter {
          position: absolute;
          bottom: 12px;
          right: 12px;
          background: rgba(0, 0, 0, 0.6);
          color: white;
          padding: 4px 8px;
          border-radius: 50px;
          font-size: 12px;
          font-weight: 400;
        }

        .content-section {
          padding: 12px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .badges-row {
          display: flex;
          justify-content: flex-start;
          align-items: center;
          gap: 8px;
          height: 24px;
          margin-bottom: 8px;
        }

        .badges-group {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .left-badges {
          display: flex;
          gap: 8px;
          align-items: center;
          flex: 1;
        }

        .right-badges {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .status-badge {
          background: #F9FAFB;
          color: rgb(21, 41, 109);
          padding: 4px 8px;
          border-radius: 7px;
          font-size: 12px;
          font-weight: 500;
        }

        .viewed-badge {
          background: white;
          border: 1px solid #E5E7EB;
          color: rgb(21, 41, 109);
          padding: 4px 8px;
          border-radius: 7px;
          font-size: 12px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .viewed-badge svg {
          width: 12px;
          height: 12px;
        }

        .favorite-heart {
          width: 16px;
          height: 16px;
          color: #CF0D0D;
          cursor: pointer;
          transition: color 200ms ease-in-out;
          margin-left: 4px;
        }

        .keeper-message {
          font-size: 12px;
          color: #6B7280;
          margin-left: 4px;
          animation: pulse 2s ease-in-out;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .vehicle-title {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          line-height: 1.2;
          margin-bottom: 8px;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        @media (max-width: 640px) {
          .vehicle-title {
            font-size: 18px;
          }
        }

        .details-bar {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #E5E7EB;
        }

        .detail-group {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .detail-group svg {
          width: 16px;
          height: 16px;
          color: #6B7280;
        }

        .detail-text {
          font-size: 12px;
          font-weight: 500;
          color: #000000;
        }

        @media (max-width: 640px) {
          .detail-text {
            font-size: 14px;
          }
        }

        .pricing-section {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
          margin-bottom: 4px;
          min-height: 48px;
          flex: 1;
        }

        .price-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .price-label {
          font-size: 12px;
          font-weight: 400;
          color: #6B7280;
          margin-bottom: 2px;
        }

        .price-value {
          font-size: 16px;
          font-weight: 700;
        }

        .price-value.sale {
          color: #000000;
        }

        .price-value.payment {
          color: #CF0D0D;
        }

        .price-divider {
          width: 1px;
          height: 48px;
          background: #E5E7EB;
        }

        @media (max-width: 640px) {
          .price-label {
            font-size: 14px;
          }
          .price-value {
            font-size: 18px;
          }
        }

        .dealer-section {
          background: #F9FAFB;
          border-top: 1px solid #F3F4F6;
          padding: 12px 8px;
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-top: auto;
          border-radius: 0 0 12px 12px;
        }

        .dealer-info {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-width: 0;
        }

        .dealer-name {
          font-size: 12px;
          font-weight: 500;
          color: #111827;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .dealer-location {
          font-size: 12px;
          font-weight: 400;
          color: #000000;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .dealer-distance {
          font-size: 11px;
          font-weight: 400;
          color: #6B7280;
          font-style: italic;
          margin-top: 2px;
        }

        .contact-info {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          flex-shrink: 0;
        }

        .seller-type {
          font-size: 12px;
          font-weight: 500;
          color: #000000;
          margin-bottom: 4px;
        }

        .dealer-phone {
          font-size: 12px;
          font-weight: 400;
          color: #000000;
          text-decoration: none;
          transition: color 200ms ease-in-out;
        }

        .dealer-phone:hover {
          color: #6B7280;
          text-decoration: underline;
        }

        @media (max-width: 640px) {
          .featured-badge,
          .image-counter,
          .status-badge,
          .viewed-badge,
          .detail-text,
          .price-label,
          .dealer-name,
          .dealer-location,
          .call-dealer,
          .dealer-phone {
            font-size: 14px;
          }
          .price-value {
            font-size: 18px;
          }
        }
      `}</style>
      
      <div className="vehicle-card">
        <div className="image-container">
          <img
            src={vehicle.images ? vehicle.images[currentIndex] : vehicle.image}
            alt={vehicle.title}
            className="vehicle-image"
            loading="lazy"
          />
          
          {vehicle.featured && (
            <div className="featured-badge">
              Featured!
            </div>
          )}
          
          {vehicle.images && vehicle.images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="nav-arrow nav-arrow-left"
                aria-label="Previous image"
              >
                <ChevronLeft />
              </button>
              <button
                onClick={nextImage}
                className="nav-arrow nav-arrow-right"
                aria-label="Next image"
              >
                <ChevronRight />
              </button>
              <div className="image-counter">
                {currentIndex + 1}/{totalImages}
              </div>
            </>
          )}
        </div>

        <div className="content-section">
          <div className="badges-row">
            <div className="left-badges">
              <span className="status-badge">
                {getCondition()}
              </span>
              <span className="status-badge">
                {getDrivetrain()}
              </span>
              {vehicle.viewed && (
                <span className="viewed-badge">
                  Viewed <Check />
                </span>
              )}
            </div>
            <div className="right-badges">
              <Heart
                className={`favorite-heart ${
                  favorites[vehicle.id]
                    ? 'fill-current'
                    : 'fill-white stroke-current'
                }`}
                onClick={toggleFavorite}
                aria-label={favorites[vehicle.id] ? 'Remove from favorites' : 'Add to favorites'}
              />
              {keeperMessage && (
                <span className="keeper-message">
                  That's a Keeper!
                </span>
              )}
            </div>
          </div>

          <h3 className="vehicle-title">
            {vehicle.title}
          </h3>

          <div className="details-bar">
            <div className="detail-group">
              <Gauge />
              <span className="detail-text">{vehicle.mileage} miles</span>
            </div>
            <div className="detail-group">
              <Settings />
              <span className="detail-text">{vehicle.transmission}</span>
            </div>
            <div className="detail-group">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="16" rx="2"/>
                <path d="M7 4v16"/>
              </svg>
              <span className="detail-text">{vehicle.doors}</span>
            </div>
          </div>

          <div className="pricing-section">
            {vehicle.salePrice ? (
              <>
                <div className="price-group">
                  <div className="price-label">Sale Price</div>
                  <div className="price-value sale">{vehicle.salePrice}</div>
                </div>
                {vehicle.payment && (
                  <>
                    <div className="price-divider"></div>
                    <div className="price-group">
                      <div className="price-label">Payments</div>
                      <div className="price-value payment">
                        {vehicle.payment}
                        <span style={{fontSize: '12px', fontWeight: '400', color: '#000000'}}>/mo*</span>
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="price-group">
                <div className="price-label">No Sale Price Listed</div>
                <div className="price-value sale">Call For Pricing</div>
              </div>
            )}
          </div>
        </div>

        <div className="dealer-section">
          <div className="dealer-info">
            <div className="dealer-name">{getSellerName()}</div>
            <div className="dealer-location">{getSellerLocation()}</div>
            {getDistanceDisplay() && (
              <div className="dealer-distance">{getDistanceDisplay()}</div>
            )}
          </div>
          <div className="contact-info">
            <div className="seller-type">{getSellerType()}</div>
            <a
              href={`tel:${getSellerPhone()}`}
              className="dealer-phone"
            >
              {getSellerPhone()}
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default VehicleCard;
