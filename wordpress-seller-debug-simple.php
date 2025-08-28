<?php
/**
 * SIMPLE DEBUG - Carzino Seller Field Inspector
 * This snippet will help us see what seller fields exist in your products
 */

// Hook into WooCommerce REST API
add_filter('woocommerce_rest_prepare_product_object', 'carzino_debug_seller_fields', 10, 3);

function carzino_debug_seller_fields($response, $product, $request) {
    try {
        $product_id = $product->get_id();
        
        // Get ALL meta data for this product
        $all_meta = get_post_meta($product_id);
        
        // Filter to show only seller-related fields
        $seller_meta = [];
        foreach ($all_meta as $key => $value) {
            if (strpos($key, 'seller') !== false || strpos($key, 'account') !== false) {
                $seller_meta[$key] = $value;
            }
        }
        
        // Add debug info to the API response
        $response->data['debug_seller_fields'] = $seller_meta;
        $response->data['debug_product_id'] = $product_id;
        $response->data['debug_total_meta_fields'] = count($all_meta);
        
        // Create simple seller data for all products
        $seller_data = [
            'account_name' => 'Debug Dealer',
            'city' => 'Debug City',
            'state' => 'WA',
            'zip' => '98101',
            'phone' => '(253) 555-DEBUG'
        ];
        
        // If we find specific seller fields, use them
        if (isset($all_meta['acount_name_seller']) && !empty($all_meta['acount_name_seller'][0])) {
            $seller_data['account_name'] = $all_meta['acount_name_seller'][0];
        }
        if (isset($all_meta['city_seller']) && !empty($all_meta['city_seller'][0])) {
            $seller_data['city'] = $all_meta['city_seller'][0];
        }
        if (isset($all_meta['state_seller']) && !empty($all_meta['state_seller'][0])) {
            $seller_data['state'] = $all_meta['state_seller'][0];
        }
        if (isset($all_meta['zip_seller']) && !empty($all_meta['zip_seller'][0])) {
            $seller_data['zip'] = $all_meta['zip_seller'][0];
        }
        
        $response->data['seller_data'] = $seller_data;
        
        error_log('CARZINO DEBUG: Product ' . $product_id . ' - Found ' . count($seller_meta) . ' seller fields');
        
    } catch (Exception $e) {
        error_log('CARZINO DEBUG ERROR: ' . $e->getMessage());
    }
    
    return $response;
}

error_log('CARZINO DEBUG: Simple seller debug snippet loaded');
?>
