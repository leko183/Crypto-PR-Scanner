const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  console.error("CRITICAL ERROR: DATABASE_URL is not defined!");
  console.error("Please go to Railway Dashboard -> Webapp -> Settings -> Variables and ensure DATABASE_URL is present.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const initDB = async () => {
  try {
    const client = await pool.connect();
    console.log("Connected to PostgreSQL successfully");
    
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

    const res = await client.query('SELECT COUNT(*) FROM sources');
    if (parseInt(res.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO sources (name, url, item_selector, title_selector, link_selector, date_selector)
        VALUES 
        ('beincrypto.com', 'https://beincrypto.com/press-releases/', 'article', 'h3 a', 'h3 a', 'time'),
        ('ambcrypto.com', 'https://ambcrypto.com/category/press-release/', '.post-item', '.post-title a', '.post-title a', '.post-date')
      `);
    }
    console.log("Database tables initialized");
    client.release();
  } catch (err) {
    console.error("Database initialization failed:", err.message);
  }
};

module.exports = { pool, initDB };
