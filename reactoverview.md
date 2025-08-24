# Carzino React Filter System - Technical Implementation Scope

## Project Overview
Build a React-based vehicle filtering and sorting system for the Carzino WordPress/WooCommerce website with full data integration from ACF and WooCommerce fields.

## Data Architecture

### 1. ACF Fields Structure

#### Vehicle Identification Fields
- `stock_number` (text) - Prefixed with "STOCK-"
- `vin` (text) - 17-character VIN
- `year` (text) - Vehicle year
- `make` (text) - Vehicle manufacturer
- `model` (text) - Vehicle model
- `trim` (text) - Vehicle trim level

#### Pricing Fields
- `price` (number) - Sale price (primary pricing source)
- `msrp` (number) - Manufacturer suggested retail price
- `monthly_payment` (number) - Computed monthly payment

#### Vehicle Specifications
- `mileage` (number) - Current mileage
- `condition` (select) - Options: New/Used/Certified
- `transmission` (select) - Options: Auto/Manual/CVT
- `drivetrain` (select) - Options: FWD/RWD/AWD/4WD
- `doors` (number) - Number of doors
- `displacement_liters` (text) - Engine displacement
- `fuel_type` (select) - Gas/Diesel/Electric/Hybrid
- `city_mpg` (number) - City fuel economy
- `highway_mpg` (number) - Highway fuel economy
- `body_type` (text) - Maps to WooCommerce categories

#### Appearance Fields
- `exterior_color` (select) - Exterior paint color
- `interior_color` (select) - Interior material color

#### Location Fields
- `car_location_latitude` (number) - Vehicle latitude coordinate
- `car_location_longitude` (number) - Vehicle longitude coordinate
- `dealer_location` (text) - Dealer address

#### Media Fields
- `vehicle_gallery` (gallery) - Array of image URLs
- `featured_image` (image) - Primary vehicle image

#### Dealer/Seller Fields
- `account_number_seller` (text) - Links to SellersAccount post type
- `acount_name_seller` (text) - Dealer/seller name
- `phone_number_seller` (text) - Contact phone
- `dealer` (relationship) - Legacy relationship field

#### Customer Capture Fields
- `customer_zip` (text) - User's ZIP code
- `customer_city` (text) - User's city
- `customer_state` (text) - User's state

#### Additional Content
- `features_dealer` (checkbox) - Array of feature strings
- `post_content` (textarea) - Vehicle description

### 2. WooCommerce Fields & Taxonomies

#### Product Meta Fields
- `_sku` - Stock keeping unit
- `_stock_status` - instock/outofstock
- `_visibility` - visible/hidden
- `_featured` - yes/no
- `post_status` - publish/draft/pending

#### WooCommerce Taxonomies

**Product Categories (Body Styles)**
```
Parent: car
  - sedan (Sedan)
  - coupe (Coupe)
  - hatchback (Hatchback)
  - wagon (Wagon)
  - convertible (Convertible)
  - crossover-suv (Crossover/SUV)
  - van-minivan (Van/Minivan)

Parent: truck
  - crew-cab-pickup (Crew Cab Pickup)
  - extended-cab-pickup (Extended Cab Pickup)
  - regular-cab-pickup (Regular Cab Pickup)
```

**Product Attributes**
- `pa_vehicles_condition` - Attribute for New/Used/Certified
- `pa_make` - Vehicle manufacturer attribute
- `pa_model` - Vehicle model attribute
- `pa_year` - Vehicle year attribute

### 3. SellersAccount Post Type Fields

#### Identification
- `account_number_seller` (text) - Unique seller identifier
- `seller_name` (text) - Business name

#### Location Data
- `zip_seller` (text) - Seller ZIP code
- `car_location_latitude` (number) - Geocoded latitude
- `car_location_longitude` (number) - Geocoded longitude
- `city_seller` (text) - City name
- `state_seller` (text) - State abbreviation

#### Contact Information
- `phone_seller` (text) - Business phone
- `email_seller` (email) - Business email
- `website_seller` (url) - Dealer website

## WordPress REST API Specification

### Endpoint Structure
```
/wp-json/carzino/v1/search
```

