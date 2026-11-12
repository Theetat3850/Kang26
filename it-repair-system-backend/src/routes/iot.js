
const router = require('express').Router();
const crypto = require('crypto');
const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, allowRoles } = require('../middleware/auth');

// Compare API keys without a normal string comparison.
function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;

  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  return aBuffer.length === bBuffer.length &&
    crypto.timingSafeEqual(aBuffer, bBuffer);
}

// POST /api/iot/telemetry
// Used by Node-RED only.
router.post('/telemetry', asyncHandler(async (req, res) => {
  const apiKey = process.env.IOT_API_KEY;

  if (!apiKey || !safeCompare(req.headers['x-iot-api-key'], apiKey)) {
    return res.status(401).json({ message: 'Invalid API key' });
  }

  const {
    device_id,
    sensor,
    temperature,
    pressure,
    altitude,
    wifi_rssi
  } = req.body;

  if (
    typeof device_id !== 'string' ||
    !device_id.trim() ||
    device_id.length > 100
  ) {
    return res.status(400).json({ message: 'Invalid device_id' });
  }

  if (sensor !== 'BMP280') {
    return res.status(400).json({ message: 'Unsupported sensor' });
  }

  const values = { temperature, pressure, altitude, wifi_rssi };

  for (const [key, value] of Object.entries(values)) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return res.status(400).json({ message: `Invalid ${key}` });
    }
  }

  if (
    temperature < -40 || temperature > 85 ||
    pressure < 300 || pressure > 1100 ||
    altitude < -1000 || altitude > 10000 ||
    !Number.isInteger(wifi_rssi) || wifi_rssi < -120 || wifi_rssi > 0
  ) {
    return res.status(400).json({ message: 'Sensor value out of range' });
  }

  const devices = await db.query(
    'SELECT device_id FROM iot_devices WHERE device_id = ? LIMIT 1',
    [device_id.trim()]
  );

  if (devices.length === 0) {
    return res.status(404).json({ message: 'Device not registered' });
  }

  await db.query(
    `INSERT INTO iot_sensor_readings
      (device_id, temperature, pressure, altitude, wifi_rssi)
     VALUES (?, ?, ?, ?, ?)`,
    [
      device_id.trim(),
      temperature,
      pressure,
      altitude,
      wifi_rssi
    ]
  );

  await db.query(
    `UPDATE iot_devices
     SET status = 'online', last_seen = CURRENT_TIMESTAMP
     WHERE device_id = ?`,
    [device_id.trim()]
  );

  res.status(201).json({
    message: 'Telemetry saved',
    device_id: device_id.trim()
  });
}));

// All read endpoints require a logged-in admin or technician.
router.use(authenticate, allowRoles('admin', 'technician'));

// GET /api/iot/devices
router.get('/devices', asyncHandler(async (req, res) => {
  const devices = await db.query(
    `SELECT
       id, device_id, device_name, sensor_type,
       CASE
         WHEN last_seen IS NOT NULL
          AND last_seen >= CURRENT_TIMESTAMP - INTERVAL 30 SECOND
         THEN 'online'
         ELSE 'offline'
       END AS status,
       last_seen, created_at
     FROM iot_devices
     ORDER BY device_name`
  );

  res.json(devices);
}));

// GET /api/iot/latest
router.get('/latest', asyncHandler(async (req, res) => {
  const readings = await db.query(
    `SELECT
       d.device_id,
       d.device_name,
       d.sensor_type,
       r.temperature,
       r.pressure,
       r.altitude,
       r.wifi_rssi,
       r.recorded_at
     FROM iot_devices d
     LEFT JOIN iot_sensor_readings r
       ON r.id = (
         SELECT r2.id
         FROM iot_sensor_readings r2
         WHERE r2.device_id = d.device_id
         ORDER BY r2.recorded_at DESC, r2.id DESC
         LIMIT 1
       )
     ORDER BY d.device_name`
  );

  res.json(readings);
}));

// GET /api/iot/history?device_id=esp32-bmp280-01&limit=100
router.get('/history', asyncHandler(async (req, res) => {
  const deviceId = req.query.device_id;
  const limit = Math.min(
    Math.max(Number.parseInt(req.query.limit, 10) || 100, 1),
    1000
  );

  if (typeof deviceId !== 'string' || !deviceId.trim()) {
    return res.status(400).json({ message: 'device_id is required' });
  }

  const readings = await db.query(
    `SELECT
       device_id, temperature, pressure,
       altitude, wifi_rssi, recorded_at
     FROM iot_sensor_readings
     WHERE device_id = ?
     ORDER BY recorded_at DESC, id DESC
     LIMIT ?`,
    [deviceId.trim(), limit]
  );

  res.json(readings);
}));

module.exports = router;
