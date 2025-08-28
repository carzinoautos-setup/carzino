<?php
/**
 * DYNAMIC Carzino - Seller Data Resolver
 * Automatically resolves seller data from existing sellers_account posts
 * NO HARDCODING - works with unlimited dealers
 * 
 * REPLACES: "Carzino - Auto-Populate Missing Seller Data" 
 */

// Hook into WooCommerce REST API
add_filter('woocommerce_rest_prepare_product_object', 'carzino_dynamic_seller_resolver', 10, 3);

function carzino_dynamic_seller_resolver($response, $product, $request) {
    try {
        $product_id = $product->get_id();
        
        // Get account number from product meta
        $account_number = get_post_meta($product_id, 'account_number_seller', true);
        
        if (empty($account_number)) {
            $account_number = get_post_meta($product_id, '_account_number_seller', true);
        }
        
        // Also try to get from the response meta_data
        if (empty($account_number) && isset($response->data['meta_data'])) {
            $account_number = carzino_get_meta_value_safe($response->data['meta_data'], 'account_number_seller');
        }
        
        if (!empty($account_number)) {
            // DYNAMIC LOOKUP: Find seller by account number in WordPress
            $seller_data = carzino_find_seller_by_account($account_number);
            
            if ($seller_data) {
                $response->data['seller_data'] = $seller_data;
                error_log("CARZINO DYNAMIC: Found seller data for account $account_number - {$seller_data['account_name']}");
            } else {
                error_log("CARZINO DYNAMIC: No seller found for account $account_number");
                
                // Fallback seller data
                $response->data['seller_data'] = array(
                    'account_name' => "Account #$account_number",
                    'account_number' => $account_number,
                    'business_name' => "Account #$account_number",
                    'city' => 'Contact',
                    'state' => 'for',
                    'zip' => 'Details',
                    'phone' => '(253) 555-0100',
                    'email' => 'info@carzino.com'
                );
            }
        }
        
    } catch (Exception $e) {
        error_log('CARZINO DYNAMIC ERROR: ' . $e->getMessage());
    }
    
    return $response;
}

/**
 * DYNAMIC SELLER LOOKUP
 * Finds seller data from WordPress sellers_account posts by account number
 */
