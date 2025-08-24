import React, { useState, useEffect } from 'react';
import './App.css';
import VehicleSearchFilter from './components/VehicleSearchFilter';
import VehicleCard from './components/VehicleCard';
import Pagination from './components/Pagination';
import SearchResultsHeader from './components/SearchResultsHeader';

// Sample vehicle data
const SAMPLE_VEHICLES = [
  {
    id: 1,
    featured: true,
    viewed: true,
    images: [
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=450&h=300&fit=crop",
      "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=450&h=300&fit=crop",
      "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=450&h=300&fit=crop"
    ],
    badges: ["New", "4WD"],
    title: "2025 Ford F-150 Lariat SuperCrew",
    mileage: "8",
    transmission: "Auto",
    doors: "4 doors",
    salePrice: "$67,899",
    payment: "$789",
    dealer: "Bayside Ford",
    location: "Lakewood, WA",
    phone: "(253) 555-0123"
  },
  {
    id: 2,
    featured: false,
    viewed: false,
    images: [
      "https://images.unsplash.com/photo-1549924231-f129b911e442?w=450&h=300&fit=crop",
      "https://images.unsplash.com/photo-1607603750916-fccee4ed2b06?w=450&h=300&fit=crop"
    ],
    badges: ["Used", "AWD"],
    title: "2023 Honda CR-V EX-L",
    mileage: "24,567",
    transmission: "CVT",
    doors: "4 doors",
    salePrice: "$34,995",
    payment: "$465",
    dealer: "Downtown Honda",
    location: "Seattle, WA",
    phone: "(206) 555-0456"
  },
  {
    id: 3,
    featured: true,
    viewed: true,
    images: [
      "https://images.unsplash.com/photo-1563720360172-67b8f3dce741?w=450&h=300&fit=crop",
      "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=450&h=300&fit=crop",
      "https://images.unsplash.com/photo-1563664427-1846a8b5b85c?w=450&h=300&fit=crop"
    ],
    badges: ["Certified", "Hybrid"],
    title: "2024 Toyota Camry Hybrid LE",
    mileage: "12,450",
    transmission: "CVT",
    doors: "4 doors",
    salePrice: "$32,899",
    payment: "$425",
    dealer: "City Toyota",
    location: "Bellevue, WA",
    phone: "(425) 555-0789"
  },
  {
    id: 4,
    featured: false,
    viewed: false,
    images: [
      "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=450&h=300&fit=crop"
    ],
    badges: ["Used"],
    title: "2022 Chevrolet Silverado 1500 LT",
    mileage: "45,123",
    transmission: "Auto",
    doors: "4 doors",
    salePrice: "$42,995",
    payment: "$589",
    dealer: "Northwest Chevrolet",
    location: "Tacoma, WA",
    phone: "(253) 555-0321"
  },
  {
    id: 5,
    featured: false,
    viewed: true,
    images: [
      "https://images.unsplash.com/photo-1580414155477-c81e8ce44a14?w=450&h=300&fit=crop",
      "https://images.unsplash.com/photo-1616422285623-13ff0162193c?w=450&h=300&fit=crop"
    ],
    badges: ["New", "Electric"],
    title: "2024 Tesla Model 3 Long Range",
    mileage: "5",
    transmission: "Auto",
    doors: "4 doors",
    salePrice: "$54,990",
    payment: "$699",
    dealer: "Tesla Store",
    location: "Redmond, WA",
    phone: "(425) 555-0654"
  },
  {
    id: 6,
    featured: false,
    viewed: false,
    images: [
      "https://images.unsplash.com/photo-1627454820516-b2d60b727c78?w=450&h=300&fit=crop"
    ],
    badges: ["Used", "Luxury"],
    title: "2023 BMW X5 xDrive40i",
    mileage: "18,234",
    transmission: "Auto",
    doors: "4 doors",
    salePrice: "$68,995",
    payment: "$895",
    dealer: "Luxury BMW",
    location: "Kirkland, WA",
    phone: "(425) 555-0987"
  }
];

