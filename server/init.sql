-- Erlbrew Café Database Schema
-- Run this script to initialize the MySQL database.
-- Usage: mysql -h 192.168.75.101 -u root -p < server/init.sql

CREATE DATABASE IF NOT EXISTS erlbrew
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE erlbrew;

CREATE TABLE IF NOT EXISTS gallery_photos (
  slot INT UNSIGNED NOT NULL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) DEFAULT NULL,
  mime_type VARCHAR(50) DEFAULT NULL,
  file_size INT UNSIGNED DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS business_hours (
  id INT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
  day_label VARCHAR(100) NOT NULL,
  hours_text VARCHAR(100) NOT NULL DEFAULT '',
  is_highlighted TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO business_hours (id, day_label, hours_text, is_highlighted, sort_order) VALUES
(1, 'Monday – Friday', '7:00 AM – 8:00 PM', 0, 1),
(2, 'Saturday',       '7:00 AM – 9:00 PM', 0, 2),
(3, 'Sunday',         '8:00 AM – 7:00 PM', 0, 3),
(4, 'Holidays',       'Check our socials',  1, 4);

CREATE TABLE IF NOT EXISTS about_photo (
  id INT UNSIGNED NOT NULL PRIMARY KEY DEFAULT 1,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) DEFAULT NULL,
  mime_type VARCHAR(50) DEFAULT NULL,
  file_size INT UNSIGNED DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_users (
  id INT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS menu_categories (
  id INT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
  cat VARCHAR(100) NOT NULL,
  ja VARCHAR(100) NOT NULL DEFAULT '',
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS menu_items (
  id INT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
  category_id INT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL,
  price INT UNSIGNED NOT NULL DEFAULT 0,
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seasonal items table (for temporary / limited-time menu entries)
CREATE TABLE IF NOT EXISTS seasonal_items (
  id INT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
  menu_item_id INT UNSIGNED NOT NULL,
  season_name VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  tags VARCHAR(255) DEFAULT '', -- comma-separated tags like 'pumpkin,iced,vegan'
  description TEXT DEFAULT NULL,
  image_filename VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (menu_item_id),
  INDEX (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create a dedicated user with full DML + CREATE for auto-setup (change password in production)
CREATE USER IF NOT EXISTS 'erlbrew'@'%' IDENTIFIED BY 'erlbrew_prod_2026';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE ON erlbrew.* TO 'erlbrew'@'%';
FLUSH PRIVILEGES;

-- ── Seed: create a Seasonal category, a sample seasonal menu item, and a seasonal_items row (idempotent)
INSERT INTO menu_categories (cat, ja, sort_order)
SELECT 'Seasonal', '季節', 99 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM menu_categories WHERE cat = 'Seasonal');

INSERT INTO menu_items (category_id, name, price, sort_order)
SELECT (SELECT id FROM menu_categories WHERE cat='Seasonal' LIMIT 1), 'Matcha Strawberry Latte (Seasonal)', 159, 1
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Matcha Strawberry Latte (Seasonal)');

INSERT INTO seasonal_items (menu_item_id, season_name, start_date, end_date, tags, description, image_filename)
SELECT mi.id, 'Matcha Season', '2026-08-01', '2026-09-30', 'matcha,iced,seasonal', 'Limited-time matcha strawberry latte — bright, creamy, and iced.', NULL
FROM menu_items mi
JOIN menu_categories mc ON mc.id = mi.category_id
WHERE mc.cat='Seasonal' AND mi.name='Matcha Strawberry Latte (Seasonal)'
  AND NOT EXISTS (SELECT 1 FROM seasonal_items si WHERE si.menu_item_id = mi.id AND si.season_name='Matcha Season');
