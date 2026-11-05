USE it_repair;
SHOW TABLES;
DESCRIBE users;
DESCRIBE device_categories;
DESCRIBE repair_tickets;
SELECT id,name FROM device_categories ORDER BY id;
SELECT id,first_name,last_name,email,role,status FROM users ORDER BY id;