### Request Parameters
```javascript
{
  // Search Parameters
  "keyword": "string",           // General search term
  "zip": "string",               // 5-digit ZIP code
  "radius": "number",            // Search radius in miles
  
  // Filter Parameters
  "make": ["string"],            // Array of makes
  "model": ["string"],           // Array of models
  "year": ["string"],            // Array of years or range
  "condition": ["string"],       // New/Used/Certified
  "body_type": ["string"],       // Category slugs
  "transmission": ["string"],    // Auto/Manual/CVT
  "drivetrain": ["string"],      // FWD/RWD/AWD/4WD
  "fuel_type": ["string"],       // Gas/Diesel/Electric/Hybrid
  "exterior_color": ["string"],  // Color options
  "interior_color": ["string"],  // Color options
  
  // Range Filters
  "price_min": "number",
  "price_max": "number",
  "mileage_min": "number",
  "mileage_max": "number",
  "mpg_min": "number",
  "mpg_max": "number",
  "year_min": "number",
  "year_max": "number",
  
  // Sorting
  "sort": "string",              // Sort field
  "order": "string",             // asc/desc
  
  // Pagination
  "page": "number",              // Page number
  "per_page": "number"           // Results per page (default: 20)
}
```

### Response Structure
```javascript
{
  "results": [
    {
      // Core Product Data
      "id": 12345,
      "title": "2020 Honda Accord Sport",
      "slug": "2020-honda-accord-sport",
      "url": "/product/2020-honda-accord-sport",
      
      // ACF Fields
      "acf": {
        "stock_number": "STOCK-H2345",
        "vin": "1HGCV1F31LA123456",
        "year": "2020",
        "make": "Honda",
        "model": "Accord",
        "trim": "Sport",
        "price": 28500,
        "msrp": 31000,
        "monthly_payment": 395.83,
        "mileage": 15234,
        "condition": "Used",
        "transmission": "Auto",
        "drivetrain": "FWD",
        "doors": 4,
        "displacement_liters": "1.5L",
        "fuel_type": "Gas",
        "city_mpg": 30,
        "highway_mpg": 38,
        "exterior_color": "Crystal Black Pearl",
        "interior_color": "Black",
        "car_location_latitude": 47.3809,
        "car_location_longitude": -122.2348,
        "features_dealer": [
          "Adaptive Cruise Control",
          "Lane Keeping Assist",
          "Apple CarPlay"
        ]
      },
      
      // Gallery/Images
      "images": {
        "featured": "https://site.com/wp-content/uploads/featured.jpg",
        "gallery": [
          "https://site.com/wp-content/uploads/image1.jpg",
          "https://site.com/wp-content/uploads/image2.jpg"
        ]
      },
      
      // Categories/Taxonomies
      "categories": [
        {
          "slug": "sedan",
          "name": "Sedan",
          "parent": "car"
        }
      ],
      
      // Seller Information
      "seller": {
        "account_number": "DLR001",
        "name": "Premium Auto Sales",
        "phone": "(253) 555-0100",
        "location": {
          "address": "123 Main St, Auburn, WA 98001",
          "city": "Auburn",
          "state": "WA",
          "zip": "98001",
          "latitude": 47.3073,
          "longitude": -122.2285
        }
      },
      
      // Calculated Fields
      "distance": 12.5,  // Miles from user ZIP
      "days_on_lot": 45,
      "price_reduction": 2500,
      
      // Meta Information
      "status": "publish",
      "stock_status": "instock",
      "featured": false
    }
  ],
  
  // Pagination Meta
  "pagination": {
    "total": 543,
    "total_pages": 28,
    "current_page": 1,
    "per_page": 20,
    "from": 1,
    "to": 20
  },
  
  // Filter Facets (available options with counts)
  "facets": {
    "makes": [
      {"value": "Honda", "count": 145, "slug": "honda"},
      {"value": "Toyota", "count": 132, "slug": "toyota"}
    ],
    "models": [
      {"value": "Accord", "count": 23, "slug": "accord"},
      {"value": "Civic", "count": 31, "slug": "civic"}
    ],
    "years": [
      {"value": "2024", "count": 89},
      {"value": "2023", "count": 124}
    ],
    "conditions": [
      {"value": "New", "count": 234},
      {"value": "Used", "count": 289},
      {"value": "Certified", "count": 20}
    ],
    "body_types": [
      {"value": "sedan", "name": "Sedan", "count": 156},
      {"value": "crossover-suv", "name": "Crossover/SUV", "count": 201}
    ],
    "price_range": {
      "min": 8900,
      "max": 125000
    },
    "mileage_range": {
      "min": 0,
      "max": 150000
    }
  },
  
  // Search Context
  "search_context": {
    "user_location": {
      "zip": "98498",
      "city": "Auburn",
      "state": "WA",
      "latitude": 47.3809,
      "longitude": -122.2348
    },
    "search_radius": 200,
    "applied_filters": {
      "make": ["Honda"],
      "condition": ["Used"]
    }
  }
}
```

