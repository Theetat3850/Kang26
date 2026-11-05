const mariadb = require('mariadb');

const pool = mariadb.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'it_repair',
  connectionLimit: 10,
  bigIntAsNumber: true,
  insertIdAsNumber: true,
  acquireTimeout: 10000
});

module.exports = pool;
