<p align="center">
  <img src="public/logo.png.png" alt="Labh Logo" width="80" />
</p>

<h1 align="center">LABH — Learn. Account. Build. Holdings.</h1>

<p align="center">
  <b>AI-Powered Paper Trading Simulator for Indian Markets</b><br/>
  <i>Trade smarter with Vibe AI — zero real money, 100% real learning.</i>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Groq-LLaMA_3.3-FF6F00?logo=meta&logoColor=white" />
  <img src="https://img.shields.io/badge/Deployed_on-Vercel-000000?logo=vercel&logoColor=white" />
</p>

---

## 🚀 Live Demo

**[stocks-iota-dusky.vercel.app](https://stocks-iota-dusky.vercel.app)**
<p>Landing page : https://open-kappa-two.vercel.app/</p>
---

## 📖 What is Labh?

Labh is a **full-stack AI-powered paper trading simulator** built for the Indian stock market (NSE & BSE). It gives users a risk-free environment to learn trading, experiment with strategies, and get real-time AI-driven insights — all without spending a single rupee.

Every user starts with **₹1,00,000 in virtual balance** and can buy/sell stocks from a curated list of top Indian equities.

---

## ✨ Features

### 🤖 Labh Sathi — AI Chat Assistant
- Conversational AI powered by **Groq LLaMA 3.3 70B**
- Understands **Hindi, Hinglish, English**, and regional languages
- Provides buy/sell/hold recommendations with structured JSON trade tickets
- Context-aware — knows your portfolio, selected stock, and experience level

### 📊 Paper Trading Engine
- Simulated buy/sell orders with real-time portfolio tracking
- Virtual balance management with profit/loss calculations
- Complete trade history with timestamps

### 🧠 Autonomous Sentiment Engine
- Scrapes **Google News RSS feeds** every 15 minutes (via GitHub Actions)
- Aggregates headlines across all tracked stocks
- Uses Groq AI to compute **real-time sentiment scores** (-1 to +1)
- Live UI widget with auto-refresh capability

### 🔮 AI Price Forecasting
- Technical analysis-based price predictions using LLaMA 3.3
- Generates 5-point forward projections from historical data

### 🏆 Global Leaderboard
- Ranks all users by portfolio value
- Highlights top performers with badges

### 🔥 AI Portfolio Roast
- Brutally honest AI analysis of your trading decisions
- Entertainment + education in one feature

### ⏰ Time Machine (Backtesting)
- AI-powered historical scenario analysis
- Test "what-if" strategies on past market data

### 🔒 Smart Interlocks
- AI-driven risk management rules
- Automatic position size limits and sector exposure checks
- Runs on a **5-minute schedule** via GitHub Actions

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, Vanilla CSS |
| **Backend** | Express.js (Node.js ESM) |
| **AI Engine** | Groq SDK + LLaMA 3.3 70B Versatile |
| **Database** | MongoDB Atlas + Mongoose ODM |
| **Hosting** | Vercel (Serverless Functions) |
| **Scheduling** | GitHub Actions (cron workflows) |
| **Charts** | Lightweight Charts (TradingView) |

---

## 📁 Project Structure

```
LABH/
├── src/
│   ├── main.jsx            # App entry point
│   ├── Auth.jsx            # Login & Registration UI
│   ├── Labh.jsx            # Main dashboard (all tabs & widgets)
│   └── Footer.jsx          # App footer
├── models/
│   ├── User.js             # User schema (balance, portfolio, level)
│   ├── Trade.js            # Trade history schema
│   └── InterlockRule.js    # Risk management rules schema
├── controllers/
│   └── tradeController.js  # Trade execution logic
├── .github/workflows/
│   ├── market-pulse.yml    # Sentiment engine trigger (every 15 min)
│   └── interlocks-pulse.yml # Interlocks evaluator (every 5 min)
├── server.js               # Express backend (all API routes)
├── vercel.json             # Vercel deployment config
├── vite.config.js          # Vite build config
└── package.json
```

---

## ⚡ Quick Start (Local Development)

### Prerequisites
- **Node.js** 18+
- **MongoDB** (local instance or Atlas URI)
- **Groq API Key** — Get one free at [console.groq.com](https://console.groq.com)

### 1. Clone & Install

```bash
git clone https://github.com/ASHIT2007/LABH-LEARN.-ACCOUNT.-BUILD-HOLDINGS.-.git
cd LABH-LEARN.-ACCOUNT.-BUILD-HOLDINGS.-
npm install
```

### 2. Configure Environment

Create a `.env` file in the project root:

```env
GROQ_API_KEY=your_groq_api_key_here
MONGODB_URI=mongodb://localhost:27017/labh
CRON_SECRET=your_secret_here
```

### 3. Run

Open **two terminals**:

```bash
# Terminal 1 — Frontend (Vite dev server)
npm run dev

# Terminal 2 — Backend (Express API)
npm run server
```

The app will be available at `http://localhost:5173` with the API at `http://localhost:3001`.

---

## 🌐 Deployment (Vercel)

The app is deployed on **Vercel** with `server.js` running as a serverless function.

### Environment Variables (set in Vercel Dashboard)

| Variable | Description |
|----------|------------|
| `GROQ_API_KEY` | Groq API key for AI features |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `CRON_SECRET` | Secret token for GitHub Actions auth |

### Deploy

```bash
vercel deploy --prod --yes
```

### GitHub Actions (Background Jobs)

Since Vercel Hobby plans don't support cron jobs, background tasks are triggered via **GitHub Actions**:

- **`market-pulse.yml`** — Hits `/api/sentiment/refresh` every 15 minutes
- **`interlocks-pulse.yml`** — Hits `/api/cron/interlocks` every 5 minutes

Add `CRON_SECRET` as a **GitHub Repository Secret** for authentication.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Server health check |
| `GET` | `/api/markets` | List all tracked stocks |
| `POST` | `/api/auth/register` | Create new account |
| `POST` | `/api/auth/login` | User login |
| `GET` | `/api/auth/me` | Get user profile |
| `POST` | `/api/vibe-trade` | AI chat (Labh Sathi) |
| `POST` | `/api/trade` | Execute a trade |
| `POST` | `/api/sentiment/analyze` | Analyze text sentiment |
| `GET` | `/api/sentiment/live` | Get live sentiment data |
| `POST` | `/api/sentiment/refresh` | Trigger sentiment refresh (secured) |
| `POST` | `/api/forecast` | AI price prediction |
| `POST` | `/api/roast` | AI portfolio roast |
| `POST` | `/api/backtest` | Historical backtesting |
| `GET` | `/api/leaderboard` | Global rankings |
| `GET` | `/api/cron/interlocks` | Evaluate risk rules (secured) |

---

## 🎨 Tracked Stocks

| Symbol | Company | Sector |
|--------|---------|--------|
| HDFCBANK | HDFC Bank Ltd | Banking |
| INFY | Infosys Ltd | IT |
| TCS | Tata Consultancy Services | IT |
| RELIANCE | Reliance Industries Ltd | Conglomerate |
| SBIN | State Bank of India | Banking |
| ICICIBANK | ICICI Bank Ltd | Banking |
| TATAMOTORS | Tata Motors Ltd | Auto |
| WIPRO | Wipro Ltd | IT |
| BAJFINANCE | Bajaj Finance Ltd | NBFC |
| HINDUNILVR | Hindustan Unilever Ltd | FMCG |
| ONGC | Oil and Natural Gas Corp | Energy |
| GOLDBEES | Nippon India ETF Gold BeES | ETF |

---

## 🛡️ Security

- Background task endpoints are secured with `CRON_SECRET` bearer token authentication
- Passwords are stored as hashes (demo mode uses plain text for simplicity)
- MongoDB Atlas connection uses TLS encryption
- Environment variables are encrypted on Vercel

---

## ⚠️ Disclaimer

> This is an **educational platform** for learning stock market concepts. **No real trading or real money is involved.** All portfolio values are simulated. AI-generated analysis is for learning purposes only and is not SEBI-registered financial advice.

---

## 📝 License

MIT © [Ashit Tiwary](https://github.com/ASHIT2007)
