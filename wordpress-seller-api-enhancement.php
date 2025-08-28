<?php
/**
 * Carzino - Enhance WooCommerce Product API with Seller Data
 * 
 * This enhances the WordPress REST API to automatically include seller account data
 * when fetching WooCommerce products, eliminating the need for separate API calls.
 * 
 * To install: Add this code to your WordPress site via WPCode plugin
 * WPCode → PHP (Run Everywhere)
 * Name: Carzino - Product API Seller Enhancement
 */

if (!function_exists('carzino_enhance_product_api_with_seller_data')) {

    /**
     * Add seller data to WooCommerce product REST API response
     */
    function carzino_enhance_product_api_with_seller_data() {
        // Hook into WooCommerce product REST API
        add_action('rest_api_init', 'carzino_register_seller_api_fields');
    }

    /**
     * Register custom fields in the WooCommerce product REST API
     */
    function carzino_register_seller_api_fields() {
        // Add seller_data field to product API response
        register_rest_field('product', 'seller_data', array(
            'get_callback' => 'carzino_get_seller_data_for_api',
            'update_callback' => null,
            'schema' => array(
                'description' => 'Seller account information linked to this product',
                'type' => 'object',
                'context' => array('view', 'edit'),
                'properties' => array(
                    'account_name_seller' => array(
                        'type' => 'string',
                        'description' => 'Seller account name'
                    ),
                    'account_type_seller' => array(
                        'type' => 'string', 
                        'description' => 'Seller account type'
                    ),
                    'city_seller' => array(
                        'type' => 'string',
                        'description' => 'Seller city'
                    ),
                    'state_seller' => array(
                        'type' => 'string',
                        'description' => 'Seller state'
                    ),
                    'zip_seller' => array(
                        'type' => 'string',
                        'description' => 'Seller ZIP code'
                    ),
                    'phone_number_seller' => array(
                        'type' => 'string',
                        'description' => 'Seller phone number'
                    ),
                    'car_location_latitude' => array(
                        'type' => 'string',
                        'description' => 'Seller latitude coordinate'
                    ),
                    'car_location_longitude' => array(
                        'type' => 'string',
                        'description' => 'Seller longitude coordinate'
                    ),
                    'account_number_seller' => array(
                        'type' => 'string',
                        'description' => 'Seller account number (for reference)'
                    )
                )
            )
        ));
    }

    /**
     * Get seller data for a product
     * 
     * @param array $object Product object
     * @param string $field_name Field name being requested
     * @param WP_REST_Request $request REST request object
     * @return array|null Seller data or null if not found
     */
    function carzino_get_seller_data_for_api($object, $field_name, $request) {
        $product_id = $object['id'];
        
        // Get the account_number_seller relationship field
        $account_number = get_field('account_number_seller', $product_id);
        
        if (!$account_number) {
            return null;
        }

        // Handle different relationship field return types
        $seller_post_id = null;
        
        if (is_array($account_number) && !empty($account_number)) {
            // If it's an array of post objects or IDs
            $seller_post_id = is_object($account_number[0]) ? $account_number[0]->ID : $account_number[0];
        } elseif (is_object($account_number)) {
            // If it's a single post object
            $seller_post_id = $account_number->ID;
        } elseif (is_numeric($account_number)) {
            // If it's a post ID
            $seller_post_id = $account_number;
        } else {
            // If it's a string (account number), find the seller post
            $seller_posts = get_posts(array(
                'post_type' => 'sellers_account',
                'meta_query' => array(
                    array(
                        'key' => 'account_number_seller',
                        'value' => $account_number,
                        'compare' => '='
                    )
                ),
                'posts_per_page' => 1
            ));
            
            if (!empty($seller_posts)) {
                $seller_post_id = $seller_posts[0]->ID;
            }
        }

        if (!$seller_post_id) {
            return null;
        }

        // Get seller account data
        $seller_data = array();

        // Helper function to get field with fallback
        $get_seller_field = function($field_name) use ($seller_post_id) {
            // Try ACF get_field first
            if (function_exists('get_field')) {
                $value = get_field($field_name, $seller_post_id);
                if ($value) return $value;
            }
            
            // Fallback to get_post_meta
            return get_post_meta($seller_post_id, $field_name, true);
        };

        // Collect seller fields
        $seller_data['account_name_seller'] = $get_seller_field('acount_name_seller') ?: 
                                            $get_seller_field('account_name_seller') ?: '';
        $seller_data['account_type_seller'] = $get_seller_field('account_type_seller') ?: '';
        $seller_data['city_seller'] = $get_seller_field('city_seller') ?: '';
        $seller_data['state_seller'] = $get_seller_field('state_seller') ?: '';
        $seller_data['zip_seller'] = $get_seller_field('zip_seller') ?: '';
        $seller_data['phone_number_seller'] = $get_seller_field('phone_number_seller') ?: '';
        $seller_data['car_location_latitude'] = $get_seller_field('car_location_latitude') ?: '';
        $seller_data['car_location_longitude'] = $get_seller_field('car_location_longitude') ?: '';
        
        // Include the account number for reference
        $seller_data['account_number_seller'] = is_string($account_number) ? $account_number : 
                                               $get_seller_field('account_number_seller');

        // Debug logging (remove in production)
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log("Carzino API: Product {$product_id} seller data: " . print_r($seller_data, true));
        }

        return $seller_data;
    }

    // Initialize the enhancement
    add_action('init', 'carzino_enhance_product_api_with_seller_data');
}

/**
 * Optional: Add seller data to WooCommerce product meta_data as well
 * This ensures compatibility with existing systems that expect data in meta_data
 */
add_filter('woocommerce_rest_prepare_product_object', function($response, $object, $request) {
    // Get the seller data that was added to the API
    if (isset($response->data['seller_data']) && !empty($response->data['seller_data'])) {
        $seller_data = $response->data['seller_data'];
        
        // Add seller fields to meta_data array for React compatibility
        if (!isset($response->data['meta_data'])) {
            $response->data['meta_data'] = array();
        }
        
        // Convert seller_data to meta_data format
        foreach ($seller_data as $key => $value) {
            if ($value !== '') {
                $response->data['meta_data'][] = array(
                    'id' => 0,
                    'key' => $key,
                    'value' => $value
                );
            }
        }
    }
    
    return $response;
}, 10, 3);
?>