## URL Parameter Mapping

### Current WCAPF Parameters (Must Maintain)
```
_make=Honda
_model=Accord
_year=2020
_condition=used
product_cat=sedan
```

### Additional React Parameters
```
zip=98498
radius=200
sort=price
order=asc
page=2
```

## Data Flow Architecture

### 1. Vehicle Data Synchronization
```
WP All Import → ACF Fields → Post Save Hook → Normalize Data → Link to SellersAccount → Sync Coordinates
```

### 2. Search Query Processing
```
React Filter UI → API Request → WP_Query Builder → Apply Filters → Calculate Distance → Sort Results → Return JSON
```

### 3. Geocoding Pipeline
```
User ZIP → Google Maps API → Cache in Transient → Calculate Haversine Distance → Filter by Radius
```

## PHP Implementation Requirements

### API Endpoint Registration
```php
add_action('rest_api_init', function() {
    register_rest_route('carzino/v1', '/search', [
        'methods' => 'GET',
        'callback' => 'carzino_search_vehicles',
        'permission_callback' => '__return_true',
        'args' => [
            'make' => ['type' => 'array'],
            'model' => ['type' => 'array'],
            'year' => ['type' => 'array'],
            'condition' => ['type' => 'array'],
            'zip' => ['type' => 'string'],
            'radius' => ['type' => 'integer'],
            'sort' => ['type' => 'string'],
            'order' => ['type' => 'string'],
            'page' => ['type' => 'integer'],
            'per_page' => ['type' => 'integer']
        ]
    ]);
});
```

### Query Building Logic
```php
function carzino_search_vehicles($request) {
    $params = $request->get_params();
    
    // Base query args
    $args = [
        'post_type' => 'product',
        'post_status' => 'publish',
        'posts_per_page' => $params['per_page'] ?? 20,
        'paged' => $params['page'] ?? 1,
        'meta_query' => [],
        'tax_query' => []
    ];
    
    // Add make filter
    if (!empty($params['make'])) {
        $args['meta_query'][] = [
            'key' => 'make',
            'value' => $params['make'],
            'compare' => 'IN'
        ];
    }
    
    // Add price range filter
    if (!empty($params['price_min']) || !empty($params['price_max'])) {
        $args['meta_query'][] = [
            'key' => 'price',
            'value' => [$params['price_min'] ?? 0, $params['price_max'] ?? 999999],
            'type' => 'NUMERIC',
            'compare' => 'BETWEEN'
        ];
    }
    
    // Add radius search
    if (!empty($params['zip']) && !empty($params['radius'])) {
        $user_coords = carzino_zip_to_latlng($params['zip']);
        if ($user_coords) {
            // Add distance calculation to query
            add_filter('posts_where', function($where) use ($user_coords, $params) {
                // Haversine formula SQL
                return $where;
            });
        }
    }
    
    // Execute query
    $query = new WP_Query($args);
    
    // Format response
    return carzino_format_search_response($query, $params);
}
```

### Geocoding Functions
```php
function carzino_zip_to_latlng($zip) {
    // Check transient cache first
    $cache_key = 'carzino_zip_coords_' . $zip;
    $cached = get_transient($cache_key);
    if ($cached) return $cached;
    
    // Call Google Maps API
    $api_key = get_option('carzino_google_maps_key');
    $url = "https://maps.googleapis.com/maps/api/geocode/json?address={$zip}&key={$api_key}";
    
    $response = wp_remote_get($url);
    if (is_wp_error($response)) return false;
    
    $data = json_decode(wp_remote_retrieve_body($response), true);
    
    if ($data['status'] === 'OK' && !empty($data['results'][0])) {
        $location = $data['results'][0]['geometry']['location'];
        $coords = [
            'lat' => $location['lat'],
            'lng' => $location['lng']
        ];
        
        // Cache for 30 days
        set_transient($cache_key, $coords, 30 * DAY_IN_SECONDS);
        return $coords;
    }
    
    return false;
}

function carzino_calculate_distance($lat1, $lon1, $lat2, $lon2) {
    $earth_radius = 3959; // Miles
    
    $lat1 = deg2rad($lat1);
    $lon1 = deg2rad($lon1);
    $lat2 = deg2rad($lat2);
    $lon2 = deg2rad($lon2);
    
    $dlat = $lat2 - $lat1;
    $dlon = $lon2 - $lon1;
    
    $a = sin($dlat/2) * sin($dlat/2) + 
         cos($lat1) * cos($lat2) * 
         sin($dlon/2) * sin($dlon/2);
    
    $c = 2 * atan2(sqrt($a), sqrt(1-$a));
    
    return $earth_radius * $c;
}
```

