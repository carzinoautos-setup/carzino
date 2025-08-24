import React, { useState } from 'react';
import { Gauge, Settings, ChevronLeft, ChevronRight, Heart, Check } from 'lucide-react';

const VehicleCard = ({ vehicle, favorites, onFavoriteToggle }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [keeperMessage, setKeeperMessage] = useState(false);

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
          transition: box-shadow 200ms ease-in-out;
        }

        .vehicle-card:hover {
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }

        @media (max-width: 640px) {
          .vehicle-card {
            max-width: 100%;
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
          justify-content: space-between;
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

        .contact-info {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          flex-shrink: 0;
        }

        .call-dealer {
          font-size: 12px;
          font-weight: 500;
          color: #000000;
          cursor: pointer;
          transition: color 200ms ease-in-out;
        }

        .call-dealer:hover {
          color: #6B7280;
        }

        .dealer-phone {
          font-size: 12px;
          font-weight: 400;
          color: #000000;
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
            <div className="badges-group">
              {vehicle.badges?.map((badge, index) => (
                <span key={index} className="status-badge">
                  {badge}
                </span>
              ))}
              {vehicle.viewed && (
                <span className="viewed-badge">
                  Viewed <Check />
                </span>
              )}
            </div>
            <div className="badges-group">
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
            <div className="dealer-name">{vehicle.dealer}</div>
            <div className="dealer-location">{vehicle.location}</div>
          </div>
          <div className="contact-info">
            <div className="call-dealer">Call Dealer</div>
            <div className="dealer-phone">{vehicle.phone}</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default VehicleCard;
