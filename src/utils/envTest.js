/**
 * Environment Testing Utility
 * Helps debug data display issues by validating environment setup
 */

export const testEnvironment = () => {
  const results = {
    valid: true,
    issues: [],
    warnings: [],
    recommendations: []
  };

  // Check required environment variables
  const requiredVars = {
    'REACT_APP_WP_SITE_URL': {
      value: process.env.REACT_APP_WP_SITE_URL,
      description: 'WordPress site URL',
      example: 'https://yoursite.com'
    },
    'REACT_APP_WC_CONSUMER_KEY': {
      value: process.env.REACT_APP_WC_CONSUMER_KEY,
      description: 'WooCommerce API Consumer Key',
      example: 'ck_1234567890abcdef...'
    },
    'REACT_APP_WC_CONSUMER_SECRET': {
      value: process.env.REACT_APP_WC_CONSUMER_SECRET,
      description: 'WooCommerce API Consumer Secret',
      example: 'cs_1234567890abcdef...'
    }
  };

  console.log('🔧 ENVIRONMENT TEST RESULTS:');
  console.log('═══════════════════════════════');

  Object.entries(requiredVars).forEach(([varName, config]) => {
    if (!config.value) {
      results.valid = false;
      results.issues.push({
        type: 'missing',
        variable: varName,
        description: config.description,
        fix: `Add ${varName}=${config.example} to your .env.local file`
      });
      console.log(`❌ ${varName}: MISSING`);
    } else {
      console.log(`✅ ${varName}: SET (${config.value.substring(0, 20)}...)`);
      
      // Validate format
      if (varName === 'REACT_APP_WC_CONSUMER_KEY' && !config.value.startsWith('ck_')) {
        results.warnings.push({
          type: 'format',
          variable: varName,
          issue: 'Should start with "ck_"'
        });
      }
      
      if (varName === 'REACT_APP_WC_CONSUMER_SECRET' && !config.value.startsWith('cs_')) {
        results.warnings.push({
          type: 'format',
          variable: varName,
          issue: 'Should start with "cs_"'
        });
      }
      
      if (varName === 'REACT_APP_WP_SITE_URL' && !config.value.startsWith('http')) {
        results.warnings.push({
          type: 'format',
          variable: varName,
          issue: 'Should start with "https://"'
        });
      }
    }
  });

  // Check .env file existence recommendations
  console.log('\n📁 ENVIRONMENT FILE RECOMMENDATIONS:');
  console.log('═══════════════════════════════════════');
  
  if (results.issues.length > 0) {
    console.log('🚨 CREATE .env.local FILE:');
    console.log('──────────────────────────');
    console.log('Create a file named .env.local in your project root with:');
    console.log('');
    
    Object.entries(requiredVars).forEach(([varName, config]) => {
      console.log(`${varName}=${config.example}`);
    });
    
    console.log('');
    console.log('Replace the example values with your actual credentials.');
    
    results.recommendations.push({
      type: 'setup',
      title: 'Create .env.local file',
      description: 'Environment variables must be set for the app to connect to your WordPress/WooCommerce site',
      action: 'Create .env.local file with your actual API credentials'
    });
  }

  // Development vs Production recommendations
  console.log('\n🌐 ENVIRONMENT CONTEXT:');
  console.log('═══════════════════════════');
  console.log('Current domain:', window.location.origin);
  console.log('Node environment:', process.env.NODE_ENV);
  
  if (window.location.hostname === 'localhost') {
    console.log('🔧 LOCALHOST DEVELOPMENT:');
    console.log('- Ensure your WordPress site allows CORS from localhost');
    console.log('- Test your API credentials in WordPress admin first');
    
    results.recommendations.push({
      type: 'cors',
      title: 'CORS Configuration for localhost',
      description: 'Your WordPress site may need CORS headers to allow requests from localhost',
      action: 'Add CORS headers to your WordPress site'
    });
  }

  // Summary
  console.log('\n📊 TEST SUMMARY:');
  console.log('══════════════════');
  console.log(`Environment Valid: ${results.valid ? '✅ YES' : '❌ NO'}`);
  console.log(`Issues Found: ${results.issues.length}`);
  console.log(`Warnings: ${results.warnings.length}`);
  console.log(`Recommendations: ${results.recommendations.length}`);

  if (results.issues.length > 0) {
    console.log('\n🚨 IMMEDIATE ACTION REQUIRED:');
    results.issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.fix}`);
    });
  }

  if (results.warnings.length > 0) {
    console.log('\n⚠️ WARNINGS TO CHECK:');
    results.warnings.forEach((warning, index) => {
      console.log(`${index + 1}. ${warning.variable}: ${warning.issue}`);
    });
  }

  return results;
};

export const testAPIConnection = async () => {
  const env = testEnvironment();
  
  if (!env.valid) {
    return {
      success: false,
      message: 'Environment variables not configured',
      details: 'Run testEnvironment() first to fix configuration'
    };
  }

  const apiUrl = `${process.env.REACT_APP_WP_SITE_URL}/wp-json/wc/v3/products?per_page=1&consumer_key=${process.env.REACT_APP_WC_CONSUMER_KEY}&consumer_secret=${process.env.REACT_APP_WC_CONSUMER_SECRET}`;

  console.log('\n🔍 TESTING API CONNECTION:');
  console.log('═══════════════════════════');
  console.log('API URL:', apiUrl.substring(0, 100) + '...');

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    console.log('Response Status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error Response:', errorText.substring(0, 200));
      
      return {
        success: false,
        message: `API Error: ${response.status} ${response.statusText}`,
        details: errorText.substring(0, 200)
      };
    }

    const data = await response.json();
    console.log('✅ API Connection Successful!');
    console.log('Data received:', data.length, 'products');

    return {
      success: true,
      message: 'API connection successful',
      data: data
    };

  } catch (error) {
    console.log('❌ Connection Failed:', error.message);
    
    return {
      success: false,
      message: 'Connection failed',
      details: error.message
    };
  }
};

// Make functions available in browser console for debugging
if (typeof window !== 'undefined') {
  window.testEnvironment = testEnvironment;
  window.testAPIConnection = testAPIConnection;
  
  console.log('🛠️ DEBUG UTILITIES LOADED:');
  console.log('- testEnvironment() - Check environment variables');
  console.log('- testAPIConnection() - Test WooCommerce API');
}
