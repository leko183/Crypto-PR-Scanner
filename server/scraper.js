const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Cấu hình Agent HTTPS để giả lập trình duyệt xịn hơn, vượt qua Cloudflare cơ bản
const httpsAgent = new https.Agent({
  rejectUnauthorized: false, // Bỏ qua lỗi chứng chỉ SSL
  keepAlive: true
});

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'Cache-Control': 'max-age=0'
};

function cleanProjectName(title) {
    if (!title) return 'Unknown Project';
    let name = title.split(':')[0]
                    .split('|')[0]
                    .replace(/Press Release/gi, '')
                    .replace(/Sponsored/gi, '')
                    .replace(/Announces/gi, '')
                    .replace(/Launches/gi, '')
                    .replace(/Introduces/gi, '')
                    .trim();
    return name.substring(0, 80);
}

async function extractDeepData(url) {
    try {
        const { data } = await axios.get(url, { 
            timeout: 15000,
            headers: HEADERS,
            httpsAgent
        });
        const $ = cheerio.load(data);
        const bodyText = $('body').text();
        
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
            headers: HEADERS,
            httpsAgent,
            timeout: 30000
        });
        
        const $ = cheerio.load(data);
        const leads = [];
        let items = $(source.item_selector);
        
        if (items.length === 0) {
            console.log(`>>> [WARN] ${source.name}: Selectors failed, using Fallback method.`);
            items = $('article, .post, .entry').has('a');
        }

        for (let i = 0; i < Math.min(items.length, 5); i++) {
            const el = items[i];
            
            // Tìm title và link một cách linh hoạt
            const aTag = $(el).find(source.link_selector).length > 0 ? $(el).find(source.link_selector) : $(el).find('a').first();
            let title = $(el).find(source.title_selector).text().trim();
            if (!title || title.length < 5) title = aTag.text().trim();
            
            const link = aTag.attr('href');

            if (title && link && title.length > 10) {
                const fullLink = link.startsWith('http') ? link : 
                                 link.startsWith('//') ? `https:${link}` :
                                 `https://${source.name.replace('www.', '')}${link.startsWith('/') ? '' : '/'}${link}`;
                
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
                await sleep(2000); // Tránh rate limit
            }
        }

        const msg = leads.length > 0 ? `Success: ${leads.length} leads` : '0 leads found';
        await pool.query('UPDATE sources SET status = $1, last_error = $2 WHERE id = $3', ['DONE', msg, source.id]);
        return leads;
    } catch (error) {
        let errorMsg = error.message;
        if (error.response) {
            if (error.response.status === 403) errorMsg = "Blocked by Cloudflare/Firewall (403)";
            else errorMsg = `HTTP Error ${error.response.status}`;
        }
        console.error(`>>> [SCRAPER] Error ${source.name}: ${errorMsg}`);
        await pool.query('UPDATE sources SET status = $1, last_error = $2 WHERE id = $3', ['ERROR', errorMsg, source.id]);
        return [];
    }
}

async function runAllScrapers(sources, pool) {
    let allLeads = [];
    for (const source of sources) {
        const leads = await scrapeSource(source, pool);
        allLeads = [...allLeads, ...leads];
        await sleep(5000); // Nghỉ 5s giữa các site để server an toàn
    }
    return allLeads;
}

module.exports = { runAllScrapers };
