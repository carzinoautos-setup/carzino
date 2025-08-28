<?php
/**
 * Carzino - Auto-Populate Missing Seller Data (FULLY DYNAMIC VERSION)
 * Works with unlimited dealers - NO hardcoded account numbers
 */

// Hook into WooCommerce REST API to ensure seller data is always present
add_filter('woocommerce_rest_prepare_product_object', 'carzino_ensure_seller_data_dynamic', 20, 3);

function carzino_ensure_seller_data_dynamic($response, $product, $request) {
    $product_id = $product->get_id();
    
    // Check if product already has seller name data
    $existing_seller_name = get_post_meta($product_id, 'acount_name_seller', true) ?: get_post_meta($product_id, 'account_name_seller', true);
    
    // If no seller name but we have an account number, populate seller data
    if (empty($existing_seller_name)) {
        $account_number = get_post_meta($product_id, 'account_number_seller', true);
        
        if (!empty($account_number)) {
            error_log("CARZINO AUTO-POPULATE: Product $product_id has account $account_number but missing seller data");
            
            // Get seller data based on account number (FULLY DYNAMIC)
            $seller_data = carzino_get_seller_data_dynamic($account_number);
            
            if ($seller_data) {
                // Populate seller fields on the product
                foreach ($seller_data as $field_key => $field_value) {
                    if (!empty($field_value)) {
                        update_post_meta($product_id, $field_key, $field_value);
                        error_log("CARZINO AUTO-POPULATE: Added $field_key = $field_value to product $product_id");
                    }
                }
                
                error_log("CARZINO AUTO-POPULATE: Successfully populated seller data for product $product_id (Account: $account_number)");
            }
        }
    }
    
    return $response;
}

/**
 * Get seller data by account number (FULLY DYNAMIC - NO HARDCODED DEALERS)
 */