## React Component Data Requirements

### Filter State Structure
```javascript
const filterState = {
  // Active Filters
  filters: {
    make: [],
    model: [],
    year: [],
    condition: [],
    body_type: [],
    transmission: [],
    drivetrain: [],
    fuel_type: [],
    price: { min: null, max: null },
    mileage: { min: null, max: null }
  },
  
  // Location
  location: {
    zip: '98498',
    radius: 200,
    coordinates: { lat: null, lng: null }
  },
  
  // Sorting
  sort: {
    field: 'relevance',
    order: 'desc'
  },
  
  // Pagination
  pagination: {
    page: 1,
    perPage: 20
  },
  
  // UI State
  ui: {
    loading: false,
    mobileFiltersOpen: false,
    viewMode: 'grid'
  }
};
```

### Component Props Interface
```typescript
interface VehicleData {
  id: number;
  title: string;
  acf: ACFFields;
  images: ImageData;
  categories: Category[];
  seller: SellerInfo;
  distance: number;
}

interface ACFFields {
  stock_number: string;
  vin: string;
  year: string;
  make: string;
  model: string;
  trim: string;
  price: number;
  msrp: number;
  monthly_payment: number;
  mileage: number;
  condition: string;
  transmission: string;
  drivetrain: string;
  doors: number;
  displacement_liters: string;
  fuel_type: string;
  city_mpg: number;
  highway_mpg: number;
  exterior_color: string;
  interior_color: string;
  car_location_latitude: number;
  car_location_longitude: number;
  features_dealer: string[];
}

interface SellerInfo {
  account_number: string;
  name: string;
  phone: string;
  location: {
    address: string;
    city: string;
    state: string;
    zip: string;
    latitude: number;
    longitude: number;
  };
}

interface ImageData {
  featured: string;
  gallery: string[];
}

interface Category {
  slug: string;
  name: string;
  parent: string;
}
```

## Integration Points

### Existing Shortcodes to Maintain
- `[product_acf_price]` - Display ACF price field
- `[carzino_product_monthly_payment_dynamic]` - Calculate monthly payment
- `[vehicle_distance]` - Show distance from user
- `[seller_info]` - Display seller information
- `[customer_zip]` - Show user's ZIP
- `[customer_city]` - Show user's city
- `[customer_state]` - Show user's state

### Existing JavaScript Variables
```javascript
window.carzino = {
  ajax_url: '/wp-admin/admin-ajax.php',
  api_base: '/wp-json/carzino/v1',
  default_zip: '98498',
  default_radius: 200,
  google_maps_key: 'YOUR_API_KEY'
};
```

### Local Storage Keys
- `carzino_zip` - User's ZIP code
- `carzino_radius` - Search radius
- `carzino_filters` - Applied filters
- `carzino_sort` - Current sort option

## Sorting Implementation

### Available Sort Options
1. **Relevance** - Default WP search relevance
2. **Distance** - Closest to user location first
3. **Price Low to High** - ACF `price` ascending
4. **Price High to Low** - ACF `price` descending
5. **Mileage Low to High** - ACF `mileage` ascending
6. **Mileage High to Low** - ACF `mileage` descending
7. **Year Newest** - ACF `year` descending
8. **Year Oldest** - ACF `year` ascending

