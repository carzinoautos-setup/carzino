# Medusa.js Automotive Setup Guide (100% Free)

## Why Medusa.js is Perfect for 300K Vehicles

### ✅ Completely Free
- Open source MIT license
- No platform fees ever
- No transaction fees
- No vendor lock-in

### ✅ Built for Scale
- PostgreSQL database (handles millions of records)
- Node.js backend (high performance)
- Redis caching (fast responses)
- API-first architecture

### ✅ Perfect for Automotive
- Custom product types for vehicles
- Advanced search capabilities
- Real-time inventory management
- Geographic search features

## Quick Setup (30 minutes)

### Step 1: Install Medusa
```bash
# Create new Medusa project
npx create-medusa-app@latest carzino-automotive

cd carzino-automotive

# Start the backend
npm run develop
# Backend runs on http://localhost:9000

# Start admin dashboard (in new terminal)
cd carzino-automotive-admin
npm run develop
# Admin runs on http://localhost:7001
```

### Step 2: Configure for Vehicles
```javascript
// medusa-config.js - Add PostgreSQL database
module.exports = {
  projectConfig: {
    database_type: "postgres",
    database_url: process.env.DATABASE_URL,
    redis_url: process.env.REDIS_URL,
  },
  plugins: [
    {
      resolve: "medusa-plugin-algolia",
      options: {
        application_id: process.env.ALGOLIA_APP_ID,
        admin_api_key: process.env.ALGOLIA_ADMIN_API_KEY,
        settings: {
          vehicles: {
            searchableAttributes: ["title", "make", "model", "year"],
            attributesForFaceting: ["make", "model", "year", "price"]
          }
        }
      }
    }
  ]
};
```

### Step 3: Create Vehicle Product Type
```javascript
// src/models/vehicle.js
import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";
import { Product as MedusaProduct } from "@medusajs/medusa";

@Entity()
export class Vehicle extends MedusaProduct {
  @Column()
  vin: string;

  @Column()
  make: string;

  @Column()
  model: string;

  @Column()
  year: number;

  @Column()
  mileage: number;

  @Column()
  transmission: string;

  @Column()
  fuel_type: string;

  @Column()
  body_style: string;

  @Column()
  exterior_color: string;

  @Column()
  interior_color: string;

  @Column({ type: "decimal" })
  latitude: number;

  @Column({ type: "decimal" })
  longitude: number;

  @Column()
  dealer_id: string;

  @Column()
  condition: string;
}
```

### Step 4: Custom Vehicle Search API
```javascript
// src/api/store/vehicles/search.js
export default async (req, res) => {
  const vehicleService = req.scope.resolve("vehicleService");
  
  const { 
    make, model, year, price_min, price_max, 
    zip, radius, page = 1, limit = 25 
  } = req.query;

  try {
    const searchParams = {
      where: {},
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    };

    // Add filters
    if (make) searchParams.where.make = make;
    if (model) searchParams.where.model = model;
    if (year) searchParams.where.year = parseInt(year);
    
    // Price range
    if (price_min || price_max) {
      searchParams.where.price = {};
      if (price_min) searchParams.where.price.gte = parseFloat(price_min);
      if (price_max) searchParams.where.price.lte = parseFloat(price_max);
    }

    // Geographic search (if zip provided)
    if (zip && radius) {
      const coordinates = await getCoordinatesFromZip(zip);
      if (coordinates) {
        // Add geographic filter using PostgreSQL spatial functions
        searchParams.where.location = {
          distance: radius,
          from: coordinates
        };
      }
    }

    const vehicles = await vehicleService.search(searchParams);
    
    res.json({
      vehicles: vehicles.data,
      count: vehicles.count,
      page: parseInt(page),
      limit: parseInt(limit),
      total_pages: Math.ceil(vehicles.count / parseInt(limit))
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Helper function for ZIP to coordinates
const getCoordinatesFromZip = async (zip) => {
  // Use free geocoding service or maintain ZIP code database
  const zipDatabase = {
    '98498': { lat: 47.127, lng: -122.529 },
    '98032': { lat: 47.384, lng: -122.235 },
    // Add more ZIP codes as needed
  };
  
  return zipDatabase[zip] || null;
};
```

### Step 5: Connect Your React Frontend
```javascript
// Update your existing src/services/api.js
class MedusaVehicleAPI {
  constructor() {
    this.baseUrl = process.env.REACT_APP_MEDUSA_URL || 'http://localhost:9000';
  }

  async searchVehicles(filters = {}, page = 1, limit = 25) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });

    const response = await fetch(`${this.baseUrl}/store/vehicles/search?${params}`);
    return await response.json();
  }

  async getVehicle(id) {
    const response = await fetch(`${this.baseUrl}/store/products/${id}`);
    return await response.json();
  }

  async getFilterOptions() {
    const response = await fetch(`${this.baseUrl}/store/vehicles/filters`);
    return await response.json();
  }
}

export const vehicleAPI = new MedusaVehicleAPI();
```

