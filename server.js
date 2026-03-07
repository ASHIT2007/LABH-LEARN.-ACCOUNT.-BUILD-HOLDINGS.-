// ─────────────────────────────────────────────────────────
// server.js — Labh "Vibe Engine" Backend
// Express server with Google Gemini AI integration
// ─────────────────────────────────────────────────────────

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Groq from 'groq-sdk';
import mongoose from 'mongoose';

// Import Models
import User from './models/User.js';
import Trade from './models/Trade.js';
import InterlockRule from './models/InterlockRule.js';
import { executeTrade, formatUserForFrontend as formatUserFromController } from './controllers/tradeController.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───
app.use(cors());
app.use(express.json());

// ─── Initialize MongoDB ───
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/labh';
mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB (Vibe Engine v2 active)'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// ─── Initialize Groq ───
const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY) {
    console.warn('\n⚠️  GROQ_API_KEY is not set in .env — AI routes will return errors.\n   Paste your key in the .env file and restart the server.\n');
}

const ai = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null;



// ─── System Prompt (The Vibe Engine Brain) ───
function buildSystemPrompt(stockContext, portfolioContext, userLevel) {
    return `You are Labh Sathi, a friendly and expert stock market assistant for Indian markets (NSE and BSE). You can answer ANY question the user asks — whether it is about stocks, trading, investing, market concepts, personal finance, or even general topics. You are warm, conversational, and helpful.

IMPORTANT LANGUAGE RULE: Detect the language the user writes in and ALWAYS respond in that EXACT same language. If Hindi → respond in Hindi. If Hinglish → respond in Hinglish. If English → respond in English. If Tamil, Telugu, Marathi, Bengali, Kannada, Gujarati, or any other language → respond in that language.

GREETING BEHAVIOR: When someone says Hi, Hello, Hey, Namaste, or any greeting, greet them warmly, introduce yourself briefly as Labh Sathi, mention you can help with stock analysis, trading concepts, portfolio advice, or any question they have, and ask how you can help.

RESPONSE FORMAT RULES:
1. If the user asks about buying, selling, holding, or trading a specific stock, respond with a JSON block wrapped in \`\`\`json ... \`\`\` containing:
   { "action": "BUY" or "SELL" or "HOLD", "ticker": "SYMBOL", "quantity": suggested_number, "reasoning": "clear explanation" }
   ALSO include a human-readable explanation OUTSIDE the JSON block.
2. For all other questions (greetings, concepts, analysis, general chat), respond naturally in plain text without JSON.

Current context:
- Selected stock: ${stockContext || 'None selected'}
- User portfolio: ${portfolioContext || 'Empty (no holdings)'}
- User level: ${userLevel || 'Beginner'}
- Date: ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

Knowledge: You have deep expertise in Indian stocks, Nifty 50, Sensex, FII/DII activity, SEBI rules, RBI policy, technical analysis (RSI, MACD, Bollinger Bands, candlesticks), fundamental analysis (PE ratio, EPS, ROE), options/futures, mutual funds, SIP.

Rules:
- ${userLevel === 'Advanced' ? 'Use technical terminology freely. Provide quantitative analysis.' : userLevel === 'Intermediate' ? 'Balance technical terms with explanations.' : 'Use simple, jargon-free language. Explain concepts like the user is new to trading.'}
- Always use ₹ (Rupee symbol) for prices.
- Always end every response with this disclaimer on a new line:
⚠️ This is AI-generated analysis for educational purposes only and is not SEBI-registered financial advice.`;
}

