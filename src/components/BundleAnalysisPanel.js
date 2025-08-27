import React, { useState, useEffect } from 'react';
import { bundleMetrics, getBundleRecommendations, getOptimizationSuggestions } from '../utils/bundleAnalyzer';

const BundleAnalysisPanel = ({ isVisible, onClose }) => {
  const [metrics, setMetrics] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (isVisible) {
      updateMetrics();
      const interval = setInterval(updateMetrics, 2000);
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  const updateMetrics = () => {
    const currentMetrics = bundleMetrics.getMetrics();
    setMetrics(currentMetrics);
    setRecommendations(getBundleRecommendations(currentMetrics));
    setSuggestions(getOptimizationSuggestions());
  };

  const exportMetrics = () => {
    bundleMetrics.exportMetrics();
  };

  if (!isVisible || !metrics) return null;

  const panelStyles = {
    position: 'fixed',
    top: '10px',
    right: '10px',
    width: '400px',
    maxHeight: '80vh',
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    zIndex: 1000,
    overflow: 'hidden',
    fontFamily: "'Albert Sans', sans-serif"
  };

  const headerStyles = {
    padding: '16px',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  const tabStyles = {
    display: 'flex',
    borderBottom: '1px solid #e5e7eb'
  };

  const tabButtonStyles = (isActive) => ({
    flex: 1,
    padding: '12px 16px',
    border: 'none',
    backgroundColor: isActive ? 'white' : '#f9fafb',
    borderBottom: isActive ? '2px solid #2563eb' : '2px solid transparent',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: isActive ? '600' : '400',
    color: isActive ? '#2563eb' : '#6b7280'
  });

  const contentStyles = {
    padding: '16px',
    maxHeight: '400px',
    overflowY: 'auto'
  };

  const MetricRow = ({ label, value, color = '#374151' }) => (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      marginBottom: '8px',
      fontSize: '14px'
    }}>
      <span style={{ color: '#6b7280' }}>{label}</span>
      <span style={{ color, fontWeight: '500' }}>{value}</span>
    </div>
  );

  const RecommendationItem = ({ recommendation }) => {
    const severityColors = {
      high: '#dc2626',
      medium: '#f59e0b',
      low: '#10b981'
    };

    return (
      <div style={{
        padding: '12px',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        marginBottom: '12px',
        borderLeft: `4px solid ${severityColors[recommendation.severity]}`
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '4px'
        }}>
          <span style={{ 
            fontSize: '12px', 
            fontWeight: '600',
            color: severityColors[recommendation.severity]
          }}>
            {recommendation.type.toUpperCase()} - {recommendation.severity.toUpperCase()}
          </span>
        </div>
        <p style={{ 
          fontSize: '14px', 
          margin: '0 0 8px 0',
          color: '#374151'
        }}>
          {recommendation.message}
        </p>
        <p style={{ 
          fontSize: '12px', 
          margin: 0,
          color: '#6b7280',
          fontStyle: 'italic'
        }}>
          💡 {recommendation.action}
        </p>
      </div>
    );
  };

  const SuggestionItem = ({ suggestion }) => (
    <div style={{
      padding: '12px',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      marginBottom: '12px'
    }}>
      <h4 style={{ 
        margin: '0 0 8px 0', 
        fontSize: '14px', 
        fontWeight: '600',
        color: '#374151'
      }}>
        {suggestion.title}
      </h4>
      <p style={{ 
        fontSize: '13px', 
        margin: '0 0 8px 0',
        color: '#6b7280'
      }}>
        {suggestion.description}
      </p>
      <div style={{ fontSize: '12px', color: '#374151' }}>
        <div style={{ marginBottom: '4px' }}>
          <strong>How:</strong> {suggestion.implementation}
        </div>
        <div style={{ color: '#059669', fontWeight: '500' }}>
          <strong>Impact:</strong> {suggestion.impact}
        </div>
      </div>
    </div>
  );

  return (
    <div style={panelStyles}>
      <div style={headerStyles}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
          📦 Bundle Analysis
        </h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={exportMetrics}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            Export
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: '#dc2626',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        </div>
      </div>

      <div style={tabStyles}>
        <button
          style={tabButtonStyles(activeTab === 'overview')}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          style={tabButtonStyles(activeTab === 'recommendations')}
          onClick={() => setActiveTab('recommendations')}
        >
          Issues ({recommendations.length})
        </button>
        <button
          style={tabButtonStyles(activeTab === 'suggestions')}
          onClick={() => setActiveTab('suggestions')}
        >
          Tips
        </button>
      </div>

      <div style={contentStyles}>
        {activeTab === 'overview' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>
                Bundle Metrics
              </h4>
              <MetricRow label="Total Size" value={metrics.totalBundleSize} />
              <MetricRow label="Average Load Time" value={`${metrics.averageLoadTime}ms`} />
              <MetricRow label="Resources Loaded" value={metrics.resourceCount} />
              <MetricRow label="Chunk Errors" value={metrics.chunkLoadErrors} color={metrics.chunkLoadErrors > 0 ? '#dc2626' : '#059669'} />
              <MetricRow label="Retry Attempts" value={metrics.retryAttempts} />
              <MetricRow label="App Uptime" value={`${metrics.appUptime}s`} />
            </div>

            {metrics.currentMemory && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>
                  Memory Usage
                </h4>
                <MetricRow label="Used" value={metrics.currentMemory.used} />
                <MetricRow label="Total" value={metrics.currentMemory.total} />
                <MetricRow 
                  label="Usage %" 
                  value={`${metrics.currentMemory.usagePercent}%`}
                  color={metrics.currentMemory.usagePercent > 80 ? '#dc2626' : '#059669'}
                />
              </div>
            )}

            {Object.keys(metrics.renderTimes).length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>
                  Component Performance
                </h4>
                {Object.entries(metrics.renderTimes).map(([component, data]) => (
                  <MetricRow 
                    key={component}
                    label={component} 
                    value={`${data.average}ms (${data.samples} samples)`}
                    color={data.average > 16 ? '#dc2626' : '#059669'}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div>
            {recommendations.length > 0 ? (
              recommendations.map((rec, index) => (
                <RecommendationItem key={index} recommendation={rec} />
              ))
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px 20px',
                color: '#059669'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>✅</div>
                <div style={{ fontWeight: '500' }}>All Good!</div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  No performance issues detected
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'suggestions' && (
          <div>
            {suggestions.map((suggestion, index) => (
              <SuggestionItem key={index} suggestion={suggestion} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BundleAnalysisPanel;
