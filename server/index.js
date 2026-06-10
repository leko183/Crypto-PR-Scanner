const express = require('express');
const path = require('path');
const cors = require('cors');
const cron = require('node-cron');
const { runAllScrapers } = require('./scraper');
const { pool, initDB } = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize Postgres
initDB();

// Function to run the scanner (used by both API and Cron)
const runAutomation = async () => {
  console.log('--- AUTO SCAN STARTING ---');
  try {
    const sourcesRes = await pool.query('SELECT * FROM sources');
    const sources = sourcesRes.rows.map(s => ({
        name: s.name,
        url: s.url,
        itemSelector: s.item_selector,
        titleSelector: s.title_selector,
        linkSelector: s.link_selector,
        dateSelector: s.date_selector
    }));

    const newLeads = await runAllScrapers(sources);
    
    for (const lead of newLeads) {
        await pool.query(
            `INSERT INTO leads (project, type, category, date, contact, source, link, status) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (project) DO NOTHING`,
            [lead.project, lead.type, lead.category, lead.date, lead.contact, lead.source, lead.link, lead.status]
        );
    }
    console.log(`--- AUTO SCAN FINISHED: ${newLeads.length} leads processed ---`);
  } catch (err) {
    console.error('Auto scan error:', err.message);
  }
};

// Schedule: Chạy mỗi 1 tiếng (vào phút thứ 00 của mỗi giờ)
cron.schedule('0 * * * *', () => {
    runAutomation();
});

// API Endpoints
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

app.post('/api/sources', async (req, res) => {
  const { name, url, itemSelector, titleSelector, linkSelector, dateSelector } = req.body;
  try {
    await pool.query(
      'INSERT INTO sources (name, url, item_selector, title_selector, link_selector, date_selector) VALUES ($1, $2, $3, $4, $5, $6)',
      [name, url, itemSelector, titleSelector, linkSelector, dateSelector]
    );
    const result = await pool.query('SELECT * FROM sources ORDER BY id ASC');
    res.json({ message: 'Source added', sources: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const leadsRes = await pool.query('SELECT * FROM leads');
    const leads = leadsRes.rows;
    const contacts = leads.filter(l => l.contact).length;
    
    res.json({
      prArticles: leads.length * 3, 
      projectsDetected: leads.length,
      contactsCollected: contacts,
      outreachSent: leads.filter(l => l.status === 'Sent').length,
      todayPR: `+${leads.length}`,
      weekProjects: '+12',
      contactRate: leads.length > 0 ? `${Math.round((contacts / leads.length) * 100)}%` : '0%',
      replyRate: '15%'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/scan', async (req, res) => {
  try {
    await runAutomation();
    res.json({ message: 'Scan complete' });
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

// Serve static files from React app
app.use(express.static(path.join(__dirname, '../client/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
