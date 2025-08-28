import React, { useState, useEffect } from 'react';
import { fetchVehiclesPaginated } from '../services/api-paginated';

const ImageDiagnostic = () => {
  const [diagnosticData, setDiagnosticData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeImages = async () => {
    setIsAnalyzing(true);
    try {
      // Fetch first page of vehicles to analyze
      const result = await fetchVehiclesPaginated(1, 10, {});
      
      const imageAnalysis = result.vehicles.map(vehicle => {
        const analysis = {
          id: vehicle.id,
          title: vehicle.title,
          hasImages: !!vehicle.images && vehicle.images.length > 0,
          imageCount: vehicle.images ? vehicle.images.length : 0,
          imageUrls: vehicle.images || [],
          hasRawData: !!vehicle.rawData,
          rawImageData: null
        };

        if (vehicle.rawData) {
          analysis.rawImageData = {
            hasImagesArray: !!vehicle.rawData.images,
            imageCount: vehicle.rawData.images ? vehicle.rawData.images.length : 0,
            featuredMedia: vehicle.rawData.featured_media,
            featuredMediaSrc: vehicle.rawData.featured_media_src,
            firstImageSample: vehicle.rawData.images?.[0]
          };
        }

        return analysis;
      });

      const summary = {
        totalVehicles: imageAnalysis.length,
        vehiclesWithImages: imageAnalysis.filter(v => v.hasImages).length,
        vehiclesWithRawImages: imageAnalysis.filter(v => v.rawImageData?.hasImagesArray).length,
        totalImageUrls: imageAnalysis.reduce((sum, v) => sum + v.imageCount, 0),
        sampleImageUrls: imageAnalysis
          .filter(v => v.imageUrls.length > 0)
          .slice(0, 3)
          .map(v => v.imageUrls[0])
      };

      setDiagnosticData({
        summary,
        detailedAnalysis: imageAnalysis.slice(0, 5), // First 5 vehicles
        recommendations: generateRecommendations(summary, imageAnalysis)
      });
    } catch (error) {
      console.error('Error analyzing images:', error);
      setDiagnosticData({
        error: error.message,
        recommendations: ['Unable to analyze images. Check WooCommerce API connection.']
      });
    }
    setIsAnalyzing(false);
  };

  const generateRecommendations = (summary, analysis) => {
    const recommendations = [];

    if (summary.vehiclesWithImages === 0) {
      recommendations.push('❌ No vehicles have images in the processed data. Images may need to be added to WooCommerce products.');
      recommendations.push('💡 Check if images are attached to your WooCommerce vehicle products.');
      recommendations.push('💡 Verify that the WooCommerce REST API has permission to access product images.');
    } else if (summary.vehiclesWithImages < summary.totalVehicles / 2) {
      recommendations.push('⚠️ Only some vehicles have images. Consider adding images to all inventory items.');
    } else {
      recommendations.push('✅ Most vehicles have images available.');
    }

    if (summary.totalImageUrls === 0) {
      recommendations.push('💡 Consider uploading vehicle images to your WooCommerce media library.');
      recommendations.push('💡 Ensure vehicle product pages have featured images or gallery images.');
    }

    return recommendations;
  };

  useEffect(() => {
    analyzeImages();
  }, []);

  if (!diagnosticData && isAnalyzing) {
    return (
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        zIndex: 1000,
        textAlign: 'center'
      }}>
        <div>🔍 Analyzing vehicle images...</div>
      </div>
    );
  }

  if (!diagnosticData) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      width: '500px',
      maxHeight: '80vh',
      backgroundColor: 'white',
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      zIndex: 1000,
      overflow: 'auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
          🖼️ Vehicle Image Analysis
        </h3>
        <button
          onClick={() => setDiagnosticData(null)}
          style={{
            padding: '4px 8px',
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

      <div style={{ padding: '16px' }}>
        {diagnosticData.error ? (
          <div style={{ color: '#dc2626', marginBottom: '16px' }}>
            <strong>Error:</strong> {diagnosticData.error}
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>
                Summary
              </h4>
              <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                <div>📊 Total Vehicles Analyzed: {diagnosticData.summary.totalVehicles}</div>
                <div>🖼️ Vehicles with Images: {diagnosticData.summary.vehiclesWithImages}</div>
                <div>📁 Vehicles with Raw Image Data: {diagnosticData.summary.vehiclesWithRawImages}</div>
                <div>🔗 Total Image URLs Found: {diagnosticData.summary.totalImageUrls}</div>
              </div>
            </div>

            {diagnosticData.summary.sampleImageUrls.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>
                  Sample Image URLs Found
                </h4>
                {diagnosticData.summary.sampleImageUrls.map((url, index) => (
                  <div key={index} style={{ 
                    fontSize: '12px', 
                    marginBottom: '4px',
                    wordBreak: 'break-all',
                    backgroundColor: '#f0f9ff',
                    padding: '4px',
                    borderRadius: '4px'
                  }}>
                    {url}
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>
                Detailed Analysis (First 5 Vehicles)
              </h4>
              {diagnosticData.detailedAnalysis.map((vehicle, index) => (
                <div key={index} style={{
                  padding: '8px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  fontSize: '12px'
                }}>
                  <div><strong>{vehicle.title}</strong></div>
                  <div>Images: {vehicle.imageCount} ({vehicle.hasImages ? '✅' : '❌'})</div>
                  {vehicle.rawImageData && (
                    <div>Raw Images: {vehicle.rawImageData.imageCount} 
                      {vehicle.rawImageData.featuredMediaSrc && ' + Featured'}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>
                Recommendations
              </h4>
              {diagnosticData.recommendations.map((rec, index) => (
                <div key={index} style={{
                  padding: '8px',
                  backgroundColor: rec.includes('❌') ? '#fef2f2' : 
                                 rec.includes('⚠️') ? '#fefbf2' : '#f0f9ff',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  fontSize: '13px',
                  lineHeight: '1.4'
                }}>
                  {rec}
                </div>
              ))}
            </div>

            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <button
                onClick={analyzeImages}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                🔄 Re-analyze
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ImageDiagnostic;
