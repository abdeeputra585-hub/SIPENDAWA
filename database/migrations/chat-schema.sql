-- /database/migrations/chat-schema.sql

CREATE TABLE IF NOT EXISTS messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_sender INT NOT NULL,
    id_recipient INT NOT NULL,
    isi_pesan TEXT NOT NULL,
    attachment VARCHAR(255) NULL,
    attachment_type VARCHAR(50) NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    dibaca BOOLEAN DEFAULT FALSE,
    dibaca_at DATETIME NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at DATETIME NULL,
    
    FOREIGN KEY (id_sender) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (id_recipient) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_sender (id_sender),
    INDEX idx_recipient (id_recipient),
    INDEX idx_conversation (id_sender, id_recipient, timestamp),
    INDEX idx_timestamp (timestamp)
);

CREATE TABLE IF NOT EXISTS conversations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_wali INT NOT NULL,
    id_guru INT NOT NULL,
    last_message_id INT NULL,
    last_message_preview VARCHAR(100) NULL,
    last_message_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (id_wali) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (id_guru) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (last_message_id) REFERENCES messages(id) ON DELETE SET NULL,
    
    UNIQUE KEY unique_conversation (id_wali, id_guru),
    INDEX idx_wali (id_wali),
    INDEX idx_guru (id_guru)
);