// ─── POST /api/vibe-trade ───
app.post('/api/vibe-trade', async (req, res) => {
    try {


        // 1. Validate OpenAI is configured
        if (!ai) {
            return res.status(500).json({
                error: 'GROQ_API_KEY is not configured. Add it to your .env file and restart the server.'
            });
        }

        // 2. Extract request body
        const {
            prompt,
            conversationHistory = [],
            stockContext = '',
            portfolioContext = '',
            userLevel = 'Beginner'
        } = req.body;

        if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
            return res.status(400).json({ error: 'A non-empty "prompt" field is required.' });
        }

        // 3. Build the system prompt with dynamic context
        const systemPrompt = buildSystemPrompt(stockContext, portfolioContext, userLevel);

        // 4. Build the conversation contents for OpenAI
        const messages = [
            { role: 'system', content: systemPrompt }
        ];
        for (const msg of conversationHistory) {
            messages.push({ role: msg.role === 'user' ? 'user' : 'assistant', content: msg.text });
        }
        // Add the current user message
        messages.push({ role: 'user', content: prompt });

        // 5. Call Groq API
        const response = await ai.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages,
            max_tokens: 1000,
        });

        const replyText = response.choices[0].message.content;

        // 6. Try to extract structured trade data if present
        let tradeData = null;
        const jsonMatch = replyText.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[1]);
                if (parsed.action && parsed.ticker) {
                    tradeData = {
                        action: parsed.action.toUpperCase(),
                        ticker: parsed.ticker.toUpperCase(),
                        quantity: parsed.quantity || 1,
                        reasoning: parsed.reasoning || ''
                    };
                }
            } catch (parseErr) {
                // JSON parsing failed — that's fine, just return the text
            }
        }

        // 7. Return the response
        return res.json({
            reply: replyText,
            tradeData // null if not a trade recommendation
        });

    } catch (err) {
        console.error('❌ Gemini API error:', err.message || err);

        // Provide status-specific error messages
        const status = err.status || err.httpCode || 500;
        let userMessage = 'Something went wrong. Please try again.';

        if (status === 400) userMessage = 'Bad request — check your input and try again.';
        else if (status === 401 || status === 403) userMessage = 'API key is invalid or unauthorized. Check your GROQ_API_KEY in .env.';
        else if (status === 429) userMessage = 'Rate limit reached. Please wait a moment and try again.';
        else if (status >= 500) userMessage = 'Groq server error. Please try again in a few seconds.';

        return res.status(status >= 400 ? status : 500).json({ error: userMessage });
    }
});

// ─── POST /api/sentiment/analyze ───
app.post('/api/sentiment/analyze', async (req, res) => {
    try {
        if (!ai) return res.status(503).json({ error: 'Groq not configured. Add GROQ_API_KEY.' });

        const { text } = req.body;
        if (!text || typeof text !== 'string' || !text.trim()) {
            return res.status(400).json({ error: 'Text payload is required.' });
        }

        const prompt = `Analyze the provided financial text and return a strict JSON object.
Required Fields:
- "sentiment_score": Float between -1.0 (Extreme Fear) and 1.0 (Extreme Greed).
- "signal": String: 'BULLISH', 'BEARISH', or 'NEUTRAL'.
- "confidence": Percentage of how certain you are based on the data.
- "reasoning": A one-sentence explanation of why you gave this score.

Text to analyze: "${text.substring(0, 3000)}"

DO NOT include markdown formatting (\`\`\`json) outside the braces, just return raw JSON text.`;

        const response = await ai.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 300
        });

        let jsonStr = response.choices[0].message.content.trim();
        if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        else if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');

        const parsedData = JSON.parse(jsonStr);
        res.json(parsedData);
    } catch (err) {
        console.error('❌ Sentiment Analyze error:', err);
        res.status(500).json({ error: 'Failed to analyze sentiment.' });
    }
});

// ─── POST /api/forecast ───
app.post('/api/forecast', async (req, res) => {
    try {
        if (!ai) return res.status(503).json({ error: 'Groq not configured. Add GROQ_API_KEY.' });

        const { pricesStr } = req.body;
        if (!pricesStr || typeof pricesStr !== 'string') {
            return res.status(400).json({ error: 'Comma-separated prices string is required.' });
        }

        const prompt = `Based on these 20 price points, predict the next 5 points using technical analysis patterns (Mean Reversion or Momentum). Return ONLY a JSON array of 5 numbers.

Prices: ${pricesStr}

DO NOT include markdown formatting (\`\`\`json) outside the braces, just return raw JSON text (e.g. [1.2, 1.3, 1.4, 1.5, 1.6]).`;

        const response = await ai.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'system', content: prompt }],
            max_tokens: 150
        });

        let jsonStr = response.choices[0].message.content.trim();
        if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        else if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');

        const parsedData = JSON.parse(jsonStr);
        if (!Array.isArray(parsedData) || parsedData.length !== 5) {
            throw new Error("Invalid format returned by LLM");
        }
        res.json(parsedData);
    } catch (err) {
        console.error('❌ Forecast logic error:', err);
        res.status(500).json({ error: 'Failed to generate forecast.' });
    }
});


