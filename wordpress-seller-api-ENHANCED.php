<?php
/**
 * ENHANCED Carzino - Seller Data API Enhancement
 * Adds seller_data field to WooCommerce product API responses
 */

add_filter('woocommerce_rest_prepare_product_object', 'carzino_enhanced_seller_resolver', 10, 3);

function carzino_enhanced_seller_resolver($response, $product, $request) {
    try {
        $product_id = $product->get_id();
        
        // Get account number from product meta
        $account_number = get_post_meta($product_id, 'account_number_seller', true);
        
        // If no account number in meta, check meta_data array
        if (empty($account_number) && isset($response->data['meta_data'])) {
            foreach ($response->data['meta_data'] as $meta) {
                if (is_object($meta) && method_exists($meta, 'get_data')) {
                    $meta_array = $meta->get_data();
                    if ($meta_array['key'] === 'account_number_seller') {
                        $account_number = $meta_array['value'];
                        break;
                    }
                }
            }
        }
        
        if (!empty($account_number)) {
            // First try to get data from the product itself
            $seller_data = array(
                'account_name' => get_post_meta($product_id, 'acount_name_seller', true) ?: get_post_meta($product_id, 'account_name_seller', true),
                'account_number' => $account_number,
                'business_name' => get_post_meta($product_id, 'business_name_seller', true),
                'city' => get_post_meta($product_id, 'city_seller', true),
                'state' => get_post_meta($product_id, 'state_seller', true),
                'zip' => get_post_meta($product_id, 'zip_seller', true),
                'phone' => get_post_meta($product_id, 'phone_number_seller', true),
                'email' => get_post_meta($product_id, 'email_seller', true),
                'address' => get_post_meta($product_id, 'address_seller', true),
                'account_type' => get_post_meta($product_id, 'account_type_seller', true) ?: 'Dealer',
                'car_location_latitude' => get_post_meta($product_id, 'car_location_latitude', true),
                'car_location_longitude' => get_post_meta($product_id, 'car_location_longitude', true)
            );
            
            // If we don't have seller name from product, try to find seller post
            if (empty($seller_data['account_name'])) {
                global $wpdb;
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
                    // Get seller data from the seller post
                    $seller_data['account_name'] = get_post_meta($seller_post->ID, 'acount_name_seller', true) ?: get_post_meta($seller_post->ID, 'account_name_seller', true) ?: $seller_post->post_title;
                    $seller_data['business_name'] = get_post_meta($seller_post->ID, 'business_name_seller', true) ?: $seller_data['account_name'];
                    $seller_data['city'] = $seller_data['city'] ?: get_post_meta($seller_post->ID, 'city_seller', true);
                    $seller_data['state'] = $seller_data['state'] ?: get_post_meta($seller_post->ID, 'state_seller', true);
                    $seller_data['zip'] = $seller_data['zip'] ?: get_post_meta($seller_post->ID, 'zip_seller', true);
                    $seller_data['phone'] = $seller_data['phone'] ?: get_post_meta($seller_post->ID, 'phone_number_seller', true);
                    $seller_data['email'] = $seller_data['email'] ?: get_post_meta($seller_post->ID, 'email_seller', true);
                    $seller_data['address'] = $seller_data['address'] ?: get_post_meta($seller_post->ID, 'address_seller', true);
                    $seller_data['car_location_latitude'] = $seller_data['car_location_latitude'] ?: get_post_meta($seller_post->ID, 'car_location_latitude', true);
                    $seller_data['car_location_longitude'] = $seller_data['car_location_longitude'] ?: get_post_meta($seller_post->ID, 'car_location_longitude', true);
                    
                    error_log("CARZINO: Found seller post {$seller_data['account_name']} for account $account_number");
                } else {
                    error_log("CARZINO: No seller post found for account $account_number");
                }
            }
            
            // Set defaults for missing data
            $seller_data['account_name'] = $seller_data['account_name'] ?: "Dealer Account #$account_number";
            $seller_data['business_name'] = $seller_data['business_name'] ?: $seller_data['account_name'];
            $seller_data['city'] = $seller_data['city'] ?: 'Seattle';
            $seller_data['state'] = $seller_data['state'] ?: 'WA';
            $seller_data['zip'] = $seller_data['zip'] ?: '98101';
            $seller_data['phone'] = $seller_data['phone'] ?: '(253) 555-0100';
            $seller_data['email'] = $seller_data['email'] ?: 'info@carzino.com';
            $seller_data['address'] = $seller_data['address'] ?: 'Contact for Address';
            
            // CRITICAL: Add seller_data field to the API response
            $response->data['seller_data'] = $seller_data;
            
            error_log("CARZINO: Added seller_data to product {$product_id} - {$seller_data['account_name']}");
        } else {
            error_log("CARZINO: No account number found for product {$product_id}");
        }
        
    } catch (Exception $e) {
        error_log('CARZINO ERROR: ' . $e->getMessage());
    }
    
    return $response;
}

// Log that the enhanced seller API was loaded
error_log('CARZINO ENHANCED SELLER API: Loaded successfully');
?>
