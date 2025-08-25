<?php
/**
 * CARZINO CORS HEADERS
 * Add this snippet to WordPress via WPCode to allow React app to connect
 * This will let your existing seller data snippet work
 */

// Add CORS headers for all requests
add_action('init', function() {
    // Allow specific origins
    $allowed_origins = [
        'https://fbce45b0c67141608c60e319b0dcfc3a-44a36f7f-89a9-4b6d-ba50-d884fa.fly.dev',
        'http://localhost:3000',
        'https://localhost:3000'
    ];
    
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    if (in_array($origin, $allowed_origins)) {
        header("Access-Control-Allow-Origin: $origin");
    } else {
        header("Access-Control-Allow-Origin: *");
    }
    
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Access-Control-Max-Age: 86400');
    
    // Handle preflight OPTIONS requests
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        exit(0);
    }
});

// Specific CORS for WooCommerce API
add_filter('rest_pre_serve_request', function($served, $result, $request, $server) {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    $allowed_origins = [
        'https://fbce45b0c67141608c60e319b0dcfc3a-44a36f7f-89a9-4b6d-ba50-d884fa.fly.dev',
        'http://localhost:3000',
        'https://localhost:3000'
    ];
    
    if (in_array($origin, $allowed_origins)) {
        header("Access-Control-Allow-Origin: $origin");
    } else {
        header("Access-Control-Allow-Origin: *");
    }
    
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    
    return $served;
}, 10, 4);

error_log('CARZINO CORS: Headers added for Fly.dev React app');
?>