// ─── BACKGROUND NEWS SCRAPER & SENTIMENT ───
let latestLiveSentiment = null;

async function fetchAndAnalyzeNews() {
    try {
        if (!ai) return; // Do nothing if no Groq setup
        console.log(`[Autonomous] Fetching live financial news...`);
        // Fetch from Google News (Broad Indian Market)
        const rssRes = await fetch('https://news.google.com/rss/search?q=HDFC+Bank+OR+Infosys+OR+TCS+OR+Reliance+OR+Tata+Motors+OR+SBI+OR+ICICI+Bank+when:1d&hl=en-IN&gl=IN&ceid=IN:en');
        if (!rssRes.ok) throw new Error("Failed to fetch Google News RSS");
        const rssText = await rssRes.text();

        // Very basic XML extraction using Regex (to avoid huge parser deps)
        const titleMatches = Array.from(rssText.matchAll(/<title>(?!Google News)(.*?)<\/title>/g)).slice(0, 15);
        const headlines = titleMatches.map(m => m[1].replace(/&apos;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"'));

        if (headlines.length === 0) {
            console.log(`[Autonomous] No news found to analyze.`);
            return;
        }

        console.log(`[Autonomous] Extracted ${headlines.length} headlines. Analyzing...`);
        const prompt = `Analyze these ${headlines.length} recent financial headlines related to the Indian Stock Market and return a strict JSON object structure.
Required JSON format:
{
  "aggregate": {
    "sentiment_score": 0.5, // Float between -1.0 (Extreme Fear) and 1.0 (Extreme Greed)
    "signal": "BULLISH", // 'BULLISH', 'BEARISH', or 'NEUTRAL'
    "confidence": 80, // Percentage INT
    "reasoning": "A comprehensive one or two sentence summary explaining the aggregate score."
  },
  "news_items": [
    {
      "headline": "The original headline",
      "related_stock": "The specific company or stock mentioned (e.g. HDFC Bank), or 'Market' if general",
      "signal": "BULLISH", // 'BULLISH', 'BEARISH', or 'NEUTRAL'
      "sentiment_score": 0.5 // Float between -1.0 and 1.0
    }
  ]
}
Note: Return ALL ${headlines.length} items in the news_items array.

Headlines:
${headlines.map((h, i) => `${i + 1}. ${h}`).join('\n')}

DO NOT include markdown formatting (\`\`\`json) outside the braces, just return raw JSON text.`;

        const response = await ai.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 2000
        });

        let jsonStr = response.choices[0].message.content.trim();
        if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        else if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');

        const parsedData = JSON.parse(jsonStr);
        latestLiveSentiment = { ...parsedData, timestamp: new Date(), headlinesScanned: headlines.length };
        console.log(`[Autonomous] Sentiment updated: ${parsedData.aggregate.signal} (${parsedData.aggregate.sentiment_score})`);
    } catch (err) {
        console.error('❌ Autonomous News Analysis error:', err.message);
    }
}

// Start loop natively on server start (run immediately, then every 15 min)
if (ai) {
    fetchAndAnalyzeNews(); // initial run
    setInterval(fetchAndAnalyzeNews, 15 * 60 * 1000);
}

// ─── GET /api/sentiment/live ───
app.get('/api/sentiment/live', (req, res) => {
    res.json(latestLiveSentiment || { status: 'initializing', message: 'Engine is booting up and analyzing live feeds...' });
});

// ─── POST /api/sentiment/refresh ───
app.post('/api/sentiment/refresh', async (req, res) => {
    try {
        await fetchAndAnalyzeNews();
        res.json({ success: true, data: latestLiveSentiment });
    } catch (err) {
        res.status(500).json({ error: 'Failed to refresh news.' });
    }
});


// ─── Health Check ───
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        groqConfigured: !!GROQ_API_KEY,
        dbConnected: mongoose.connection.readyState === 1,
        timestamp: new Date().toISOString()
    });
});

// ─────────────────────────────────────────────────────────
// VIBE ENGINE V2 ADVANCED FEATURES (Architected, to be implemented)
// ─────────────────────────────────────────────────────────

