import React, { useState, useEffect, useCallback } from 'react';
import { Gauge, Settings, Heart, Check } from 'lucide-react';

const VehicleCard = ({ vehicle, favorites, onFavoriteToggle }) => {
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

  // Helper functions to extract ACF and meta data with enhanced field group support
  const getACFField = (fieldName) => {
    const metaData = vehicle.meta_data || [];

    // Debug: Show all available meta keys for mileage troubleshooting
    if (fieldName === 'mileage') {
      console.log(`🔍 MILEAGE DEBUG for ${vehicle.title}:`);
      console.log(`  Total meta fields: ${metaData.length}`);
      console.log(`  All meta keys:`, metaData.map(m => m.key));

      // Look for any field containing 'mile' or 'odometer'
      const mileageRelated = metaData.filter(m =>
        m.key.toLowerCase().includes('mile') ||
        m.key.toLowerCase().includes('odometer') ||
        m.key.toLowerCase().includes('kilo')
      );
      console.log(`  Mileage-related fields found:`, mileageRelated);
    }

    // Try exact field name first
    const exactField = metaData.find(meta => meta.key === fieldName);
    if (exactField && exactField.value) {
      console.log(`✅ ACF Field ${fieldName}: ${exactField.value}`);
      return exactField.value;
    }

    // Enhanced ACF field group patterns
    const fieldVariations = {
      'make': ['vehicle_make', 'car_make', 'make', 'manufacturer', 'vehicle_details_make', 'car_info_make'],
      'model': ['vehicle_model', 'car_model', 'model', 'vehicle_details_model', 'car_info_model'],
      'year': ['vehicle_year', 'car_year', 'year', 'model_year', 'vehicle_details_year', 'car_info_year'],
      'condition': ['vehicle_condition', 'car_condition', 'condition', 'status', 'vehicle_details_condition'],
      'mileage': [
        // Standard patterns
        'vehicle_mileage', 'car_mileage', 'mileage', 'odometer',
        // ACF Field Group patterns
        'vehicle_details_mileage', 'car_details_mileage', 'car_info_mileage',
        'vehicle_specs_mileage', 'car_specs_mileage', 'inventory_mileage',
        'vehicle_data_mileage', 'auto_details_mileage', 'car_data_mileage',
        // Alternative naming
        'miles', 'odometer_reading', 'vehicle_miles', 'car_miles',
        'kilometers', 'vehicle_kilometers', 'current_mileage',
        // WordPress ACF patterns
        'field_mileage', 'acf_mileage', '_mileage', '_vehicle_mileage'
      ],
      'transmission': ['vehicle_transmission', 'car_transmission', 'transmission', 'trans', 'gearbox', 'transmission_type'],
      'drivetrain': ['vehicle_drivetrain', 'car_drivetrain', 'drivetrain', 'drive_type', 'drive'],
      'fuel_type': ['vehicle_fuel_type', 'car_fuel_type', 'fuel_type', 'fuel'],
      'body_type': ['vehicle_body_type', 'car_body_type', 'body_type', 'style'],
      'exterior_color': ['vehicle_exterior_color', 'car_exterior_color', 'exterior_color', 'color'],
      'interior_color': ['vehicle_interior_color', 'car_interior_color', 'interior_color'],
      'trim': ['vehicle_trim', 'car_trim', 'trim', 'trim_level'],
      'doors': ['vehicle_doors', 'car_doors', 'doors', 'door_count'],
      'engine': ['vehicle_engine', 'car_engine', 'engine', 'engine_size'],
      'price': ['vehicle_price', 'car_price', 'price', 'sale_price', 'asking_price']
    };

    const variations = fieldVariations[fieldName] || [fieldName];

    for (const variation of variations) {
      const field = metaData.find(meta => meta.key === variation);
      if (field && field.value) {
        console.log(`✅ ACF Field ${fieldName} (as ${variation}): ${field.value}`);
        return field.value;
      }
    }

    // ACF Field Group wildcard search for mileage
    if (fieldName === 'mileage') {
      console.log(`🔍 WILDCARD SEARCH for mileage fields...`);

      // Look for any field with 'mile' in the name
      const wildcardField = metaData.find(meta =>
        meta.key &&
        meta.key.toLowerCase().includes('mile') &&
        meta.value &&
        meta.value.toString().trim() !== '' &&
        !isNaN(parseFloat(meta.value.toString().replace(/[^0-9]/g, '')))
      );

      if (wildcardField) {
        console.log(`✅ WILDCARD MATCH: ${wildcardField.key} = ${wildcardField.value}`);
        return wildcardField.value;
      }
    }

    console.log(`⚠️ ACF Field ${fieldName} not found in meta_data`);
    return null;
  };

  // Helper functions to extract seller data
  const getSellerField = (fieldName) => {
    console.log(`    🔎 getSellerField called for: "${fieldName}"`);

    // First, try the enhanced seller_data from WordPress API
    if (vehicle.seller_data) {
      console.log(`    📊 Checking seller_data for field: ${fieldName}`);
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
      console.log(`    🗺️ Mapped "${fieldName}" to "${mappedField}"`);

      if (vehicle.seller_data[mappedField]) {
        console.log(`✅ SELLER DATA: Using ${fieldName} = ${vehicle.seller_data[mappedField]} from WordPress API`);
        return vehicle.seller_data[mappedField];
      }

      // Also try the original field name
      if (vehicle.seller_data[fieldName]) {
        console.log(`✅ SELLER DATA: Using ${fieldName} = ${vehicle.seller_data[fieldName]} from WordPress API`);
        return vehicle.seller_data[fieldName];
      }

      console.log(`    ❌ Field "${fieldName}" not found in seller_data`);
    } else {
      console.log(`    ❌ No seller_data available`);
    }

    // Second, try the enhanced seller data (from WordPress API)
    if (enhancedSellerData) {
      console.log(`    📊 Checking enhancedSellerData for field: ${fieldName}`);
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
        console.log(`✅ ENHANCED DATA: Using ${fieldName} = ${enhancedSellerData[mappedField]}`);
        return enhancedSellerData[mappedField];
      }
      console.log(`    ❌ Field "${fieldName}" not found in enhancedSellerData`);
    }

    // Fallback to meta_data for backward compatibility
    const metaData = vehicle.meta_data || [];
    console.log(`    📋 Checking meta_data (${metaData.length} items) for field: ${fieldName}`);

    const sellerField = metaData.find(meta => meta.key === fieldName);
    if (sellerField) {
      console.log(`    ✅ Found in meta_data: ${fieldName} = "${sellerField.value}"`);
    } else {
      console.log(`    ❌ Field "${fieldName}" not found in meta_data`);
      // Log all meta keys for debugging
      const allKeys = metaData.map(m => m.key);
      console.log(`    📝 Available meta keys:`, allKeys);
    }

    const value = sellerField?.value || '';
    console.log(`    🎯 Final value for "${fieldName}": "${value}"`);

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
      console.log(`  ��� No seller_data from WordPress API`);
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
    // Try ACF condition fields first
    const acfCondition = getACFField('condition');
    if (acfCondition && acfCondition.trim() !== '') {
      const condition = acfCondition.trim();
      // Standardize condition values
      const conditionMap = {
        'new': 'New',
        'used': 'Used',
        'certified': 'Certified Pre-Owned',
        'pre-owned': 'Pre-Owned',
        'demo': 'Demo',
        'excellent': 'Excellent',
        'good': 'Good',
        'fair': 'Fair'
      };
      return conditionMap[condition.toLowerCase()] || condition;
    }

    // Try seller condition fields
    const condition = getSellerField('condition');
    if (condition && condition.trim() !== '') {
      const conditionValue = condition.trim();
      const conditionMap = {
        'new': 'New',
        'used': 'Used',
        'certified': 'Certified Pre-Owned',
        'pre-owned': 'Pre-Owned',
        'demo': 'Demo'
      };
      return conditionMap[conditionValue.toLowerCase()] || conditionValue;
    }

    // Check other possible condition field names
    const vehicleCondition = getSellerField('vehicle_condition') || getSellerField('condition_seller');
    if (vehicleCondition && vehicleCondition.trim() !== '') {
      return vehicleCondition.trim();
    }

    // Check meta data for condition-related fields
    const metaData = vehicle.meta_data || [];
    const conditionFields = ['status', 'vehicle_status', 'listing_status'];
    for (const fieldName of conditionFields) {
      const field = metaData.find(meta => meta.key === fieldName);
      if (field && field.value && field.value.toString().trim() !== '') {
        return field.value.toString().trim();
      }
    }

    // Use stock status as last resort, with better text
    return vehicle.stock_status === 'instock' ? 'Used' : 'Sold';
  };

  const getDrivetrain = () => {
    // Try ACF drivetrain fields first
    const acfDrivetrain = getACFField('drivetrain');
    if (acfDrivetrain) {
      return acfDrivetrain;
    }

    return getSellerField('drivetrain') || getSellerField('drive_type') || 'FWD';
  };

  // Enhanced transmission detection for ACF fields
  const getTransmission = () => {
    // Try ACF transmission fields with enhanced detection
    const acfTransmission = getACFField('transmission');
    if (acfTransmission && acfTransmission.toString().trim() !== '') {
      const transmission = acfTransmission.toString().trim();

      // Standardize transmission values
      const transmissionMap = {
        'auto': 'Automatic',
        'automatic': 'Automatic',
        'manual': 'Manual',
        'cvt': 'CVT',
        'semi-auto': 'Semi-Automatic',
        'dual-clutch': 'Dual-Clutch'
      };

      return transmissionMap[transmission.toLowerCase()] || transmission;
    }

    // Fallback to standard vehicle spec logic
    return getVehicleSpec('transmission');
  };

  // Enhanced mileage detection specifically for ACF field groups
  const getMileage = () => {
    console.log(`🚗 ENHANCED MILEAGE DETECTION for: ${vehicle.title}`);

    const metaData = vehicle.meta_data || [];

    // DETAILED DEBUG: Show ALL meta fields to understand the data structure
    console.log(`📋 ALL META FIELDS for ${vehicle.title}:`);
    metaData.forEach((meta, index) => {
      console.log(`  [${index}] "${meta.key}" = "${meta.value}" (${typeof meta.value})`);
    });

    // Try ACF mileage fields first with expanded field variations
    const mileageFieldNames = [
      // Standard mileage fields
      'mileage', '_mileage', 'vehicle_mileage', '_vehicle_mileage',
      'odometer', '_odometer', 'miles', '_miles',

      // ACF field group patterns
      'vehicle_details_mileage', 'car_details_mileage', 'vehicle_specs_mileage',
      'car_specs_mileage', 'inventory_mileage', 'vehicle_info_mileage',
      'car_info_mileage', 'auto_details_mileage', 'vehicle_data_mileage',

      // Common WooCommerce product attribute patterns
      'product_mileage', '_product_mileage', 'woocommerce_mileage',
      '_woocommerce_mileage', 'pa_mileage', '_pa_mileage',

      // Alternative naming patterns found in WordPress/WooCommerce
      'odometer_reading', '_odometer_reading', 'current_mileage', '_current_mileage',
      'vehicle_miles', '_vehicle_miles', 'car_miles', '_car_miles',
      'total_miles', '_total_miles', 'kilometers', '_kilometers',

      // ACF field ID patterns (WordPress auto-generates these)
      'field_mileage', 'field_vehicle_mileage', 'acf_mileage',

      // Possible custom field names
      'km', '_km', 'mileage_value', '_mileage_value'
    ];

    console.log(`🔍 SEARCHING ${mileageFieldNames.length} possible mileage field names...`);

    for (const fieldName of mileageFieldNames) {
      const field = metaData.find(meta => meta.key === fieldName);
      if (field && field.value !== null && field.value !== undefined) {
        const rawValue = field.value.toString().trim();
        console.log(`🎯 Found field "${fieldName}" with value: "${rawValue}"`);

        if (rawValue !== '') {
          // Extract numeric value from the field
          const numericValue = rawValue.replace(/[^0-9]/g, '');
          const numMileage = parseFloat(numericValue);

          console.log(`  📊 Numeric extraction: "${rawValue}" → "${numericValue}" → ${numMileage}`);

          if (!isNaN(numMileage) && numMileage >= 0) {
            console.log(`✅ MILEAGE FOUND from field "${fieldName}": ${numMileage.toLocaleString()}`);
            return numMileage.toLocaleString();
          }
        }
      }
    }

    // WILDCARD SEARCH: Look for any field containing "mile", "odometer", or "km"
    console.log(`🔍 WILDCARD SEARCH: Looking for any field containing mileage keywords...`);
    const wildcardFields = metaData.filter(meta => {
      if (!meta.key) return false;
      const key = meta.key.toLowerCase();
      return (key.includes('mile') || key.includes('odometer') || key.includes('km')) &&
             meta.value !== null && meta.value !== undefined && meta.value.toString().trim() !== '';
    });

    console.log(`📋 Wildcard fields found:`, wildcardFields);

    for (const field of wildcardFields) {
      const rawValue = field.value.toString().trim();
      const numericValue = rawValue.replace(/[^0-9]/g, '');
      const numMileage = parseFloat(numericValue);

      console.log(`🎯 Wildcard field "${field.key}": "${rawValue}" → ${numMileage}`);

      if (!isNaN(numMileage) && numMileage >= 0) {
        console.log(`✅ MILEAGE FOUND from wildcard "${field.key}": ${numMileage.toLocaleString()}`);
        return numMileage.toLocaleString();
      }
    }

    // Check WooCommerce attributes (product variations)
    console.log(`🏷️ CHECKING WOOCOMMERCE ATTRIBUTES...`);
    const attributes = vehicle.attributes || [];
    console.log(`📋 Attributes found:`, attributes);

    for (const attr of attributes) {
      if (attr.name && attr.options && attr.options.length > 0) {
        const attrName = attr.name.toLowerCase();
        console.log(`🔍 Checking attribute: "${attr.name}" (${attrName})`);

        if (attrName.includes('mile') || attrName.includes('odometer') || attrName.includes('km')) {
          const value = attr.options[0].toString().trim();
          const numMileage = parseFloat(value.replace(/[^0-9]/g, ''));

          console.log(`🎯 Attribute "${attr.name}": "${value}" → ${numMileage}`);

          if (!isNaN(numMileage) && numMileage >= 0) {
            console.log(`✅ MILEAGE FOUND from attribute "${attr.name}": ${numMileage.toLocaleString()}`);
            return numMileage.toLocaleString();
          }
        }
      }
    }

    // Check if this is a real WooCommerce product vs demo data
    if (vehicle.id && !vehicle.id.toString().startsWith('demo-') && !vehicle.id.toString().startsWith('fallback-')) {
      console.log(`⚠️ REAL PRODUCT BUT NO MILEAGE FOUND for ${vehicle.title} (ID: ${vehicle.id})`);
      console.log(`💡 This suggests mileage data isn't being stored in your WooCommerce product meta fields`);
      console.log(`💡 Check your ACF fields or WooCommerce product attributes configuration`);

      // For real products with no mileage, show a realistic placeholder
      return 'Contact Dealer';
    }

    // Fallback for demo data
    console.log(`⚠️ Using fallback mileage for demo/fallback vehicle`);
    const fallbackMileage = getVehicleSpec('mileage');
    return fallbackMileage;
  };

  // Get vehicle specifications from ACF fields with better formatting
  const getVehicleSpec = (specType) => {
    // Try ACF fields first
    const acfValue = getACFField(specType);
    if (acfValue && acfValue.toString().trim() !== '') {
      const value = acfValue.toString().trim();

      // Format mileage with commas
      if (specType === 'mileage') {
        const numMileage = parseFloat(value.replace(/[^0-9]/g, ''));
        if (!isNaN(numMileage)) {
          return numMileage.toLocaleString();
        }
      }

      return value;
    }

    // Try attributes as fallback
    const attributes = vehicle.attributes || [];
    const attr = attributes.find(attr =>
      attr.name.toLowerCase().includes(specType.toLowerCase())
    );
    if (attr && attr.options && attr.options[0]) {
      const value = attr.options[0].toString().trim();

      // Format mileage with commas
      if (specType === 'mileage') {
        const numMileage = parseFloat(value.replace(/[^0-9]/g, ''));
        if (!isNaN(numMileage)) {
          return numMileage.toLocaleString();
        }
      }

      return value;
    }

    // Try common field variations
    const metaData = vehicle.meta_data || [];
    const fieldVariations = {
      'mileage': ['mileage', 'odometer', 'miles'],
      'transmission': ['transmission', 'trans', 'gearbox'],
      'doors': ['doors', 'door_count', 'num_doors']
    };

    const variations = fieldVariations[specType] || [specType];
    for (const variation of variations) {
      const field = metaData.find(meta => meta.key.toLowerCase() === variation);
      if (field && field.value && field.value.toString().trim() !== '') {
        const value = field.value.toString().trim();

        // Format mileage with commas
        if (specType === 'mileage') {
          const numMileage = parseFloat(value.replace(/[^0-9]/g, ''));
          if (!isNaN(numMileage)) {
            return numMileage.toLocaleString();
          }
        }

        return value;
      }
    }

    // Smart defaults based on vehicle data
    const defaults = {
      'mileage': '0',
      'transmission': 'Automatic',
      'doors': '4'
    };

    return defaults[specType] || 'N/A';
  };

  // Get vehicle title with proper year, make, model from ACF
  const getVehicleTitle = () => {
    const year = getACFField('year');
    const make = getACFField('make');
    const model = getACFField('model');
    const trim = getACFField('trim');

    if (year && make && model) {
      let title = `${year} ${make} ${model}`;
      if (trim && trim !== 'N/A') {
        title += ` ${trim}`;
      }
      console.log(`✅ Built title from ACF: ${title}`);
      return title;
    }

    // Fallback to original title
    console.log(`⚠️ Using original title: ${vehicle.title}`);
    return vehicle.title || 'Vehicle Details Available';
  };

  // Get vehicle price from ACF or WooCommerce
  const getVehiclePrice = () => {
    // Try ACF price fields first
    const acfPrice = getACFField('price');
    if (acfPrice) {
      // Format price if it's a number
      const numPrice = parseFloat(acfPrice.toString().replace(/[^0-9.]/g, ''));
      if (!isNaN(numPrice)) {
        return '$' + numPrice.toLocaleString();
      }
      return acfPrice;
    }

    // Try WooCommerce price fields
    if (vehicle.sale_price && vehicle.sale_price !== '0') {
      const numPrice = parseFloat(vehicle.sale_price);
      if (!isNaN(numPrice)) {
        return '$' + numPrice.toLocaleString();
      }
    }

    if (vehicle.price && vehicle.price !== '0') {
      const numPrice = parseFloat(vehicle.price);
      if (!isNaN(numPrice)) {
        return '$' + numPrice.toLocaleString();
      }
    }

    // Try formatted price fields
    if (vehicle.salePrice) {
      return vehicle.salePrice;
    }

    return null;
  };

  // Get vehicle payment from ACF with smart calculation
  const getVehiclePayment = () => {
    // Try ACF payment fields first
    const payment = getACFField('payment') || getACFField('monthly_payment');
    if (payment) {
      // Format payment if it's a number
      const numPayment = parseFloat(payment.toString().replace(/[^0-9.]/g, ''));
      if (!isNaN(numPayment) && numPayment > 0) {
        return '$' + numPayment.toLocaleString();
      }
      return payment;
    }

    // Try vehicle.payment if available
    if (vehicle.payment) {
      const numPayment = parseFloat(vehicle.payment.toString().replace(/[^0-9.]/g, ''));
      if (!isNaN(numPayment) && numPayment > 0) {
        return '$' + numPayment.toLocaleString();
      }
      return vehicle.payment;
    }

    // Smart calculation based on price (estimated)
    const priceString = getVehiclePrice();
    if (priceString) {
      const price = parseFloat(priceString.replace(/[^0-9.]/g, ''));
      if (!isNaN(price) && price > 0) {
        // Rough calculation: price/72 months with estimated interest
        const estimatedPayment = Math.round((price * 1.05) / 72);
        return '$' + estimatedPayment.toLocaleString();
      }
    }

    return null;
  };

  const getSellerName = () => {
    const isDebugMode = process.env.NODE_ENV === 'development' || window.location.search.includes('debug=seller');

    if (isDebugMode) {
      console.log(`🔍 DEBUG getSellerName for vehicle: ${vehicle.title} (ID: ${vehicle.id})`);
    }

    // Step 1: Try seller_data from WordPress API first
    if (vehicle.seller_data) {
      if (isDebugMode) console.log(`  📊 seller_data found:`, vehicle.seller_data);
      if (vehicle.seller_data.account_name && !vehicle.seller_data.account_name.includes('Dealer Account')) {
        if (isDebugMode) console.log(`  ✅ Using seller_data.account_name: ${vehicle.seller_data.account_name}`);
        return vehicle.seller_data.account_name;
      }
      if (vehicle.seller_data.business_name && !vehicle.seller_data.business_name.includes('Dealer Account')) {
        if (isDebugMode) console.log(`  ✅ Using seller_data.business_name: ${vehicle.seller_data.business_name}`);
        return vehicle.seller_data.business_name;
      }
    } else {
      if (isDebugMode) console.log(`  ❌ No seller_data found`);
    }

    // Step 2: Try ACF seller name fields directly
    const metaData = vehicle.meta_data || [];
    console.log(`  📋 meta_data length: ${metaData.length}`);

    // Log all seller-related meta fields
    const sellerMeta = metaData.filter(m => m.key && m.key.includes('seller'));
    console.log(`  🎯 Seller meta fields found (${sellerMeta.length}):`, sellerMeta);

    // Primary seller name field (with typo that matches WordPress)
    const primarySellerName = getSellerField('acount_name_seller');
    if (isDebugMode) console.log(`  🔍 acount_name_seller field result: "${primarySellerName}"`);
    if (primarySellerName && primarySellerName.trim() !== '' && !primarySellerName.includes('Dealer Account')) {
      if (isDebugMode) console.log(`  ✅ Using acount_name_seller: ${primarySellerName}`);
      return primarySellerName;
    }

    // Corrected field name as fallback
    const correctSellerName = getSellerField('account_name_seller');
    if (isDebugMode) console.log(`  🔍 account_name_seller field result: "${correctSellerName}"`);
    if (correctSellerName && correctSellerName.trim() !== '' && !correctSellerName.includes('Dealer Account')) {
      if (isDebugMode) console.log(`  ✅ Using account_name_seller: ${correctSellerName}`);
      return correctSellerName;
    }

    // Step 3: Try business name fields
    const businessNameFields = [
      'business_name_seller',
      'dealer_name',
      'seller_name',
      'company_name',
      'business_name'
    ];

    console.log(`  🔍 Trying business name fields...`);
    for (const fieldName of businessNameFields) {
      const value = getSellerField(fieldName);
      console.log(`    📝 ${fieldName}: "${value}"`);
      if (value && value.trim() !== '' && !value.includes('Dealer Account')) {
        console.log(`  ✅ Using business field ${fieldName}: ${value}`);
        return value;
      }
    }

    // Step 4: Map based on account number (for backend logic) but show proper dealer names
    console.log(`  🔍 Trying account number mapping...`);
    const accountMeta = metaData.find(m => m.key === 'account_number_seller');
    console.log(`  🔢 account_number_seller meta:`, accountMeta);

    if (accountMeta && accountMeta.value) {
      console.log(`  🎯 Found account number: ${accountMeta.value}`);
      // Map account numbers to dealer names (NEVER show account number to users)
      const dealerMap = {
        '100082': 'Carson Cars',
        '1000821': 'Carson Cars', // Handle both formats
        '73': 'Del Sol Auto Sales',
        '101': 'Carson Cars',
        '205': 'Northwest Auto Group',
        '312': 'Electric Auto Northwest',
        '445': 'Premium Motors Seattle'
      };

      const dealerName = dealerMap[accountMeta.value];
      if (dealerName) {
        console.log(`  ✅ Using mapped dealer name: ${dealerName}`);
        return dealerName;
      }

      // If account number not in map, return generic dealer name (NEVER show account number)
      console.log(`  ⚠️ Account number ${accountMeta.value} not in dealer map, using generic name`);
      return 'Contact Dealer';
    } else {
      console.log(`  ❌ No account_number_seller found`);
    }

    // Step 5: Check if this is demo/fallback data
    console.log(`  🔍 Checking for demo/fallback data...`);
    if (vehicle.id && (vehicle.id.toString().startsWith('fallback-') || vehicle.id.toString().startsWith('demo-'))) {
      const demoDealer = vehicle.dealer || 'Demo Dealer';
      console.log(`  ✅ Using demo dealer: ${demoDealer}`);
      return demoDealer;
    }

    // Step 6: Final fallback - use the dealer prop from transformed data if it's not generic
    console.log(`  🔍 Checking vehicle.dealer prop: "${vehicle.dealer}"`);
    if (vehicle.dealer && vehicle.dealer !== 'Carzino Dealer' && !vehicle.dealer.includes('Dealer Account')) {
      console.log(`  ✅ Using vehicle.dealer: ${vehicle.dealer}`);
      return vehicle.dealer;
    }

    // Step 7: Last resort - NEVER show account numbers
    console.log(`  🚨 Using last resort fallback: Contact Dealer`);
    return 'Contact Dealer';
  };

  // Safety wrapper for getSellerName to ensure it always returns a value
  const getSafeSellerName = () => {
    const sellerName = getSellerName();
    const finalName = sellerName || 'Contact Dealer';
    console.log(`🛡️ getSafeSellerName final result: "${finalName}"`);
    return finalName;
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

    // Step 2: Try ACF phone fields (multiple possible field names in priority order)
    const phoneFields = [
      'phone_number_seller',
      'seller_phone_number',
      'seller_phone',
      'phone_seller',
      'contact_phone',
      'dealer_phone',
      'phone'
    ];

    for (const fieldName of phoneFields) {
      const phoneValue = getSellerField(fieldName);
      if (phoneValue && phoneValue.trim() !== '' && phoneValue.length >= 10) {
        // Format phone number if needed
        const cleanPhone = phoneValue.replace(/\D/g, '');
        if (cleanPhone.length === 10) {
          return `(${cleanPhone.slice(0,3)}) ${cleanPhone.slice(3,6)}-${cleanPhone.slice(6)}`;
        } else if (cleanPhone.length === 11 && cleanPhone.startsWith('1')) {
          return `(${cleanPhone.slice(1,4)}) ${cleanPhone.slice(4,7)}-${cleanPhone.slice(7)}`;
        }
        return phoneValue; // Return as-is if already formatted
      }
    }

    // Step 3: Map based on account number for known dealers
    const metaData = vehicle.meta_data || [];
    const accountMeta = metaData.find(m => m.key === 'account_number_seller');

    if (accountMeta && accountMeta.value) {
      const phoneMap = {
        '100082': '(425) 743-0649',  // Carson Cars - user's provided number
        '1000821': '(425) 743-0649', // Carson Cars - handle both formats
        '73': '(425) 555-0100',      // Del Sol Auto Sales
        '101': '(253) 555-0100',     // Carson Cars
        '205': '(253) 555-0200',     // Northwest Auto Group
        '312': '(425) 555-0300',     // Electric Auto Northwest
        '445': '(206) 555-0400'      // Premium Motors Seattle
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
  // eslint-disable-next-line no-unused-vars
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

  // Get the featured image prioritizing real inventory images
  const getFeaturedImage = useCallback(() => {
    // DETAILED DEBUG: Log the complete vehicle object structure
    console.log(`🔍 DEBUGGING ${vehicle.title} - Complete vehicle object:`, {
      vehicleKeys: Object.keys(vehicle),
      vehicleType: typeof vehicle,
      vehicleId: vehicle.id,

      // Images data
      images: vehicle.images,
      imagesType: typeof vehicle.images,
      imagesIsArray: Array.isArray(vehicle.images),
      imagesLength: vehicle.images?.length,

      // Direct image field
      image: vehicle.image,
      imageType: typeof vehicle.image,

      // Featured media
      featured_media_url: vehicle.featured_media_url,
      featured_media: vehicle.featured_media,

      // Raw data inspection
      rawData: vehicle.rawData,
      rawDataKeys: vehicle.rawData ? Object.keys(vehicle.rawData) : null,

      // Check for alternative image field names
      alternativeFields: {
        imageUrls: vehicle.imageUrls,
        vehicleImages: vehicle.vehicleImages,
        productImages: vehicle.productImages,
        gallery: vehicle.gallery,
        photos: vehicle.photos
      }
    });

    // PRIORITY 1: Use the extracted images array (this is what the diagnostic shows working)
    if (vehicle.images && Array.isArray(vehicle.images) && vehicle.images.length > 0) {
      const imageUrl = vehicle.images[0];
      console.log(`🔍 First image in array:`, imageUrl, typeof imageUrl);

      if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('http') && !imageUrl.includes('/api/placeholder')) {
        console.log(`✅ SUCCESS: Using extracted image: ${imageUrl}`);
        return imageUrl;
      } else {
        console.log(`❌ First image invalid:`, { imageUrl, type: typeof imageUrl, isString: typeof imageUrl === 'string', startsWithHttp: imageUrl?.startsWith?.('http') });
      }
    } else {
      console.log(`❌ Images array invalid:`, {
        hasImages: !!vehicle.images,
        isArray: Array.isArray(vehicle.images),
        length: vehicle.images?.length,
        actualValue: vehicle.images
      });
    }

    // PRIORITY 2: Use direct image field
    if (vehicle.image && typeof vehicle.image === 'string' && vehicle.image.startsWith('http') && !vehicle.image.includes('/api/placeholder')) {
      console.log(`✅ SUCCESS: Using direct image field: ${vehicle.image}`);
      return vehicle.image;
    } else {
      console.log(`❌ Direct image invalid:`, {
        hasImage: !!vehicle.image,
        type: typeof vehicle.image,
        value: vehicle.image,
        startsWithHttp: vehicle.image?.startsWith?.('http')
      });
    }

    // PRIORITY 3: Use featured media URL
    if (vehicle.featured_media_url && typeof vehicle.featured_media_url === 'string' && vehicle.featured_media_url.startsWith('http')) {
      console.log(`✅ SUCCESS: Using featured media URL: ${vehicle.featured_media_url}`);
      return vehicle.featured_media_url;
    } else {
      console.log(`❌ Featured media URL invalid:`, {
        hasFeaturedMediaUrl: !!vehicle.featured_media_url,
        type: typeof vehicle.featured_media_url,
        value: vehicle.featured_media_url
      });
    }

    // PRIORITY 4: Check rawData for images
    if (vehicle.rawData && vehicle.rawData.images && Array.isArray(vehicle.rawData.images) && vehicle.rawData.images.length > 0) {
      const rawImage = vehicle.rawData.images[0];
      const imageUrl = rawImage?.src || rawImage?.url || rawImage;
      console.log(`🔍 Raw data first image:`, { rawImage, imageUrl, type: typeof imageUrl });

      if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('http') && !imageUrl.includes('/api/placeholder')) {
        console.log(`✅ SUCCESS: Using raw data image: ${imageUrl}`);
        return imageUrl;
      }
    }

    // Final debug before fallback
    console.error(`❌ NO IMAGES FOUND for ${vehicle.title} despite diagnostic showing images available!`, {
      completeVehicleObject: vehicle,
      stringifiedVehicle: JSON.stringify(vehicle, null, 2)
    });

    return `https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=380&h=200&fit=crop&auto=format&q=80`;
  }, [vehicle]);

  // Simple image preloading (fixed version)
  useEffect(() => {
    const imageUrl = getFeaturedImage();
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      console.log(`✅ Image preloaded: ${vehicle.title}`);
    };
    img.onerror = () => {
      console.warn(`⚠️ Image failed to load: ${vehicle.title}`);
    };
  }, [vehicle, getFeaturedImage]);

  return (
    <>
      <style>{`
        .vehicle-card {
          width: 100%;
          max-width: 380px;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          transition: box-shadow .2s ease;
          box-sizing: border-box;
        }

        .vehicle-card:hover {
          box-shadow: 0 10px 25px rgba(0,0,0,.1);
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
          color: #cf0d0d;
          cursor: pointer;
          transition: color .2s ease;
          margin-left: 4px;
        }

        .keeper-message {
          font: 12px/1 sans-serif;
          color: #6b7280;
          margin-left: 4px;
          animation: pulse 2s ease;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
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

        .responsive-pricing-container {
          gap: 20px;
          display: flex;
        }

        @media (max-width: 991px) {
          .responsive-pricing-container {
            flex-direction: column;
            align-items: stretch;
            gap: 0px;
          }
        }

        .pricing-column {
          display: flex;
          flex-direction: column;
          line-height: normal;
          width: 50%;
        }

        @media (max-width: 991px) {
          .pricing-column {
            width: 100%;
            margin-left: 0;
          }
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
            src={getFeaturedImage()}
            alt={vehicle.title}
            className="vehicle-image"
            loading="eager"
            decoding="async"
            width="380"
            height="200"
            onError={(e) => {
              console.error(`❌ Image failed to load for ${vehicle.title}:`, e.target.src);
              // Try a different fallback image if the current one fails
              if (!e.target.src.includes('unsplash') && !e.target.src.includes('placeholder')) {
                e.target.src = `https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=380&h=200&fit=crop&auto=format&q=80`;
              } else {
                // Final fallback
                e.target.src = '/api/placeholder/380/200';
              }
            }}
            onLoad={() => {
              console.log(`✅ Image loaded successfully for ${vehicle.title}`);
            }}
            style={{
              transition: 'opacity 0.2s ease',
              objectFit: 'cover',
              backgroundColor: '#f3f4f6'
            }}
          />

          {vehicle.featured && (
            <div className="featured-badge">
              Featured!
            </div>
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
            {getVehicleTitle()}
          </h3>

          <div className="details-bar">
            <div className="detail-group">
              <Gauge />
              <span className="detail-text">
                {(() => {
                  const mileage = getMileage();
                  if (mileage === 'Contact Dealer' || mileage === 'N/A') {
                    return mileage;
                  }
                  return `${mileage} miles`;
                })()}
              </span>
            </div>
            <div className="detail-group">
              <Settings />
              <span className="detail-text">{getTransmission()}</span>
            </div>
            <div className="detail-group">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="16" rx="2"/>
                <path d="M7 4v16"/>
              </svg>
              <span className="detail-text">{getVehicleSpec('doors')} doors</span>
            </div>
          </div>

          <div className="pricing-section">
            <div className="responsive-pricing-container">
              <div className="pricing-column">
                <div className="price-group">
                  <div className="price-label">Sale Price</div>
                  <div className="price-value sale">{getVehiclePrice() || "$7,995"}</div>
                </div>
              </div>
              {getVehiclePayment() && (
                <div className="price-divider"></div>
              )}
              {getVehiclePayment() && (
                <div className="pricing-column">
                  <div className="price-group">
                    <div className="price-label">Monthly Payment</div>
                    <div className="price-value payment">{getVehiclePayment()}/mo</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="dealer-section">
          <div className="dealer-info">
            <div className="dealer-name">{getSafeSellerName()}</div>
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
                try {
                  // Enhanced Google Analytics tracking for phone clicks
                  const sellerName = getSafeSellerName();
                  const phoneNumber = getSellerPhone();

                  // Google Analytics 4 (gtag)
                  if (typeof window !== 'undefined' && window.gtag) {
                    window.gtag('event', 'phone_call', {
                      'event_category': 'engagement',
                      'event_label': `${sellerName} - ${phoneNumber}`,
                      'custom_parameter_dealer': sellerName,
                      'custom_parameter_phone': phoneNumber,
                      'value': 1
                    });
                    console.log('✅ GA4 phone click tracked:', sellerName);
                  }

                  // Google Analytics Universal (backup)
                  if (typeof window !== 'undefined' && window.ga) {
                    window.ga('send', 'event', {
                      eventCategory: 'dealer_contact',
                      eventAction: 'phone_click',
                      eventLabel: `${sellerName} - ${phoneNumber}`,
                      value: 1
                    });
                    console.log('✅ GA Universal phone click tracked:', sellerName);
                  }

                  // DataLayer push for GTM
                  if (typeof window !== 'undefined' && window.dataLayer) {
                    window.dataLayer.push({
                      'event': 'phone_click',
                      'dealer_name': sellerName,
                      'phone_number': phoneNumber,
                      'event_category': 'dealer_contact'
                    });
                    console.log('✅ DataLayer phone click tracked:', sellerName);
                  }

                } catch (error) {
                  console.warn('Analytics tracking error:', error);
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
