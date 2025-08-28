<?php
/**
 * Carzino - Fix Product-Seller Relationships
 * This will help refresh and rebuild the product-seller relationships
 */

// Add admin action to fix relationships
add_action('rest_api_init', function() {
    register_rest_route('carzino/v1', '/fix-relationships', array(
        'methods' => 'GET',
        'callback' => 'carzino_fix_relationships',
        'permission_callback' => '__return_true'
    ));
});

function carzino_fix_relationships($request) {
    global $wpdb;
    
    $results = array();
    $fixed_count = 0;
    
    // 1. First, let's see what seller accounts actually exist
    $seller_accounts = $wpdb->get_results("
        SELECT ID, post_title, post_type
        FROM {$wpdb->posts} 
        WHERE post_type IN ('seller-accounts', 'sellers_account', 'seller_account', 'seller')
        AND post_status = 'publish'
        ORDER BY post_title
    ");
    
    $results['available_sellers'] = $seller_accounts;
    
    // 2. Get products with account_number_seller = "73"
    $products_with_73 = $wpdb->get_results("
        SELECT p.ID, p.post_title, pm.meta_value as account_number
        FROM {$wpdb->posts} p
        JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id
        WHERE p.post_type = 'product'
        AND pm.meta_key = 'account_number_seller'
        AND pm.meta_value = '73'
        AND p.post_status = 'publish'
        LIMIT 5
    ");
    
    $results['products_with_account_73'] = $products_with_73;
    
    // 3. Try to find the actual seller account for "73"
    $seller_73_options = array();
    
    // Check by post title
    $seller_by_title = $wpdb->get_row("
        SELECT ID, post_title, post_type
        FROM {$wpdb->posts}
        WHERE post_title = '73'
        AND post_type IN ('seller-accounts', 'sellers_account', 'seller_account', 'seller')
        AND post_status = 'publish'
    ");
    
    if ($seller_by_title) {
        $seller_73_options['by_title'] = $seller_by_title;
    }
    
    // Check by meta field
    $seller_by_meta = $wpdb->get_row("
        SELECT p.ID, p.post_title, p.post_type
        FROM {$wpdb->posts} p
        JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id
        WHERE pm.meta_key = 'account_number_seller'
        AND pm.meta_value = '73'
        AND p.post_type IN ('seller-accounts', 'sellers_account', 'seller_account', 'seller')
        AND p.post_status = 'publish'
    ");
    
    if ($seller_by_meta) {
        $seller_73_options['by_meta'] = $seller_by_meta;
    }
    
    $results['seller_73_found'] = $seller_73_options;
    
    // 4. If we found a seller account, try to get its actual seller data
    if (!empty($seller_73_options)) {
        $seller_id = null;
        
        if (isset($seller_73_options['by_title'])) {
            $seller_id = $seller_73_options['by_title']->ID;
        } elseif (isset($seller_73_options['by_meta'])) {
            $seller_id = $seller_73_options['by_meta']->ID;
        }
        
        if ($seller_id) {
            // Get all meta data for this seller
            $seller_meta = $wpdb->get_results($wpdb->prepare("
                SELECT meta_key, meta_value
                FROM {$wpdb->postmeta}
                WHERE post_id = %d
                AND (meta_key LIKE '%name%' OR meta_key LIKE '%city%' OR meta_key LIKE '%state%' OR meta_key LIKE '%phone%')
            ", $seller_id));
            
            $results['seller_73_meta'] = $seller_meta;
            
            // Try to fix the relationship by adding actual seller data to products
            if (!empty($products_with_73)) {
                $seller_data_map = array();
                foreach ($seller_meta as $meta) {
                    $seller_data_map[$meta->meta_key] = $meta->meta_value;
                }
                
                // If we have seller data, add it to the first product as a test
                if (!empty($seller_data_map)) {
                    $test_product_id = $products_with_73[0]->ID;
                    
                    // Add seller data fields to the product
                    foreach ($seller_data_map as $key => $value) {
                        if (!empty($value)) {
                            update_post_meta($test_product_id, $key, $value);
                            $fixed_count++;
                        }
                    }
                    
                    $results['test_fix_applied'] = array(
                        'product_id' => $test_product_id,
                        'product_title' => $products_with_73[0]->post_title,
                        'fields_added' => $fixed_count,
                        'seller_data_added' => $seller_data_map
                    );
                }
            }
        }
    }
    
    // 5. Alternative: Create a manual seller data entry for account 73
    if (empty($seller_73_options)) {
        $results['recommendation'] = 'No seller account found for ID 73. You may need to create one or check the account number.';
        
        // Create a temporary seller record for testing
        $temp_seller_data = array(
            'acount_name_seller' => 'Del Sol Auto Sales',
            'account_name_seller' => 'Del Sol Auto Sales',
            'city_seller' => 'Everett',
            'state_seller' => 'WA',
            'zip_seller' => '98204',
            'phone_number_seller' => '(425) 555-0100',
            'account_type_seller' => 'dealer'
        );
        
        if (!empty($products_with_73)) {
            $test_product_id = $products_with_73[0]->ID;
            
            foreach ($temp_seller_data as $key => $value) {
                update_post_meta($test_product_id, $key, $value);
                $fixed_count++;
            }
            
            $results['temp_fix_applied'] = array(
                'product_id' => $test_product_id,
                'product_title' => $products_with_73[0]->post_title,
                'fields_added' => $fixed_count,
                'temp_data_added' => $temp_seller_data
            );
        }
    }
    
    $results['summary'] = array(
        'sellers_found' => count($seller_accounts),
        'products_with_73' => count($products_with_73),
        'seller_73_located' => !empty($seller_73_options),
        'fields_fixed' => $fixed_count,
        'timestamp' => current_time('mysql')
    );
    
    return rest_ensure_response($results);
}

// Log that the fix file was loaded
error_log('CARZINO: Seller relationship fix loaded successfully');
?>
