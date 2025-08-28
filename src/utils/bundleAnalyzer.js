// Bundle Analysis and Optimization Utilities
import React from 'react';

/**
 * Dynamic import utility for code splitting
 */
export const lazyImport = (importFunc, retries = 3, delay = 1000) => {
  return new Promise((resolve, reject) => {
    const attemptImport = (remainingRetries) => {
      importFunc()
        .then(resolve)
        .catch((error) => {
          if (remainingRetries > 0) {
            console.warn(`Import failed, retrying... (${remainingRetries} attempts left)`);
            setTimeout(() => attemptImport(remainingRetries - 1), delay);
          } else {
            reject(error);
          }
        });
    };
    attemptImport(retries);
  });
};

/**
 * Performance metrics collection
 */
class BundleMetrics {
  constructor() {
    this.metrics = {
      loadTimes: new Map(),
      bundleSizes: new Map(),
      renderTimes: new Map(),
      memorageUsage: [],
      chunkLoadErrors: 0,
      retryAttempts: 0
    };
    this.startTime = performance.now();
    this.initObservers();
  }

  initObservers() {
    // Memory usage tracking
    if ('memory' in performance) {
      setInterval(() => {
        this.trackMemoryUsage();
      }, 5000);
    }

    // Performance observer for resource timing
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name.includes('.js') || entry.name.includes('.css')) {
              this.trackResourceLoad(entry);
            }
          }
        });
        observer.observe({ entryTypes: ['resource'] });
      } catch (error) {
        console.warn('PerformanceObserver not available:', error);
      }
    }
  }

  trackMemoryUsage() {
    if ('memory' in performance) {
      const memory = performance.memory;
      this.metrics.memorageUsage.push({
        timestamp: Date.now(),
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      });

      // Keep only last 20 measurements
      if (this.metrics.memorageUsage.length > 20) {
        this.metrics.memorageUsage.shift();
      }
    }
  }

  trackResourceLoad(entry) {
    const size = entry.transferSize || entry.encodedBodySize || 0;
    const loadTime = entry.responseEnd - entry.responseStart;
    
    this.metrics.bundleSizes.set(entry.name, size);
    this.metrics.loadTimes.set(entry.name, loadTime);
  }

  trackRenderTime(componentName, renderTime) {
    if (!this.metrics.renderTimes.has(componentName)) {
      this.metrics.renderTimes.set(componentName, []);
    }
    
    const times = this.metrics.renderTimes.get(componentName);
    times.push(renderTime);
    
    // Keep only last 10 render times
    if (times.length > 10) {
      times.shift();
    }
  }

  trackChunkLoadError() {
    this.metrics.chunkLoadErrors++;
  }

  trackRetryAttempt() {
    this.metrics.retryAttempts++;
  }

  getMetrics() {
    const totalBundleSize = Array.from(this.metrics.bundleSizes.values())
      .reduce((total, size) => total + size, 0);
    
    const averageLoadTime = this.metrics.loadTimes.size > 0
      ? Array.from(this.metrics.loadTimes.values())
          .reduce((total, time) => total + time, 0) / this.metrics.loadTimes.size
      : 0;

    const currentMemory = this.metrics.memorageUsage.length > 0
      ? this.metrics.memorageUsage[this.metrics.memorageUsage.length - 1]
      : null;

    return {
      totalBundleSize: this.formatBytes(totalBundleSize),
      averageLoadTime: Math.round(averageLoadTime),
      resourceCount: this.metrics.bundleSizes.size,
      chunkLoadErrors: this.metrics.chunkLoadErrors,
      retryAttempts: this.metrics.retryAttempts,
      currentMemory: currentMemory ? {
        used: this.formatBytes(currentMemory.used),
        total: this.formatBytes(currentMemory.total),
        usagePercent: Math.round((currentMemory.used / currentMemory.total) * 100)
      } : null,
      appUptime: Math.round((performance.now() - this.startTime) / 1000),
      renderTimes: Object.fromEntries(
        Array.from(this.metrics.renderTimes.entries()).map(([name, times]) => [
          name,
          {
            average: Math.round(times.reduce((sum, time) => sum + time, 0) / times.length),
            latest: times[times.length - 1],
            samples: times.length
          }
        ])
      )
    };
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  exportMetrics() {
    const metrics = this.getMetrics();
    const blob = new Blob([JSON.stringify(metrics, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bundle-metrics-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
}

// Global metrics instance
export const bundleMetrics = new BundleMetrics();

/**
 * Component performance tracking decorator
 */
export const withPerformanceTracking = (WrappedComponent, componentName) => {
  return function PerformanceTrackedComponent(props) {
    const startTime = performance.now();
    
    React.useEffect(() => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      bundleMetrics.trackRenderTime(componentName, renderTime);
    });

    return React.createElement(WrappedComponent, props);
  };
};

/**
 * Code splitting utilities
 */
export const optimizeChunkLoading = () => {
  // Preload critical chunks
  const criticalChunks = [
    '/static/js/main.',
    '/static/css/main.'
  ];

  criticalChunks.forEach(chunk => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = chunk.includes('.js') ? 'script' : 'style';
    
    // Find the actual chunk name
    const scripts = Array.from(document.querySelectorAll('script[src*="' + chunk + '"]'));
    const links = Array.from(document.querySelectorAll('link[href*="' + chunk + '"]'));
    
    const resource = scripts[0] || links[0];
    if (resource) {
      link.href = resource.src || resource.href;
      document.head.appendChild(link);
    }
  });
};

/**
 * Bundle size recommendations
 */
export const getBundleRecommendations = (metrics) => {
  const recommendations = [];
  
  const totalSize = metrics.totalBundleSize;
  const sizeInBytes = parseSizeToBytes(totalSize);
  
  // Size recommendations
  if (sizeInBytes > 1024 * 1024) { // > 1MB
    recommendations.push({
      type: 'size',
      severity: 'high',
      message: 'Bundle size is over 1MB. Consider code splitting.',
      action: 'Implement lazy loading for non-critical components'
    });
  } else if (sizeInBytes > 512 * 1024) { // > 512KB
    recommendations.push({
      type: 'size',
      severity: 'medium',
      message: 'Bundle size is getting large. Monitor closely.',
      action: 'Consider optimizing imports and removing unused code'
    });
  }

  // Load time recommendations
  if (metrics.averageLoadTime > 1000) {
    recommendations.push({
      type: 'performance',
      severity: 'high',
      message: 'Average load time is over 1 second.',
      action: 'Optimize resource loading and consider CDN'
    });
  }

  // Memory recommendations
  if (metrics.currentMemory && metrics.currentMemory.usagePercent > 80) {
    recommendations.push({
      type: 'memory',
      severity: 'high',
      message: 'High memory usage detected.',
      action: 'Check for memory leaks and optimize component cleanup'
    });
  }

  // Error recommendations
  if (metrics.chunkLoadErrors > 0) {
    recommendations.push({
      type: 'reliability',
      severity: 'medium',
      message: `${metrics.chunkLoadErrors} chunk load errors detected.`,
      action: 'Implement better error handling and retry mechanisms'
    });
  }

  return recommendations;
};

/**
 * Utility to parse size string to bytes
 */
const parseSizeToBytes = (sizeStr) => {
  const units = { 'Bytes': 1, 'KB': 1024, 'MB': 1024 * 1024, 'GB': 1024 * 1024 * 1024 };
  const [value, unit] = sizeStr.split(' ');
  return parseFloat(value) * (units[unit] || 1);
};

/**
 * Automatic optimization suggestions
 */
export const getOptimizationSuggestions = () => {
  return [
    {
      title: 'Tree Shaking',
      description: 'Remove unused code from bundles',
      implementation: 'Use ES6 modules and avoid importing entire libraries',
      impact: 'High - Can reduce bundle size by 20-50%'
    },
    {
      title: 'Code Splitting',
      description: 'Split code into smaller chunks loaded on demand',
      implementation: 'Use React.lazy() and dynamic imports',
      impact: 'High - Improves initial load time significantly'
    },
    {
      title: 'Compression',
      description: 'Enable gzip/brotli compression',
      implementation: 'Configure web server compression',
      impact: 'Medium - Can reduce transfer size by 60-80%'
    },
    {
      title: 'Asset Optimization',
      description: 'Optimize images and other static assets',
      implementation: 'Use WebP format, image compression, and lazy loading',
      impact: 'Medium - Reduces overall page weight'
    },
    {
      title: 'Vendor Splitting',
      description: 'Separate vendor libraries from application code',
      implementation: 'Configure webpack to split vendor chunks',
      impact: 'Medium - Improves caching efficiency'
    }
  ];
};

/**
 * Development helpers
 */
export const logBundleInfo = () => {
  if (process.env.NODE_ENV === 'development') {
    const metrics = bundleMetrics.getMetrics();
    console.group('📦 Bundle Analysis');
    console.log('Bundle Size:', metrics.totalBundleSize);
    console.log('Load Time:', metrics.averageLoadTime + 'ms');
    console.log('Resources:', metrics.resourceCount);
    console.log('Memory Usage:', metrics.currentMemory?.usagePercent + '%');
    console.log('Uptime:', metrics.appUptime + 's');
    
    const recommendations = getBundleRecommendations(metrics);
    if (recommendations.length > 0) {
      console.warn('Recommendations:', recommendations);
    }
    
    console.groupEnd();
  }
};

// Auto-log bundle info in development
if (process.env.NODE_ENV === 'development') {
  setTimeout(logBundleInfo, 3000); // Log after initial load
}