// ─── IN-MEMORY DATABASE FALLBACK ───
// These arrays act as our database when MongoDB is not running locally.
const mockUsers = [
    { _id: 'mock1', name: 'Demo User', email: 'demo@labh.com', passwordHash: 'password', virtualBalance: 100000, portfolioHoldings: [], level: 'Beginner' }
];
const mockTrades = [];

// Expose mock data for trade controller when DB is disconnected
app.locals.mockUsers = mockUsers;
app.locals.mockTrades = mockTrades;

const STOCKS_DATA = {
    HDFCBANK: { sym: 'HDFCBANK', name: 'HDFC Bank Ltd', price: 887.40, change: -1.27, exchange: 'BSE', sector: 'Banking' },
    INFY: { sym: 'INFY', name: 'Infosys Ltd', price: 1300.10, change: 0.85, exchange: 'NSE', sector: 'IT' },
    TCS: { sym: 'TCS', name: 'Tata Consultancy Services', price: 2636.40, change: -0.43, exchange: 'BSE', sector: 'IT' },
    ONGC: { sym: 'ONGC', name: 'Oil and Natural Gas Corp', price: 279.70, change: -0.14, exchange: 'NSE', sector: 'Energy' },
    RELIANCE: { sym: 'RELIANCE', name: 'Reliance Industries Ltd', price: 2845.60, change: 1.14, exchange: 'NSE', sector: 'Conglomerate' },
    TATAMOTORS: { sym: 'TATAMOTORS', name: 'Tata Motors Ltd', price: 748.25, change: -1.18, exchange: 'NSE', sector: 'Auto' },
    WIPRO: { sym: 'WIPRO', name: 'Wipro Ltd', price: 521.30, change: 0.81, exchange: 'BSE', sector: 'IT' },
    BAJFINANCE: { sym: 'BAJFINANCE', name: 'Bajaj Finance Ltd', price: 7124.50, change: -1.32, exchange: 'NSE', sector: 'NBFC' },
    HINDUNILVR: { sym: 'HINDUNILVR', name: 'Hindustan Unilever Ltd', price: 2338.25, change: -1.90, exchange: 'BSE', sector: 'FMCG' },
    GOLDBEES: { sym: 'GOLDBEES', name: 'Nippon India ETF Gold BeES', price: 131.60, change: 0.86, exchange: 'BSE', sector: 'ETF' },
    SBIN: { sym: 'SBIN', name: 'State Bank of India', price: 762.45, change: 0.77, exchange: 'NSE', sector: 'Banking' },
    ICICIBANK: { sym: 'ICICIBANK', name: 'ICICI Bank Ltd', price: 1124.80, change: 1.21, exchange: 'NSE', sector: 'Banking' },
};

// ─── MARKETS ROUTE ───
app.get('/api/markets', (req, res) => {
    // Return an array of stocks to the frontend
    setTimeout(() => res.json(Object.values(STOCKS_DATA)), 500); // Simulate network latency
});

// ─── HELPER TO ALIGN BACKEND USER WITH FRONTEND EXPECTATIONS ───
const formatUserForFrontend = formatUserFromController;

// ─── AUTHENTICATION ROUTES ───
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, level = 'Beginner' } = req.body;
        if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password required' });

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email format' });

        if (mongoose.connection.readyState !== 1) {
            // Memory Fallback
            if (mockUsers.find(u => u.email === email)) return res.status(400).json({ error: 'Email already exists' });
            const newUser = { _id: Date.now().toString(), name, email, passwordHash: password, virtualBalance: 100000, portfolioHoldings: [], level };
            mockUsers.push(newUser);
            return res.status(201).json({ user: formatUserForFrontend(newUser) });
        }

        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ error: 'Email already exists' });

        const newUser = new User({ name, email, passwordHash: password, level });
        await newUser.save();
        res.status(201).json({ user: formatUserForFrontend(newUser) });
    } catch (err) {
        console.error('❌ Register error:', err);
        res.status(500).json({ error: 'Failed to register' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

        if (mongoose.connection.readyState !== 1) {
            // Memory Fallback
            const user = mockUsers.find(u => u.email === email && u.passwordHash === password);
            if (!user) return res.status(401).json({ error: 'Invalid credentials' });
            return res.json({ user: formatUserForFrontend(user) });
        }

        const user = await User.findOne({ email });
        // Keeping it simple for demo: raw password check, no bcrypt
        if (!user || user.passwordHash !== password) return res.status(401).json({ error: 'Invalid credentials' });

        res.json({ user: formatUserForFrontend(user) });
    } catch (err) {
        console.error('❌ Login error:', err);
        res.status(500).json({ error: 'Failed to login' });
    }
});

