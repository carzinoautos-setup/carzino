<?php
/**
 * FINAL AGGRESSIVE Carzino - Product API Seller Enhancement
 * This version hooks into multiple WordPress REST API points to ensure seller data is added
 */

// Hook into multiple REST API points to catch all product requests
add_filter('woocommerce_rest_prepare_product_object', 'carzino_add_seller_data_final', 10, 3);
add_filter('rest_prepare_product', 'carzino_add_seller_data_final', 10, 3);
add_action('rest_api_init', 'carzino_register_seller_field');

function carzino_register_seller_field() {
    register_rest_field('product', 'seller_data', array(
        'get_callback' => 'carzino_get_seller_data_callback',
        'update_callback' => null,
        'schema' => null,
    ));
}

function carzino_get_seller_data_callback($product) {
    $product_id = $product['id'];
    
    // Get account number from product meta
    $account_number = get_post_meta($product_id, 'account_number_seller', true);
    
    if (empty($account_number)) {
        $account_number = get_post_meta($product_id, '_account_number_seller', true);
    }
    
    // For account "73", return hardcoded data
    if ($account_number == '73') {
        return array(
            'account_name' => 'Carzino Test Account',
            'account_number' => '73',
            'business_name' => 'Carzino Motors',
            'address' => '123 Test Street',
            'city' => 'Seattle',
            'state' => 'WA',
            'zip' => '98101',
            'phone' => '(253) 555-0100',
            'email' => 'test@carzino.com',
            'latitude' => '47.6062',
            'longitude' => '-122.3321'
        );
    }
    
    return null;
}

function carzino_add_seller_data_final($response, $product, $request) {
    // Log that function is being called
    error_log('CARZINO FINAL: Adding seller data for product ID: ' . $product->get_id());
    
    $product_id = $product->get_id();
    
    // Get account number from product meta
    $account_number = get_post_meta($product_id, 'account_number_seller', true);
    
    if (empty($account_number)) {
        $account_number = get_post_meta($product_id, '_account_number_seller', true);
    }
    
    // For account "73", add hardcoded seller data
    if ($account_number == '73') {
        $seller_data = array(
            'account_name' => 'Carzino Test Account',
            'account_number' => '73',
            'business_name' => 'Carzino Motors',
            'address' => '123 Test Street',
            'city' => 'Seattle',
            'state' => 'WA',
            'zip' => '98101',
            'phone' => '(253) 555-0100',
            'email' => 'test@carzino.com',
            'latitude' => '47.6062',
            'longitude' => '-122.3321'
        );
        
        $response->data['seller_data'] = $seller_data;
        error_log('CARZINO FINAL: Seller data added to response for account 73');
    }
    
    return $response;
}

// Also hook into the general REST API response for products
add_filter('rest_post_dispatch', 'carzino_modify_rest_response', 10, 3);

function carzino_modify_rest_response($response, $server, $request) {
    // Only modify WooCommerce product responses
    if (strpos($request->get_route(), '/wc/v3/products') !== false) {
        $data = $response->get_data();
        
        // Handle both single product and product list responses
        if (isset($data['id'])) {
            // Single product
            $data = carzino_add_seller_to_product_data($data);
        } elseif (is_array($data)) {
            // Product list
            foreach ($data as $index => $product) {
                if (isset($product['id'])) {
                    $data[$index] = carzino_add_seller_to_product_data($product);
                }
            }
        }
        
        $response->set_data($data);
    }
    
    return $response;
}

function carzino_add_seller_to_product_data($product_data) {
    if (!isset($product_data['seller_data'])) {
        $product_id = $product_data['id'];
        
        // Get account number from meta data
        $account_number = null;
        if (isset($product_data['meta_data'])) {
            foreach ($product_data['meta_data'] as $meta) {
                if ($meta['key'] === 'account_number_seller' || $meta['key'] === '_account_number_seller') {
                    $account_number = $meta['value'];
                    break;
                }
            }
        }
        
        // For account "73", add hardcoded seller data
        if ($account_number == '73') {
            $product_data['seller_data'] = array(
                'account_name' => 'Carzino Test Account',
                'account_number' => '73',
                'business_name' => 'Carzino Motors',
                'address' => '123 Test Street',
                'city' => 'Seattle',
                'state' => 'WA',
                'zip' => '98101',
                'phone' => '(253) 555-0100',
                'email' => 'test@carzino.com',
                'latitude' => '47.6062',
                'longitude' => '-122.3321'
            );
            error_log('CARZINO FINAL: Seller data added via rest_post_dispatch for account 73');
        }
    }
    
    return $product_data;
}

// Log that the file was loaded
error_log('CARZINO FINAL: Aggressive seller enhancement loaded successfully');
?>
