const router = require('express').Router();
const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, allowRoles } = require('../middleware/auth');

router.get('/', asyncHandler(async (req, res) => {
  const rows = await db.query('SELECT c.*, (SELECT COUNT(*) FROM repair_tickets t WHERE t.category_id=c.id) AS ticket_count FROM device_categories c ORDER BY c.name');
  res.json({ data: rows });
}));
router.post('/', authenticate, allowRoles('admin'), asyncHandler(async (req, res) => {
  const { name, description = null, image_url = null } = req.body;
  if (!name || !String(name).trim()) return res.status(400).json({ message: 'กรุณาระบุชื่อประเภทอุปกรณ์' });
  const r = await db.query('INSERT INTO device_categories (name,description,image_url) VALUES (?,?,?)', [String(name).trim(),description,image_url]);
  res.status(201).json({ message: 'เพิ่มประเภทอุปกรณ์สำเร็จ', id: r.insertId });
}));
router.patch('/:id', authenticate, allowRoles('admin'), asyncHandler(async (req, res) => {
  const fields = ['name','description','image_url'], sets = [], values = [];
  for (const f of fields) if (req.body[f] !== undefined) { sets.push(`${f}=?`); values.push(req.body[f]); }
  if (!sets.length) return res.status(400).json({ message: 'ไม่มีข้อมูลสำหรับแก้ไข' });
  values.push(Number(req.params.id));
  const r = await db.query(`UPDATE device_categories SET ${sets.join(',')} WHERE id=?`, values);
  if (!r.affectedRows) return res.status(404).json({ message: 'ไม่พบประเภทอุปกรณ์' });
  res.json({ message: 'แก้ไขประเภทอุปกรณ์สำเร็จ' });
}));
router.delete('/:id', authenticate, allowRoles('admin'), asyncHandler(async (req, res) => {
  try {
    const r = await db.query('DELETE FROM device_categories WHERE id=?', [Number(req.params.id)]);
    if (!r.affectedRows) return res.status(404).json({ message: 'ไม่พบประเภทอุปกรณ์' });
    res.json({ message: 'ลบประเภทอุปกรณ์สำเร็จ' });
  } catch (e) {
    if (e.code === 'ER_ROW_IS_REFERENCED_2') return res.status(409).json({ message: 'ประเภทนี้มีรายการแจ้งซ่อมอยู่ ไม่สามารถลบได้' });
    throw e;
  }
}));
module.exports = router;
