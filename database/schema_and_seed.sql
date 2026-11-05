-- IT Repair schema compatible with the included Express API
-- Existing database: it_repair. This script does NOT DROP tables or existing data.
CREATE DATABASE IF NOT EXISTS it_repair CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE it_repair;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  address TEXT NULL,
  birth_date DATE NULL,
  gender ENUM('male','female','other') NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','technician','user') NOT NULL DEFAULT 'user',
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role_status (role,status),
  INDEX idx_users_name (last_name,first_name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS device_categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  description TEXT NULL,
  image_url VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS repair_tickets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  ticket_no VARCHAR(40) NOT NULL UNIQUE,
  user_id BIGINT UNSIGNED NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  device_name VARCHAR(180) NOT NULL,
  brand_model VARCHAR(180) NULL,
  problem_description TEXT NOT NULL,
  location VARCHAR(255) NOT NULL,
  status ENUM('pending','in_progress','completed') NOT NULL DEFAULT 'pending',
  assigned_to BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tickets_status_created (status,created_at),
  INDEX idx_tickets_user (user_id),
  INDEX idx_tickets_category (category_id),
  CONSTRAINT fk_tickets_user FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE,
  CONSTRAINT fk_tickets_category FOREIGN KEY (category_id) REFERENCES device_categories(id) ON UPDATE CASCADE,
  CONSTRAINT fk_tickets_technician FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Seed categories only when they do not already exist.
INSERT INTO device_categories (name, description, image_url)
SELECT 'คอมพิวเตอร์', 'คอมพิวเตอร์ตั้งโต๊ะและโน้ตบุ๊ก', NULL
WHERE NOT EXISTS (SELECT 1 FROM device_categories WHERE name='คอมพิวเตอร์');
INSERT INTO device_categories (name, description, image_url)
SELECT 'เครื่องพิมพ์', 'เครื่องพิมพ์และอุปกรณ์สแกน', NULL
WHERE NOT EXISTS (SELECT 1 FROM device_categories WHERE name='เครื่องพิมพ์');
INSERT INTO device_categories (name, description, image_url)
SELECT 'จอภาพ', 'จอภาพและอุปกรณ์แสดงผล', NULL
WHERE NOT EXISTS (SELECT 1 FROM device_categories WHERE name='จอภาพ');
INSERT INTO device_categories (name, description, image_url)
SELECT 'เครือข่าย / อินเทอร์เน็ต', 'เราเตอร์ สวิตช์ และอุปกรณ์เครือข่าย', NULL
WHERE NOT EXISTS (SELECT 1 FROM device_categories WHERE name='เครือข่าย / อินเทอร์เน็ต');
INSERT INTO device_categories (name, description, image_url)
SELECT 'อุปกรณ์เสริม', 'คีย์บอร์ด เมาส์ และอุปกรณ์เสริม', NULL
WHERE NOT EXISTS (SELECT 1 FROM device_categories WHERE name='อุปกรณ์เสริม');
INSERT INTO device_categories (name, description, image_url)
SELECT 'โปรเจคเตอร์', 'อุปกรณ์ฉายภาพ', NULL
WHERE NOT EXISTS (SELECT 1 FROM device_categories WHERE name='โปรเจคเตอร์');
INSERT INTO device_categories (name, description, image_url)
SELECT 'เครื่องสำรองไฟ (UPS)', 'อุปกรณ์สำรองไฟฟ้า', NULL
WHERE NOT EXISTS (SELECT 1 FROM device_categories WHERE name='เครื่องสำรองไฟ (UPS)');
INSERT INTO device_categories (name, description, image_url)
SELECT 'โทรศัพท์สำนักงาน', 'โทรศัพท์ IP Phone และโทรศัพท์สำนักงาน', NULL
WHERE NOT EXISTS (SELECT 1 FROM device_categories WHERE name='โทรศัพท์สำนักงาน');
INSERT INTO device_categories (name, description, image_url)
SELECT 'อื่น ๆ', 'อุปกรณ์ IT ประเภทอื่น', NULL
WHERE NOT EXISTS (SELECT 1 FROM device_categories WHERE name='อื่น ๆ');
