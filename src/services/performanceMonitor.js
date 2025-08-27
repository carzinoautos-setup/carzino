// Performance Monitoring Service
import React from 'react';

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      searchTime: [],
      renderTime: [],
      apiCalls: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errorCount: 0,
      userInteractions: {
        filterChanges: 0,
        pageChanges: 0,
        searches: 0
      }
    };
    
    this.startTime = performance.now();
    this.isEnabled = process.env.NODE_ENV === 'development';
    
    if (this.isEnabled) {
      this.initWebVitals();
    }
  }

  // Initialize Web Vitals monitoring
  initWebVitals() {
    // Track Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          console.log('📊 LCP:', Math.round(lastEntry.startTime), 'ms');
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // Track Cumulative Layout Shift (CLS)
        const clsObserver = new PerformanceObserver((entryList) => {
          let clsValue = 0;
          for (const entry of entryList.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          if (clsValue > 0) {
            console.log('📊 CLS:', clsValue.toFixed(4));
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        console.warn('Web Vitals monitoring not available:', error);
      }
    }
  }

  // Track search performance
  trackSearch(duration, resultCount, cached = false) {
    if (!this.isEnabled) return;
    
    this.metrics.searchTime.push({
      duration,
      resultCount,
      cached,
      timestamp: Date.now()
    });
    
    if (cached) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
      this.metrics.apiCalls++;
    }

    this.metrics.userInteractions.searches++;

    // Keep only last 50 searches
    if (this.metrics.searchTime.length > 50) {
      this.metrics.searchTime.shift();
    }

    console.log(`📊 Search: ${duration}ms, ${resultCount} results${cached ? ' (CACHED)' : ''}`);
  }

  // Track filter changes
  trackFilterChange(filterName, value) {
    if (!this.isEnabled) return;
    
    this.metrics.userInteractions.filterChanges++;
    console.log(`📊 Filter changed: ${filterName} = ${value}`);
  }

  // Track page changes
  trackPageChange(page, loadTime) {
    if (!this.isEnabled) return;
    
    this.metrics.userInteractions.pageChanges++;
    console.log(`📊 Page change: ${page}, Load time: ${loadTime}ms`);
  }

  // Track errors
  trackError(error, context) {
    if (!this.isEnabled) return;
    
    this.metrics.errorCount++;
    console.error(`📊 Error tracked:`, { error, context });
  }

  // Track render performance
  trackRender(componentName, duration) {
    if (!this.isEnabled) return;
    
    if (!this.metrics.renderTime[componentName]) {
      this.metrics.renderTime[componentName] = [];
    }
    
    this.metrics.renderTime[componentName].push({
      duration,
      timestamp: Date.now()
    });

    // Keep only last 20 renders per component
    if (this.metrics.renderTime[componentName].length > 20) {
      this.metrics.renderTime[componentName].shift();
    }

    if (duration > 16) { // Slower than 60fps
      console.warn(`📊 Slow render: ${componentName} took ${duration}ms`);
    }
  }

  // Get performance summary
  getSummary() {
    if (!this.isEnabled) return null;

    const searches = this.metrics.searchTime;
    const avgSearchTime = searches.length > 0 
      ? searches.reduce((sum, s) => sum + s.duration, 0) / searches.length 
      : 0;

    const cacheHitRate = this.metrics.cacheHits + this.metrics.cacheMisses > 0
      ? (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) * 100)
      : 0;

    const sessionDuration = (performance.now() - this.startTime) / 1000;

    return {
      sessionDuration: Math.round(sessionDuration),
      avgSearchTime: Math.round(avgSearchTime),
      totalSearches: searches.length,
      cacheHitRate: Math.round(cacheHitRate),
      apiCalls: this.metrics.apiCalls,
      errorCount: this.metrics.errorCount,
      userInteractions: this.metrics.userInteractions,
      lastSearches: searches.slice(-5), // Last 5 searches
      performance: {
        good: avgSearchTime < 500 && cacheHitRate > 70 && this.metrics.errorCount === 0,
        warnings: []
      }
    };
  }

  // Generate performance insights
  getInsights() {
    if (!this.isEnabled) return [];

    const summary = this.getSummary();
    const insights = [];

    if (summary.avgSearchTime > 1000) {
      insights.push({
        type: 'warning',
        message: 'Search performance is slow',
        suggestion: 'Consider optimizing API calls or improving caching'
      });
    }

    if (summary.cacheHitRate < 50) {
      insights.push({
        type: 'warning',
        message: 'Low cache hit rate',
        suggestion: 'Review caching strategy'
      });
    }

    if (summary.errorCount > 0) {
      insights.push({
        type: 'error',
        message: `${summary.errorCount} errors occurred`,
        suggestion: 'Check error boundaries and error handling'
      });
    }

    if (summary.apiCalls > summary.totalSearches * 2) {
      insights.push({
        type: 'warning',
        message: 'High API call ratio',
        suggestion: 'Check for unnecessary API calls'
      });
    }

    return insights;
  }

  // Export metrics for analysis
  exportMetrics() {
    if (!this.isEnabled) return;

    const data = {
      summary: this.getSummary(),
      insights: this.getInsights(),
      rawMetrics: this.metrics,
      exportTime: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `performance-metrics-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Reset metrics
  reset() {
    this.metrics = {
      searchTime: [],
      renderTime: [],
      apiCalls: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errorCount: 0,
      userInteractions: {
        filterChanges: 0,
        pageChanges: 0,
        searches: 0
      }
    };
    this.startTime = performance.now();
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance tracking
export const usePerformanceTracking = (componentName) => {
  const startTime = React.useRef(performance.now());
  
  React.useEffect(() => {
    const endTime = performance.now();
    const duration = endTime - startTime.current;
    performanceMonitor.trackRender(componentName, duration);
  });

  return {
    trackAction: (actionName, duration) => {
      console.log(`📊 ${componentName} - ${actionName}: ${duration}ms`);
    }
  };
};

export default PerformanceMonitor;
