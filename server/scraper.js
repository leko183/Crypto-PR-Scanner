const axios = require('axios');
const cheerio = require('cheerio');

async function extractContactInfo(url) {
    try {
        const { data } = await axios.get(url, { 
            timeout: 5000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
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
    console.log(`Scraping ${source.name}...`);
    try {
        const { data } = await axios.get(source.url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 10000
        });
        const $ = cheerio.load(data);
        const results = [];

        $(source.itemSelector).each((i, el) => {
            if (i >= 5) return; 
            
            const title = $(el).find(source.titleSelector).text().trim();
            const link = $(el).find(source.linkSelector).attr('href');
            const date = $(el).find(source.dateSelector).text().trim();

            if (title && link) {
                const fullLink = link.startsWith('http') ? link : 
                                 link.startsWith('//') ? `https:${link}` :
                                 `https://${source.name.replace('www.', '')}${link.startsWith('/') ? '' : '/'}${link}`;
                
                results.push({
                    project: title.split(':')[0].trim(),
                    type: 'Press Release',
                    category: 'Crypto',
                    date: date || new Date().toLocaleDateString(),
                    source: source.name,
                    link: fullLink,
                    status: 'Pending'
                });
            }
        });

        // Enrich with contact info
        for (let i = 0; i < Math.min(results.length, 3); i++) {
            const contacts = await extractContactInfo(results[i].link);
            results[i].contact = contacts.telegram || contacts.email || null;
        }

        return results;
    } catch (error) {
        console.error(`Error scraping ${source.name}:`, error.message);
        return [];
    }
}

async function runAllScrapers(sources) {
    let allLeads = [];
    for (const source of sources) {
        const leads = await scrapeSource(source);
        allLeads = [...allLeads, ...leads];
    }
    return allLeads;
}

module.exports = { runAllScrapers };
