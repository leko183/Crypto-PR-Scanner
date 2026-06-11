const express = require('express');
const path = require('path');
const cors = require('cors');
const cron = require('node-cron');
const { runAllScrapers } = require('./scraper');
const { pool, initDB } = require('./db');
require('dotenv').config();

console.log('>>> [SERVER] BOOTING AT ' + new Date().toISOString());

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
initDB();

const runAutomation = async () => {
  console.log('>>> [AUTO] STARTING FULL SCAN...');
  try {
    const sourcesRes = await pool.query('SELECT * FROM sources');
    const sources = sourcesRes.rows;
    console.log(`[AUTO] Scanning ${sources.length} websites.`);

    const newLeads = await runAllScrapers(sources, pool);
    
    console.log(`[AUTO] Found ${newLeads.length} total leads. Saving...`);
    for (const lead of newLeads) {
        await pool.query(
            `INSERT INTO leads (project, type, category, date, contact, source, link, status) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (project) DO NOTHING`,
            [lead.project, lead.type, lead.category, lead.date, lead.contact, lead.source, lead.link, lead.status]
        );
    }
    console.log(`>>> [AUTO] SCAN COMPLETED.`);
  } catch (err) {
    console.error('[AUTO] Error:', err.message);
  }
};

cron.schedule('0 * * * *', () => runAutomation());

// ENDPOINTS
app.get('/api/health', (req, res) => res.json({ status: 'active', db: !!pool }));

app.get('/api/leads', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM leads ORDER BY id DESC LIMIT 150');
    res.json(result.rows);
  } catch (err) { res.json([]); }
});

app.get('/api/sources', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sources ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) { res.json([]); }
});

app.post('/api/scan', async (req, res) => {
  runAutomation(); 
  res.json({ message: 'Scan triggered' });
});

app.patch('/api/leads/:project', async (req, res) => {
    const { project } = req.params;
    const { status } = req.body;
    try {
        await pool.query('UPDATE leads SET status = $1 WHERE project = $2', [status, project]);
        res.json({ success: true });
    } catch (err) { res.status(500).end(); }
});

app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../client/dist/index.html')));

app.listen(PORT, () => console.log(`>>> [SERVER] LISTENING ON PORT ${PORT}`));
