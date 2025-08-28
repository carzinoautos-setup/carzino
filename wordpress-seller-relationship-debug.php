<?php
/**
 * Carzino - Debug Seller Relationship Issue
 * This will help us understand why products can't find their seller accounts
 */

// Add debug endpoint to check seller relationships
add_action('rest_api_init', function() {
    register_rest_route('carzino/v1', '/debug-relationships', array(
        'methods' => 'GET',
        'callback' => 'carzino_debug_relationships',
        'permission_callback' => '__return_true'
    ));
});

function carzino_debug_relationships($request) {
    global $wpdb;
    
    $debug_info = array();
    
    // 1. Check all seller account posts
    $seller_accounts = $wpdb->get_results("
        SELECT ID, post_title, post_status, post_type 
        FROM {$wpdb->posts} 
        WHERE post_type IN ('seller-accounts', 'sellers_account', 'seller_account', 'seller')
        AND post_status = 'publish'
        ORDER BY ID DESC
        LIMIT 10
    ");
    
    $debug_info['seller_accounts_found'] = count($seller_accounts);
    $debug_info['seller_accounts'] = $seller_accounts;
    
    // 2. Look for seller account with title "73"
    $seller_73_by_title = $wpdb->get_results("
        SELECT ID, post_title, post_status, post_type 
        FROM {$wpdb->posts} 
        WHERE post_type IN ('seller-accounts', 'sellers_account', 'seller_account', 'seller')
        AND post_title = '73'
        AND post_status = 'publish'
    ");
    
    $debug_info['seller_73_by_title'] = $seller_73_by_title;
    
    // 3. Look for seller account with meta field account_number_seller = "73"
    $seller_73_by_meta = $wpdb->get_results("
        SELECT p.ID, p.post_title, p.post_status, p.post_type, pm.meta_value
        FROM {$wpdb->posts} p
        JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id
        WHERE p.post_type IN ('seller-accounts', 'sellers_account', 'seller_account', 'seller')
        AND pm.meta_key = 'account_number_seller'
        AND pm.meta_value = '73'
        AND p.post_status = 'publish'
    ");
    
    $debug_info['seller_73_by_meta'] = $seller_73_by_meta;
    
    // 4. Get a sample product and its seller relationship
    $sample_product = $wpdb->get_row("
        SELECT p.ID, p.post_title 
        FROM {$wpdb->posts} p
        JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id
        WHERE p.post_type = 'product'
        AND pm.meta_key = 'account_number_seller'
        AND pm.meta_value = '73'
        AND p.post_status = 'publish'
        LIMIT 1
    ");
    
    if ($sample_product) {
        $debug_info['sample_product'] = $sample_product;
        
        // Get all meta for this product related to sellers
        $product_seller_meta = $wpdb->get_results($wpdb->prepare("
            SELECT meta_key, meta_value 
            FROM {$wpdb->postmeta} 
            WHERE post_id = %d 
            AND (meta_key LIKE '%seller%' OR meta_key LIKE '%account%')
        ", $sample_product->ID));
        
        $debug_info['sample_product_seller_meta'] = $product_seller_meta;
    }
    
    // 5. Check what seller post types exist in your database
    $post_types = $wpdb->get_results("
        SELECT DISTINCT post_type, COUNT(*) as count
        FROM {$wpdb->posts} 
        WHERE post_type LIKE '%seller%' OR post_type LIKE '%account%'
        GROUP BY post_type
    ");
    
    $debug_info['seller_related_post_types'] = $post_types;
    
    // 6. Check if account 73 exists with different field names
    $account_variations = $wpdb->get_results("
        SELECT p.ID, p.post_title, pm.meta_key, pm.meta_value
        FROM {$wpdb->posts} p
        JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id
        WHERE p.post_type IN ('seller-accounts', 'sellers_account', 'seller_account', 'seller')
        AND (
            pm.meta_key LIKE '%account%' OR 
            pm.meta_key LIKE '%number%' OR
            pm.meta_key LIKE '%id%'
        )
        AND pm.meta_value = '73'
        AND p.post_status = 'publish'
    ");
    
    $debug_info['account_73_variations'] = $account_variations;
    
    return rest_ensure_response($debug_info);
}

// Log that the debug file was loaded
error_log('CARZINO: Seller relationship debug loaded successfully');
?>