app.get('/api/auth/me', async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ error: 'Email required' });

        if (mongoose.connection.readyState !== 1) {
            const user = mockUsers.find(u => u.email === email);
            if (!user) return res.status(404).json({ error: 'User not found' });
            return res.json({ user: formatUserForFrontend(user) });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ user: formatUserForFrontend(user) });
    } catch (err) {
        console.error('❌ Fetch user error:', err);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// ─── TRADING ROUTE (Trade Controller) ───
app.post('/api/trade', executeTrade);

// Feature 4: Gamified Leaderboard
app.get('/api/leaderboard', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            // Return mock leaderboard data if DB isn't connected
            return res.json({
                leaderboard: [
                    { _id: 'mock1', name: 'Rakesh Jhunjhunwala (Ghost)', virtualBalance: 100000, portfolioValue: 4500000, netWorth: 4600000 },
                    { _id: 'mock2', name: 'Harshad Mehta (Ghost)', virtualBalance: 5000, portfolioValue: 1200000, netWorth: 1205000 },
                    { _id: 'mock3', name: 'You (Mock Data)', virtualBalance: 500000, portfolioValue: 0, netWorth: 500000 },
                ]
            });
        }

        // This pipeline calculates virtualBalance + (holdings * avgPrice) as a rough fallback 
        // for Net Worth. Supports both portfolioHoldings and legacy portfolio.
        const leaderboard = await User.aggregate([
            {
                $addFields: {
                    _holdings: {
                        $cond: {
                            if: { $gt: [{ $size: { $ifNull: ["$portfolioHoldings", []] } }, 0] },
                            then: "$portfolioHoldings",
                            else: "$portfolio"
                        }
                    }
                }
            },
            {
                $addFields: {
                    portfolioValue: {
                        $reduce: {
                            input: "$_holdings",
                            initialValue: 0,
                            in: {
                                $add: [
                                    "$$value",
                                    {
                                        $multiply: [
                                            { $ifNull: ["$$this.sharesOwned", "$$this.quantity"] },
                                            { $ifNull: ["$$this.averageBuyPrice", "$$this.averagePrice"] }
                                        ]
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            {
                $addFields: {
                    netWorth: { $add: ["$virtualBalance", "$portfolioValue"] }
                }
            },
            { $sort: { netWorth: -1 } },
            { $limit: 100 },
            { $project: { _id: 1, name: 1, virtualBalance: 1, portfolioValue: 1, netWorth: 1 } }
        ]);

        res.json({ leaderboard });
    } catch (err) {
        console.error('❌ Leaderboard error:', err);
        res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
});

// Feature 5: AI "Roast My Portfolio"
app.post('/api/roast', async (req, res) => {
    try {


        if (!ai) return res.status(503).json({ error: "Gemini not configured" });

        const { portfolio = [], balance = 0 } = req.body;

        let portfolioDesc = portfolio.length > 0
            ? portfolio.map(p => `${p.qty !== undefined ? p.qty : p.quantity} shares of ${p.sym || p.ticker} at avg ₹${p.avg !== undefined ? p.avg : p.averagePrice}`).join(', ')
            : "Empty (Nothing but cash and regret)";

        const prompt = `You are a harsh, cynical, yet witty financial advisor from Wall Street evaluating an Indian retail investor's portfolio. 
        Current Cash: ₹${balance}
        Holdings: ${portfolioDesc}
        
        Roast their investment choices mercilessly but playfully. Expose their terrible decision making. Don't be polite.
        Respond in a strict JSON format with exactly 2 keys: "roastText" (a paragraph of savage roasting) and "riskScore" (a number from 1 to 10 for risk level).
        DO NOT include markdown block formatting (\`\`\`json) outside the braces, just return raw JSON text.`;

        const response = await ai.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 500
        });

        let jsonStr = response.choices[0].message.content.trim();
        // Remove markdown backticks if Gemini includes them
        if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        const roastData = JSON.parse(jsonStr);
        res.json(roastData);
    } catch (err) {
        console.error('❌ Roast error:', err);
        res.status(500).json({ error: "Failed to generate roast" });
    }
});

// Feature 3: The "Vibe Meter" (Sentiment)
const vibeCache = {};

app.get('/api/sentiment/:ticker', async (req, res) => {
    try {
        const ticker = req.params.ticker.toUpperCase();



        if (!ai) return res.status(503).json({ error: "Gemini not configured" });

        // Check Cache (valid for 5 minutes)
        if (vibeCache[ticker] && (Date.now() - vibeCache[ticker].timestamp < 5 * 60 * 1000)) {
            console.log(`[Cache Hit] Sentiment for ${ticker}`);
            return res.json(vibeCache[ticker].data);
        }

        // In a full production app, you would fetch real headlines here:
        // const newsRes = await fetch(`https://newsapi.org/v2/everything?q=${ticker}&apiKey=${process.env.NEWS_API_KEY}`);
        // const newsData = await newsRes.json();
        // const headlines = newsData.articles.slice(0, 10).map(a => a.title).join('\n');

        // For now, we ask Gemini to synthesize its knowledge of the company's general market sentiment
        const prompt = `You are the "Vibe Meter" AI for the Indian stock market.
        Analyze the general market sentiment, recent historical context, and public perception for the stock ticker: ${ticker}.
        
        Return a strict JSON response with exactly two keys:
        1. "score": A number from 1 to 100 (1 = Extreme Fear/Bearish, 100 = Extreme Greed/Bullish).
        2. "summary": A punchy, 2-sentence summary of the current "vibe" around this stock.
        
        DO NOT include markdown formatting (\`\`\`json) outside the braces, just return raw JSON text.`;

        const response = await ai.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 200
        });

        let jsonStr = response.choices[0].message.content.trim();
        if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        else if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');

        const parsedData = JSON.parse(jsonStr);
        vibeCache[ticker] = { data: parsedData, timestamp: Date.now() };
        res.json(parsedData);
    } catch (err) {
        console.error('❌ Vibe Meter error:', err);
        res.status(500).json({ error: "Failed to calculate sentiment" });
    }
});

// Feature 1: The "Time Machine" (Backtesting)
app.post('/api/backtest', async (req, res) => {
    try {


        if (!ai) return res.status(503).json({ error: "Gemini not configured" });
        const { strategy, ticker, timeframe = "6m" } = req.body;

        if (!strategy || !ticker) return res.status(400).json({ error: "Strategy and ticker required" });

        // Step 1: Use Gemini to parse the NL strategy into simulated trade actions
        const prompt = `You are a backtesting engine parser. The user wants to backtest this strategy on ${ticker} over the last ${timeframe}:
        Strategy: "${strategy}"
        
        Analyze this strategy. If we look at a hypothetical 6-month chart, what is the likely outcome of this strategy? 
        Return a strict JSON response:
        {
          "parsedCondition": "The condition you extracted (e.g. 'buy on 5% dip')",
          "hypotheticalPnL": "A realistic percentage like '+12.5%' or '-4.2%' based on typical market behavior for this strategy",
          "tradesExecuted": "Estimated integer number of trades that would have triggered",
          "explanation": "A 2-sentence explanation of why this strategy works or fails in trending vs ranging markets."
        }
        DO NOT include markdown formatting (\`\`\`json) outside the braces, just return raw JSON text.`;

        const response = await ai.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 300
        });

        let jsonStr = response.choices[0].message.content.trim();
        if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        else if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');

        const simulationResults = JSON.parse(jsonStr);
        res.json(simulationResults);
    } catch (err) {
        console.error('❌ Backtest error:', err);
        res.status(500).json({ error: "Failed to run backtest simulation" });
    }
});

