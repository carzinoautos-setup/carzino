# Phase 1: Foundation Architecture (0-10K vehicles)

## Current State Assessment
- ✅ React frontend working
- ✅ WooCommerce API integration 
- ❌ No real pagination
- ❌ Client-side filtering only
- ❌ No search functionality

## Phase 1 Upgrades Needed

### 1. Database Migration
```sql
-- Move from WooCommerce to dedicated vehicle database
CREATE DATABASE vehicles_db;

-- Optimized vehicle table structure
CREATE TABLE vehicles (
    id BIGSERIAL PRIMARY KEY,
    vin VARCHAR(17) UNIQUE NOT NULL,
    dealer_id INT NOT NULL,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year SMALLINT NOT NULL,
    price DECIMAL(10,2),
    mileage INT,
    status VARCHAR(20) DEFAULT 'available',
    
    -- Essential indexes for performance
    INDEX idx_make_model_year (make, model, year),
    INDEX idx_price_range (price),
    INDEX idx_status_dealer (status, dealer_id),
    INDEX idx_mileage (mileage)
);
```

### 2. API Layer Upgrade
```javascript
// Replace direct WooCommerce calls with optimized vehicle API
const vehicleAPI = {
  async searchVehicles(filters, page = 1) {
    const params = new URLSearchParams({
      page,
      per_page: 25, // Keep reasonable page sizes
      make: filters.make?.join(','),
      model: filters.model?.join(','),
      year_min: filters.yearMin,
      year_max: filters.yearMax,
      price_min: filters.priceMin,
      price_max: filters.priceMax,
      status: 'available'
    });

    const response = await fetch(`/api/v1/vehicles/search?${params}`);
    return response.json();
  }
};
```

### 3. Search Implementation
```javascript
// Add real search functionality to replace current filtering
const searchImplementation = {
  // Basic full-text search using PostgreSQL
  async textSearch(query, filters) {
    return await db.query(`
      SELECT *, 
             ts_rank(search_vector, plainto_tsquery($1)) as rank
      FROM vehicles 
      WHERE search_vector @@ plainto_tsquery($1)
        AND ($2::text IS NULL OR make = $2)
        AND ($3::int IS NULL OR year >= $3)
      ORDER BY rank DESC, price ASC
      LIMIT 25
    `, [query, filters.make, filters.yearMin]);
  }
};
```

### 4. Infrastructure Upgrade
- **Database**: PostgreSQL on managed service (AWS RDS, Digital Ocean)
- **Backend**: Node.js/Express API server
- **Frontend**: Keep current React app
- **Hosting**: Container deployment (Docker + Railway/Render)

### Performance Targets Phase 1:
- ✅ Handle 10,000 vehicles smoothly
- ✅ Search response time < 500ms
- ✅ Support 100 concurrent users
- ✅ 99.5% uptime

### Estimated Costs Phase 1:
- Database: $100-200/month
- API Server: $50-100/month  
- Hosting: $50-100/month
- **Total: $200-400/month**