### Sort Implementation Map
```php
$sort_options = [
    'relevance' => ['orderby' => 'relevance'],
    'distance' => ['orderby' => 'distance', 'order' => 'ASC'],
    'price_asc' => ['meta_key' => 'price', 'orderby' => 'meta_value_num', 'order' => 'ASC'],
    'price_desc' => ['meta_key' => 'price', 'orderby' => 'meta_value_num', 'order' => 'DESC'],
    'mileage_asc' => ['meta_key' => 'mileage', 'orderby' => 'meta_value_num', 'order' => 'ASC'],
    'mileage_desc' => ['meta_key' => 'mileage', 'orderby' => 'meta_value_num', 'order' => 'DESC'],
    'year_desc' => ['meta_key' => 'year', 'orderby' => 'meta_value_num', 'order' => 'DESC'],
    'year_asc' => ['meta_key' => 'year', 'orderby' => 'meta_value_num', 'order' => 'ASC']
];
```

## Configuration Constants

```php
// Default Values
define('CARZINO_DEFAULT_ZIP', '98498');
define('CARZINO_DEFAULT_RADIUS', 200);
define('CARZINO_DEFAULT_PER_PAGE', 20);
define('CARZINO_MAX_PER_PAGE', 100);

// Cache Durations
define('CARZINO_ZIP_CACHE_DURATION', 30 * DAY_IN_SECONDS);
define('CARZINO_FACETS_CACHE_DURATION', HOUR_IN_SECONDS);
```

## Required Design Components

### Filter UI Components
- Desktop filter sidebar (280px width)
- Mobile filter overlay (full screen, slide-in from left)
- Collapsible filter sections with chevron indicators
- Custom checkbox design (16x16px, #CF0D0D when checked)
- Applied filters pills with remove buttons
- Clear all filters button

### Product Card Components
- Image container with aspect ratio preservation
- Badge overlays (Featured, New Arrival, etc.)
- Title section (Year Make Model format)
- Price display with formatting
- Monthly payment calculator display
- Key specs grid (mileage, transmission, fuel type)
- Dealer information section
- Distance indicator
- Favorite/save button
- Card hover states and shadows

### Search & Sort Components
- ZIP code input field
- Radius dropdown (default: 200 miles)
- Search button with right chevron icon
- Sort dropdown with active indicator
- Results count display
- Location context display

### Responsive Breakpoints
```css
/* Mobile */
@media (max-width: 639px)

/* Tablet */
@media (min-width: 640px) and (max-width: 1023px)

/* Desktop */
@media (min-width: 1024px)

/* Wide Desktop */
@media (min-width: 1325px)
```

### Design Tokens
```css
/* Colors */
--color-primary: #CF0D0D
--color-gray-50: #F9FAFB
--color-gray-100: #F3F4F6
--color-gray-200: #E5E7EB
--color-gray-300: #D1D5DB
--color-gray-400: #9CA3AF
--color-gray-500: #6B7280
--color-gray-900: #111827
--color-white: #FFFFFF

/* Container */
--container-max: 1325px
```

## CSV Import Field Mapping Reference

### Input CSV Fields → ACF Field Names
- Stock# → `stock_number` (Prefix with "STOCK-")
- Year → `year`
- Make → `make` (Lowercase, match ACF choices)
- Model → `model`
- Trim → `trim`
- VIN → `vin` (Uppercase, validate length)
- Mileage → `mileage` (Remove commas)
- Condition → `condition` (Map: New/Used/Certified)
- Price → `price` (Remove $, commas)
- MSRP → `msrp` (Remove $, commas)
- Payment → `monthly_payment` (Parse formatting)
- Exterior Color → `exterior_color` (Standardize names)
- Interior Color → `interior_color` (Standardize names)
- Transmission → `transmission` (Map: Auto/Manual/CVT)
- Drive Type → `drivetrain` (Map: FWD/RWD/AWD/4WD)
- Doors → `doors` (Extract number only)
- Engine → `displacement_liters`
- Fuel Type → `fuel_type` (Standardize)
- MPG City → `city_mpg` (Number only)
- MPG Highway → `highway_mpg` (Number only)
- Features → `features_dealer` (Split by comma)
- Photos → `vehicle_gallery` (URLs or filenames)
- Dealer Name → `acount_name_seller`
- Location → `dealer_location`
- Phone → `phone_number_seller` (Format: (XXX) XXX-XXXX)
- Description → `post_content`

## Notes

- All price fields use ACF as primary source, not WooCommerce meta
- Vehicle products link to SellersAccount via `account_number_seller`
- Coordinates sync from SellersAccount to products for radius search
- Categories are assigned based on body_type mapping
- Default location: Auburn, WA (ZIP: 98498)
- Maximum search radius: 200 miles
- Maintain compatibility with existing WCAPF filter parameters