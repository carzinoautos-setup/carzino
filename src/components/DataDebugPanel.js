import React, { useState, useEffect } from 'react';

const DataDebugPanel = ({ vehicles, filterOptions, loading, error, apiConnected }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [envCheck, setEnvCheck] = useState({});

  useEffect(() => {
    // Check environment variables
    setEnvCheck({
      wpSiteUrl: !!process.env.REACT_APP_WP_SITE_URL,
      consumerKey: !!process.env.REACT_APP_WC_CONSUMER_KEY,
      consumerSecret: !!process.env.REACT_APP_WC_CONSUMER_SECRET,
      wpSiteUrlValue: process.env.REACT_APP_WP_SITE_URL || 'NOT SET',
      consumerKeyValue: process.env.REACT_APP_WC_CONSUMER_KEY ? 
        process.env.REACT_APP_WC_CONSUMER_KEY.substring(0, 10) + '...' : 'NOT SET',
      consumerSecretValue: process.env.REACT_APP_WC_CONSUMER_SECRET ? 
        process.env.REACT_APP_WC_CONSUMER_SECRET.substring(0, 10) + '...' : 'NOT SET'
    });
  }, []);

  const getStatusIcon = (condition) => condition ? '✅' : '❌';
  
  const debugData = {
    // Environment Status
    environment: {
      'WordPress Site URL': `${getStatusIcon(envCheck.wpSiteUrl)} ${envCheck.wpSiteUrlValue}`,
      'Consumer Key': `${getStatusIcon(envCheck.consumerKey)} ${envCheck.consumerKeyValue}`,
      'Consumer Secret': `${getStatusIcon(envCheck.consumerSecret)} ${envCheck.consumerSecretValue}`,
    },
    
    // API Status
    api: {
      'Connection Status': `${getStatusIcon(apiConnected)} ${apiConnected ? 'Connected' : 'Failed'}`,
      'Loading State': `${loading ? '⏳' : '✅'} ${loading ? 'Loading...' : 'Complete'}`,
      'Error Status': error ? `❌ ${error}` : '✅ No Errors',
    },
    
    // Data Status
    data: {
      'Vehicles Loaded': `${vehicles.length} vehicles`,
      'Filter Options': `${Object.keys(filterOptions).length} categories`,
      'Makes Available': `${filterOptions.makes?.length || 0} makes`,
      'Models Available': `${filterOptions.models?.length || 0} models`,
      'Sample Vehicle': vehicles[0] ? vehicles[0].title : 'None loaded',
    },
    
    // Quick Fixes
    quickFixes: {
      'Missing Environment Variables': !envCheck.wpSiteUrl || !envCheck.consumerKey || !envCheck.consumerSecret,
      'Infinite Loading': loading && vehicles.length === 0,
      'No Data Loaded': !loading && vehicles.length === 0,
      'API Connection Issues': !apiConnected && envCheck.wpSiteUrl && envCheck.consumerKey,
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: loading ? '#dc2626' : apiConnected ? '#16a34a' : '#f59e0b',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '12px 16px',
          cursor: 'pointer',
          fontFamily: 'monospace',
          fontSize: '12px',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}
      >
        🔧 Debug Data ({vehicles.length} vehicles)
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'white',
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      padding: '16px',
      maxWidth: '400px',
      maxHeight: '600px',
      overflow: 'auto',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 1000,
      boxShadow: '0 10px 25px rgba(0,0,0,0.15)'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '12px',
        paddingBottom: '8px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>
          🔧 Data Debug Panel
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '16px',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          ✕
        </button>
      </div>

      {Object.entries(debugData).map(([section, items]) => (
        <div key={section} style={{ marginBottom: '12px' }}>
          <h4 style={{ 
            margin: '0 0 6px 0', 
            fontSize: '13px', 
            fontWeight: 'bold',
            textTransform: 'capitalize',
            color: section === 'quickFixes' ? '#dc2626' : '#374151'
          }}>
            {section === 'quickFixes' ? '⚠️ Issues Found' : `📊 ${section}`}
          </h4>
          
          {section === 'quickFixes' ? (
            <div style={{ padding: '8px', background: '#fef2f2', borderRadius: '6px' }}>
              {Object.entries(items).map(([issue, hasIssue]) => 
                hasIssue ? (
                  <div key={issue} style={{ color: '#dc2626', marginBottom: '4px' }}>
                    ❌ {issue}
                  </div>
                ) : null
              )}
              {!Object.values(items).some(Boolean) && (
                <div style={{ color: '#16a34a' }}>✅ No issues detected</div>
              )}
            </div>
          ) : (
            Object.entries(items).map(([key, value]) => (
              <div key={key} style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '4px',
                fontSize: '11px'
              }}>
                <span style={{ color: '#6b7280' }}>{key}:</span>
                <span style={{ 
                  fontWeight: 'bold',
                  color: value.includes('✅') ? '#16a34a' : 
                        value.includes('❌') ? '#dc2626' : 
                        value.includes('⏳') ? '#f59e0b' : '#374151'
                }}>
                  {value}
                </span>
              </div>
            ))
          )}
        </div>
      ))}

      {/* Quick Actions */}
      <div style={{ 
        marginTop: '12px', 
        paddingTop: '12px', 
        borderTop: '1px solid #e5e7eb' 
      }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 'bold' }}>
          🚀 Quick Actions
        </h4>
        
        <button
          onClick={() => {
            localStorage.clear();
            window.location.reload();
          }}
          style={{
            background: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '11px',
            cursor: 'pointer',
            marginRight: '8px',
            marginBottom: '4px'
          }}
        >
          🔄 Clear Cache & Reload
        </button>
        
        <button
          onClick={() => {
            console.log('🔍 DETAILED DEBUG INFO:');
            console.log('Environment Variables:', envCheck);
            console.log('Current Vehicles:', vehicles);
            console.log('Filter Options:', filterOptions);
            console.log('Loading State:', loading);
            console.log('API Connected:', apiConnected);
            console.log('Error:', error);
          }}
          style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '11px',
            cursor: 'pointer',
            marginBottom: '4px'
          }}
        >
          📋 Log Full Debug Info
        </button>
      </div>
    </div>
  );
};

export default DataDebugPanel;
