const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate } = require('../middleware/auth');

const publicUser = u => ({
  id: u.id, first_name: u.first_name, last_name: u.last_name,
  phone: u.phone, email: u.email, address: u.address,
  birth_date: u.birth_date, gender: u.gender, role: u.role,
  status: u.status, created_at: u.created_at
});

router.post('/register', asyncHandler(async (req, res) => {
  const { first_name, last_name, phone, email, password, address, birth_date, gender } = req.body;
  if (![first_name, last_name, phone, email, password].every(v => typeof v === 'string' && v.trim())) {
    return res.status(400).json({ message: 'กรุณากรอกชื่อ นามสกุล เบอร์โทร อีเมล และรหัสผ่าน' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'รูปแบบอีเมลไม่ถูกต้อง' });
  if (password.length < 8) return res.status(400).json({ message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' });
  const existing = await db.query('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
  if (existing.length) return res.status(409).json({ message: 'อีเมลนี้ถูกใช้งานแล้ว' });

  // Public registration always creates a normal user. Admin/technician roles are assigned by an admin.
  const hash = await bcrypt.hash(password, 12);
  const result = await db.query(
    `INSERT INTO users (first_name,last_name,phone,email,address,birth_date,gender,password_hash,role)
     VALUES (?,?,?,?,?,?,?,?, 'user')`,
    [first_name.trim(), last_name.trim(), phone.trim(), email.trim().toLowerCase(),
     address || null, birth_date || null, gender || null, hash]
  );
  res.status(201).json({ message: 'สมัครสมาชิกสำเร็จ', user_id: result.insertId });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'กรุณากรอกอีเมลและรหัสผ่าน' });
  const rows = await db.query('SELECT * FROM users WHERE email = ? LIMIT 1', [String(email).trim().toLowerCase()]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
  }
  if (user.status !== 'active') return res.status(403).json({ message: 'บัญชีนี้ถูกระงับการใช้งาน' });
  const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
  res.json({ token, user: publicUser(user) });
}));

router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const rows = await db.query(
    'SELECT id,first_name,last_name,phone,email,address,birth_date,gender,role,status,created_at FROM users WHERE id=?',
    [req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ message: 'ไม่พบผู้ใช้งาน' });
  res.json({ user: rows[0] });
}));

module.exports = router;
