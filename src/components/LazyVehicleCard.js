import React, { useState, useEffect, useRef, memo } from 'react';
import VehicleCard from './VehicleCard';
import VehicleCardSkeleton from './VehicleCardSkeleton';

// Custom hook for Intersection Observer
const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Don't observe if already intersected (for performance)
    if (hasIntersected) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting;
        setIsIntersecting(isVisible);
        
        // Once intersected, mark as loaded permanently
        if (isVisible && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        // Load content when 50% visible or 200px before entering viewport
        rootMargin: '200px 0px',
        threshold: 0.1,
        ...options
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [hasIntersected, options]);

  return [elementRef, isIntersecting || hasIntersected, hasIntersected];
};

// Lazy Vehicle Card component
const LazyVehicleCard = memo(({ 
  vehicle, 
  favorites, 
  onFavoriteToggle, 
  index = 0,
  priority = false // For above-the-fold content
}) => {
  const [ref, isVisible] = useIntersectionObserver({
    rootMargin: priority ? '0px' : '200px 0px', // Load immediately if priority
    threshold: priority ? 0 : 0.1
  });

  // Preload images when component becomes visible
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (isVisible && vehicle && !imageLoaded && !imageError) {
      const imageUrl = vehicle.images?.[0] || vehicle.image;
      
      if (imageUrl && !imageUrl.includes('/api/placeholder')) {
        const img = new Image();
        
        img.onload = () => {
          setImageLoaded(true);
        };
        
        img.onerror = () => {
          setImageError(true);
          setImageLoaded(true); // Still show card even if image fails
        };
        
        // Add slight delay for smoother loading experience
        setTimeout(() => {
          img.src = imageUrl;
        }, index * 50); // Stagger image loading
      } else {
        setImageLoaded(true);
      }
    }
  }, [isVisible, vehicle, imageLoaded, imageError, index]);

  // For priority content (first few cards), load immediately
  if (priority) {
    return (
      <div ref={ref}>
        <VehicleCard
          vehicle={vehicle}
          favorites={favorites}
          onFavoriteToggle={onFavoriteToggle}
        />
      </div>
    );
  }

  // Show skeleton until visible and image is loaded
  if (!isVisible || !imageLoaded) {
    return (
      <div ref={ref} style={{ minHeight: '400px' }}>
        <VehicleCardSkeleton />
      </div>
    );
  }

  // Show actual vehicle card once visible and loaded
  return (
    <div ref={ref}>
      <VehicleCard
        vehicle={vehicle}
        favorites={favorites}
        onFavoriteToggle={onFavoriteToggle}
      />
    </div>
  );
});

LazyVehicleCard.displayName = 'LazyVehicleCard';

export default LazyVehicleCard;
