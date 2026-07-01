CREATE TABLE IF NOT EXISTS 
otifikasi (
  id int(11) NOT NULL AUTO_INCREMENT,
  user_id int(11) DEFAULT NULL,
  judul varchar(150) NOT NULL,
  pesan text NOT NULL,
  	ipe enum('info','success','warning','error') DEFAULT 'info',
  dibaca tinyint(1) DEFAULT 0,
  created_at timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (id),
  KEY k_notifikasi_user (user_id),
  CONSTRAINT k_notifikasi_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
