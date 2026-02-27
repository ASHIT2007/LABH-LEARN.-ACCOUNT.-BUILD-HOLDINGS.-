// ─────────────────────────────────────────────────────────
// server.js — Labh "Vibe Engine" Backend
// Express server with Google Gemini AI integration
// ─────────────────────────────────────────────────────────

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import mongoose from 'mongoose';

// Import Models
import User from './models/User.js';
import Trade from './models/Trade.js';
import InterlockRule from './models/InterlockRule.js';

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

// ─── Initialize Gemini ───
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    console.warn('\n⚠️  GEMINI_API_KEY is not set in .env — AI routes will return errors.\n   Paste your key in the .env file and restart the server.\n');
}

const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

// ─── System Prompt (The Vibe Engine Brain) ───
function buildSystemPrompt(stockContext, portfolioContext, userLevel) {
    return `You are TradeVibe AI, a friendly and expert stock market assistant for Indian markets (NSE and BSE). You can answer ANY question the user asks — whether it is about stocks, trading, investing, market concepts, personal finance, or even general topics. You are warm, conversational, and helpful.

IMPORTANT LANGUAGE RULE: Detect the language the user writes in and ALWAYS respond in that EXACT same language. If Hindi → respond in Hindi. If Hinglish → respond in Hinglish. If English → respond in English. If Tamil, Telugu, Marathi, Bengali, Kannada, Gujarati, or any other language → respond in that language.

GREETING BEHAVIOR: When someone says Hi, Hello, Hey, Namaste, or any greeting, greet them warmly, introduce yourself briefly as TradeVibe AI, mention you can help with stock analysis, trading concepts, portfolio advice, or any question they have, and ask how you can help.

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
        // 1. Validate Gemini is configured
        if (!ai) {
            return res.status(500).json({
                error: 'GEMINI_API_KEY is not configured. Add it to your .env file and restart the server.'
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

        // 4. Build the conversation contents for Gemini
        //    Gemini expects alternating user/model roles
        const contents = [];
        for (const msg of conversationHistory) {
            if (msg.role === 'user') {
                contents.push({ role: 'user', parts: [{ text: msg.text }] });
            } else if (msg.role === 'assistant') {
                contents.push({ role: 'model', parts: [{ text: msg.text }] });
            }
        }
        // Add the current user message
        contents.push({ role: 'user', parts: [{ text: prompt }] });

        // 5. Call Gemini API
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents,
            config: {
                systemInstruction: systemPrompt,
                maxOutputTokens: 1000,
            }
        });

        const replyText = response.text;

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
        else if (status === 401 || status === 403) userMessage = 'API key is invalid or unauthorized. Check your GEMINI_API_KEY in .env.';
        else if (status === 429) userMessage = 'Rate limit reached. Please wait a moment and try again.';
        else if (status >= 500) userMessage = 'Google AI server error. Please try again in a few seconds.';

        return res.status(status >= 400 ? status : 500).json({ error: userMessage });
    }
});

// ─── Health Check ───
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        geminiConfigured: !!GEMINI_API_KEY,
        dbConnected: mongoose.connection.readyState === 1,
        timestamp: new Date().toISOString()
    });
});

// ─────────────────────────────────────────────────────────
// VIBE ENGINE V2 ADVANCED FEATURES (Architected, to be implemented)
// ─────────────────────────────────────────────────────────

// Feature 4: Gamified Leaderboard
app.get('/api/leaderboard', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: "Database not connected" });
        }

        // This pipeline calculates virtualBalance + (holdings * avgPrice) as a rough fallback 
        // for Net Worth. In a real app we'd fetch live DB prices per ticker.
        const leaderboard = await User.aggregate([
            {
                $addFields: {
                    portfolioValue: {
                        $reduce: {
                            input: "$portfolio",
                            initialValue: 0,
                            in: { $add: ["$$value", { $multiply: ["$$this.quantity", "$$this.averagePrice"] }] }
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
            ? portfolio.map(p => `${p.quantity} shares of ${p.ticker} at avg ₹${p.averagePrice}`).join(', ')
            : "Empty (Nothing but cash and regret)";

        const prompt = `You are a harsh, cynical, yet witty financial advisor from Wall Street evaluating an Indian retail investor's portfolio. 
        Current Cash: ₹${balance}
        Holdings: ${portfolioDesc}
        
        Roast their investment choices mercilessly but playfully. Expose their terrible decision making. Don't be polite.
        Respond in a strict JSON format with exactly 2 keys: "roastText" (a paragraph of savage roasting) and "riskScore" (a number from 1 to 10 for risk level).
        DO NOT include markdown block formatting (\`\`\`json) outside the braces, just return raw JSON text.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { maxOutputTokens: 500 }
        });

        let jsonStr = response.text.trim();
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
        if (!ai) return res.status(503).json({ error: "Gemini not configured" });
        const ticker = req.params.ticker.toUpperCase();

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

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { maxOutputTokens: 200 }
        });

        let jsonStr = response.text.trim();
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

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { maxOutputTokens: 300 }
        });

        let jsonStr = response.text.trim();
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
app.post('/api/interlocks', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: "Database not connected" });

        const { userId, conditionType, thresholdValue, action } = req.body;
        if (!userId || !conditionType || !thresholdValue || !action) {
            return res.status(400).json({ error: "Missing required fields for interlock rule" });
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
        if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: "Database not connected" });
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ error: "userId query parameter required" });

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
                    const currentVal = user.portfolio.reduce((acc, p) => acc + (p.quantity * p.averagePrice), 0);
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
        console.log(`   Gemini: ${GEMINI_API_KEY ? '✅ API key loaded' : '❌ No API key — set GEMINI_API_KEY in .env'}\n`);
    });
}

export default app;
