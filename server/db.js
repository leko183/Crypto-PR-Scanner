const { Pool } = require('pg');
require('dotenv').config();

// Railway cung cấp biến DATABASE_URL tự động
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const initDB = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS sources (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE,
        url TEXT,
        item_selector TEXT,
        title_selector TEXT,
        link_selector TEXT,
        date_selector TEXT,
        status TEXT DEFAULT 'READY'
      );

      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        project TEXT UNIQUE,
        type TEXT,
        category TEXT,
        date TEXT,
        contact TEXT,
        source TEXT,
        link TEXT,
        status TEXT DEFAULT 'Pending'
      );
    `);

    // Chèn dữ liệu mẫu nếu bảng sources trống
    const res = await client.query('SELECT COUNT(*) FROM sources');
    if (parseInt(res.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO sources (name, url, item_selector, title_selector, link_selector, date_selector)
        VALUES 
        ('beincrypto.com', 'https://beincrypto.com/press-releases/', 'article', 'h3 a', 'h3 a', 'time'),
        ('ambcrypto.com', 'https://ambcrypto.com/category/press-release/', '.post-item', '.post-title a', '.post-title a', '.post-date')
      `);
    }
    console.log("Database initialized successfully");
  } catch (err) {
    console.error("Error initializing database", err);
  } finally {
    client.release();
  }
};

module.exports = { pool, initDB };
