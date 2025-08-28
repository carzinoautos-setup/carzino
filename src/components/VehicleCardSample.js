import React from 'react';
import VehicleCard from './VehicleCard';

const VehicleCardSample = () => {
  // Sample vehicles with proper data structure to test generated values
  const sampleVehicles = [
    {
      id: 'sample-1',
      title: '2021 Toyota RAV4 XLE',
      images: ['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=450&h=300&fit=crop'],
      featured: true,
      stock_status: 'instock',
      meta_data: [
        { key: 'make', value: 'Toyota' },
        { key: 'model', value: 'RAV4' },
        { key: 'year', value: '2021' },
        { key: 'trim', value: 'XLE' },
        { key: 'condition', value: 'used' },
        { key: 'mileage', value: '32456' },
        { key: 'transmission', value: 'Automatic' },
        { key: 'drivetrain', value: 'AWD' },
        { key: 'doors', value: '4' },
        { key: 'price', value: '28995' },
        { key: 'monthly_payment', value: '425' },
        { key: 'acount_name_seller', value: 'Carson Cars' },
        { key: 'city_seller', value: 'Seattle' },
        { key: 'state_seller', value: 'WA' },
        { key: 'phone_number_seller', value: '(206) 555-0123' },
        { key: 'account_type_seller', value: 'Dealer' }
      ]
    },
    {
      id: 'sample-2',
      title: '2020 Honda Civic Si',
      images: ['https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=450&h=300&fit=crop'],
      featured: false,
      stock_status: 'instock',
      meta_data: [
        { key: 'make', value: 'Honda' },
        { key: 'model', value: 'Civic' },
        { key: 'year', value: '2020' },
        { key: 'trim', value: 'Si' },
        { key: 'condition', value: 'certified' },
        { key: 'mileage', value: '24567' },
        { key: 'transmission', value: 'Manual' },
        { key: 'drivetrain', value: 'FWD' },
        { key: 'doors', value: '4' },
        { key: 'price', value: '22995' },
        { key: 'monthly_payment', value: '329' },
        { key: 'acount_name_seller', value: 'Honda Center' },
        { key: 'city_seller', value: 'Bellevue' },
        { key: 'state_seller', value: 'WA' },
        { key: 'phone_number_seller', value: '(425) 555-0456' },
        { key: 'account_type_seller', value: 'Dealer' }
      ]
    },
    {
      id: 'sample-3',
      title: '2019 Ford F-150 XLT',
      images: ['https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=450&h=300&fit=crop'],
      featured: false,
      stock_status: 'instock',
      meta_data: [
        { key: 'make', value: 'Ford' },
        { key: 'model', value: 'F-150' },
        { key: 'year', value: '2019' },
        { key: 'trim', value: 'XLT' },
        { key: 'condition', value: 'excellent' },
        { key: 'mileage', value: '45321' },
        { key: 'transmission', value: 'Automatic' },
        { key: 'drivetrain', value: '4WD' },
        { key: 'doors', value: '4' },
        { key: 'price', value: '34995' },
        // No payment data - will use smart calculation
        { key: 'acount_name_seller', value: 'Northwest Auto Group' },
        { key: 'city_seller', value: 'Tacoma' },
        { key: 'state_seller', value: 'WA' },
        { key: 'phone_number_seller', value: '(253) 555-0789' },
        { key: 'account_type_seller', value: 'Dealer' }
      ]
    }
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px', color: '#111827' }}>
        🔧 Vehicle Card - Fixed Generated Values Preview
      </h2>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {sampleVehicles.map(vehicle => (
          <VehicleCard
            key={vehicle.id}
            vehicle={vehicle}
            favorites={{}}
            onFavoriteToggle={() => {}}
          />
        ))}
      </div>

      <div style={{
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '20px',
        marginTop: '24px'
      }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#111827' }}>
          ✅ Fixed Generated Values:
        </h3>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li><strong>Vehicle Title:</strong> Properly generated from year + make + model + trim</li>
          <li><strong>Condition:</strong> Standardized values (Used, Certified Pre-Owned, Excellent, etc.)</li>
          <li><strong>Mileage:</strong> Formatted with commas (e.g., "32,456 miles")</li>
          <li><strong>Pricing:</strong> 
            <ul style={{ marginTop: '8px' }}>
              <li>Sale Price: From ACF price fields with proper formatting</li>
              <li>Monthly Payment: From ACF payment fields OR smart calculation if missing</li>
              <li>Conditional display: Payment only shows if available</li>
            </ul>
          </li>
          <li><strong>Dealer Info:</strong> 
            <ul style={{ marginTop: '8px' }}>
              <li>Name: From seller fields with proper mapping</li>
              <li>Location: City, State format</li>
              <li>Phone: Properly formatted phone numbers</li>
            </ul>
          </li>
          <li><strong>Vehicle Specs:</strong> Transmission, drivetrain, doors with fallbacks</li>
        </ul>
      </div>

      <div style={{
        background: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '12px',
        padding: '20px',
        marginTop: '16px'
      }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#dc2626' }}>
          🚨 Note: Main App Still Loading
        </h3>
        <p style={{ margin: 0, color: '#991b1b' }}>
          The main application is still showing "Loading vehicles..." because the environment variables 
          are not configured. This preview shows how the vehicle cards will look once your WordPress 
          API connection is working properly.
        </p>
      </div>
    </div>
  );
};

export default VehicleCardSample;