function carzino_get_seller_data_dynamic($account_number) {
    global $wpdb;
    
    // Look for seller post by account number in WordPress database
    $seller_post = $wpdb->get_row($wpdb->prepare("
        SELECT p.ID, p.post_title
        FROM {$wpdb->posts} p
        INNER JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id
        WHERE p.post_type IN ('sellers_account', 'seller_account', 'sellersaccount', 'seller')
        AND p.post_status = 'publish'
        AND pm.meta_key = 'account_number_seller'
        AND pm.meta_value = %s
        LIMIT 1
    ", $account_number));
    
    if ($seller_post) {
        error_log("CARZINO DYNAMIC: Found seller post ID {$seller_post->ID} for account $account_number");
        
        // Get all seller meta data
        $seller_meta = get_post_meta($seller_post->ID);
        
        // Build seller data array with comprehensive field mapping
        $seller_data = array();
        
        // Core seller fields with multiple possible field names
        $field_mapping = array(
            // Account/Business Name variants
            'acount_name_seller' => ['acount_name_seller', 'account_name_seller', 'business_name', 'company_name', 'name'],
            'account_name_seller' => ['account_name_seller', 'acount_name_seller', 'business_name', 'company_name', 'name'],
            'business_name_seller' => ['business_name_seller', 'business_name', 'company_name', 'acount_name_seller', 'account_name_seller'],
            
            // Contact Information
            'phone_number_seller' => ['phone_number_seller', 'phone', 'contact_phone', 'telephone'],
            'email_seller' => ['email_seller', 'email', 'contact_email'],
            
            // Address Information
            'address_seller' => ['address_seller', 'address', 'street_address', 'business_address'],
            'city_seller' => ['city_seller', 'city'],
            'state_seller' => ['state_seller', 'state'],
            'zip_seller' => ['zip_seller', 'zip', 'postal_code', 'zipcode'],
            
            // Location Coordinates
            'car_location_latitude' => ['car_location_latitude', 'latitude', 'lat'],
            'car_location_longitude' => ['car_location_longitude', 'longitude', 'lng', 'lon'],
            
            // Account Type
            'account_type_seller' => ['account_type_seller', 'account_type', 'seller_type']
        );
        
        // Extract data using field mapping
        foreach ($field_mapping as $target_field => $possible_sources) {
            foreach ($possible_sources as $source_field) {
                if (isset($seller_meta[$source_field]) && !empty($seller_meta[$source_field][0])) {
                    $seller_data[$target_field] = $seller_meta[$source_field][0];
                    break; // Use first match found
                }
            }
        }
        
        // Use post title as fallback for business name
        if (empty($seller_data['acount_name_seller']) && empty($seller_data['account_name_seller'])) {
            $seller_data['acount_name_seller'] = $seller_post->post_title;
            $seller_data['account_name_seller'] = $seller_post->post_title;
            $seller_data['business_name_seller'] = $seller_post->post_title;
        }
        
        // Ensure consistent naming across all variations
        if (!empty($seller_data['acount_name_seller'])) {
            $seller_data['account_name_seller'] = $seller_data['acount_name_seller'];
            $seller_data['business_name_seller'] = $seller_data['acount_name_seller'];
        } elseif (!empty($seller_data['account_name_seller'])) {
            $seller_data['acount_name_seller'] = $seller_data['account_name_seller'];
            $seller_data['business_name_seller'] = $seller_data['account_name_seller'];
        }
        
        // Set defaults for missing required fields
        $seller_data['account_type_seller'] = $seller_data['account_type_seller'] ?: 'Dealer';
        $seller_data['account_number_seller'] = $account_number;
        
        // Set reasonable defaults for missing location data
        if (empty($seller_data['city_seller'])) {
            $seller_data['city_seller'] = 'Seattle';
        }
        if (empty($seller_data['state_seller'])) {
            $seller_data['state_seller'] = 'WA';
        }
        if (empty($seller_data['zip_seller'])) {
            $seller_data['zip_seller'] = '98101';
        }
        if (empty($seller_data['phone_number_seller'])) {
            $seller_data['phone_number_seller'] = '(253) 555-0100';
        }
        if (empty($seller_data['email_seller'])) {
            $seller_data['email_seller'] = 'info@carzino.com';
        }
        if (empty($seller_data['address_seller'])) {
            $seller_data['address_seller'] = 'Contact for Address';
        }
        
        error_log("CARZINO DYNAMIC: Built seller data for {$seller_data['acount_name_seller']} (Account: $account_number)");
        return $seller_data;
        
    } else {
        error_log("CARZINO DYNAMIC: No seller post found for account $account_number");
        
        // Create minimal fallback data
        return array(
            'acount_name_seller' => "Dealer Account #$account_number",
            'account_name_seller' => "Dealer Account #$account_number",
            'business_name_seller' => "Dealer Account #$account_number",
            'city_seller' => 'Seattle',
            'state_seller' => 'WA',
            'zip_seller' => '98101',
            'phone_number_seller' => '(253) 555-0100',
            'email_seller' => 'info@carzino.com',
            'address_seller' => 'Contact for Address',
            'account_type_seller' => 'Dealer',
            'account_number_seller' => $account_number,
            'car_location_latitude' => '47.6062',
            'car_location_longitude' => '-122.3321'
        );
    }
}

// Bulk population endpoint (DYNAMIC VERSION)
add_action('rest_api_init', function() {
    register_rest_route('carzino/v1', '/populate-seller-data', array(
        'methods' => 'GET',
        'callback' => 'carzino_populate_all_seller_data_dynamic',
        'permission_callback' => '__return_true'
    ));
});

function carzino_populate_all_seller_data_dynamic($request) {
    global $wpdb;
    
    try {
        // Get products with account numbers but missing seller names
        $products_missing_seller_data = $wpdb->get_results("
            SELECT p.ID, p.post_title, pm1.meta_value as account_number
            FROM {$wpdb->posts} p
            JOIN {$wpdb->postmeta} pm1 ON p.ID = pm1.post_id
            LEFT JOIN {$wpdb->postmeta} pm2 ON p.ID = pm2.post_id AND pm2.meta_key = 'acount_name_seller'
            WHERE p.post_type = 'product'
            AND p.post_status = 'publish'
            AND pm1.meta_key = 'account_number_seller'
            AND pm1.meta_value != ''
            AND (pm2.meta_value IS NULL OR pm2.meta_value = '')
            ORDER BY p.post_date DESC
            LIMIT 50
        ");
        
        $results = array(
            'products_processed' => 0,
            'products_updated' => 0,
            'errors' => array(),
            'updated_products' => array(),
            'unique_accounts' => array()
        );
        
        foreach ($products_missing_seller_data as $product) {
            $results['products_processed']++;
            
            // Track unique accounts being processed
            if (!in_array($product->account_number, $results['unique_accounts'])) {
                $results['unique_accounts'][] = $product->account_number;
            }
            
            try {
                $seller_data = carzino_get_seller_data_dynamic($product->account_number);
                
                if ($seller_data) {
                    $fields_added = 0;
                    
                    foreach ($seller_data as $field_key => $field_value) {
                        if (!empty($field_value)) {
                            update_post_meta($product->ID, $field_key, $field_value);
                            $fields_added++;
                        }
                    }
                    
                    if ($fields_added > 0) {
                        $results['products_updated']++;
                        $results['updated_products'][] = array(
                            'id' => $product->ID,
                            'title' => $product->post_title,
                            'account_number' => $product->account_number,
                            'fields_added' => $fields_added,
                            'seller_name' => $seller_data['acount_name_seller']
                        );
                        
                        error_log("CARZINO BULK UPDATE: Updated product $product->ID with seller data for account $product->account_number");
                    }
                }
            } catch (Exception $e) {
                $results['errors'][] = "Product $product->ID: " . $e->getMessage();
                error_log("CARZINO ERROR: Failed to update product $product->ID - " . $e->getMessage());
            }
        }
        
        $results['summary'] = "Processed " . count($results['unique_accounts']) . " unique dealer accounts";
        
        return rest_ensure_response($results);
        
    } catch (Exception $e) {
        error_log("CARZINO BULK UPDATE ERROR: " . $e->getMessage());
        return new WP_Error('bulk_update_failed', 'Bulk update failed: ' . $e->getMessage(), array('status' => 500));
    }
}

// Log that the dynamic auto-populate script was loaded
error_log('CARZINO AUTO-POPULATE DYNAMIC: Fully dynamic seller data system loaded - supports unlimited dealers');
?>
