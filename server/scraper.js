const axios = require('axios');
const cheerio = require('cheerio');

async function extractContactInfo(url) {
    try {
        const { data } = await axios.get(url, { 
            timeout: 5000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
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
    console.log(`[DEBUG] Starting scrape for: ${source.name} (${source.url})`);
    try {
        const { data } = await axios.get(source.url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            },
            timeout: 15000
        });
        
        const $ = cheerio.load(data);
        const results = [];
        const items = $(source.item_selector || source.itemSelector);
        
        console.log(`[DEBUG] Found ${items.length} items on ${source.name} using selector ${source.item_selector || source.itemSelector}`);

        items.each((i, el) => {
            if (i >= 5) return; 
            
            const title = $(el).find(source.title_selector || source.titleSelector).text().trim();
            const link = $(el).find(source.link_selector || source.linkSelector).attr('href');
            const date = $(el).find(source.date_selector || source.dateSelector).text().trim();

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

        // Enrich with contact info in parallel
        const enriched = await Promise.all(results.map(async (lead) => {
            const contacts = await extractContactInfo(lead.link);
            return { ...lead, contact: contacts.telegram || contacts.email || null };
        }));

        console.log(`[DEBUG] Scrape success for ${source.name}: ${enriched.length} leads found`);
        return enriched;
    } catch (error) {
        console.error(`[DEBUG] Scrape Error [${source.name}]: ${error.message}`);
        return [];
    }
}

async function runAllScrapers(sources) {
    console.log(`[DEBUG] runAllScrapers called with ${sources.length} sources`);
    const tasks = sources.map(source => scrapeSource(source));
    const results = await Promise.allSettled(tasks);
    
    let allLeads = [];
    results.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
            allLeads = [...allLeads, ...result.value];
        } else {
            console.error(`[DEBUG] Task for ${sources[idx].name} rejected:`, result.reason);
        }
    });
    
    console.log(`[DEBUG] Total leads found across all sources: ${allLeads.length}`);
    return allLeads;
}

module.exports = { runAllScrapers };
