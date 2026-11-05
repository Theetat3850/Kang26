const router = require('express').Router();
const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, allowRoles } = require('../middleware/auth');
router.use(authenticate);

router.post('/', asyncHandler(async (req, res) => {
  const { category_id, device_name, brand_model, problem_description, location } = req.body;
  if (!category_id || !device_name || !problem_description || !location) return res.status(400).json({ message: 'กรุณากรอกประเภทอุปกรณ์ ชื่ออุปกรณ์ อาการเสีย และสถานที่ให้ครบ' });
  const ticketNo = `REP-${Date.now()}-${Math.floor(Math.random()*900+100)}`;
  const result = await db.query(
    `INSERT INTO repair_tickets (ticket_no,user_id,category_id,device_name,brand_model,problem_description,location)
     VALUES (?,?,?,?,?,?,?)`,
    [ticketNo,req.user.id,Number(category_id),String(device_name).trim(),brand_model || null,String(problem_description).trim(),String(location).trim()]);
  res.status(201).json({ message: 'ส่งคำแจ้งซ่อมสำเร็จ', id: result.insertId, ticket_no: ticketNo });
}));

router.get('/', asyncHandler(async (req, res) => {
  const { q = '', status = '', page = '1', limit = '10' } = req.query;
  const p = Math.max(1, parseInt(page,10) || 1), l = Math.min(100,Math.max(1,parseInt(limit,10)||10));
  const where = [], params = [];
  if (req.user.role === 'user') { where.push('t.user_id=?'); params.push(req.user.id); }
  if (status && ['pending','in_progress','completed'].includes(status)) { where.push('t.status=?'); params.push(status); }
  if (q) { where.push('(t.ticket_no LIKE ? OR t.device_name LIKE ? OR t.problem_description LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)'); params.push(...Array(5).fill(`%${q}%`)); }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const count = await db.query(`SELECT COUNT(*) AS total FROM repair_tickets t JOIN users u ON u.id=t.user_id JOIN device_categories c ON c.id=t.category_id ${clause}`, params);
  const rows = await db.query(
    `SELECT t.id,t.ticket_no,t.user_id,t.category_id,t.device_name,t.brand_model,t.problem_description,t.location,t.status,t.assigned_to,t.created_at,t.updated_at,
      CONCAT(u.first_name,' ',u.last_name) AS requester_name,u.phone,u.email,c.name AS category_name,
      CONCAT(a.first_name,' ',a.last_name) AS technician_name
     FROM repair_tickets t JOIN users u ON u.id=t.user_id JOIN device_categories c ON c.id=t.category_id
     LEFT JOIN users a ON a.id=t.assigned_to ${clause}
     ORDER BY t.created_at DESC LIMIT ? OFFSET ?`, [...params,l,(p-1)*l]);
  res.json({ data: rows, pagination: { page:p, limit:l, total:count[0].total, pages:Math.ceil(count[0].total/l) } });
}));

router.patch('/:id/status', allowRoles('admin','technician'), asyncHandler(async (req, res) => {
  const { status, assigned_to } = req.body;
  if (!['pending','in_progress','completed'].includes(status)) return res.status(400).json({ message: 'สถานะไม่ถูกต้อง' });
  const values = [status];
  let sql = 'UPDATE repair_tickets SET status=?';
  if (assigned_to !== undefined) { sql += ', assigned_to=?'; values.push(assigned_to === null ? null : Number(assigned_to)); }
  sql += ' WHERE id=?'; values.push(Number(req.params.id));
  const r = await db.query(sql, values);
  if (!r.affectedRows) return res.status(404).json({ message: 'ไม่พบรายการแจ้งซ่อม' });
  res.json({ message: 'อัปเดตสถานะสำเร็จ' });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const rows = await db.query(
    `SELECT t.*, CONCAT(u.first_name,' ',u.last_name) AS requester_name,u.phone,u.email,c.name AS category_name
     FROM repair_tickets t JOIN users u ON u.id=t.user_id JOIN device_categories c ON c.id=t.category_id WHERE t.id=?`,
    [Number(req.params.id)]);
  if (!rows[0]) return res.status(404).json({ message: 'ไม่พบรายการแจ้งซ่อม' });
  if (req.user.role === 'user' && rows[0].user_id !== req.user.id) return res.status(403).json({ message: 'ไม่มีสิทธิ์ดูรายการนี้' });
  res.json({ data: rows[0] });
}));
module.exports = router;
