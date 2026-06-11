const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const initDB = async () => {
  const client = await pool.connect();
  try {
    console.log(">>> [DB] Initializing Stealth Sources...");

    await client.query(`
      CREATE TABLE IF NOT EXISTS sources (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        url TEXT NOT NULL,
        item_selector TEXT NOT NULL,
        title_selector TEXT NOT NULL,
        link_selector TEXT NOT NULL,
        date_selector TEXT NOT NULL,
        status TEXT DEFAULT 'READY',
        last_error TEXT,
        last_scanned TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        project TEXT UNIQUE NOT NULL,
        type TEXT,
        category TEXT,
        date TEXT,
        contact TEXT,
        source TEXT,
        link TEXT,
        status TEXT DEFAULT 'Pending'
      );
    `);

    // Danh sách 15 Sources với URL đã cập nhật chuẩn 2026
    const sourcesData = [
        ['beincrypto.com', 'https://beincrypto.com/press-releases/', 'article', 'h3', 'a', 'time'],
        ['ambcrypto.com', 'https://ambcrypto.com/category/press-release/', '.post-item', 'h2', 'a', '.post-date'],
        ['crypto.news', 'https://crypto.news/news/press-releases/', 'article', 'h3', 'a', 'time'],
        ['bitcoin.com', 'https://news.bitcoin.com/press-releases/', '.td-block-span6', 'h3', 'a', 'time'],
        ['u.today', 'https://u.today/press-releases', '.news-item', '.news-item-title', 'a', 'time'],
        ['coingape.com', 'https://coingape.com/press-releases/', 'article', 'h3', 'a', 'time'],
        ['cryptopolitan.com', 'https://www.cryptopolitan.com/press-release/', 'article', 'h3', 'a', 'time'],
        ['newsbtc.com', 'https://www.newsbtc.com/press-releases/', 'article', 'h3', 'a', 'time'],
        ['bitcoinist.com', 'https://bitcoinist.com/category/press-releases/', 'article', 'h3', 'a', 'time'],
        ['coinpedia.org', 'https://coinpedia.org/press-release/', 'article', 'h2', 'a', 'time'],
        ['coindoo.com', 'https://coindoo.com/category/press-releases/', 'article', 'h2', 'a', 'time'],
        ['coinmarketcap.com', 'https://coinmarketcap.com/alexandria/categories/press-release', 'article', 'h2', 'a', 'time'],
        ['analyticsinsight.net', 'https://www.analyticsinsight.net/category/press-release/', 'article', 'h2', 'a', 'time'],
        ['captainaltcoin.com', 'https://captainaltcoin.com/category/press-releases/', 'article', 'h3', 'a', 'time'],
        ['coingabbar.com', 'https://www.coingabbar.com/en/crypto-news/category/press-release', '.card', 'h5', 'a', 'time']
    ];

    for (const s of sourcesData) {
        await client.query(`
            INSERT INTO sources (name, url, item_selector, title_selector, link_selector, date_selector)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (name) DO UPDATE SET 
                url = EXCLUDED.url, 
                item_selector = EXCLUDED.item_selector,
                status = 'READY'
        `, s);
    }
    
    await client.query(`
        INSERT INTO leads (project, type, category, date, contact, source, link, status) 
        VALUES ('STEALTH SYSTEM ACTIVE', 'Core', 'Security', 'Online', '@Admin', 'Railway', '#', 'Active')
        ON CONFLICT (project) DO UPDATE SET date = NOW()::text
    `);

    console.log(">>> [DB] Stealth Initialization Complete.");
  } catch (err) {
    console.error(">>> [DB] Init Error:", err);
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { pool, initDB };
