const axios = require('axios');
const cheerio = require('cheerio');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function extractContactInfo(url) {
    try {
        const { data } = await axios.get(url, { 
            timeout: 5000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36' }
        });
        const $ = cheerio.load(data);
        const text = $('body').text();
        
        const telegramRegex = /(@[a-zA-Z0-9_]{5,32})|t\.me\/([a-zA-Z0-9_]{5,32})/g;
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        
        const telegrams = [...text.matchAll(telegramRegex)].map(m => m[0]);
        const emails = [...text.matchAll(emailRegex)].map(m => m[0]);
        
        return {
            telegram: telegrams.length > 0 ? telegrams[0] : null,
            email: emails.length > 0 ? emails[0] : null
        };
    } catch (error) {
        return { telegram: null, email: null };
    }
}

async function scrapeSource(source) {
    console.log(`[SCRAPER] Processing: ${source.name}`);
    try {
        const { data } = await axios.get(source.url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            },
            timeout: 20000
        });
        
        const $ = cheerio.load(data);
        const results = [];
        const items = $(source.item_selector || source.itemSelector);
        
        console.log(`[SCRAPER] ${source.name}: Found ${items.length} items.`);

        for (let i = 0; i < Math.min(items.length, 5); i++) {
            const el = items[i];
            const title = $(el).find(source.title_selector || source.titleSelector).text().trim();
            const link = $(el).find(source.link_selector || source.linkSelector).attr('href');
            const date = $(el).find(source.date_selector || source.dateSelector).text().trim();

            if (title && link) {
                const fullLink = link.startsWith('http') ? link : 
                                 link.startsWith('//') ? `https:${link}` :
                                 `https://${source.name.replace('www.', '')}${link.startsWith('/') ? '' : '/'}${link}`;
                
                // Trích xuất contact cho từng link (chạy tuần tự để tránh bị block)
                const contacts = await extractContactInfo(fullLink);
                
                results.push({
                    project: title.split(':')[0].trim(),
                    type: 'Press Release',
                    category: 'Crypto',
                    date: date || new Date().toLocaleDateString(),
                    source: source.name,
                    link: fullLink,
                    contact: contacts.telegram || contacts.email || null,
                    status: 'Pending'
                });
                await sleep(500); // Nghỉ ngắn giữa các bài viết
            }
        }

        return results;
    } catch (error) {
        console.error(`[SCRAPER] Error on ${source.name}: ${error.message}`);
        return [];
    }
}

async function runAllScrapers(sources) {
    console.log(`[SCRAPER] Starting scan for ${sources.length} sources...`);
    let allLeads = [];
    
    // Chạy tuần tự từng site để đảm bảo tính ổn định trên Railway
    for (const source of sources) {
        const leads = await scrapeSource(source);
        allLeads = [...allLeads, ...leads];
        await sleep(1000); // Nghỉ 1 giây giữa các website
    }
    
    console.log(`[SCRAPER] Completed. Total leads: ${allLeads.length}`);
    return allLeads;
}

module.exports = { runAllScrapers };
