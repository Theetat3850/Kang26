-- ใช้กับฐานข้อมูล it_repair ที่สร้างไว้แล้ว
-- เพิ่มเฉพาะประเภทอุปกรณ์ที่ยังไม่มี ไม่ลบหรือแก้ข้อมูลเดิม
USE it_repair;

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

-- ตรวจสอบข้อมูลประเภทอุปกรณ์
SELECT id, name, description FROM device_categories ORDER BY id;
