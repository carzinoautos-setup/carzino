import React from 'react';
import './App.css';
import VehicleCardSample from './components/VehicleCardSample';
import DataDebugPanel from './components/DataDebugPanel';

function VehicleCardTestApp() {
  return (
    <div className="App">
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
        padding: '20px 0',
        marginBottom: '24px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px'
        }}>
          <h1 style={{
            color: 'white',
            margin: 0,
            fontSize: '28px',
            fontWeight: 'bold'
          }}>
            🔧 Vehicle Card - Generated Values Test
          </h1>
          <p style={{ color: 'white', margin: '8px 0 0 0', opacity: 0.9 }}>
            Testing fixed generated values with sample data
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px'
      }}>
        <VehicleCardSample />
      </div>

      {/* Debug Panel */}
      <DataDebugPanel
        vehicles={[]} // Empty for this test
        filterOptions={{}}
        loading={false}
        error={null}
        apiConnected={false}
      />
    </div>
  );
}

export default VehicleCardTestApp;