// Feature 2: Interlock Rules (Create/List)
const mockInterlocks = [];

app.post('/api/interlocks', async (req, res) => {
    try {
        const { userId, conditionType, thresholdValue, action } = req.body;
        if (!userId || !conditionType || !thresholdValue || !action) {
            return res.status(400).json({ error: "Missing required fields for interlock rule" });
        }

        if (mongoose.connection.readyState !== 1) {
            const newRule = { _id: Date.now().toString(), userId, conditionType, thresholdValue, action, isActive: true };
            mockInterlocks.push(newRule);
            return res.status(201).json({ message: "Interlock rule created (Mock)", rule: newRule });
        }

        const newRule = new InterlockRule({ userId, conditionType, thresholdValue, action });
        await newRule.save();

        res.status(201).json({ message: "Interlock rule created", rule: newRule });
    } catch (err) {
        console.error('❌ Interlock create error:', err);
        res.status(500).json({ error: "Failed to create interlock rule" });
    }
});

app.get('/api/interlocks', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ error: "userId query parameter required" });

        if (mongoose.connection.readyState !== 1) {
            const rules = mockInterlocks.filter(r => r.userId === userId && r.isActive);
            return res.json({ rules });
        }

        const rules = await InterlockRule.find({ userId, isActive: true });
        res.json({ rules });
    } catch (err) {
        console.error('❌ Interlock fetch error:', err);
        res.status(500).json({ error: "Failed to fetch interlock rules" });
    }
});

