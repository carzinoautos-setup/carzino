<?php
/**
 * FIXED Carzino - Product API Seller Enhancement (WITH ACCOUNT 100082)
 * This version includes account 100082 which your vehicles actually use
 */

// Hook into WooCommerce REST API
add_filter('woocommerce_rest_prepare_product_object', 'carzino_add_seller_data_with_100082', 10, 3);

function carzino_add_seller_data_with_100082($response, $product, $request) {
    try {
        $product_id = $product->get_id();
        
        // Get account number from product meta (direct method)
        $account_number = get_post_meta($product_id, 'account_number_seller', true);
        
        if (empty($account_number)) {
            $account_number = get_post_meta($product_id, '_account_number_seller', true);
        }
        
        // Also try to get from the response meta_data (with proper object handling)
        if (empty($account_number) && isset($response->data['meta_data'])) {
            $account_number = carzino_get_meta_value_safe($response->data['meta_data'], 'account_number_seller');
        }
        
        // Define ALL seller accounts INCLUDING 100082
        $seller_database = array(
            '73' => array(
                'account_name' => 'Del Sol Auto Sales',
                'account_number' => '73',
                'business_name' => 'Del Sol Auto Sales',
                'address' => '1234 Auto Row',
                'city' => 'Everett',
                'state' => 'WA',
                'zip' => '98204',
                'phone' => '(425) 555-0100',
                'email' => 'sales@delsolauto.com',
                'latitude' => '47.9789',
                'longitude' => '-122.2021'
            ),
            '100082' => array(
                'account_name' => 'Carson Cars',
                'account_number' => '100082',
                'business_name' => 'Carson Cars',
                'address' => '5678 Carson Ave',
                'city' => 'Seattle',
                'state' => 'WA',
                'zip' => '98101',
                'phone' => '(253) 555-0100',
                'email' => 'sales@carsoncars.com',
                'latitude' => '47.6062',
                'longitude' => '-122.3321'
            ),
            '101' => array(
                'account_name' => 'Carson Cars Legacy',
                'account_number' => '101',
                'business_name' => 'Carson Cars',
                'address' => '5678 Carson Ave',
                'city' => 'Seattle',
                'state' => 'WA',
                'zip' => '98101',
                'phone' => '(253) 555-0100',
                'email' => 'sales@carsoncars.com',
                'latitude' => '47.6062',
                'longitude' => '-122.3321'
            ),
            '205' => array(
                'account_name' => 'Northwest Auto Group',
                'account_number' => '205',
                'business_name' => 'Northwest Auto Group',
                'address' => '9012 Pacific Ave',
                'city' => 'Tacoma',
                'state' => 'WA',
                'zip' => '98402',
                'phone' => '(253) 555-0200',
                'email' => 'contact@nwautogroup.com',
                'latitude' => '47.2529',
                'longitude' => '-122.4443'
            ),
            '312' => array(
                'account_name' => 'Electric Auto Northwest',
                'account_number' => '312',
                'business_name' => 'Electric Auto Northwest',
                'address' => '1357 Electric Blvd',
                'city' => 'Bellevue',
                'state' => 'WA',
                'zip' => '98004',
                'phone' => '(425) 555-0300',
                'email' => 'sales@electricautonw.com',
                'latitude' => '47.6144',
                'longitude' => '-122.1932'
            ),
            '445' => array(
                'account_name' => 'Premium Motors Seattle',
                'account_number' => '445',
                'business_name' => 'Premium Motors Seattle',
                'address' => '2468 Premium Way',
                'city' => 'Seattle',
                'state' => 'WA',
                'zip' => '98109',
                'phone' => '(206) 555-0400',
                'email' => 'luxury@premiummotors.com',
                'latitude' => '47.6205',
                'longitude' => '-122.3493'
            )
        );
        
        // Check if we have seller data for this account
        if (!empty($account_number) && isset($seller_database[$account_number])) {
            $seller_data = $seller_database[$account_number];
            $response->data['seller_data'] = $seller_data;
            
            error_log("CARZINO 100082: Added seller data for account $account_number ({$seller_data['account_name']}) to product $product_id");
        } else {
            // Log when account number is found but no seller data
            if (!empty($account_number)) {
                error_log("CARZINO 100082: Account $account_number found but no seller data defined for product $product_id");
            }
        }
        
    } catch (Exception $e) {
        error_log('CARZINO 100082 ERROR: ' . $e->getMessage());
    }
    
    return $response;
}

/**
 * Safely get meta value from meta_data array that might contain WC_Meta_Data objects
 */
function carzino_get_meta_value_safe($meta_data, $key) {
    if (!is_array($meta_data)) {
        return null;
    }
    
    foreach ($meta_data as $meta) {
        try {
            // Handle WC_Meta_Data objects
            if (is_object($meta) && method_exists($meta, 'get_data')) {
                $meta_array = $meta->get_data();
                if (isset($meta_array['key']) && $meta_array['key'] === $key) {
                    return $meta_array['value'];
                }
            }
            // Handle regular arrays  
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

error_log('CARZINO 100082: Seller data enhancement loaded with account 100082 (Carson Cars) included');
?>
