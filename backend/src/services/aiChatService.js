const axios = require('axios');

/**
 * AI Astrologer Consultation Service
 * Supports OpenAI (sk-proj-..., sk-...) and OpenRouter (sk-or-...)
 * With smart, context-aware Vedic Astrology fallback engine
 */

const AI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY || '';
const AI_MODEL = process.env.AI_MODEL || (AI_API_KEY.startsWith('sk-or-') ? 'meta-llama/llama-3.2-3b-instruct:free' : 'gpt-4o-mini');

/**
 * Generate AI Astrologer Response
 * @param {Object} options
 * @param {string} options.expertName - Name of the astrologer/expert
 * @param {string} options.specialties - Expert specialties (e.g. Vedic, Tarot, Kundali)
 * @param {string} options.customerName - Name of the customer
 * @param {string} options.currentMessage - Latest customer question/message
 * @param {Array}  options.history - Previous messages in conversation [{role, content}]
 * @returns {Promise<string>}
 */
async function generateAstrologyReply({ expertName, specialties, customerName, currentMessage, history = [] }) {
    const cleanKey = (process.env.AI_API_KEY || process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY || '').trim();

    // 1. Try Live API (OpenAI or OpenRouter) if key is configured
    if (cleanKey && cleanKey !== 'placeholder_key') {
        try {
            const isRouter = cleanKey.startsWith('sk-or-');
            const apiUrl = isRouter
                ? 'https://openrouter.ai/api/v1/chat/completions'
                : 'https://api.openai.com/v1/chat/completions';

            const systemPrompt = `You are ${expertName || 'Acharya Ji'}, a deeply respected, highly accurate, and empathetic Vedic Astrologer and Spiritual Psychic Guide.
Your specialties include: ${specialties || 'Vedic Astrology, Kundali Milan, Career & Wealth Guidance, Love & Relationship Remedies, Gemstone Advice'}.
You are currently in a real-time, 1-on-1 sacred consultation chat with your client named ${customerName || 'Ji'}.

Guidelines:
1. Warm & Spiritual Persona: Greet with respect ("Namaste 🙏", "Om Shanti", "Blessings to you").
2. Language Matching: Reply in the same language as the user (Hindi, Hinglish, or English).
3. Astrological Guidance: Connect their problem to planetary influences (e.g. Jupiter/Guru for wisdom & fortune, Venus/Shukra for love & marriage, Saturn/Shani for career & patience, Mars/Mangal for courage & vitality, Rahu/Ketu for sudden shifts).
4. Vedic Remedies (Upay): Suggest simple, positive, authentic remedies (e.g. lighting a ghee diya, chanting Gayatri or Maha Mrityunjaya mantra, feeding birds/cows, fasting or wearing specific colors on designated days).
5. Birth Details: If they ask for deep predictions and haven't given Date of Birth, Birth Time, and Birth City yet, kindly ask for them so you can analyze their Lagna chart.
6. Chat Length: Keep your response concise (2 to 4 sentences maximum) so it looks like a genuine, rapid real-time chat message.`;

            const messagesPayload = [
                { role: 'system', content: systemPrompt }
            ];

            // Add recent chat history (up to last 6 messages)
            const recentHistory = history.slice(-6);
            recentHistory.forEach(msg => {
                messagesPayload.push({
                    role: msg.senderRole === 'CUSTOMER' ? 'user' : 'assistant',
                    content: msg.content
                });
            });

            // Add current message
            messagesPayload.push({
                role: 'user',
                content: currentMessage
            });

            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${cleanKey}`
            };

            if (isRouter) {
                headers['HTTP-Referer'] = 'http://localhost:3000';
                headers['X-Title'] = 'Astrology Consultation Platform';
            }

            const modelToUse = isRouter
                ? (process.env.AI_MODEL || 'meta-llama/llama-3.2-3b-instruct:free')
                : (process.env.AI_MODEL || 'gpt-4o-mini');

            const response = await axios.post(apiUrl, {
                model: modelToUse,
                messages: messagesPayload,
                max_tokens: 300,
                temperature: 0.7
            }, {
                headers,
                timeout: 12000
            });

            const reply = response.data?.choices?.[0]?.message?.content;
            if (reply && reply.trim()) {
                return reply.trim();
            }
        } catch (apiErr) {
            const errDetail = apiErr.response?.data?.error?.message || apiErr.message;
            console.warn('[AI Astrologer Service] External API call note:', errDetail);
            console.log('[AI Astrologer Service] Falling back to intelligent built-in Vedic Astrology Engine.');
        }
    }

    // 2. Intelligent Built-in Vedic Astrology Fallback Engine
    return generateFallbackAstrologyResponse({
        expertName,
        specialties,
        customerName,
        currentMessage
    });
}

/**
 * Context-aware Vedic Astrologer response generator
 */
function generateFallbackAstrologyResponse({ expertName, customerName, currentMessage = '' }) {
    const text = currentMessage.toLowerCase();
    const name = customerName || 'Ji';
    const astrologer = expertName || 'Acharya';

    // 1. Greetings / Introduction
    if (/^(hi|hello|hey|namaste|pranam|ram ram|radhe|jai shree krishna|sat sri akal|good morning|good evening)/i.test(text.trim())) {
        const greetings = [
            `Namaste ${name} 🙏! Main ${astrologer} aapka hardik swagat karta hoon. Kripya apni Janma Tithi (Date of birth), Janma Samay (Time), aur Janma Sthan (Place) share karein, ya batayein aaj kis vishay par guidance lena chahte hain?`,
            `Pranam ${name} ji 🙏! Maa Bhagwati aur Grah Devta aap par kripa karein. Kripya apne sawal aur kundali details (DOB, Time, City) batayein, taaki hum grah dasha ka vishleshan shuru kar sakein.`
        ];
        return greetings[Math.floor(Math.random() * greetings.length)];
    }

    // 2. Birth details shared (Date, Time, Place, Kundali)
    if (/\b(dob|birth|born|janm|samay|time|am|pm|\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b/i.test(text)) {
        return `Dhanyawad ${name} ji 🙏. Aapki janma patrika ka vishleshan karne par pata chal raha hai ki aapki lagna kundali me Guru (Jupiter) aur Shukra (Venus) ka prabhav mahatvapurna hai. Kripya apna mukhya prashna (Career, Shadi, ya Swasthya) batayein, taaki hum uchit grah dasha aur sateek upay nikal sakein.`;
    }

    // 3. Love, Marriage & Relationships
    if (/\b(love|marriage|shadi|vivah|divorce|breakup|relation|husband|wife|partner|prem|pyar|boyfriend|girlfriend)\b/i.test(text)) {
        const replies = [
            `${name} ji, aapki kundali ke 7th house (vivah sthan) me Shukra aur Brihaspati ki sthiti dekhni hogi. Current transit me thoda patience rakhna zaroori hai. Upay ke taur par har Shukrawar ko kisi mandir me safed mithai ya kheer ka daan karein aur 'Om Shukraya Namah' ka jaap karein. Baat banne ke shubh sanket dikh rahe hain 🙏.`,
            `Prem aur vivah ke drishtikon se aapke rishte me Mangal (Mars) ya Rahu ka prabhav thodi anban paida kar sakta hai. Daily subah Suryadev ko arghya dein aur Shukra Beej Mantra ka dhyan karein. Kripya partner ki bhi birth details share karein toh Gun Milan aur sateek samay bata sakoon.`
        ];
        return replies[Math.floor(Math.random() * replies.length)];
    }

    // 4. Career, Job, Business & Studies
    if (/\b(job|career|business|naukri|promotion|salary|work|exam|interview|paise|money|dhan|karz|debt|loss|profit)\b/i.test(text)) {
        const replies = [
            `Career aur dhan sthan (10th & 11th house) ka vishleshan karne par Shani Dev aur Guru ka dasha-antar chal raha hai. Aane wale 3 se 6 mahino me sthiti sudharne ke yog hain. Har Shanivar ko peepal ke ped ke paas sarson ke tel ka diya jalayein aur pakshiyon ko bajra khilayein, ruka hua dhan aur nayi opportunities zaroor aayengi 🙏.`,
            `${name} ji, vyapar aur naukri me safalta ke liye Surya grah ko balwan karna zaroori hai. Subah jaldi uthkar 'Om Suryaya Namah' 108 baar bole kripya. Jaldi hi ek achhi khabar ya promotion ke asar dikh rahe hain.`
        ];
        return replies[Math.floor(Math.random() * replies.length)];
    }

    // 5. Health, Tension, Depression & Negative Energy
    if (/\b(health|bimar|bimari|swasthya|tension|depression|stress|chinta|dar|nazar|bura|negative|neend)\b/i.test(text)) {
        return `${name} ji, Chandra (Moon) grah ke prabhav se mann me ashanti aur chinta badh sakti hai. Har Somwar ko Shivling par kacha doodh aur jal arpit karein, aur 'Om Namah Shivaya' ka jaap karein. Isse mansik shanti aur rogo se mukti milegi. Sab shubh hoga 🙏.`;
    }

    // 6. Planetary Doshas & Remedies (Manglik, Sade Sati, Rahu, Ketu, Upay)
    if (/\b(upay|remedy|totka|manglik|shani|sade sati|rahu|ketu|kaal sarp|grahan|dosh)\b/i.test(text)) {
        return `Grah dosh nivaran ke liye sabse pehle Hanuman Chalisa ka niyamit path karna param labhkari hai. Sath hi kisi zarooratmand ko til ya kaale chane ka daan karein. Ishwar ki kripa se sabhi kasht door honge aur sakaratmak urja ka sanchar hoga 🙏.`;
    }

    // 7. Generic thoughtful response
    return `${name} ji, maine aapke prashna par dhyan diya hai 🙏. Grah sthiti batati hai ki samay parivartansheel hai aur aane wale samay me graho ki chal aapke paksh me mudegi. Kripya thoda aur vistar se batayein taaki main aur gehrai se aapki kundali ka sateek nishkarsh nikaal sakoon.`;
}

module.exports = {
    generateAstrologyReply,
    generateFallbackAstrologyResponse
};
