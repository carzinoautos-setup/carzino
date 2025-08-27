import { useState, useEffect, useRef, useCallback } from 'react';

// Performance monitoring for lazy loading
const lazyLoadingMetrics = {
  totalObserved: 0,
  totalLoaded: 0,
  averageLoadTime: 0,
  loadTimes: [],
  intersectionCount: 0
};

// Enhanced lazy loading hook with performance tracking
export const useLazyLoading = (options = {}) => {
  const {
    rootMargin = '200px 0px',
    threshold = 0.1,
    priority = false,
    trackPerformance = true,
    onLoad = null,
    onError = null
  } = options;

  const [isIntersecting, setIsIntersecting] = useState(priority);
  const [hasIntersected, setHasIntersected] = useState(priority);
  const [isLoaded, setIsLoaded] = useState(priority);
  const [loadError, setLoadError] = useState(false);
  
  const elementRef = useRef(null);
  const loadStartTime = useRef(null);
  const observerRef = useRef(null);

  // Create intersection observer
  useEffect(() => {
    const element = elementRef.current;
    if (!element || hasIntersected) return;

    // Track performance start
    if (trackPerformance) {
      loadStartTime.current = performance.now();
      lazyLoadingMetrics.totalObserved++;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting;
        setIsIntersecting(isVisible);
        
        if (trackPerformance) {
          lazyLoadingMetrics.intersectionCount++;
        }

        // Once intersected, mark as loaded permanently
        if (isVisible && !hasIntersected) {
          setHasIntersected(true);
          
          // Track load completion time
          if (trackPerformance && loadStartTime.current) {
            const loadTime = performance.now() - loadStartTime.current;
            lazyLoadingMetrics.loadTimes.push(loadTime);
            lazyLoadingMetrics.totalLoaded++;
            
            // Calculate rolling average
            const recentTimes = lazyLoadingMetrics.loadTimes.slice(-20); // Last 20 loads
            lazyLoadingMetrics.averageLoadTime = 
              recentTimes.reduce((sum, time) => sum + time, 0) / recentTimes.length;
          }

          if (onLoad) {
            onLoad();
          }
        }
      },
      {
        rootMargin,
        threshold
      }
    );

    observerRef.current = observer;
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [hasIntersected, rootMargin, threshold, trackPerformance, onLoad]);

  // Mark as loaded
  const markAsLoaded = useCallback(() => {
    setIsLoaded(true);
  }, []);

  // Mark as error
  const markAsError = useCallback((error) => {
    setLoadError(true);
    setIsLoaded(true); // Still consider "loaded" to stop trying
    
    if (onError) {
      onError(error);
    }
  }, [onError]);

  return {
    ref: elementRef,
    isVisible: isIntersecting || hasIntersected,
    hasIntersected,
    isLoaded,
    loadError,
    markAsLoaded,
    markAsError
  };
};

// Hook for batch lazy loading management
export const useBatchLazyLoading = (items = [], batchSize = 5) => {
  const [loadedBatches, setLoadedBatches] = useState(1); // Start with first batch
  const [isLoading, setIsLoading] = useState(false);

  // Calculate which items should be rendered
  const visibleItems = items.slice(0, loadedBatches * batchSize);
  const hasMoreBatches = visibleItems.length < items.length;

  // Load next batch
  const loadNextBatch = useCallback(() => {
    if (hasMoreBatches && !isLoading) {
      setIsLoading(true);
      
      // Add slight delay for smoother UX
      setTimeout(() => {
        setLoadedBatches(prev => prev + 1);
        setIsLoading(false);
      }, 100);
    }
  }, [hasMoreBatches, isLoading]);

  // Reset batches (useful for new search results)
  const resetBatches = useCallback(() => {
    setLoadedBatches(1);
    setIsLoading(false);
  }, []);

  return {
    visibleItems,
    hasMoreBatches,
    isLoading,
    loadNextBatch,
    resetBatches,
    batchInfo: {
      current: loadedBatches,
      total: Math.ceil(items.length / batchSize),
      itemsShown: visibleItems.length,
      totalItems: items.length
    }
  };
};

// Hook for image lazy loading with WebP support
export const useImageLazyLoading = (imageUrl, options = {}) => {
  const [imageState, setImageState] = useState({
    loaded: false,
    error: false,
    src: null,
    webpSupported: null
  });

  const { 
    enableWebP = true, 
    priority = false,
    sizes = '(max-width: 768px) 100vw, 50vw'
  } = options;

  // Check WebP support
  useEffect(() => {
    if (!enableWebP) {
      setImageState(prev => ({ ...prev, webpSupported: false }));
      return;
    }

    // Check if WebP is supported
    const webpTest = new Image();
    webpTest.onload = webpTest.onerror = () => {
      setImageState(prev => ({ 
        ...prev, 
        webpSupported: webpTest.height === 2 
      }));
    };
    webpTest.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  }, [enableWebP]);

  // Load image when triggered
  const loadImage = useCallback(() => {
    if (!imageUrl || imageState.loaded || imageState.error) return;

    let finalImageUrl = imageUrl;

    // Try WebP version if supported
    if (imageState.webpSupported && enableWebP && !imageUrl.includes('.webp')) {
      const webpUrl = imageUrl.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      finalImageUrl = webpUrl;
    }

    const img = new Image();
    
    img.onload = () => {
      setImageState(prev => ({
        ...prev,
        loaded: true,
        src: finalImageUrl
      }));
    };

    img.onerror = () => {
      // Fallback to original format if WebP fails
      if (finalImageUrl !== imageUrl && enableWebP) {
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
          setImageState(prev => ({
            ...prev,
            loaded: true,
            src: imageUrl
          }));
        };
        fallbackImg.onerror = () => {
          setImageState(prev => ({
            ...prev,
            error: true
          }));
        };
        fallbackImg.src = imageUrl;
      } else {
        setImageState(prev => ({
          ...prev,
          error: true
        }));
      }
    };

    img.src = finalImageUrl;
  }, [imageUrl, imageState.loaded, imageState.error, imageState.webpSupported, enableWebP]);

  // Auto-load if priority
  useEffect(() => {
    if (priority && imageState.webpSupported !== null) {
      loadImage();
    }
  }, [priority, loadImage, imageState.webpSupported]);

  return {
    ...imageState,
    loadImage
  };
};

// Get lazy loading performance metrics
export const getLazyLoadingMetrics = () => {
  return {
    ...lazyLoadingMetrics,
    efficiency: lazyLoadingMetrics.totalObserved > 0 
      ? (lazyLoadingMetrics.totalLoaded / lazyLoadingMetrics.totalObserved * 100).toFixed(1)
      : 0
  };
};

// Reset performance metrics
export const resetLazyLoadingMetrics = () => {
  lazyLoadingMetrics.totalObserved = 0;
  lazyLoadingMetrics.totalLoaded = 0;
  lazyLoadingMetrics.averageLoadTime = 0;
  lazyLoadingMetrics.loadTimes = [];
  lazyLoadingMetrics.intersectionCount = 0;
};