// Feature 2: Background Cron Job for Interlock Evaluation
// Vercel Cron will hit this endpoint every 5 minutes
app.get('/api/cron/interlocks', async (req, res) => {
    console.log('⏰ [Cron] Running Interlock portfolio evaluations...');
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: "Database not connected" });

    // Optional: Protect this route if you have a CRON_SECRET configured on Vercel
    const authHeader = req.headers.authorization;
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        // Find all active rules
        const activeRules = await InterlockRule.find({ isActive: true });
        if (activeRules.length === 0) return res.json({ message: "No active rules" });

        // Group rules by user, fetch users
        const userIds = [...new Set(activeRules.map(r => r.userId.toString()))];
        const users = await User.find({ _id: { $in: userIds } });

        for (const user of users) {
            const userRules = activeRules.filter(r => r.userId.toString() === user._id.toString());

            // Evaluate rules (Simplified mock logic: normally you'd fetch live stock prices)
            for (const rule of userRules) {
                if (rule.conditionType === 'PORTFOLIO_DROP') {
                    // Normally you would compare current 'live' value to an all-time-high marker
                    // Since we don't have historical portfolio snapshots, we simulate a check
                    const holdings = user.portfolioHoldings?.length ? user.portfolioHoldings : (user.portfolio || []);
                    const currentVal = holdings.reduce((acc, p) => {
                        const qty = p.sharesOwned ?? p.quantity;
                        const avg = p.averageBuyPrice ?? p.averagePrice;
                        return acc + (qty * avg);
                    }, 0);
                    // Let's assume a dummy scenario where the check fails if value < threshold

                    // If triggered:
                    if (currentVal < rule.thresholdValue) { // Extremely simplified logic
                        console.log(`⚠️ User ${user.email} triggered interlock rule! Locking buying.`);
                        user.tradingStatus = 'BUYING_LOCKED';
                        await user.save();
                        rule.lastTriggeredAt = new Date();
                        await rule.save();
                    }
                }
            }
        }
        res.json({ message: "Interlocks evaluated" });
    } catch (err) {
        console.error('❌ Cron Job error:', err);
        res.status(500).json({ error: "Interlock evaluation failed" });
    }
});

// ─── Start Server ───
// Only bind to PORT locally. Vercel automatically routes the default export.
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`\n🚀 Labh Vibe Engine running on http://localhost:${PORT}`);
        console.log(`   GET  /api/health      — Health check`);
        console.log(`   POST /api/vibe-trade  — AI Chat Core`);
        console.log(`   GET  /api/leaderboard — F4: Global Rankings`);
        console.log(`   POST /api/roast       — F5: AI Portfolio Roast`);
        console.log(`   GET  /api/sentiment   — F3: Vibe Meter`);
        console.log(`   POST /api/backtest    — F1: Time Machine`);
        console.log(`   Groq: ${GROQ_API_KEY ? '✅ API key loaded' : '❌ No API key — set GROQ_API_KEY in .env'}\n`);
    });
}

export default app;