function App() {
  // State management
  const [filters, setFilters] = useState({
    condition: [],
    make: [],
    model: [],
    trim: [],
    vehicleType: [],
    bodyType: [],
    driveType: [],
    mileage: '',
    exteriorColor: [],
    interiorColor: [],
    transmissionSpeed: [],
    sellerType: [],
    dealer: [],
    state: [],
    city: [],
    zipCodeFilter: [],
    priceMin: '',
    priceMax: '',
    paymentMin: '',
    paymentMax: '',
    zipCode: '98498',
    radius: '200',
    termLength: '72',
    interestRate: '8',
    downPayment: '2000'
  });

  const [favorites, setFavorites] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('relevance');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showingFavorites, setShowingFavorites] = useState(false);

  const resultsPerPage = 25;
  const totalResults = SAMPLE_VEHICLES.length;

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = JSON.parse(localStorage.getItem('carzino_favorites') || '{}');
    setFavorites(savedFavorites);
  }, []);

  // Save favorites to localStorage
  const saveFavorites = (newFavorites) => {
    setFavorites(newFavorites);
    localStorage.setItem('carzino_favorites', JSON.stringify(newFavorites));
  };

  // Handle favorite toggle
  const handleFavoriteToggle = (vehicleId, vehicle) => {
    const newFavorites = { ...favorites };
    if (newFavorites[vehicleId]) {
      delete newFavorites[vehicleId];
    } else {
      newFavorites[vehicleId] = vehicle;
    }
    saveFavorites(newFavorites);
  };

  // Handle filter changes
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle sort change
  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    setCurrentPage(1);
  };

  // Handle mobile filters
  const handleMobileFiltersOpen = () => {
    setIsMobileFiltersOpen(true);
  };

  const handleMobileFiltersClose = () => {
    setIsMobileFiltersOpen(false);
  };

  // Handle favorites toggle
  const handleToggleFavorites = (show) => {
    if (typeof show === 'boolean') {
      setShowingFavorites(show);
    } else {
      setShowingFavorites(!showingFavorites);
    }
    setCurrentPage(1);
  };

  // Handle filter removal
  const handleRemoveFilter = (category, value) => {
    const newFilters = { ...filters };

    if (category === 'price') {
      newFilters.priceMin = '';
      newFilters.priceMax = '';
    } else if (category === 'payment') {
      newFilters.paymentMin = '';
      newFilters.paymentMax = '';
    } else if (Array.isArray(newFilters[category])) {
      newFilters[category] = newFilters[category].filter(item => item !== value);
    } else {
      newFilters[category] = '';
    }

    setFilters(newFilters);
    setCurrentPage(1);
  };

  // Handle clear all filters
  const handleClearAllFilters = () => {
    setFilters({
      condition: [],
      make: [],
      model: [],
      trim: [],
      vehicleType: [],
      bodyType: [],
      driveType: [],
      mileage: '',
      exteriorColor: [],
      interiorColor: [],
      transmissionSpeed: [],
      sellerType: [],
      dealer: [],
      state: [],
      city: [],
      zipCodeFilter: [],
      priceMin: '',
      priceMax: '',
      paymentMin: '',
      paymentMax: '',
      zipCode: filters.zipCode, // Keep location settings
      radius: filters.radius,
      termLength: filters.termLength,
      interestRate: filters.interestRate,
      downPayment: filters.downPayment
    });
    setCurrentPage(1);
  };

  // Handle search
  const handleSearch = (query) => {
    // In a real app, this would trigger a search API call
    console.log('Searching for:', query);
    setCurrentPage(1);
  };

  // Get current page vehicles
  const favoritesCount = Object.keys(favorites).length;
  const vehiclesToShow = showingFavorites
    ? SAMPLE_VEHICLES.filter(vehicle => favorites[vehicle.id])
    : SAMPLE_VEHICLES;
  const totalVehicles = vehiclesToShow.length;
  const totalPages = Math.ceil(totalVehicles / resultsPerPage);
  const startIndex = (currentPage - 1) * resultsPerPage;
  const endIndex = startIndex + resultsPerPage;
  const currentVehicles = vehiclesToShow.slice(startIndex, endIndex);

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <h1>Carzino Vehicle Search</h1>
        <p>Find your perfect vehicle with advanced filtering</p>
      </header>

      {/* Main Content */}
      <div className="main-container">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <aside className="flex-shrink-0">
            <VehicleSearchFilter
              filters={filters}
              onFiltersChange={handleFiltersChange}
              filterOptions={{}}
              isLoading={false}
              isMobile={false}
            />
          </aside>
        )}

        {/* Mobile Filter Overlay */}
        {isMobile && isMobileFiltersOpen && (
          <VehicleSearchFilter
            filters={filters}
            onFiltersChange={handleFiltersChange}
            filterOptions={{}}
            isLoading={false}
            isMobile={true}
            onClose={handleMobileFiltersClose}
          />
        )}

        {/* Results Section */}
        <main className="flex-1 min-w-0 bg-white">
          {/* Search Results Header */}
          <SearchResultsHeader
            totalResults={showingFavorites ? favoritesCount : totalResults}
            currentFilters={filters}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            sortBy={sortBy}
            onSortChange={handleSortChange}
            onMobileFiltersOpen={handleMobileFiltersOpen}
            favoritesCount={favoritesCount}
            showingFavorites={showingFavorites}
            onToggleFavorites={handleToggleFavorites}
            onRemoveFilter={handleRemoveFilter}
            onClearAllFilters={handleClearAllFilters}
            onSearch={handleSearch}
          />

          {/* Vehicle Grid */}
          <div className={`vehicle-grid ${viewMode === 'grid' ? 'grid-view' : 'list-view'} ${isMobile ? 'p-2' : 'p-4'}`}>
            {currentVehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                favorites={favorites}
                onFavoriteToggle={handleFavoriteToggle}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalResults={totalVehicles}
              resultsPerPage={resultsPerPage}
              onPageChange={handlePageChange}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
