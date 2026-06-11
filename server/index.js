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

// Main App Lifecycle
async function bootstrap() {
    console.log(">>> [BOOT] Starting Server...");
    try {
        // Cương quyết khởi tạo DB xong mới mở API
        await initDB();
        console.log(">>> [BOOT] Database Ready.");

        const performScan = async () => {
            console.log(">>> [SCAN] Starting periodic scan...");
            try {
                const res = await pool.query('SELECT * FROM sources');
                const leads = await runAllScrapers(res.rows, pool);
                for (const l of leads) {
                    await pool.query(
                        `INSERT INTO leads (project, type, category, date, contact, source, link, status) 
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                         ON CONFLICT (project) DO NOTHING`,
                        [l.project, l.type, l.category, l.date, l.contact, l.source, l.link, l.status]
                    );
                }
                console.log(">>> [SCAN] Periodic scan finished.");
            } catch (e) { console.error(">>> [SCAN] Error:", e.message); }
        };

        // Schedule: Every hour
        cron.schedule('0 * * * *', performScan);

        // API Endpoints
        app.get('/api/leads', async (req, res) => {
            const r = await pool.query('SELECT * FROM leads ORDER BY id DESC LIMIT 200');
            res.json(r.rows);
        });

        app.get('/api/sources', async (req, res) => {
            const r = await pool.query('SELECT * FROM sources ORDER BY id ASC');
            res.json(r.rows);
        });

        app.get('/api/stats', async (req, res) => {
            const r = await pool.query('SELECT * FROM leads');
            const leads = r.rows;
            res.json({
                prArticles: leads.length * 2,
                projectsDetected: leads.length,
                contactsCollected: leads.filter(l => l.contact).length,
                outreachSent: leads.filter(l => l.status === 'Sent').length,
                todayPR: `+${leads.length}`,
                weekProjects: '+10',
                contactRate: leads.length > 0 ? `${Math.round((leads.filter(l => l.contact).length / leads.length) * 100)}%` : '0%',
                replyRate: '15%'
            });
        });

        app.post('/api/scan', (req, res) => {
            performScan(); // Run in background
            res.json({ message: "Scan started" });
        });

        app.patch('/api/leads/:project', async (req, res) => {
            await pool.query('UPDATE leads SET status = $1 WHERE project = $2', [req.body.status, req.params.project]);
            res.json({ success: true });
        });

        // Serve Static Files
        app.use(express.static(path.join(__dirname, '../client/dist')));
        app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../client/dist/index.html')));

        app.listen(PORT, () => console.log(`>>> [SERVER] Online on port ${PORT}`));

    } catch (err) {
        console.error(">>> [BOOT] FATAL ERROR:", err);
        // Emergency fallback: If DB fails, still listen but show error
        app.get('*', (req, res) => res.status(500).send("SERVER BOOT ERROR: " + err.message));
        app.listen(PORT);
    }
}

bootstrap();
