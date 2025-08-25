<?php
/**
 * UNIVERSAL Carzino - Product API Seller Enhancement
 * This version adds seller data for ALL products using their actual seller fields
 */

// Hook into WooCommerce REST API
add_filter('woocommerce_rest_prepare_product_object', 'carzino_add_seller_data_universal', 10, 3);

function carzino_add_seller_data_universal($response, $product, $request) {
    try {
        $product_id = $product->get_id();
        
        // Get seller fields from product meta
        $seller_fields = [
            'account_name' => get_post_meta($product_id, 'acount_name_seller', true) ?: get_post_meta($product_id, 'account_name_seller', true),
            'account_number' => get_post_meta($product_id, 'account_number_seller', true),
            'business_name' => get_post_meta($product_id, 'business_name_seller', true),
            'address' => get_post_meta($product_id, 'address_seller', true),
            'city' => get_post_meta($product_id, 'city_seller', true),
            'state' => get_post_meta($product_id, 'state_seller', true),
            'zip' => get_post_meta($product_id, 'zip_seller', true),
            'phone' => get_post_meta($product_id, 'phone_number_seller', true),
            'email' => get_post_meta($product_id, 'email_seller', true),
            'latitude' => get_post_meta($product_id, 'car_location_latitude', true),
            'longitude' => get_post_meta($product_id, 'car_location_longitude', true)
        ];
        
        // Also try to get from the response meta_data (with proper object handling)
        if (isset($response->data['meta_data'])) {
            $meta_fields = [
                'acount_name_seller' => 'account_name',
                'account_name_seller' => 'account_name',
                'account_number_seller' => 'account_number',
                'business_name_seller' => 'business_name',
                'address_seller' => 'address',
                'city_seller' => 'city',
                'state_seller' => 'state',
                'zip_seller' => 'zip',
                'phone_number_seller' => 'phone',
                'email_seller' => 'email',
                'car_location_latitude' => 'latitude',
                'car_location_longitude' => 'longitude'
            ];
            
            foreach ($meta_fields as $meta_key => $seller_key) {
                $meta_value = carzino_get_meta_value_safe($response->data['meta_data'], $meta_key);
                if (!empty($meta_value) && empty($seller_fields[$seller_key])) {
                    $seller_fields[$seller_key] = $meta_value;
                }
            }
        }
        
        // Check if we have any seller data
        $has_seller_data = false;
        foreach ($seller_fields as $key => $value) {
            if (!empty($value)) {
                $has_seller_data = true;
                break;
            }
        }
        
        // If we have at least some seller data, add it to the response
        if ($has_seller_data) {
            // Fill in defaults for missing data
            $seller_data = [
                'account_name' => $seller_fields['account_name'] ?: 'Carzino Dealer',
                'account_number' => $seller_fields['account_number'] ?: 'Unknown',
                'business_name' => $seller_fields['business_name'] ?: $seller_fields['account_name'] ?: 'Carzino Dealer',
                'address' => $seller_fields['address'] ?: 'Contact for Address',
                'city' => $seller_fields['city'] ?: 'Seattle',
                'state' => $seller_fields['state'] ?: 'WA',
                'zip' => $seller_fields['zip'] ?: '98101',
                'phone' => $seller_fields['phone'] ?: '(253) 555-0100',
                'email' => $seller_fields['email'] ?: 'info@carzino.com',
                'latitude' => $seller_fields['latitude'] ?: '47.6062',
                'longitude' => $seller_fields['longitude'] ?: '-122.3321'
            ];
            
            $response->data['seller_data'] = $seller_data;
            error_log('CARZINO UNIVERSAL: Seller data added for product ' . $product_id . ' (Account: ' . $seller_data['account_number'] . ')');
        } else {
            // Add default seller data if no seller fields found
            $default_seller_data = [
                'account_name' => 'Carzino Auto Sales',
                'account_number' => 'Default',
                'business_name' => 'Carzino Auto Sales',
                'address' => '123 Auto Row',
                'city' => 'Seattle',
                'state' => 'WA',
                'zip' => '98101',
                'phone' => '(253) 555-0100',
                'email' => 'info@carzino.com',
                'latitude' => '47.6062',
                'longitude' => '-122.3321'
            ];
            
            $response->data['seller_data'] = $default_seller_data;
            error_log('CARZINO UNIVERSAL: Default seller data added for product ' . $product_id);
        }
        
    } catch (Exception $e) {
        error_log('CARZINO UNIVERSAL ERROR: ' . $e->getMessage());
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
error_log('CARZINO UNIVERSAL: Universal seller enhancement loaded successfully');
?>
