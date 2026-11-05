const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, allowRoles } = require('../middleware/auth');

router.use(authenticate, allowRoles('admin'));

router.get('/', asyncHandler(async (req, res) => {
  const { q = '', role = '', status = '', page = '1', limit = '10' } = req.query;
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const where = [], params = [];
  if (q) { where.push('(first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?)'); params.push(...Array(4).fill(`%${q}%`)); }
  if (role && ['admin','technician','user'].includes(role)) { where.push('role=?'); params.push(role); }
  if (status && ['active','inactive'].includes(status)) { where.push('status=?'); params.push(status); }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const count = await db.query(`SELECT COUNT(*) AS total FROM users ${clause}`, params);
  const rows = await db.query(
    `SELECT id,first_name,last_name,phone,email,address,birth_date,gender,role,status,created_at
     FROM users ${clause} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, l, (p - 1) * l]);
  res.json({ data: rows, pagination: { page: p, limit: l, total: count[0].total, pages: Math.ceil(count[0].total / l) } });
}));

router.post('/', asyncHandler(async (req, res) => {
  const { first_name, last_name, phone, email, password, role = 'user', status = 'active' } = req.body;
  if (![first_name,last_name,phone,email,password].every(v => typeof v === 'string' && v.trim())) return res.status(400).json({ message: 'กรอกข้อมูลที่จำเป็นให้ครบ' });
  if (!['admin','technician','user'].includes(role) || !['active','inactive'].includes(status)) return res.status(400).json({ message: 'role/status ไม่ถูกต้อง' });
  if (password.length < 8) return res.status(400).json({ message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' });
  const hash = await bcrypt.hash(password, 12);
  const result = await db.query(
    'INSERT INTO users (first_name,last_name,phone,email,password_hash,role,status) VALUES (?,?,?,?,?,?,?)',
    [first_name.trim(),last_name.trim(),phone.trim(),email.trim().toLowerCase(),hash,role,status]);
  res.status(201).json({ message: 'เพิ่มผู้ใช้งานสำเร็จ', id: result.insertId });
}));

router.patch('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const allowed = ['first_name','last_name','phone','email','address','birth_date','gender','role','status'];
  const sets = [], values = [];
  for (const key of allowed) if (req.body[key] !== undefined) { sets.push(`${key}=?`); values.push(req.body[key]); }
  if (req.body.password) {
    if (req.body.password.length < 8) return res.status(400).json({ message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' });
    sets.push('password_hash=?'); values.push(await bcrypt.hash(req.body.password, 12));
  }
  if (!sets.length) return res.status(400).json({ message: 'ไม่มีข้อมูลสำหรับแก้ไข' });
  if (req.body.role && !['admin','technician','user'].includes(req.body.role)) return res.status(400).json({ message: 'role ไม่ถูกต้อง' });
  if (req.body.status && !['active','inactive'].includes(req.body.status)) return res.status(400).json({ message: 'status ไม่ถูกต้อง' });
  values.push(id);
  const result = await db.query(`UPDATE users SET ${sets.join(',')} WHERE id=?`, values);
  if (!result.affectedRows) return res.status(404).json({ message: 'ไม่พบผู้ใช้งาน' });
  res.json({ message: 'แก้ไขผู้ใช้งานสำเร็จ' });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  if (Number(req.params.id) === req.user.id) return res.status(400).json({ message: 'ไม่สามารถลบบัญชีตัวเองได้' });
  try {
    const result = await db.query('DELETE FROM users WHERE id=?', [Number(req.params.id)]);
    if (!result.affectedRows) return res.status(404).json({ message: 'ไม่พบผู้ใช้งาน' });
    res.json({ message: 'ลบผู้ใช้งานสำเร็จ' });
  } catch (e) {
    if (e.code === 'ER_ROW_IS_REFERENCED_2') return res.status(409).json({ message: 'ไม่สามารถลบผู้ใช้งานที่มีประวัติแจ้งซ่อมได้ ให้เปลี่ยนสถานะเป็น inactive แทน' });
    throw e;
  }
}));

module.exports = router;
