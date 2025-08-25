<?php
/**
 * Carzino - CORS Headers for Fly.dev Domain
 * Add this snippet to allow the Fly.dev app to access your WordPress API
 */

// Add CORS headers to allow Fly.dev domain
add_action('init', 'carzino_add_cors_headers_for_flydev');

function carzino_add_cors_headers_for_flydev() {
    // Only add headers for API requests
    if (strpos($_SERVER['REQUEST_URI'], '/wp-json/') !== false) {
        
        $allowed_origins = [
            'https://fbce45b0c67141608c60e319b0dcfc3a-44a36f7f-89a9-4b6d-ba50-d884fa.fly.dev',
            'http://localhost:3000', // For local development
            'http://localhost:3001'  // Alternative local port
        ];
        
        $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
        
        if (in_array($origin, $allowed_origins)) {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Access-Control-Allow-Credentials: true');
            header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin');
            header('Access-Control-Max-Age: 86400'); // Cache preflight for 24 hours
            
            // Handle preflight OPTIONS requests
            if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
                http_response_code(200);
                exit();
            }
        }
    }
}

// Alternative method: Hook into REST API init
add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function($value) {
        $allowed_origins = [
            'https://fbce45b0c67141608c60e319b0dcfc3a-44a36f7f-89a9-4b6d-ba50-d884fa.fly.dev',
            'http://localhost:3000',
            'http://localhost:3001'
        ];
        
        $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
        
        if (in_array($origin, $allowed_origins)) {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Access-Control-Allow-Credentials: true');
            header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin');
        }
        
        return $value;
    });
});

// Log CORS activity for debugging
add_action('wp_loaded', function() {
    if (strpos($_SERVER['REQUEST_URI'], '/wp-json/') !== false) {
        $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : 'No Origin';
        error_log('CARZINO CORS: API request from origin: ' . $origin);
    }
});

error_log('CARZINO CORS: CORS headers snippet loaded successfully');
?>
