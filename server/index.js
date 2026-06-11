const express = require('express');
const path = require('path');
const cors = require('cors');
const cron = require('node-cron');
const { runAllScrapers } = require('./scraper');
const { pool, initDB } = require('./db');
require('dotenv').config();

console.log('>>> SERVER STARTING...');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Log requests
app.use((req, res, next) => {
    console.log(`[API] ${req.method} ${req.url}`);
    next();
});

// Initialize Database
initDB().then(() => {
    // Thêm 1 lead giả để test xem DB có hoạt động ko
    pool.query(`
        INSERT INTO leads (project, type, category, date, contact, source, link, status) 
        VALUES ('SYSTEM CHECK', 'Info', 'System', 'Now', 'Admin', 'Internal', '#', 'Active')
        ON CONFLICT (project) DO UPDATE SET date = EXCLUDED.date
    `);
});

const runAutomation = async () => {
  console.log('--- AUTO SCAN STARTING ---');
  try {
    const sourcesRes = await pool.query('SELECT * FROM sources');
    const sources = sourcesRes.rows;
    console.log(`[AUTO] Found ${sources.length} sources to scan.`);

    const newLeads = await runAllScrapers(sources);
    
    console.log(`[AUTO] Saving ${newLeads.length} leads to Database...`);
    for (const lead of newLeads) {
        await pool.query(
            `INSERT INTO leads (project, type, category, date, contact, source, link, status) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (project) DO NOTHING`,
            [lead.project, lead.type, lead.category, lead.date, lead.contact, lead.source, lead.link, lead.status]
        );
    }
    console.log(`--- AUTO SCAN FINISHED ---`);
  } catch (err) {
    console.error('[AUTO] Error:', err.message);
  }
};

cron.schedule('0 * * * *', () => runAutomation());

// Endpoints
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

app.get('/api/leads', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM leads ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sources', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sources ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/scan', async (req, res) => {
  try {
    runAutomation(); // Chạy ngầm
    res.json({ message: 'Scan started in background' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/leads/:project', async (req, res) => {
    const { project } = req.params;
    const { status } = req.body;
    try {
        await pool.query('UPDATE leads SET status = $1 WHERE project = $2', [status, project]);
        res.json({ message: 'Status updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`>>> SERVER RUNNING ON PORT ${PORT}`);
});
