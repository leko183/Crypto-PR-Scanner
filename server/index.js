const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const { runAllScrapers } = require('./scraper');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const DB_PATH = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json());

// Initialize DB
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({ leads: [], lastScan: null }, null, 2));
}

function getDB() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function saveDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// API Endpoints
app.get('/api/leads', (req, res) => {
  const db = getDB();
  res.json(db.leads);
});

app.get('/api/sources', (req, res) => {
  const db = getDB();
  res.json(db.sources || []);
});

app.post('/api/sources', (req, res) => {
    const db = getDB();
    const newSource = req.body;
    if (!db.sources) db.sources = [];
    db.sources.push({ ...newSource, status: 'READY' });
    saveDB(db);
    res.json({ message: 'Source added', sources: db.sources });
});

app.get('/api/stats', (req, res) => {
  const db = getDB();
  const leads = db.leads || [];
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
});

app.post('/api/scan', async (req, res) => {
  try {
    const db = getDB();
    const newLeads = await runAllScrapers(db.sources || []);
    
    // Simple deduplication based on project name
    const existingProjects = new Set(db.leads.map(l => l.project));
    const uniqueNewLeads = newLeads.filter(l => !existingProjects.has(l.project));
    
    db.leads = [...uniqueNewLeads, ...db.leads];
    db.lastScan = new Date().toISOString();
    saveDB(db);
    
    res.json({ message: 'Scan complete', newLeadsCount: uniqueNewLeads.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update lead status
app.patch('/api/leads/:project', (req, res) => {
    const { project } = req.params;
    const { status } = req.body;
    const db = getDB();
    const index = db.leads.findIndex(l => l.project === project);
    if (index !== -1) {
        db.leads[index].status = status;
        saveDB(db);
        res.json(db.leads[index]);
    } else {
        res.status(404).json({ message: 'Lead not found' });
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
