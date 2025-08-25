<?php
/**
 * Updated CORS headers for Carzino React App
 * Add your current domain here
 */

function carzino_add_cors_headers() {
    $allowed_origins = array(
        'https://carzinoautos-setup.github.io',
        'https://fbce45b0c67141608c60e319b0dcfc3a-44a36f7f-89a9-4b6d-ba50-d884fa.fly.dev',
        'http://localhost:3000',
        'http://localhost:3001',
        // Add your current domain here if different
        'https://env-uploadbackup62225-czdev.kinsta.cloud'
    );
    
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    // Allow any localhost for development
    if (strpos($origin, 'localhost') !== false || strpos($origin, '127.0.0.1') !== false) {
        header("Access-Control-Allow-Origin: $origin");
    } elseif (in_array($origin, $allowed_origins)) {
        header("Access-Control-Allow-Origin: $origin");
    }
    
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    header("Access-Control-Allow-Credentials: true");
    
    // Handle preflight OPTIONS requests
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        status_header(200);
        exit();
    }
}

// Apply CORS to all requests
add_action('init', 'carzino_add_cors_headers');

// Apply CORS to REST API specifically
add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function($value) {
        carzino_add_cors_headers();
        return $value;
    });
});

// Apply CORS to WooCommerce API endpoints
add_filter('woocommerce_rest_pre_serve_request', function($served, $result, $request, $server) {
    carzino_add_cors_headers();
    return $served;
}, 10, 4);

// Log CORS setup
error_log('CARZINO CORS: Headers configured for React app');
?>
