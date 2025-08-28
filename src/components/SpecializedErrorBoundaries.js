import React from 'react';
import ErrorBoundary from './ErrorBoundary';

// Vehicle Grid Error Boundary with specific recovery actions
export const VehicleGridErrorBoundary = ({ children, onRetry, onReset }) => {
  const GridErrorFallback = ({ error, retry, reset, retryCount }) => (
    <div style={{
      padding: '40px 20px',
      margin: '20px 0',
      border: '2px dashed #e5e7eb',
      borderRadius: '12px',
      backgroundColor: '#fef2f2',
      textAlign: 'center'
    }}>
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <h3 style={{ 
          color: '#dc2626', 
          marginBottom: '16px',
          fontSize: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          🚗 Vehicle Grid Error
        </h3>
        
        <p style={{ 
          color: '#374151', 
          marginBottom: '20px',
          lineHeight: '1.5'
        }}>
          There was an issue loading the vehicle results. The search filters should still work normally.
        </p>

        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => {
              retry();
              if (onRetry) onRetry();
            }}
            style={{
              padding: '12px 20px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '500',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🔄 Reload Vehicles
          </button>

          <button
            onClick={() => {
              reset();
              if (onReset) onReset();
            }}
            style={{
              padding: '12px 20px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '500',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🔄 Clear Cache & Reset
          </button>
        </div>

        {retryCount > 1 && (
          <p style={{ 
            marginTop: '16px', 
            fontSize: '14px', 
            color: '#6b7280',
            fontStyle: 'italic'
          }}>
            💡 Tip: Try clearing your search filters or refreshing the page
          </p>
        )}
      </div>
    </div>
  );

  return (
    <ErrorBoundary 
      level="section" 
      fallback={GridErrorFallback}
      onReset={onReset}
    >
      {children}
    </ErrorBoundary>
  );
};

// Filter Section Error Boundary
export const FilterErrorBoundary = ({ children, onRetry, onReset }) => {
  const FilterErrorFallback = ({ error, retry, reset, retryCount }) => (
    <div style={{
      padding: '20px',
      margin: '10px 0',
      border: '1px solid #fecaca',
      borderRadius: '8px',
      backgroundColor: '#fef2f2',
      textAlign: 'center'
    }}>
      <h4 style={{ 
        color: '#dc2626', 
        marginBottom: '12px',
        fontSize: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px'
      }}>
        🔍 Filter Error
      </h4>
      
      <p style={{ 
        color: '#374151', 
        marginBottom: '16px',
        fontSize: '14px',
        lineHeight: '1.4'
      }}>
        There was an issue with the search filters. You can still browse all vehicles.
      </p>

      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => {
            retry();
            if (onRetry) onRetry();
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontWeight: '500',
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          Retry Filters
        </button>

        <button
          onClick={() => {
            reset();
            if (onReset) onReset();
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontWeight: '500',
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          Reset All
        </button>
      </div>
    </div>
  );

  return (
    <ErrorBoundary 
      level="component" 
      fallback={FilterErrorFallback}
      onReset={onReset}
    >
      {children}
    </ErrorBoundary>
  );
};

// Pagination Error Boundary
export const PaginationErrorBoundary = ({ children, onRetry }) => {
  const PaginationErrorFallback = ({ error, retry, reset }) => (
    <div style={{
      padding: '16px',
      margin: '10px 0',
      border: '1px solid #fecaca',
      borderRadius: '6px',
      backgroundColor: '#fef2f2',
      textAlign: 'center'
    }}>
      <p style={{ 
        color: '#dc2626', 
        marginBottom: '12px',
        fontSize: '14px',
        fontWeight: '500'
      }}>
        📄 Pagination Error
      </p>
      
      <button
        onClick={() => {
          retry();
          if (onRetry) onRetry();
        }}
        style={{
          padding: '6px 12px',
          backgroundColor: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontWeight: '500',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        Retry Pagination
      </button>
    </div>
  );

  return (
    <ErrorBoundary 
      level="component" 
      fallback={PaginationErrorFallback}
    >
      {children}
    </ErrorBoundary>
  );
};

// Individual Vehicle Card Error Boundary
export const VehicleCardErrorBoundary = ({ children, vehicleId }) => {
  const CardErrorFallback = ({ error, retry }) => (
    <div style={{
      padding: '20px',
      border: '1px dashed #fecaca',
      borderRadius: '8px',
      backgroundColor: '#fefefe',
      textAlign: 'center',
      minHeight: '200px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <p style={{ 
        color: '#dc2626', 
        marginBottom: '8px',
        fontSize: '14px',
        fontWeight: '500'
      }}>
        🚗 Vehicle Loading Error
      </p>
      
      <p style={{ 
        color: '#6b7280', 
        marginBottom: '12px',
        fontSize: '12px'
      }}>
        Unable to display vehicle #{vehicleId}
      </p>

      <button
        onClick={retry}
        style={{
          padding: '6px 12px',
          backgroundColor: '#6b7280',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontWeight: '500',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        Retry
      </button>
    </div>
  );

  return (
    <ErrorBoundary 
      level="component" 
      fallback={CardErrorFallback}
    >
      {children}
    </ErrorBoundary>
  );
};

// API Error Boundary for network-related issues
export const APIErrorBoundary = ({ children, onRetry, onFallbackMode }) => {
  const APIErrorFallback = ({ error, retry, reset, retryCount }) => (
    <div style={{
      padding: '24px',
      margin: '20px 0',
      border: '2px solid #fecaca',
      borderRadius: '8px',
      backgroundColor: '#fef2f2',
      textAlign: 'center'
    }}>
      <h3 style={{ 
        color: '#dc2626', 
        marginBottom: '16px',
        fontSize: '18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
      }}>
        🌐 Connection Error
      </h3>
      
      <p style={{ 
        color: '#374151', 
        marginBottom: '20px',
        lineHeight: '1.5'
      }}>
        Unable to connect to the vehicle database. This might be a temporary network issue.
      </p>

      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => {
            retry();
            if (onRetry) onRetry();
          }}
          style={{
            padding: '12px 20px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: '500',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🔄 Retry Connection
        </button>

        {onFallbackMode && (
          <button
            onClick={onFallbackMode}
            style={{
              padding: '12px 20px',
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '500',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            📱 Use Demo Mode
          </button>
        )}
      </div>

      {retryCount > 2 && (
        <div style={{ 
          marginTop: '16px', 
          padding: '12px',
          backgroundColor: '#f0f9ff',
          borderRadius: '6px',
          border: '1px solid #bae6fd'
        }}>
          <p style={{ 
            fontSize: '14px', 
            color: '#0369a1',
            margin: 0
          }}>
            💡 <strong>Suggestion:</strong> Check your internet connection or try again later
          </p>
        </div>
      )}
    </div>
  );

  return (
    <ErrorBoundary 
      level="section" 
      fallback={APIErrorFallback}
    >
      {children}
    </ErrorBoundary>
  );
};
