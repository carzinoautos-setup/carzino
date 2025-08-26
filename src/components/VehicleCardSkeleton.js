import React from 'react';

const VehicleCardSkeleton = () => {
  return (
    <>
      <style>{`
        .skeleton-card {
          width: 100%;
          max-width: 380px;
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          overflow: hidden;
          box-sizing: border-box;
        }

        .skeleton-image {
          width: 100%;
          height: 200px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }

        .skeleton-content {
          padding: 12px;
        }

        .skeleton-badges {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
        }

        .skeleton-badge {
          width: 60px;
          height: 20px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          border-radius: 7px;
          animation: shimmer 1.5s infinite;
        }

        .skeleton-title {
          width: 80%;
          height: 16px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          border-radius: 4px;
          margin-bottom: 12px;
          animation: shimmer 1.5s infinite;
        }

        .skeleton-details {
          display: flex;
          gap: 16px;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #E5E7EB;
        }

        .skeleton-detail {
          width: 50px;
          height: 12px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          border-radius: 4px;
          animation: shimmer 1.5s infinite;
        }

        .skeleton-pricing {
          display: flex;
          justify-content: center;
          gap: 24px;
          margin-bottom: 12px;
          min-height: 48px;
          align-items: center;
        }

        .skeleton-price {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .skeleton-price-label {
          width: 60px;
          height: 12px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          border-radius: 4px;
          animation: shimmer 1.5s infinite;
        }

        .skeleton-price-value {
          width: 80px;
          height: 16px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          border-radius: 4px;
          animation: shimmer 1.5s infinite;
        }

        .skeleton-divider {
          width: 1px;
          height: 48px;
          background: #E5E7EB;
        }

        .skeleton-dealer {
          background: #F9FAFB;
          border-top: 1px solid #F3F4F6;
          padding: 12px 8px;
          display: flex;
          justify-content: space-between;
          align-items: start;
          border-radius: 0 0 12px 12px;
        }

        .skeleton-dealer-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .skeleton-dealer-name {
          width: 100px;
          height: 12px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          border-radius: 4px;
          animation: shimmer 1.5s infinite;
        }

        .skeleton-dealer-location {
          width: 80px;
          height: 12px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          border-radius: 4px;
          animation: shimmer 1.5s infinite;
        }

        .skeleton-contact {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }

        .skeleton-phone {
          width: 90px;
          height: 12px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          border-radius: 4px;
          animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        @media (max-width: 640px) {
          .skeleton-card {
            max-width: 100%;
            width: 100%;
            margin: 0;
          }
        }
      `}</style>
      
      <div className="skeleton-card">
        <div className="skeleton-image"></div>
        
        <div className="skeleton-content">
          <div className="skeleton-badges">
            <div className="skeleton-badge"></div>
            <div className="skeleton-badge"></div>
          </div>

          <div className="skeleton-title"></div>

          <div className="skeleton-details">
            <div className="skeleton-detail"></div>
            <div className="skeleton-detail"></div>
            <div className="skeleton-detail"></div>
          </div>

          <div className="skeleton-pricing">
            <div className="skeleton-price">
              <div className="skeleton-price-label"></div>
              <div className="skeleton-price-value"></div>
            </div>
            <div className="skeleton-divider"></div>
            <div className="skeleton-price">
              <div className="skeleton-price-label"></div>
              <div className="skeleton-price-value"></div>
            </div>
          </div>
        </div>

        <div className="skeleton-dealer">
          <div className="skeleton-dealer-info">
            <div className="skeleton-dealer-name"></div>
            <div className="skeleton-dealer-location"></div>
          </div>
          <div className="skeleton-contact">
            <div className="skeleton-phone"></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default VehicleCardSkeleton;