## Free Hosting Options

### 1. Railway (Free Tier)
```bash
# Deploy to Railway (free)
npm install -g @railway/cli
railway login
railway init
railway up
# Free: 500 hours/month, PostgreSQL included
```

### 2. Render (Free Tier)
```yaml
# render.yaml
services:
  - type: web
    name: carzino-backend
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm run start
    # Free: 750 hours/month
```

### 3. Fly.io (Free Tier)
```dockerfile
# Dockerfile already included with Medusa
# Deploy with: fly deploy
# Free: 3 shared-cpu apps
```

## Database Options (Free)

### 1. Railway PostgreSQL
- **Free tier**: 1GB storage
- **Handles**: ~100K vehicles easily

### 2. Neon (PostgreSQL)
- **Free tier**: 3GB storage  
- **Handles**: ~300K vehicles
- **Auto-scaling**: Scales to zero when not used

### 3. Supabase
- **Free tier**: 500MB storage + 2GB bandwidth
- **Handles**: ~50K vehicles (good for testing)

## Performance Optimizations (Free)

### 1. Add Redis Caching
```javascript
// Install Redis plugin
npm install medusa-plugin-redis-cache

// medusa-config.js
plugins: [
  {
    resolve: "medusa-plugin-redis-cache",
    options: {
      redisUrl: process.env.REDIS_URL,
      ttl: 300 // 5 minutes cache
    }
  }
]
```

### 2. Add Search with Algolia (Free Tier)
```javascript
// Algolia free: 10K operations/month
npm install medusa-plugin-algolia

// Configure in medusa-config.js
{
  resolve: "medusa-plugin-algolia",
  options: {
    application_id: process.env.ALGOLIA_APP_ID,
    admin_api_key: process.env.ALGOLIA_ADMIN_API_KEY
  }
}
```

### 3. CDN with CloudFlare (Free)
- Free CDN for static assets
- Free SSL certificate
- Global performance boost

## Migration from WooCommerce

### Export Data
```javascript
// Export vehicles from WooCommerce
const exportVehicles = async () => {
  const vehicles = await fetch(`${process.env.REACT_APP_WP_SITE_URL}/wp-json/wc/v3/products?per_page=100`);
  const data = await vehicles.json();
  
  // Transform to Medusa format
  const medusaVehicles = data.map(vehicle => ({
    title: vehicle.name,
    description: vehicle.description,
    handle: vehicle.slug,
    vin: vehicle.meta_data.find(m => m.key === 'vin')?.value,
    make: vehicle.meta_data.find(m => m.key === 'make')?.value,
    model: vehicle.meta_data.find(m => m.key === 'model')?.value,
    year: vehicle.meta_data.find(m => m.key === 'year')?.value,
    price: vehicle.price,
    images: vehicle.images.map(img => img.src)
  }));
  
  return medusaVehicles;
};
```

### Import to Medusa
```javascript
// Import vehicles to Medusa
const importVehicles = async (vehicles) => {
  for (const vehicle of vehicles) {
    await fetch('http://localhost:9000/admin/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(vehicle)
    });
  }
};
```

## Total Cost Breakdown

| Component | Free Option | Cost |
|-----------|-------------|------|
| **Platform** | Medusa.js | $0 |
| **Database** | Neon PostgreSQL | $0 (3GB free) |
| **Hosting** | Railway/Render | $0 (free tier) |
| **CDN** | CloudFlare | $0 |
| **Search** | Algolia | $0 (10K ops/month) |
| **SSL** | Let's Encrypt | $0 |
| **Domain** | Your existing | $0 |
| **Total** | | **$0/month** |

## Scaling Path

### Free Tier Limits:
- **100K vehicles**: Easily handled
- **300K vehicles**: Possible with optimization
- **1M+ vehicles**: Need paid hosting

### When to Upgrade:
- **Database**: When you hit 3GB (Neon) → $19/month
- **Hosting**: When you need more resources → $20-50/month  
- **Search**: When you hit 10K searches/month → $50/month

## Next Steps

1. **Set up Medusa locally** (30 minutes)
2. **Test with sample vehicle data** (1 hour)
3. **Configure your vehicle schema** (2 hours)
4. **Connect your React frontend** (4 hours)
5. **Deploy to free hosting** (1 hour)
6. **Migrate from WooCommerce** (8 hours)

**Total setup time: 1-2 weekends**

This gives you a completely free platform that can definitely handle 300K vehicles with room to scale!
