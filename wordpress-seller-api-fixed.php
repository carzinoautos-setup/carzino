<?php
/**
 * FIXED Carzino - Product API Seller Enhancement
 * This version properly handles WC_Meta_Data objects vs arrays
 */

// Hook into WooCommerce REST API
add_filter('woocommerce_rest_prepare_product_object', 'carzino_add_seller_data_fixed', 10, 3);

function carzino_add_seller_data_fixed($response, $product, $request) {
    try {
        // Log that function is being called
        error_log('CARZINO FIXED: Adding seller data for product ID: ' . $product->get_id());
        
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
        
        // For account "73", add seller data
        if ($account_number == '73') {
            $seller_data = array(
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
            );
            
            $response->data['seller_data'] = $seller_data;
            error_log('CARZINO FIXED: Seller data added successfully for account 73');
        }
        
    } catch (Exception $e) {
        error_log('CARZINO FIXED ERROR: ' . $e->getMessage());
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

// Log that the file was loaded
error_log('CARZINO FIXED: Enhanced seller snippet loaded successfully');
?>
