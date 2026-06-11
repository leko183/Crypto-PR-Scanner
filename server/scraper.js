const axios = require('axios');
const cheerio = require('cheerio');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36'
];

// Hàm làm sạch tên dự án
function cleanProjectName(title) {
    if (!title) return 'Unknown Project';
    // Loại bỏ các từ khóa PR phổ biến
    let name = title.split(':')[0] // Lấy phần trước dấu hai chấm
                    .split('|')[0] // Lấy phần trước dấu gạch đứng
                    .replace(/Press Release/gi, '')
                    .replace(/Sponsored/gi, '')
                    .replace(/Announces/gi, '')
                    .replace(/Launches/gi, '')
                    .trim();
    return name.substring(0, 50);
}

async function extractDeepData(url) {
    try {
        const { data } = await axios.get(url, { 
            timeout: 10000,
            headers: { 'User-Agent': USER_AGENTS[0] }
        });
        const $ = cheerio.load(data);
        const bodyText = $('body').text();
        
        // Regex tìm contact
        const tgMatch = bodyText.match(/(@[a-zA-Z0-9_]{5,32})|t\.me\/([a-zA-Z0-9_]{5,32})/);
        const emailMatch = bodyText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        
        return {
            telegram: tgMatch ? tgMatch[0] : null,
            email: emailMatch ? emailMatch[0] : null
        };
    } catch (error) { return { telegram: null, email: null }; }
}

async function scrapeSource(source, pool) {
    console.log(`>>> [SCRAPER] Scanning: ${source.name}`);
    try {
        await pool.query('UPDATE sources SET status = $1, last_scanned = NOW(), last_error = NULL WHERE id = $2', ['SCANNING', source.id]);

        const { data } = await axios.get(source.url, {
            headers: {
                'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            },
            timeout: 20000
        });
        
        const $ = cheerio.load(data);
        const leads = [];
        const items = $(source.item_selector);
        
        console.log(`>>> [SCRAPER] ${source.name} found ${items.length} articles.`);

        for (let i = 0; i < Math.min(items.length, 5); i++) {
            const el = items[i];
            const title = $(el).find(source.title_selector).text().trim();
            const link = $(el).find(source.link_selector).attr('href');

            if (title && link && title.length > 10) {
                const fullLink = link.startsWith('http') ? link : 
                                 link.startsWith('//') ? `https:${link}` :
                                 `https://${source.name.replace('www.', '')}${link.startsWith('/') ? '' : '/'}${link}`;
                
                // Thu thập contact sâu
                const contactData = await extractDeepData(fullLink);
                
                leads.push({
                    project: cleanProjectName(title),
                    type: 'Press Release',
                    category: 'Crypto',
                    date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
                    source: source.name,
                    link: fullLink,
                    contact: contactData.telegram || contactData.email || null,
                    status: 'Pending'
                });
                await sleep(1000); 
            }
        }

        await pool.query('UPDATE sources SET status = $1, last_error = $2 WHERE id = $3', ['DONE', `Success: ${leads.length} leads`, source.id]);
        return leads;
    } catch (error) {
        console.error(`>>> [SCRAPER] Error ${source.name}: ${error.message}`);
        await pool.query('UPDATE sources SET status = $1, last_error = $2 WHERE id = $3', ['ERROR', error.message, source.id]);
        return [];
    }
}

async function runAllScrapers(sources, pool) {
    let allLeads = [];
    for (const source of sources) {
        const leads = await scrapeSource(source, pool);
        allLeads = [...allLeads, ...leads];
        await sleep(3000); 
    }
    return allLeads;
}

module.exports = { runAllScrapers };
