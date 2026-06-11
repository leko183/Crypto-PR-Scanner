const axios = require('axios');
const cheerio = require('cheerio');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function extractContactInfo(url) {
    try {
        const { data } = await axios.get(url, { 
            timeout: 8000,
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36'
            }
        });
        const $ = cheerio.load(data);
        const text = $('body').text();
        const telegramRegex = /(@[a-zA-Z0-9_]{5,32})|t\.me\/([a-zA-Z0-9_]{5,32})/g;
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const telegrams = [...text.matchAll(telegramRegex)].map(m => m[0]);
        const emails = [...text.matchAll(emailRegex)].map(m => m[0]);
        return { telegram: telegrams[0] || null, email: emails[0] || null };
    } catch (error) { return { telegram: null, email: null }; }
}

async function scrapeSource(source, pool) {
    console.log(`>>> [SCRAPER] Scanning: ${source.name}`);
    try {
        await pool.query('UPDATE sources SET status = $1, last_scanned = NOW(), last_error = NULL WHERE id = $2', ['SCANNING', source.id]);

        const { data } = await axios.get(source.url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            timeout: 25000
        });
        
        const $ = cheerio.load(data);
        const results = [];
        const items = $(source.item_selector);
        
        console.log(`>>> [SCRAPER] ${source.name} found ${items.length} potential items.`);

        for (let i = 0; i < Math.min(items.length, 5); i++) {
            const el = items[i];
            const title = $(el).find(source.title_selector).text().trim();
            const link = $(el).find(source.link_selector).attr('href');
            const date = $(el).find(source.date_selector).text().trim();

            if (title && link) {
                const fullLink = link.startsWith('http') ? link : 
                                 link.startsWith('//') ? `https:${link}` :
                                 `https://${source.name.replace('www.', '')}${link.startsWith('/') ? '' : '/'}${link}`;
                
                const contacts = await extractContactInfo(fullLink);
                results.push({
                    project: title.split(':')[0].trim().substring(0, 100),
                    type: 'Press Release',
                    category: 'Crypto',
                    date: date || new Date().toLocaleDateString(),
                    source: source.name,
                    link: fullLink,
                    contact: contacts.telegram || contacts.email || null,
                    status: 'Pending'
                });
                await sleep(1000); 
            }
        }

        await pool.query('UPDATE sources SET status = $1, last_error = $2 WHERE id = $3', ['DONE', `Found ${results.length} leads`, source.id]);
        return results;
    } catch (error) {
        console.error(`>>> [SCRAPER] ${source.name} error: ${error.message}`);
        await pool.query('UPDATE sources SET status = $1, last_error = $2 WHERE id = $3', ['ERROR', error.message, source.id]);
        return [];
    }
}

async function runAllScrapers(sources, pool) {
    let allLeads = [];
    // Sequential execution to avoid blocks
    for (const source of sources) {
        const leads = await scrapeSource(source, pool);
        allLeads = [...allLeads, ...leads];
        await sleep(3000); 
    }
    return allLeads;
}

module.exports = { runAllScrapers };
