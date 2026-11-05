# IT Repair System — React + Express + MariaDB (Merged)

## โครงสร้าง
- `it-repair-system-front/` React + Vite UI เชื่อม API จริง
- `src/` Express API เดิม
- `database/schema_and_seed.sql` schema ที่ API ชุดนี้ต้องการ และ seed ประเภทอุปกรณ์
- `.env.example` ตัวอย่าง config Backend; `it-repair-system-front/.env.example` config Frontend

## สำคัญก่อนเริ่ม
คุณแจ้งว่ามีฐานข้อมูลอยู่แล้ว ดังนั้น **สำรองฐานข้อมูลก่อน Import SQL ทุกครั้ง**. SQL ใช้ `CREATE TABLE IF NOT EXISTS` และไม่ DROP ตาราง/ข้อมูลเดิม แต่จะไม่เพิ่มคอลัมน์ที่ขาดในตารางเดิมโดยอัตโนมัติ หากตารางมีอยู่แล้วให้รัน `database/verify_existing_db.sql` ตรวจโครงสร้างก่อน แล้วเทียบคอลัมน์กับ `schema_and_seed.sql`. อย่า Import schema แบบเดาสุ่มลงฐานข้อมูลที่มีข้อมูลสำคัญ

## 1) ตั้งค่า Backend
1. เปิด terminal ที่โฟลเดอร์โปรเจกต์หลัก (ที่มี `src/server.js`)
2. คัดลอก `.env.example` เป็น `.env` แล้วใส่ค่า DB ให้ตรงกับ MariaDB ที่ใช้อยู่
3. ติดตั้ง dependencies และเปิด API:

```bash
npm install
npm run dev
```

ควรเห็น `IT Repair API listening on http://localhost:3000`. ทดสอบ `http://localhost:3000/api/health` ควรตอบ `{"status":"ok","database":"connected"}`.

## 2) ตั้งค่า Frontend
เปิด Terminal ใหม่ใน `it-repair-system-front`:

```bash
npm install
```

คัดลอก `.env.example` เป็น `.env` แล้วรัน:

```bash
npm run dev
```

เปิด URL ที่ Vite แสดง (ปกติ `http://localhost:5173`). ถ้าเปลี่ยน port ต้องแก้ `CLIENT_ORIGIN` ใน Backend `.env` ให้ตรง

## 3) ฐานข้อมูล
- ถ้าฐานข้อมูลของคุณยังไม่มีตารางตาม API: เปิด phpMyAdmin → เลือก Import → เลือก `database/schema_and_seed.sql`.
- ถ้าตารางมีอยู่แล้ว: สำรอง DB, รัน `database/verify_existing_db.sql` ทีละคำสั่งในแท็บ SQL แล้วตรวจว่ามีคอลัมน์ตาม Schema หรือไม่. `CREATE TABLE IF NOT EXISTS` ไม่ได้แก้โครงสร้างตารางเก่าที่ไม่ตรงกัน
- SQL เพิ่มประเภทอุปกรณ์เริ่มต้น 9 ประเภทเท่านั้น และไม่สร้างบัญชี admin ที่มีรหัสผ่านตายตัว

## 4) สร้างบัญชี Admin
1. สมัครสมาชิกจากหน้า `/register`
2. ใน phpMyAdmin → SQL รันคำสั่งนี้โดยแทน email ด้วยอีเมลบัญชีของคุณ:

```sql
USE it_repair;
UPDATE users SET role='admin' WHERE email='your-email@example.com';
```

3. ออกจากระบบและเข้าสู่ระบบใหม่เพื่อให้ JWT มี Role ใหม่

## เชื่อมต่อที่แก้แล้ว
- Login ใช้อีเมล+รหัสผ่านจริง และเก็บ JWT ใน localStorage
- Register บันทึกผ่าน `/api/auth/register`; Role สมัครใหม่เป็น `user` เสมอ
- Repair form โหลด `/api/categories` และบันทึกผ่าน `/api/tickets`
- Repair list โหลด `/api/tickets` และผู้ดูแล/เจ้าหน้าที่เปลี่ยนสถานะผ่าน PATCH
- User management ใช้ `/api/users` (Admin เท่านั้น)
- Equipment management จัดการ `device_categories` ผ่าน `/api/categories` ไม่ใช่ทะเบียนครุภัณฑ์รายชิ้น

## หมายเหตุความปลอดภัย
- ห้ามส่งไฟล์ `.env` จริงให้ผู้อื่นหรือ Commit ลง Git
- เปลี่ยน `JWT_SECRET` เป็นค่าสุ่มยาวก่อนใช้งานจริง
- อย่าใช้ข้อมูลตัวอย่างในระบบจริง
