const router = require('express').Router();
const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, allowRoles } = require('../middleware/auth');
router.use(authenticate, allowRoles('admin','technician'));

router.get('/summary', asyncHandler(async (req, res) => {
  const [ticketCounts, userCounts, categoryCounts, recent] = await Promise.all([
    db.query(`SELECT status,COUNT(*) AS count FROM repair_tickets GROUP BY status`),
    db.query(`SELECT COUNT(*) AS total, SUM(status='active') AS active, SUM(status='inactive') AS inactive FROM users`),
    db.query(`SELECT c.id,c.name,COUNT(t.id) AS count FROM device_categories c LEFT JOIN repair_tickets t ON t.category_id=c.id GROUP BY c.id,c.name ORDER BY count DESC`),
    db.query(`SELECT t.id,t.ticket_no,t.device_name,t.status,t.created_at,CONCAT(u.first_name,' ',u.last_name) AS requester_name,c.name AS category_name
      FROM repair_tickets t JOIN users u ON u.id=t.user_id JOIN device_categories c ON c.id=t.category_id ORDER BY t.created_at DESC LIMIT 5`)
  ]);
  const statuses = { pending:0, in_progress:0, completed:0 };
  ticketCounts.forEach(x => statuses[x.status] = x.count);
  res.json({ tickets: statuses, users: userCounts[0], categories: categoryCounts, recent_tickets: recent });
}));
module.exports = router;