function carzino_find_seller_by_account($account_number) {
    global $wpdb;
    
    // Try different possible post types for sellers
    $possible_post_types = array(
        'sellers_account',
        'seller_account', 
        'sellersaccount',
        'seller',
        'dealer'
    );
    
    $seller_post = null;
    
    // Search for seller post by account number
    foreach ($possible_post_types as $post_type) {
        $seller_post = $wpdb->get_row($wpdb->prepare("
            SELECT p.ID, p.post_title, p.post_type
            FROM {$wpdb->posts} p
            INNER JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id
            WHERE p.post_type = %s 
            AND p.post_status = 'publish'
            AND pm.meta_key IN ('account_number_seller', 'account_number', 'dealer_account', 'seller_account')
            AND pm.meta_value = %s
            LIMIT 1
        ", $post_type, $account_number));
        
        if ($seller_post) {
            error_log("CARZINO DYNAMIC: Found seller post ID {$seller_post->ID} (type: {$seller_post->post_type}) for account $account_number");
            break;
        }
    }
    
    if (!$seller_post) {
        error_log("CARZINO DYNAMIC: No seller post found for account $account_number");
        return null;
    }
    
    // Get all meta data for this seller
    $seller_meta = get_post_meta($seller_post->ID);
    
    // Map common field variations to standard names
    $field_mapping = array(
        // Account name variations
        'acount_name_seller' => array('acount_name_seller', 'account_name_seller', 'account_name', 'business_name', 'company_name', 'dealer_name', 'seller_name', 'name'),
        
        // Business name variations  
        'business_name' => array('business_name_seller', 'business_name', 'company_name', 'dealer_name', 'account_name_seller', 'acount_name_seller'),
        
        // Location variations
        'city' => array('city_seller', 'city', 'dealer_city', 'seller_city'),
        'state' => array('state_seller', 'state', 'dealer_state', 'seller_state'),
        'zip' => array('zip_seller', 'zip', 'zipcode', 'postal_code', 'dealer_zip', 'seller_zip'),
        'address' => array('address_seller', 'address', 'street_address', 'dealer_address', 'seller_address'),
        
        // Contact variations
        'phone' => array('phone_number_seller', 'phone_seller', 'phone', 'phone_number', 'contact_phone', 'dealer_phone', 'seller_phone'),
        'email' => array('email_seller', 'email', 'contact_email', 'dealer_email', 'seller_email'),
        
        // Location coordinates
        'latitude' => array('car_location_latitude', 'latitude', 'lat', 'dealer_lat', 'seller_lat'),
        'longitude' => array('car_location_longitude', 'longitude', 'lng', 'dealer_lng', 'seller_lng')
    );
    
    $seller_data = array(
        'account_number' => $account_number,
        'post_id' => $seller_post->ID,
        'post_type' => $seller_post->post_type
    );
    
    // Extract data using field mapping
    foreach ($field_mapping as $standard_field => $possible_keys) {
        $value = null;
        
        foreach ($possible_keys as $key) {
            if (isset($seller_meta[$key]) && !empty($seller_meta[$key][0])) {
                $value = $seller_meta[$key][0];
                break;
            }
        }
        
        if ($value) {
            $seller_data[$standard_field] = trim($value);
        }
    }
    
    // Use post title as fallback for name
    if (empty($seller_data['acount_name_seller']) && !empty($seller_post->post_title)) {
        $seller_data['acount_name_seller'] = $seller_post->post_title;
    }
    
    // Ensure we have an account name
    if (empty($seller_data['acount_name_seller'])) {
        $seller_data['acount_name_seller'] = "Account #$account_number";
    }
    
    // Set account_name for React compatibility
    $seller_data['account_name'] = $seller_data['acount_name_seller'];
    
    // Set business name if missing
    if (empty($seller_data['business_name'])) {
        $seller_data['business_name'] = $seller_data['acount_name_seller'];
    }
    
    // Default values for missing fields
    $defaults = array(
        'city' => 'Seattle',
        'state' => 'WA', 
        'zip' => '98101',
        'phone' => '(253) 555-0100',
        'email' => 'info@carzino.com',
        'address' => 'Contact for Address'
    );
    
    foreach ($defaults as $field => $default_value) {
        if (empty($seller_data[$field])) {
            $seller_data[$field] = $default_value;
        }
    }
    
    error_log("CARZINO DYNAMIC: Successfully resolved seller data: " . json_encode(array(
        'account_number' => $account_number,
        'account_name' => $seller_data['account_name'],
        'city' => $seller_data['city'],
        'state' => $seller_data['state']
    )));
    
    return $seller_data;
}

/**
 * Safely get meta value from meta_data array
 */
function carzino_get_meta_value_safe($meta_data, $key) {
    if (!is_array($meta_data)) {
        return null;
    }
    
    foreach ($meta_data as $meta) {
        try {
            if (is_object($meta) && method_exists($meta, 'get_data')) {
                $meta_array = $meta->get_data();
                if (isset($meta_array['key']) && $meta_array['key'] === $key) {
                    return $meta_array['value'];
                }
            }
            elseif (is_array($meta) && isset($meta['key']) && $meta['key'] === $key) {
                return $meta['value'];
            }
        } catch (Exception $e) {
            error_log('CARZINO META ERROR: ' . $e->getMessage());
            continue;
        }
    }
    
    return null;
}

// Add debug endpoint to test seller lookup
add_action('rest_api_init', function() {
    register_rest_route('carzino/v1', '/test-seller/(?P<account>[^/]+)', array(
        'methods' => 'GET',
        'callback' => 'carzino_test_seller_lookup',
        'permission_callback' => '__return_true'
    ));
});

function carzino_test_seller_lookup($request) {
    $account_number = $request['account'];
    $seller_data = carzino_find_seller_by_account($account_number);
    
    return rest_ensure_response(array(
        'account_number' => $account_number,
        'found' => !empty($seller_data),
        'seller_data' => $seller_data
    ));
}

error_log('CARZINO DYNAMIC: Dynamic seller resolver loaded - works with unlimited dealers');
?>
