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
        .carzino-featured-badge { font-size: 12px; font-weight: 500; }
        .carzino-badge-label { font-size: 12px; font-weight: 500; }
        .carzino-vehicle-title { font-size: 16px; font-weight: 600; }
        .carzino-vehicle-details { font-size: 12px; font-weight: 400; }
        .carzino-price-label { font-size: 12px; font-weight: 400; }
        .carzino-price-value { font-size: 16px; font-weight: 700; }
        .carzino-image-counter { font-size: 12px; font-weight: 400; }

        /* Mobile responsive - increases font sizes */
        @media (max-width: 640px) {
          .carzino-featured-badge { font-size: 14px; }
          .carzino-badge-label { font-size: 14px; }
          .carzino-vehicle-title { font-size: 18px; }
          .carzino-vehicle-details { font-size: 13px; }
          .carzino-price-label { font-size: 14px; }
          .carzino-price-value { font-size: 18px; }
          .carzino-image-counter { font-size: 14px; }
        }

        /* Card max width constraints */
        .vehicle-card {
          max-width: 380px;
          width: 100%;
        }
      `}</style>
      
      <div className="bg-white border border-gray-200 rounded-lg lg:rounded-xl overflow-hidden hover:shadow-lg transition-shadow vehicle-card flex flex-col h-full">
        <div className="relative">
          <img 
            src={vehicle.images ? vehicle.images[currentIndex] : vehicle.image} 
            alt={vehicle.title}
            className="w-full object-cover"
            style={{ height: '200px' }}
          />
          {vehicle.featured && (
            <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1.5 rounded-full carzino-featured-badge font-medium">
              Featured!
            </div>
          )}
          
          {vehicle.images && vehicle.images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-green-500 hover:bg-green-600 text-white p-2 rounded-full transition-all"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-green-500 hover:bg-green-600 text-white p-2 rounded-full transition-all"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
              <div className="absolute bottom-3 right-3 bg-black bg-opacity-60 text-white px-2 py-1 rounded-full carzino-image-counter">
                {currentIndex + 1}/{totalImages}
              </div>
            </>
          )}
        </div>

        <div className="p-3 flex-1 flex flex-col">
          <div className="flex gap-2 mb-2 items-center justify-between">
            <div className="flex gap-2 items-center">
              {vehicle.badges?.map((badge, index) => (
                <span 
                  key={index}
                  className="carzino-badge-label px-2 py-1 rounded font-medium"
                  style={{ borderRadius: '7px', backgroundColor: '#f9fafb', color: 'rgb(21, 41, 109)' }}
                >
                  {badge}
                </span>
              ))}
              {vehicle.viewed && (
                <span 
                  className="carzino-badge-label px-2 py-1 rounded font-medium inline-flex items-center"
                  style={{ borderRadius: '7px', backgroundColor: 'white', border: '1px solid #e5e7eb', color: 'rgb(21, 41, 109)' }}
                >
                  Viewed <Check className="w-3 h-3 ml-0.5" style={{ color: 'rgb(21, 41, 109)' }} />
                </span>
              )}
              <Heart 
                className={`w-4 h-4 cursor-pointer transition-colors ml-1 ${
                  favorites[vehicle.id] 
                    ? 'text-red-600 fill-red-600' 
                    : 'text-red-600 stroke-red-600 fill-white'
                }`}
                onClick={toggleFavorite}
              />
              {keeperMessage && (
                <span className="text-xs text-gray-600 ml-1 animate-pulse">
                  That's a Keeper!
                </span>
              )}
            </div>
          </div>

          <h3 className="carzino-vehicle-title text-gray-900 mb-2 leading-tight overflow-hidden whitespace-nowrap text-ellipsis">
            {vehicle.title}
          </h3>

          <div className="flex items-center justify-start mb-3 pb-2 border-b border-gray-200 carzino-vehicle-details">
            <div className="flex items-center gap-1 mr-4">
              <Gauge className="w-4 h-4 text-gray-600" />
              <span className="text-black font-medium">{vehicle.mileage} miles</span>
            </div>
            <div className="flex items-center gap-1 mr-4">
              <Settings className="w-4 h-4 text-gray-600" />
              <span className="text-black font-medium">{vehicle.transmission}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 text-gray-600 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <rect x="3" y="4" width="18" height="16" rx="2"/>
                  <path d="M7 4v16"/>
                </svg>
              </div>
              <span className="text-black font-medium">{vehicle.doors}</span>
            </div>
          </div>

          <div className="flex justify-center items-start gap-6 mb-1 flex-1">
            {vehicle.salePrice ? (
              <>
                <div className="text-center">
                  <div className="carzino-price-label text-gray-500 mb-0">Sale Price</div>
                  <div className="carzino-price-value text-gray-900">{vehicle.salePrice}</div>
                </div>
                {vehicle.payment && (
                  <>
                    <div className="w-px h-12 bg-gray-200"></div>
                    <div className="text-center">
                      <div className="carzino-price-label text-gray-500 mb-0">Payments</div>
                      <div className="carzino-price-value text-red-600">
                        {vehicle.payment}
                        <span className="text-xs text-black font-normal">/mo*</span>
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="text-center">
                <div className="carzino-price-label text-gray-500 mb-0">No Sale Price Listed</div>
                <div className="carzino-price-value text-gray-900">Call For Pricing</div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-100 px-3 py-2 mt-auto" style={{ backgroundColor: '#f9fafb' }}>
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <div className="text-gray-900 truncate" style={{ fontSize: '12px', fontWeight: 500 }}>{vehicle.dealer}</div>
              <div className="text-black font-medium truncate" style={{ fontSize: '12px' }}>{vehicle.location}</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-black hover:text-gray-600 cursor-pointer" style={{ fontSize: '12px', fontWeight: 500 }}>
                Call Dealer
              </div>
              <div className="text-black font-medium" style={{ fontSize: '12px' }}>{vehicle.phone}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default VehicleCard;
