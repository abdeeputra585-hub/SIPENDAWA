<?php
/**
 * Configuration file for Guru Management Module
 */

return [
    'max_upload_size' => 2 * 1024 * 1024, // 2MB
    
    'allowed_mime_types' => [
        'image/jpeg', 
        'image/png'
    ],
    
    'allowed_extensions' => ['jpg', 'jpeg', 'png'],
    
    'upload_base_path' => __DIR__ . '/../uploads/guru/',
    
    'default_list_limit' => 20,
    
    'default_password_length' => 12
];
