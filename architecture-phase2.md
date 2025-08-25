# Phase 2: Scale-Up Architecture (10K-100K vehicles)

## Challenges at This Scale
- Database queries slow down significantly
- Need real caching strategy
- Multiple data sources (feeds, APIs)
- Geographic distribution needed

## Phase 2 Architecture Changes

### 1. Database Optimization
```sql
-- Add partitioning by dealer regions
CREATE TABLE vehicles_west PARTITION OF vehicles 
FOR VALUES IN ('CA', 'OR', 'WA', 'NV', 'AZ');

CREATE TABLE vehicles_east PARTITION OF vehicles 
FOR VALUES IN ('NY', 'MA', 'FL', 'NC', 'VA');

CREATE TABLE vehicles_central PARTITION OF vehicles 
FOR VALUES IN ('TX', 'IL', 'OH', 'MI', 'IN');

-- Add specialized indexes for common queries
CREATE INDEX CONCURRENTLY idx_vehicles_make_price 
ON vehicles (make, price) WHERE status = 'available';

CREATE INDEX CONCURRENTLY idx_vehicles_location_radius 
ON vehicles USING gist (location) WHERE status = 'available';
```

### 2. Caching Layer Introduction
```javascript
// Redis caching for search results and hot data
const cacheManager = {
  async getCachedSearch(searchKey) {
    const cached = await redis.get(`search:${searchKey}`);
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  },

  async cacheSearchResults(searchKey, results, ttl = 300) {
    await redis.setex(
      `search:${searchKey}`, 
      ttl, 
      JSON.stringify(results)
    );
  },

  async invalidateVehicleCache(vehicleId) {
    // Remove all cached searches when vehicle data changes
    const pattern = `search:*vehicle:${vehicleId}*`;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
};
```

### 3. Search Engine Implementation
```javascript
// Upgrade to Elasticsearch for better search performance
const searchEngine = {
  async indexVehicle(vehicle) {
    await elasticClient.index({
      index: 'vehicles',
      id: vehicle.id,
      body: {
        vin: vehicle.vin,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        price: vehicle.price,
        mileage: vehicle.mileage,
        location: {
          lat: vehicle.latitude,
          lon: vehicle.longitude
        },
        description: vehicle.description,
        features: vehicle.features,
        suggest: {
          input: [
            vehicle.make,
            vehicle.model,
            `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
            vehicle.trim
          ]
        }
      }
    });
  },

  async searchVehicles(query, filters) {
    const searchQuery = {
      bool: {
        must: [
          {
            multi_match: {
              query: query,
              fields: ['make^3', 'model^2', 'description', 'features']
            }
          }
        ],
        filter: []
      }
    };

    // Add filters
    if (filters.make) {
      searchQuery.bool.filter.push({
        terms: { 'make.keyword': filters.make }
      });
    }

    if (filters.priceRange) {
      searchQuery.bool.filter.push({
        range: {
          price: {
            gte: filters.priceRange.min,
            lte: filters.priceRange.max
          }
        }
      });
    }

    // Geographic search
    if (filters.location && filters.radius) {
      searchQuery.bool.filter.push({
        geo_distance: {
          distance: `${filters.radius}mi`,
          location: filters.location
        }
      });
    }

    return await elasticClient.search({
      index: 'vehicles',
      body: {
        query: searchQuery,
        aggs: {
          makes: { terms: { field: 'make.keyword', size: 50 } },
          price_ranges: { histogram: { field: 'price', interval: 5000 } }
        },
        sort: [
          { _score: { order: 'desc' } },
          { price: { order: 'asc' } }
        ]
      }
    });
  }
};
```

### 4. API Gateway Pattern
```javascript
// Implement API gateway for better request handling
const apiGateway = {
  // Rate limiting
  rateLimiter: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: 'Too many requests, please try again later'
  }),

  // Request caching middleware
  cacheMiddleware: (req, res, next) => {
    const cacheKey = `api:${req.method}:${req.originalUrl}`;
    
    redis.get(cacheKey).then(cached => {
      if (cached) {
        return res.json(JSON.parse(cached));
      }
      
      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function(data) {
        redis.setex(cacheKey, 300, JSON.stringify(data));
        return originalJson.call(this, data);
      };
      
      next();
    });
  }
};
```

### 5. Data Pipeline for Multiple Sources
```javascript
// Handle data feeds from multiple dealerships
const dataPipeline = {
  async processVehicleFeed(dealerId, feedData) {
    const batchSize = 1000;
    const batches = this.chunkArray(feedData, batchSize);
    
    for (const batch of batches) {
      await this.processBatch(dealerId, batch);
    }
  },

  async processBatch(dealerId, vehicles) {
    const transaction = await db.beginTransaction();
    
    try {
      // Bulk insert/update vehicles
      await db.query(`
        INSERT INTO vehicles (vin, dealer_id, make, model, year, price, mileage, status)
        VALUES ${vehicles.map(v => `('${v.vin}', ${dealerId}, '${v.make}', '${v.model}', ${v.year}, ${v.price}, ${v.mileage}, 'available')`).join(', ')}
        ON CONFLICT (vin) DO UPDATE SET
          price = EXCLUDED.price,
          mileage = EXCLUDED.mileage,
          status = EXCLUDED.status,
          updated_at = NOW()
      `);

      // Update search index
      for (const vehicle of vehicles) {
        await searchEngine.indexVehicle(vehicle);
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
```

### Infrastructure Phase 2:
- **Database**: PostgreSQL with read replicas
- **Cache**: Redis cluster
- **Search**: Elasticsearch cluster
- **API**: Multiple Node.js instances with load balancer
- **CDN**: CloudFlare for static assets
- **Monitoring**: Application monitoring (DataDog/New Relic)

### Performance Targets Phase 2:
- ✅ Handle 100,000 vehicles smoothly
- ✅ Search response time < 200ms
- ✅ Support 1,000 concurrent users
- ✅ Geographic search capabilities
- ✅ 99.9% uptime

### Estimated Costs Phase 2:
- Database cluster: $800-1,500/month
- Elasticsearch: $500-1,000/month
- Redis cache: $200-400/month
- API servers: $400-800/month
- CDN: $100-300/month
- Monitoring: $200-400/month
- **Total: $2,200-4,400/month**

### Development Team Needed:
- 1 Backend developer
- 1 DevOps engineer
- 1 Data engineer (part-time)
- Frontend developer (existing)
