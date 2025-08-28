# Vehicle Card Data Mapping & Styling Rules

## Elements with Red Outlines (from your image)

### 1. **Vehicle Title** (Top area)
- **Data Source**: `vehicle.title` 
- **WooCommerce Field**: `product.name`
- **CSS Class**: `.vehicle-title`
- **Styling Rules**:
  ```css
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
  ```

### 2. **Price Section** (Sale Price & Payments)
- **Sale Price Data**: `vehicle.salePrice` → from `product.price`
- **Payment Data**: `vehicle.payment` → from meta field `monthly_payment` or `_monthly_payment`
- **CSS Classes**: `.price-value.sale`, `.price-value.payment`
- **Styling Rules**:
  ```css
  .price-value.sale { color: #000000; }
  .price-value.payment { color: #CF0D0D; }
  ```

### 3. **Dealer Information** (Bottom section)
- **Dealer Name**: `getSellerName()` function logic:
  1. `vehicle.seller_data.account_name` (from WordPress API)
  2. `meta_data` with key `acount_name_seller` (note: typo in key name)
  3. Fallback mapping by `account_number_seller`
- **Location**: `getSellerLocation()` function:
  1. `city_seller`, `state_seller`, `zip_seller` from meta_data
- **Phone**: `getSellerPhone()` function:
  1. `vehicle.seller_data.phone`
  2. `phone_number_seller` from meta_data
  3. Hardcoded mapping by account number

### 4. **Vehicle Details** (Mileage, Transmission, Doors)
- **Mileage**: meta field `mileage` or `_mileage`
- **Transmission**: meta field `transmission` or `_transmission`
- **Doors**: meta field `doors` or `_doors`

## WooCommerce/ACF Field Mapping

### Primary Data Sources:
```javascript
// From transformWooCommerceVehicle function:
const getMeta = (key) => {
  const meta = meta_data.find(m => m.key === key);
  return meta ? meta.value : '';
};

// Key field mappings:
title: product.name
price: product.price
mileage: getMeta('mileage') || getMeta('_mileage')
transmission: getMeta('transmission') || getMeta('_transmission')
doors: getMeta('doors') || getMeta('_doors')
```

### Seller Data Fields:
```javascript
// ACF Custom Fields for seller information:
- account_number_seller
- acount_name_seller (note: typo in field name)
- city_seller
- state_seller
- zip_seller
- phone_number_seller
- account_type_seller
```

## Important Notes:

1. **Red Outlines**: These are NOT actual CSS styles - they appear to be:
   - Browser developer tools highlighting
   - Design annotation overlays
   - Debugging borders

2. **Data Hierarchy**: The component uses this priority:
   1. `vehicle.seller_data` (from WordPress API)
   2. `meta_data` fields (ACF custom fields)
   3. Hardcoded fallbacks by account number

3. **Account Number Mapping**: For known dealers:
   ```javascript
   const dealerMap = {
     '100082': 'Carson Cars',
     '73': 'Del Sol Auto Sales',
     '101': 'Carson Cars',
     // etc...
   };
   ```

## Visual Mockup Structure:

```
┌���────────────────────────────────┐
│  [Featured Badge] [❤️ Favorite] │
│                                 │
│  ████████████████████████████   │ ← Vehicle Image
│  ████████████████████████████   │
│                                 │
│  [Used] [FWD]                   │ ← Status Badges
│                                 │
│  2014 Ford Fusion SE            │ ← Title (vehicle.title)
│                                 │
│  🔧 160601 miles ⚙️ Auto 🚪 4    │ ← Details
│                                 │
│  Sale Price    │    Payments    │ ← Pricing
│   $7,995       │   165.96/mo*   │
│                                 │
├─────────────────────────────────┤
│ Unknown Dealer    │    Dealer   │ ← Dealer Info
│ Seattle, WA 98101 │ (253)555-0100│
└─────────────────────────────────┘
```
