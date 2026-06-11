const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000, // Timeout sau 5s nếu ko kết nối đc
});

const initDB = async () => {
  let client;
  try {
    client = await pool.connect();
    console.log(">>> [DB] Database Connected Successfully");

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

    const sources = [
        ['beincrypto.com', 'https://beincrypto.com/press-releases/', 'article', 'h3 a', 'h3 a', 'time'],
        ['ambcrypto.com', 'https://ambcrypto.com/category/press-release/', '.post-item', '.post-title a', '.post-title a', '.post-date'],
        ['crypto.news', 'https://crypto.news/news/press-releases/', '.post-loop-info', 'h3 a', 'h3 a', '.post-loop-date'],
        ['bitcoin.com', 'https://news.bitcoin.com/category/press-release/', '.td-block-span6', '.entry-title a', '.entry-title a', 'time'],
        ['u.today', 'https://u.today/press-releases', '.news-item', '.news-item-title a', '.news-item-title a', '.news-item-date'],
        ['coingape.com', 'https://coingape.com/press-releases/', '.post-list', 'h3 a', 'h3 a', 'time'],
        ['cryptopolitan.com', 'https://www.cryptopolitan.com/press-release/', 'article', 'h3 a', 'h3 a', '.entry-date'],
        ['newsbtc.com', 'https://www.newsbtc.com/press-releases/', '.post-item', 'h3 a', 'h3 a', 'time'],
        ['bitcoinist.com', 'https://bitcoinist.com/category/press-releases/', '.post-item', 'h3 a', 'h3 a', 'time'],
        ['coinpedia.org', 'https://coinpedia.org/press-release/', 'article', 'h2 a', 'h2 a', '.post-date'],
        ['coindoo.com', 'https://coindoo.com/category/press-releases/', 'article', 'h2 a', 'h2 a', 'time'],
        ['coinmarketcap.com', 'https://coinmarketcap.com/alexandria/categories/press-release', 'article', 'h2', 'a', 'time'],
        ['analyticsinsight.net', 'https://www.analyticsinsight.net/category/press-release/', '.post-item', 'h2 a', 'h2 a', '.post-date'],
        ['captainaltcoin.com', 'https://captainaltcoin.com/category/press-releases/', 'article', 'h3 a', 'h3 a', 'time'],
        ['coingabbar.com', 'https://www.coingabbar.com/en/crypto-news/category/press-release', '.card', 'h5', 'a', '.date']
    ];

    for (const s of sources) {
        await client.query(`
            INSERT INTO sources (name, url, item_selector, title_selector, link_selector, date_selector)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (name) DO UPDATE SET 
                url = EXCLUDED.url, 
                item_selector = EXCLUDED.item_selector,
                title_selector = EXCLUDED.title_selector,
                link_selector = EXCLUDED.link_selector,
                date_selector = EXCLUDED.date_selector
        `, s);
    }
    console.log(">>> [DB] 15 Sources Synced");
    
    // Add heartbeat
    await client.query(`
        INSERT INTO leads (project, type, category, date, contact, source, link, status) 
        VALUES ('SYSTEM ACTIVE', 'Status', 'System', 'Online', '@Admin', 'Railway', '#', 'Active')
        ON CONFLICT (project) DO UPDATE SET date = 'Online ' || NOW()
    `);

  } catch (err) {
    console.error(">>> [DB] Connection Error:", err.message);
  } finally {
    if (client) client.release();
  }
};

module.exports = { pool, initDB };
