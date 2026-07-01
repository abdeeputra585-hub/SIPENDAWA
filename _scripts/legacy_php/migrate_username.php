<?php
require_once __DIR__ . '/api/config.php';

// Check if username column exists
$result = $conn->query("SHOW COLUMNS FROM users LIKE 'username'");
if ($result->num_rows === 0) {
    // Add column
    $conn->query("ALTER TABLE users ADD COLUMN username VARCHAR(255) NULL AFTER email");
    
    // Copy email prefix to username
    $users = $conn->query("SELECT id, email FROM users");
    while ($user = $users->fetch_assoc()) {
        $prefix = explode('@', $user['email'])[0];
        // Ensure uniqueness for existing users
        $baseUsername = $prefix;
        $counter = 1;
        while (true) {
            $check = $conn->prepare("SELECT id FROM users WHERE username = ? AND id != ?");
            $check->bind_param("si", $prefix, $user['id']);
            $check->execute();
            if ($check->get_result()->num_rows === 0) {
                break;
            }
            $prefix = $baseUsername . $counter;
            $counter++;
        }
        
        $update = $conn->prepare("UPDATE users SET username = ? WHERE id = ?");
        $update->bind_param("si", $prefix, $user['id']);
        $update->execute();
    }
    
    // Make username UNIQUE NOT NULL
    $conn->query("ALTER TABLE users MODIFY COLUMN username VARCHAR(255) NOT NULL");
    $conn->query("ALTER TABLE users ADD UNIQUE INDEX (username)");
    
    echo "Migration successful: username column added.";
} else {
    echo "Migration already applied.";
}
?>
