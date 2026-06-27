<?php
/**
 * Configuration file for the Real-time Chat System
 */

return [
    // Maximum file size for attachments (in bytes) - default 5MB
    'max_upload_size' => 5 * 1024 * 1024,
    
    // Allowed MIME types for attachments
    'allowed_mime_types' => [
        'image/jpeg', 
        'image/png', 
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    
    // Allowed file extensions
    'allowed_extensions' => ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'xls', 'xlsx'],
    
    // Upload directory path (relative to the project root)
    'upload_base_path' => __DIR__ . '/../uploads/pesan/',
    
    // Pagination settings
    'default_history_limit' => 50,
    'max_history_limit' => 100,
    'default_list_limit' => 20
];
