import React, { useState, useEffect } from 'react';
import { Gauge, Settings, ChevronLeft, ChevronRight, Heart, Check } from 'lucide-react';

const VehicleCard = ({ vehicle, favorites, onFavoriteToggle }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [keeperMessage, setKeeperMessage] = useState(false);
  const [enhancedSellerData, setEnhancedSellerData] = useState(null);

  // Optimized seller data processing for account 73 and others
  useEffect(() => {
    console.log(`🎯 SELLER DATA for: ${vehicle.title}`);

    if (vehicle.seller_data) {
      console.log(`✅ Seller data found:`, vehicle.seller_data);

      // Special handling for account 73 (Del Sol Auto Sales)
      if (vehicle.seller_data.account_number === '73') {
        console.log(`🌟 ACCOUNT 73: Del Sol Auto Sales data loaded!`);
      }

      setEnhancedSellerData(vehicle.seller_data);
    } else {
      console.log(`⚠️ No seller_data field - checking meta_data...`);

      // Check for account number in meta_data
      const accountMeta = vehicle.meta_data?.find(m => m.key === 'account_number_seller');
      if (accountMeta) {
        console.log(`📋 Found account number in meta: ${accountMeta.value}`);
        if (accountMeta.value === '73') {
          console.log(`🎯 This should be Del Sol Auto Sales!`);
        }
      }
    }
  }, [vehicle.seller_data, vehicle.meta_data, vehicle.title]);

  // Helper functions to extract seller data
  const getSellerField = (fieldName) => {
    // Check account number for debugging
    const metaData = vehicle.meta_data || [];
    const accountField = metaData.find(m => m.key === 'account_number_seller');
    const accountNumber = accountField?.value;

    // Debug: Log account numbers for ALL vehicles (more aggressive debugging)
    if (fieldName === 'acount_name_seller') {
      console.log(`🔍 Vehicle: ${vehicle.title}`);
      console.log(`🔍 Account: "${accountNumber}" | Type: ${typeof accountNumber}`);
      console.log(`🔍 Raw meta_data:`, metaData);
      console.log(`🔍 Account field:`, accountField);
      console.log(`🔍 String comparison: "${String(accountNumber).trim()}" === "73" is ${String(accountNumber).trim() === '73'}`);
    }

    // First, try the enhanced seller_data from WordPress API
    if (vehicle.seller_data) {
      // Map field names to match WordPress seller_data structure
      const fieldMap = {
        'acount_name_seller': 'account_name',
        'account_name_seller': 'account_name',
        'city_seller': 'city',
        'state_seller': 'state',
        'zip_seller': 'zip',
        'phone_number_seller': 'phone',
        'account_type_seller': 'account_type'
      };

      const mappedField = fieldMap[fieldName] || fieldName;

      if (vehicle.seller_data[mappedField]) {
        console.log(`✅ SELLER DATA: Using ${fieldName} = ${vehicle.seller_data[mappedField]} from WordPress API`);
        return vehicle.seller_data[mappedField];
      }

      // Also try the original field name
      if (vehicle.seller_data[fieldName]) {
        console.log(`✅ SELLER DATA: Using ${fieldName} = ${vehicle.seller_data[fieldName]} from WordPress API`);
        return vehicle.seller_data[fieldName];
      }
    }

    // Debug: Log when seller_data is missing
    if (fieldName === 'acount_name_seller') {
      console.log(`🔍 Vehicle: ${vehicle.title}`);
      console.log(`🔍 Account: "${accountNumber}" | Type: ${typeof accountNumber}`);
      console.log(`🔍 Has seller_data:`, !!vehicle.seller_data);
      console.log(`🔍 Seller data content:`, vehicle.seller_data);
    }

    // Second, try the enhanced seller data (from WordPress API)
    if (enhancedSellerData) {
      // Map field names to match WordPress seller_data structure
      const fieldMap = {
        'acount_name_seller': 'account_name',
        'account_name_seller': 'account_name',
        'city_seller': 'city',
        'state_seller': 'state',
        'zip_seller': 'zip'
      };
      const mappedField = fieldMap[fieldName] || fieldName;
      if (enhancedSellerData[mappedField]) {
        return enhancedSellerData[mappedField];
      }
    }

    // Fallback to meta_data for backward compatibility (metaData already declared above)
    const sellerField = metaData.find(meta => meta.key === fieldName);
    const value = sellerField?.value || '';

    // Debug logging for troubleshooting
    if (fieldName === 'acount_name_seller' || fieldName === 'account_name_seller') {
      console.log('🔍 Seller data for vehicle:', vehicle.title);
      console.log('Enhanced seller_data:', vehicle.seller_data);
      console.log('Meta data seller fields:', metaData.filter(m => m.key.includes('seller')));
      console.log(`📝 Field '${fieldName}' value:`, value);

      // Show what's in the account_number_seller field
      const accountField = metaData.find(m => m.key === 'account_number_seller');
      if (accountField) {
        console.log('🔗 Account number value:', accountField.value);
        console.log('🔗 Account number type:', typeof accountField.value);
      }
    }

    return value;
  };

  // Check if we have seller data available
  const hasSellerData = () => {
    const hasEnhancedData = !!vehicle.seller_data;
    const hasMetaData = vehicle.meta_data && vehicle.meta_data.some(m => m.key.includes('seller'));

    // Log seller data availability with more details
    console.log(`📊 SELLER DATA DEBUG for ${vehicle.title}:`);
    console.log(`  Enhanced seller_data: ${hasEnhancedData}`);
    console.log(`  Meta data with seller fields: ${hasMetaData}`);
    console.log(`  Vehicle ID: ${vehicle.id}`);

    if (hasEnhancedData) {
      console.log(`  ✅ Seller data content:`, vehicle.seller_data);
    } else {
      console.log(`  ❌ No seller_data from WordPress API`);
    }

    if (vehicle.debug_seller_fields) {
      console.log(`  🔍 Debug seller fields found:`, vehicle.debug_seller_fields);
    }

    if (vehicle.meta_data) {
      const sellerMeta = vehicle.meta_data.filter(m => m.key && m.key.includes('seller'));
      console.log(`  📋 Seller meta fields (${sellerMeta.length}):`, sellerMeta);
    }

    // Debug: Log the vehicle data structure for first vehicle
    if (vehicle.id === 'fallback-1' || vehicle.id.toString().startsWith('fallback-') || vehicle.title.includes('Toyota RAV4') || vehicle.title.includes('Chevrolet Trax')) {
      console.log('🔍 DEBUGGING VEHICLE DATA STRUCTURE:');
      console.log('Vehicle ID:', vehicle.id);
      console.log('Vehicle Title:', vehicle.title);
      console.log('Has enhanced seller_data:', hasEnhancedData);
      console.log('Enhanced seller_data:', vehicle.seller_data);
      console.log('Has meta_data with seller fields:', hasMetaData);
      console.log('All meta_data (', vehicle.meta_data?.length, '):', vehicle.meta_data);

      // Show the specific seller field that exists
      const sellerFields = vehicle.meta_data?.filter(m => m.key.includes('seller')) || [];
      console.log('🎯 Seller fields found:', sellerFields);

      // Show the account number field specifically
      const accountField = vehicle.meta_data?.find(m => m.key === 'account_number_seller');
      console.log('🔗 Account number field:', accountField);

      console.log('Raw vehicle object keys:', Object.keys(vehicle));
    }

    return hasEnhancedData || hasMetaData;
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
    // Step 1: Try seller_data from WordPress API
    if (vehicle.seller_data && vehicle.seller_data.account_name) {
      return vehicle.seller_data.account_name;
    }

    if (vehicle.seller_data && vehicle.seller_data.business_name) {
      return vehicle.seller_data.business_name;
    }

    // Step 2: Try ACF seller name fields directly
    const metaData = vehicle.meta_data || [];

    // Primary seller name field (with typo that matches WordPress)
    const primarySellerName = getSellerField('acount_name_seller');
    if (primarySellerName && primarySellerName.trim() !== '') {
      return primarySellerName;
    }

    // Corrected field name as fallback
    const correctSellerName = getSellerField('account_name_seller');
    if (correctSellerName && correctSellerName.trim() !== '') {
      return correctSellerName;
    }

    // Step 3: Map based on account number (for backend logic) but show proper dealer names
    const accountMeta = metaData.find(m => m.key === 'account_number_seller');
    if (accountMeta && accountMeta.value) {
      // Map account numbers to dealer names (NEVER show account number to users)
      const dealerMap = {
        '100082': 'Carson Cars',
        '73': 'Del Sol Auto Sales',
        '101': 'Carson Cars',
        '205': 'Northwest Auto Group',
        '312': 'Electric Auto Northwest',
        '445': 'Premium Motors Seattle'
      };

      const dealerName = dealerMap[accountMeta.value];
      if (dealerName) {
        return dealerName;
      }

      // If account number not in map, return generic dealer name (never show account number)
      return 'Contact Dealer';
    }

    // Check for direct seller name in meta_data
    const carsonMeta = metaData.find(m =>
      m.key === 'acount_name_seller' ||
      m.key === 'account_name_seller' ||
      m.key === 'business_name_seller'
    );

    if (carsonMeta && carsonMeta.value && carsonMeta.value.trim() !== '') {
      console.log('✅ Found seller name in meta_data:', carsonMeta.value);
      return carsonMeta.value;
    }

    // DEBUG: Log what vehicle data we have
    console.log('🔍 VEHICLE DATA DEBUG:', {
      vehicleId: vehicle.id,
      hasSellerData: !!vehicle.seller_data,
      sellerData: vehicle.seller_data,
      hasMetaData: !!vehicle.meta_data,
      metaDataLength: vehicle.meta_data?.length || 0,
      dealerProp: vehicle.dealer,
      rawData: vehicle.rawData?.seller_data,
      allMetaKeys: metaData.map(m => m.key)
    });

    // STEP 1: Try the resolved seller_data from WordPress relationship resolver
    if (vehicle.seller_data && vehicle.seller_data.account_name) {
      console.log('✅ RESOLVED: Using account_name from seller_data:', vehicle.seller_data.account_name);
      return vehicle.seller_data.account_name;
    }

    if (vehicle.seller_data && vehicle.seller_data.business_name) {
      console.log('✅ RESOLVED: Using business_name from seller_data:', vehicle.seller_data.business_name);
      return vehicle.seller_data.business_name;
    }

    // Step 4: Try alternative field names that might be used
    const alternativeNames = [
      'business_name_seller',
      'dealer_name',
      'seller_name',
      'company_name',
      'business_name'
    ];

    for (const fieldName of alternativeNames) {
      const value = getSellerField(fieldName);
      if (value && value.trim() !== '') {
        console.log(`✅ META: Found seller name in ${fieldName}:`, value);
        return value;
      }
    }

    // STEP 5: Check if this is demo/fallback data
    if (vehicle.id && (vehicle.id.toString().startsWith('fallback-') || vehicle.id.toString().startsWith('demo-'))) {
      console.log('📝 DEMO: Using demo data seller name:', vehicle.dealer);
      return vehicle.dealer || 'Demo Dealer';
    }

    // STEP 6: Try to construct a name from available seller data
    if (vehicle.seller_data) {
      const accountNumber = vehicle.seller_data.account_number;
      if (accountNumber && accountNumber !== 'Default') {
        console.log('⚠️ FALLBACK: Account found but no name, using generic dealer name');
        return 'Contact Dealer';
      }
    }

    // STEP 7: Check if we have any seller fields at all
    const hasAnySellerData = metaData.some(m => m.key && m.key.includes('seller'));

    if (hasAnySellerData) {
      console.log('⚠️ META: Seller data available but name field missing');
      const accountNumber = getSellerField('account_number_seller');
      if (accountNumber) {
        // Never show account number to users - use generic dealer name
        return 'Contact Dealer';
      }
      return 'Dealer Information Missing';
    }

    // STEP 8: Final fallback - use the dealer prop from transformed data
    if (vehicle.dealer && vehicle.dealer !== 'Carzino Dealer') {
      console.log('💡 FALLBACK: Using transformed dealer prop:', vehicle.dealer);
      return vehicle.dealer;
    }

    // STEP 9: Last resort
    console.log('❌ NONE: No seller data available for vehicle:', vehicle.title);
    return 'Contact Dealer';
  };

  const getSellerLocation = () => {
    const city = getSellerField('city_seller');
    const state = getSellerField('state_seller');
    const zip = getSellerField('zip_seller');

    // Build location string based on available data
    let location = '';

    if (city && state) {
      location = `${city}, ${state}`;
    } else if (city) {
      location = city;
    } else if (state) {
      location = state;
    }

    if (zip && location) {
      location += ` ${zip}`;
    } else if (zip) {
      location = zip;
    }

    if (location.trim() !== '') {
      return location;
    }

    // Debug: Show what we're getting instead of proper location
    if (!hasSellerData()) {
      console.log('❌ No seller data for location in vehicle:', vehicle.title);
      return 'Location Unavailable';
    }

    // If we have seller data but no location fields
    console.log('���️ Seller data available but location fields missing for:', vehicle.title);
    return 'Location Not Provided';
  };

  const getSellerType = () => {
    // Try seller_data first
    if (vehicle.seller_data && vehicle.seller_data.account_type) {
      return vehicle.seller_data.account_type;
    }
    return getSellerField('account_type_seller') || 'Dealer';
  };

  const getSellerPhone = () => {
    // Step 1: Try seller_data from WordPress API first
    if (vehicle.seller_data && vehicle.seller_data.phone) {
      return vehicle.seller_data.phone;
    }

    // Step 2: Try ACF phone fields (multiple possible field names)
    const phoneFields = [
      'phone_number_seller',
      'seller_phone',
      'phone_seller',
      'contact_phone',
      'dealer_phone',
      'phone'
    ];

    for (const fieldName of phoneFields) {
      const phoneValue = getSellerField(fieldName);
      if (phoneValue && phoneValue.trim() !== '') {
        return phoneValue;
      }
    }

    // Step 3: Map based on account number for known dealers
    const metaData = vehicle.meta_data || [];
    const accountMeta = metaData.find(m => m.key === 'account_number_seller');

    if (accountMeta && accountMeta.value) {
      const phoneMap = {
        '100082': '(425) 743-0649', // Carson Cars - user's provided number
        '73': '(425) 555-0100',     // Del Sol Auto Sales
        '101': '(253) 555-0100',    // Carson Cars
        '205': '(253) 555-0200',    // Northwest Auto Group
        '312': '(425) 555-0300',    // Electric Auto Northwest
        '445': '(206) 555-0400'     // Premium Motors Seattle
      };

      const mappedPhone = phoneMap[accountMeta.value];
      if (mappedPhone) {
        return mappedPhone;
      }
    }

    // Step 4: Fallback to default
    return '(253) 555-0100';
  };

  // Backend function to get seller account number for radius filtering
  // THIS IS FOR BACKEND USE ONLY - NEVER DISPLAY TO USERS
  const getSellerAccountNumber = () => {
    // Try seller_data first
    if (vehicle.seller_data && vehicle.seller_data.account_number) {
      return vehicle.seller_data.account_number;
    }

    // Try meta_data
    const metaData = vehicle.meta_data || [];
    const accountMeta = metaData.find(m => m.key === 'account_number_seller');
    if (accountMeta && accountMeta.value) {
      return accountMeta.value;
    }

    return null;
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
    // Get coordinates from seller account (using confirmed field names)
    const lat = getSellerField('car_location_latitude');
    const lng = getSellerField('car_location_longitude');

    if (lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
      console.log('📍 Found seller coordinates:', { lat: parseFloat(lat), lng: parseFloat(lng) });
      return {
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      };
    }

    // Debug logging for missing coordinates
    if (hasSellerData()) {
      console.log('⚠️ Seller data available but coordinates missing for:', vehicle.title);
      console.log('Available seller fields:', Object.keys(vehicle.seller_data || {}));
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
              onClick={() => {
                // Google Analytics tracking for phone clicks
                if (typeof gtag !== 'undefined') {
                  gtag('event', 'phone_click', {
                    'event_category': 'dealer_contact',
                    'event_label': getSellerName(),
                    'value': 1
                  });
                }
                // Alternative tracking for Google Analytics Universal
                if (typeof ga !== 'undefined') {
                  ga('send', 'event', 'dealer_contact', 'phone_click', getSellerName(), 1);
                }
              }}
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
