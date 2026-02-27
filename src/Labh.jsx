import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

/* ─── MOCK DATA ─── */
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
const ALL_SYMS = Object.keys(STOCKS_DATA);
const DEFAULT_WL = ['HDFCBANK', 'INFY', 'TCS', 'ONGC', 'HINDUNILVR', 'GOLDBEES'];
const SECTORS = ['All', ...[...new Set(Object.values(STOCKS_DATA).map(s => s.sector))]];

function genCandles(base, n = 60) { const d = []; let o = base; for (let i = 0; i < n; i++) { const c = o * (1 + (Math.random() - 0.48) * 0.03); const h = Math.max(o, c) * (1 + Math.random() * 0.012); const l = Math.min(o, c) * (1 - Math.random() * 0.012); const v = Math.floor(5e5 + Math.random() * 3e6); d.push({ o: +o.toFixed(2), h: +h.toFixed(2), l: +l.toFixed(2), c: +c.toFixed(2), v, date: new Date(Date.now() - 864e5 * (n - i)).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) }); o = c; } return d; }
function genArea(days = 60) { const d = []; let v = 1250000; for (let i = 0; i < days; i++) { v += v * (Math.random() - 0.47) * 0.015; d.push({ date: new Date(Date.now() - 864e5 * (days - i)).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), value: +v.toFixed(2) }); } return d; }
function genSparkline(base, n = 20) { const d = []; let v = base; for (let i = 0; i < n; i++) { v += v * (Math.random() - 0.48) * 0.02; d.push(+v.toFixed(2)); } return d; }

const CANDLE_CACHE = {};
function getCandles(sym, n = 60) { if (!CANDLE_CACHE[sym + n]) CANDLE_CACHE[sym + n] = genCandles(STOCKS_DATA[sym].price, n); return CANDLE_CACHE[sym + n]; }
const SPARK_CACHE = {};
function getSpark(sym) { if (!SPARK_CACHE[sym]) SPARK_CACHE[sym] = genSparkline(STOCKS_DATA[sym].price); return SPARK_CACHE[sym]; }
const PORTFOLIO_HISTORY = genArea(60);



const LEARN_TOPICS = [
    { emoji: '📊', title: 'Technical Analysis', desc: 'Master chart patterns, indicators like RSI, MACD, and Bollinger Bands.', diff: 'Beginner', prompts: ['Explain RSI indicator', 'What are candlestick patterns?', 'How to use MACD?'] },
    { emoji: '📈', title: 'Fundamental Analysis', desc: 'Understand PE ratio, EPS, balance sheets and company valuation.', diff: 'Beginner', prompts: ['What is PE ratio?', 'How to read a balance sheet?', 'Explain EPS'] },
    { emoji: '🎯', title: 'Trading Strategies', desc: 'Learn swing trading, scalping, positional trading for Indian markets.', diff: 'Intermediate', prompts: ['Best swing trading strategy?', 'Explain positional trading', 'Intraday vs delivery'] },
    { emoji: '🛡️', title: 'Risk Management', desc: 'Position sizing, stop losses, portfolio allocation for Nifty & Sensex.', diff: 'Intermediate', prompts: ['How to set stop loss?', 'What is position sizing?', 'Risk reward ratio'] },
    { emoji: '🏛️', title: 'Market Fundamentals', desc: 'NSE, BSE, SEBI regulations, FII/DII flows, IPO process.', diff: 'Beginner', prompts: ['What is SEBI?', 'Explain FII DII impact', 'How does NSE work?'] },
    { emoji: '🧠', title: 'Trading Psychology', desc: 'Overcome fear, greed, and develop discipline for consistent returns.', diff: 'Advanced', prompts: ['How to control fear in trading?', 'Dealing with losses', 'Building trading discipline'] },
];

const SAMPLE_REVIEWS = [
    { name: 'Rahul Sharma', level: 'Intermediate', rating: 5, text: 'Excellent platform for learning Indian stock markets. The AI analysis helps me understand Nifty movements better than any other tool.', date: '2 days ago' },
    { name: 'Priya Patel', level: 'Beginner', rating: 4, text: 'Love the Zerodha-style watchlist! The screener feature is very useful for finding stocks. UI is clean and intuitive.', date: '1 week ago' },
    { name: 'Amit Kumar', level: 'Advanced', rating: 5, text: 'The candlestick charts are remarkably well done. AI responses about FII/DII flows are insightful. Best educational trading platform.', date: '2 weeks ago' },
    { name: 'Sneha Reddy', level: 'Beginner', rating: 4, text: 'Perfect for beginners like me. The Learn section with AI prompts really helped me understand PE ratios and market basics.', date: '3 weeks ago' },
];

const AVATAR_COLORS = ['#3b82f6', '#10d07a', '#f59e0b', '#f5455c', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

/* ─── STYLE TAG ─── */
const STYLE_TEXT = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{--bg:#080b14;--card:#0f1628;--sidebar:#0c1022;--accent:#3b82f6;--green:#10d07a;--red:#f5455c;--gold:#f59e0b;--text:#e2e8f8;--muted:#4b5a80;--font-head:'Syne',sans-serif;--font-body:'DM Sans',sans-serif;}
body{background:var(--bg);color:var(--text);font-family:var(--font-body);overflow-x:hidden;}
::-webkit-scrollbar{width:6px;}::-webkit-scrollbar-track{background:var(--bg);}::-webkit-scrollbar-thumb{background:var(--muted);border-radius:3px;}
input,textarea,select,button{font-family:var(--font-body);outline:none;}
@keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideInRight{from{transform:translateX(100%)}to{transform:translateX(0)}}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}
@keyframes glow{0%,100%{box-shadow:0 0 20px rgba(59,130,246,.3)}50%{box-shadow:0 0 40px rgba(59,130,246,.6)}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes toastIn{from{transform:translateX(120%);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes toastOut{from{transform:translateX(0);opacity:1}to{transform:translateX(120%);opacity:0}}
.fade-in{animation:fadeIn .5s ease both;}
.card-hover{transition:transform .2s,box-shadow .2s;}.card-hover:hover{transform:translateY(-3px);box-shadow:0 8px 25px rgba(0,0,0,.4);}
`;

/* ─── SMALL COMPONENTS ─── */
const Sparkline = ({ data, color = '#10d07a', w = 72, h = 32 }) => { if (!data || !data.length) return null; const mn = Math.min(...data), mx = Math.max(...data), r = mx - mn || 1; const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - mn) / r) * h}`).join(' '); return <svg width={w} height={h}><polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" /></svg>; };

const Avatar = ({ name, size = 36, idx = 0 }) => { const c = AVATAR_COLORS[idx % AVATAR_COLORS.length]; return <div style={{ width: size, height: size, borderRadius: '50%', background: c, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.42, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{(name || 'U')[0].toUpperCase()}</div>; };

const StarRating = ({ rating = 0, onRate, size = 16, interactive = false }) => { const [hover, setHover] = useState(0); return <div style={{ display: 'flex', gap: 2 }}>{[1, 2, 3, 4, 5].map(i => <span key={i} style={{ cursor: interactive ? 'pointer' : 'default', fontSize: size, color: i <= (hover || rating) ? 'var(--gold)' : 'var(--muted)', transition: 'color .15s' }} onMouseEnter={() => interactive && setHover(i)} onMouseLeave={() => interactive && setHover(0)} onClick={() => interactive && onRate && onRate(i)}>★</span>)}</div>; };

const Toast = ({ toasts }) => <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>{toasts.map(t => <div key={t.id} style={{ background: 'var(--card)', border: '1px solid rgba(255,255,255,.08)', borderLeft: `4px solid ${t.type === 'success' ? 'var(--green)' : t.type === 'error' ? 'var(--red)' : 'var(--accent)'}`, borderRadius: 8, padding: '12px 18px', minWidth: 260, animation: t.leaving ? 'toastOut .3s ease forwards' : 'toastIn .3s ease', fontFamily: 'var(--font-body)', fontSize: 14 }}>{t.message}</div>)}</div>;

const ExchangeBadge = ({ ex }) => <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: ex === 'NSE' ? 'rgba(59,130,246,.15)' : 'rgba(245,158,11,.15)', color: ex === 'NSE' ? 'var(--accent)' : 'var(--gold)', fontWeight: 600, marginLeft: 6 }}>{ex}</span>;

const ChangeBadge = ({ change, style: s = {} }) => <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 6, background: change >= 0 ? 'rgba(16,208,122,.12)' : 'rgba(245,69,92,.12)', color: change >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600, ...s }}>{change >= 0 ? '+' : ''}{change.toFixed(2)}%</span>;

/* ─── CANDLESTICK CHART ─── */
const CandlestickChart = ({ sym, rangeIdx = 5 }) => {
    const ranges = [1, 5, 22, 66, 132, 252];
    const n = Math.min(ranges[rangeIdx], 252);
    const candles = useMemo(() => getCandles(sym, n), [sym, n]);
    const ref = useRef(null);
    const [hover, setHover] = useState(null);
    const [dims, setDims] = useState({ w: 800, h: 420 });
    useEffect(() => {
        const el = ref.current; if (!el) return;
        const ro = new ResizeObserver(e => { const r = e[0].contentRect; setDims({ w: r.width, h: r.height }); });
        ro.observe(el); return () => ro.disconnect();
    }, []);
    const W = dims.w, H = dims.h, pad = { t: 10, b: 40, l: 60, r: 10 }, chartH = H - pad.t - pad.b, chartW = W - pad.l - pad.r;
    const volH = chartH * 0.25, priceH = chartH - volH - 10;
    const prices = candles.flatMap(c => [c.h, c.l]);
    const mn = Math.min(...prices), mx = Math.max(...prices), pr = mx - mn || 1;
    const vols = candles.map(c => c.v), maxV = Math.max(...vols) || 1;
    const cw = Math.max(2, chartW / candles.length - 2);
    const yP = v => pad.t + priceH - (((v - mn) / pr) * priceH);
    const xC = i => pad.l + i * (chartW / candles.length) + cw / 2;

    return <div ref={ref} style={{ width: '100%', height: '100%', minHeight: 320, position: 'relative' }}>
        <svg width={W} height={H} style={{ display: 'block' }} onMouseMove={e => { const rect = ref.current.getBoundingClientRect(); const mx2 = e.clientX - rect.left - pad.l; const idx = Math.round(mx2 / (chartW / candles.length)); if (idx >= 0 && idx < candles.length) setHover(idx); else setHover(null); }} onMouseLeave={() => setHover(null)}>
            {/* Y axis */}
            {Array.from({ length: 6 }).map((_, i) => { const v = mn + pr * (i / 5); const y = yP(v); return <g key={i}><line x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke="rgba(75,90,128,.2)" strokeDasharray="3,3" /><text x={pad.l - 8} y={y + 4} textAnchor="end" fill="var(--muted)" fontSize={10} fontFamily="var(--font-body)">₹{v.toFixed(0)}</text></g>; })}
            {/* Candles */}
            {candles.map((c, i) => {
                const x = xC(i); const up = c.c >= c.o; const color = up ? 'var(--green)' : 'var(--red)'; const bodyTop = yP(Math.max(c.o, c.c)); const bodyBot = yP(Math.min(c.o, c.c)); const bodyH2 = Math.max(1, bodyBot - bodyTop);
                return <g key={i}>
                    <line x1={x} x2={x} y1={yP(c.h)} y2={yP(c.l)} stroke={color} strokeWidth={1} />
                    <rect x={x - cw / 2} y={bodyTop} width={cw} height={bodyH2} fill={up ? 'transparent' : color} stroke={color} strokeWidth={1} rx={1} />
                    {/* Volume */}
                    <rect x={x - cw / 2} y={pad.t + priceH + 10 + volH - (c.v / maxV) * volH} width={cw} height={(c.v / maxV) * volH} fill={color} opacity={0.25} rx={1} />
                </g>;
            })}
            {/* X labels */}
            {candles.filter((_, i) => i % Math.max(1, Math.floor(candles.length / 8)) === 0).map((c, i) => { const idx = candles.indexOf(c); return <text key={i} x={xC(idx)} y={H - 5} textAnchor="middle" fill="var(--muted)" fontSize={10} fontFamily="var(--font-body)">{c.date}</text>; })}
            {/* Crosshair */}
            {hover !== null && <>
                <line x1={xC(hover)} x2={xC(hover)} y1={pad.t} y2={pad.t + chartH} stroke="rgba(226,232,248,.3)" strokeDasharray="4,4" />
                <line x1={pad.l} x2={W - pad.r} y1={yP(candles[hover].c)} y2={yP(candles[hover].c)} stroke="rgba(226,232,248,.3)" strokeDasharray="4,4" />
            </>}
        </svg>
        {hover !== null && <div style={{ position: 'absolute', top: 8, right: 12, background: 'var(--card)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, padding: '8px 14px', fontSize: 12, pointerEvents: 'none', fontFamily: 'var(--font-body)' }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{candles[hover].date}</div>
            <div>O: ₹{candles[hover].o.toFixed(2)}  H: ₹{candles[hover].h.toFixed(2)}</div>
            <div>L: ₹{candles[hover].l.toFixed(2)}  C: ₹{candles[hover].c.toFixed(2)}</div>
            <div>Vol: {(candles[hover].v / 1e6).toFixed(2)}M</div>
        </div>}
    </div>;
};

/* ─── AREA CHART ─── */
const AreaChart = ({ data, w = 800, h = 200, color = 'var(--accent)' }) => {
    if (!data || !data.length) return null;
    const vals = data.map(d => d.value); const mn = Math.min(...vals), mx = Math.max(...vals), r = mx - mn || 1;
    const pad = { t: 10, b: 30, l: 50, r: 10 }; const cW = w - pad.l - pad.r, cH = h - pad.t - pad.b;
    const pts = data.map((d, i) => ({ x: pad.l + (i / (data.length - 1)) * cW, y: pad.t + cH - ((d.value - mn) / r) * cH }));
    const line = pts.map(p => `${p.x},${p.y}`).join(' ');
    const area = `${pad.l},${pad.t + cH} ${line} ${pad.l + cW},${pad.t + cH}`;
    const id = 'ag' + Math.random().toString(36).slice(2, 6);
    return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto' }}>
        <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".35" /><stop offset="100%" stopColor={color} stopOpacity=".02" /></linearGradient></defs>
        <polygon points={area} fill={`url(#${id})`} />
        <polyline points={line} fill="none" stroke={color} strokeWidth={2} />
        {data.filter((_, i) => i % Math.max(1, Math.floor(data.length / 6)) === 0).map((d, i) => { const idx = data.indexOf(d); return <text key={i} x={pts[idx].x} y={h - 5} textAnchor="middle" fill="var(--muted)" fontSize={10}>{d.date}</text>; })}
        {Array.from({ length: 4 }).map((_, i) => { const v = mn + r * (i / 3); return <text key={i} x={pad.l - 6} y={pad.t + cH - ((v - mn) / r) * cH + 4} textAnchor="end" fill="var(--muted)" fontSize={10}>₹{(v / 1000).toFixed(0)}k</text>; })}
    </svg>;
};

/* ─── DONUT CHART ─── */
const DonutChart = ({ invested = 1e6, current = 1.15e6, size = 140 }) => {
    const r = size / 2 - 10, c = 2 * Math.PI * r; const ratio = Math.min(current / Math.max(invested, 1), 2);
    const green = ratio >= 1; const pct = Math.min(ratio, 1);
    return <svg width={size} height={size}><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(75,90,128,.25)" strokeWidth={12} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={green ? 'var(--green)' : 'var(--red)'} strokeWidth={12} strokeDasharray={`${pct * c} ${c}`} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        <text x={size / 2} y={size / 2 - 6} textAnchor="middle" fill="var(--text)" fontSize={14} fontFamily="var(--font-head)" fontWeight={700}>₹{(current / 1e5).toFixed(1)}L</text>
        <text x={size / 2} y={size / 2 + 14} textAnchor="middle" fill={green ? 'var(--green)' : 'var(--red)'} fontSize={11}>{green ? '+' : ''}₹{((current - invested) / 1000).toFixed(1)}k</text>
    </svg>;
};

/* ─── TRADE MODAL ─── */
const TradeModal = ({ stock, action = 'BUY', onClose, onConfirm }) => {
    const [qty, setQty] = useState(1); if (!stock) return null;
    const total = qty * stock.price; const ac = action === 'BUY' ? 'var(--green)' : 'var(--red)';
    return <div style={{ position: 'fixed', inset: 0, zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(6px)' }} onClick={onClose}>
        <div onClick={e => e.stopPropagation()} className="fade-in" style={{ background: 'var(--card)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 16, padding: 28, width: 380, maxWidth: '92vw' }}>
            <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 20, marginBottom: 4 }}><span style={{ color: ac }}>{action}</span> {stock.sym}</h3>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16 }}>Current Price: ₹{stock.price.toFixed(2)}</p>
            <label style={{ fontSize: 13, color: 'var(--muted)' }}>Quantity</label>
            <input type="number" min={1} value={qty} onChange={e => setQty(Math.max(1, +e.target.value))} style={{ display: 'block', width: '100%', padding: '10px 14px', marginTop: 6, marginBottom: 12, background: 'var(--bg)', border: '1px solid var(--muted)', borderRadius: 8, color: 'var(--text)', fontSize: 16 }} />
            <div style={{ fontSize: 14, marginBottom: 8 }}>Estimated Total: <strong style={{ fontFamily: 'var(--font-head)', fontSize: 18 }}>₹{total.toFixed(2)}</strong></div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>Order Type: Market Order</div>
            <div style={{ background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.25)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--gold)', marginBottom: 20 }}>⚠️ Simulated trade only — no real money involved. Educational purposes only.</div>
            <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid var(--muted)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontSize: 14 }}>Cancel</button>
                <button onClick={() => onConfirm(action, stock.sym, qty, stock.price)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: ac, color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>{action === 'BUY' ? 'Buy Now' : 'Sell Now'}</button>
            </div>
        </div>
    </div>;
};

/* ─── MAIN APP ─── */
export default function App() {
    // Auth
    const [user, setUser] = useState(null);
    const [authTab, setAuthTab] = useState('login');
    const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', level: 'Beginner' });
    // Nav
    const [tab, setTab] = useState('dashboard');
    const [selSym, setSelSym] = useState('HDFCBANK');
    const [chartRange, setChartRange] = useState(5);
    // Watchlist
    const [watchlist, setWatchlist] = useState(DEFAULT_WL);
    const [wlSearch, setWlSearch] = useState('');
    // Portfolio
    const [portfolio, setPortfolio] = useState([]);
    const [trades, setTrades] = useState([]);
    // AI
    const [aiOpen, setAiOpen] = useState(false);
    const [aiMessages, setAiMessages] = useState([]);
    const [aiInput, setAiInput] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    // Modal/Toast
    const [tradeModal, setTradeModal] = useState(null);
    const [toasts, setToasts] = useState([]);
    // Mobile
    const [mobileMenu, setMobileMenu] = useState(false);
    // Reviews
    const [reviews, setReviews] = useState(SAMPLE_REVIEWS);
    const [myRating, setMyRating] = useState(0);
    const [myReview, setMyReview] = useState('');
    const [hasReviewed, setHasReviewed] = useState(false);
    // Screener
    const [scrSector, setScrSector] = useState('All');
    const [scrSort, setScrSort] = useState('change');

    // --- Vibe Engine v2 State ---
    const [roastData, setRoastData] = useState(null);
    const [roastLoading, setRoastLoading] = useState(false);

    const [vibeScore, setVibeScore] = useState(null);
    const [vibeLoading, setVibeLoading] = useState(false);

    const [backtestInput, setBacktestInput] = useState('');
    const [backtestResult, setBacktestResult] = useState(null);
    const [backtestLoading, setBacktestLoading] = useState(false);

    const [leaderboard, setLeaderboard] = useState([]);
    const [leaderboardLoading, setLeaderboardLoading] = useState(false);

    const [myRules, setMyRules] = useState([]);
    const [ruleForm, setRuleForm] = useState({ conditionType: 'PORTFOLIO_DROP', thresholdValue: 10, action: 'LOCK_BUYING' });
    const [rulesLoading, setRulesLoading] = useState(false);

    const aiRef = useRef(null);
    const msgEndRef = useRef(null);

    const addToast = (message, type = 'success') => { const id = Date.now(); setToasts(p => [...p, { id, message, type }]); setTimeout(() => setToasts(p => p.map(t => t.id === id ? { ...t, leaving: true } : t)), 2800); setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3200); };

    const stock = STOCKS_DATA[selSym];
    const totalInvested = portfolio.reduce((s, h) => s + h.avg * h.qty, 0);
    const totalCurrent = portfolio.reduce((s, h) => s + STOCKS_DATA[h.sym].price * h.qty, 0);
    const totalPnl = totalCurrent - totalInvested;
    const totalPnlPct = totalInvested ? ((totalPnl / totalInvested) * 100) : 0;

    const handleTrade = (action, sym, qty, price) => {
        if (action === 'BUY') {
            setPortfolio(p => { const ex = p.find(h => h.sym === sym); if (ex) { const nq = ex.qty + qty; return p.map(h => h.sym === sym ? { ...h, qty: nq, avg: ((ex.avg * ex.qty + price * qty) / nq) } : h); } return [...p, { sym, qty, avg: price }]; });
        } else {
            setPortfolio(p => { const ex = p.find(h => h.sym === sym); if (!ex || ex.qty < qty) { addToast('Insufficient shares', 'error'); return p; } const nq = ex.qty - qty; return nq <= 0 ? p.filter(h => h.sym !== sym) : p.map(h => h.sym === sym ? { ...h, qty: nq } : h); });
        }
        setTrades(p => [{ action, sym, qty, price, time: new Date().toLocaleString('en-IN') }, ...p.slice(0, 19)]);
        setTradeModal(null);
        addToast(`${action} ${qty} ${sym} @ ₹${price.toFixed(2)}`);
    };

    // ─── Call the Gemini backend at /api/vibe-trade ───
    const callVibeAPI = useCallback(async (messages, promptText) => {
        const stockCtx = `${stock.sym} (${stock.name}) at ₹${stock.price.toFixed(2)} (${stock.change >= 0 ? '+' : ''}${stock.change}% today) on ${stock.exchange}, sector: ${stock.sector}`;
        const portfolioCtx = portfolio.map(h => h.sym).join(', ') || 'empty (no holdings)';
        let res;
        try {
            res = await fetch('/api/vibe-trade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: promptText,
                    conversationHistory: messages.filter(m => m.role === 'user' || m.role === 'assistant').map(m => ({ role: m.role, text: m.text })),
                    stockContext: stockCtx,
                    portfolioContext: portfolioCtx,
                    userLevel: user?.level || 'Beginner'
                })
            });
        } catch (networkErr) {
            throw { message: '❌ Check your internet connection. Could not reach the server.' };
        }
        const data = await res.json();
        if (!res.ok) {
            throw { message: data.error || '❌ Something went wrong. Please try again.' };
        }
        return data.reply;
    }, [stock, portfolio, user]);

    const sendAI = useCallback(async (overrideText) => {
        const text = (overrideText || aiInput).trim(); if (!text || aiLoading) return;
        const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        const newUserMsg = { role: 'user', text, time: now };
        setAiInput(''); setAiLoading(true);
        setAiMessages(prev => {
            const cleaned = prev.filter(m => m.role !== 'error');
            const updated = [...cleaned, newUserMsg];
            (async () => {
                try {
                    const reply = await callVibeAPI(updated, text);
                    const aiNow = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                    setAiMessages(p => [...p.filter(m => m.role !== 'error'), { role: 'assistant', text: reply, time: aiNow }]);
                } catch (err) {
                    const aiNow = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                    setAiMessages(p => [...p.filter(m => m.role !== 'error'), { role: 'error', text: err.message || '❌ Could not connect to AI.', time: aiNow, failedMsg: text }]);
                }
                setAiLoading(false);
            })();
            return updated;
        });
    }, [aiInput, aiLoading, callVibeAPI]);

    const retryLastMessage = useCallback(async (failedText) => {
        if (aiLoading) return;
        setAiLoading(true);
        setAiMessages(prev => {
            const cleaned = prev.filter(m => m.role !== 'error');
            (async () => {
                try {
                    const reply = await callVibeAPI(cleaned, failedText);
                    const aiNow = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                    setAiMessages(p => { const c = p.filter(m => m.role !== 'error'); return [...c, { role: 'assistant', text: reply, time: aiNow }]; });
                } catch (err) {
                    const aiNow = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                    setAiMessages(p => { const c = p.filter(m => m.role !== 'error'); return [...c, { role: 'error', text: err.message || '❌ Still unable to connect.', time: aiNow, failedMsg: failedText }]; });
                }
                setAiLoading(false);
            })();
            return cleaned;
        });
    }, [aiLoading, callVibeAPI]);

    const clearChat = useCallback(() => { setAiMessages([]); }, []);

    useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [aiMessages]);

    const handleRoast = async () => {
        if (roastLoading || portfolio.length === 0) return;
        setRoastLoading(true); setRoastData(null);
        try {
            const res = await fetch('/api/roast', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ portfolio, balance: 500000 })
            });
            const data = await res.json();
            if (res.ok) setRoastData(data);
            else addToast(data.error || 'Failed to generate roast', 'error');
        } catch (err) {
            addToast('Network error while roasting', 'error');
        }
        setRoastLoading(false);
    };

    const handleBacktest = async () => {
        if (!backtestInput || backtestLoading) return;
        setBacktestLoading(true); setBacktestResult(null);
        try {
            const res = await fetch('/api/backtest', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ strategy: backtestInput, ticker: selSym, timeframe: '6m' })
            });
            const data = await res.json();
            if (res.ok) setBacktestResult(data);
            else addToast(data.error || 'Failed to backtest', 'error');
        } catch (err) {
            addToast('Network error while backtesting', 'error');
        }
        setBacktestLoading(false);
    };

    useEffect(() => {
        if (tab === 'chart' && selSym) {
            const fetchVibe = async () => {
                setVibeLoading(true); setVibeScore(null);
                try {
                    const res = await fetch(`/api/sentiment/${selSym}`);
                    if (res.ok) {
                        setVibeScore(await res.json());
                    } else {
                        setVibeScore({ score: '⚠️', summary: 'AI is taking a break (Rate limit reached). Please try again in a minute.' });
                    }
                } catch (e) {
                    setVibeScore({ score: '❌', summary: 'Network error analyzing sentiment.' });
                }
                setVibeLoading(false);
            };
            fetchVibe();
        }
    }, [selSym, tab]);

    useEffect(() => {
        if (tab === 'leaderboard') {
            setLeaderboardLoading(true);
            fetch('/api/leaderboard').then(r => r.json()).then(d => { setLeaderboard(d.leaderboard || []); setLeaderboardLoading(false); }).catch(e => setLeaderboardLoading(false));
        } else if (tab === 'safety' && user) {
            fetch(`/api/interlocks?userId=${user.email}`).then(r => r.json()).then(d => setMyRules(d.rules || [])).catch(e => console.error(e));
        }
    }, [tab, user]);

    const handleCreateRule = async () => {
        if (!user) return addToast("Please login first", "error");
        setRulesLoading(true);
        try {
            const res = await fetch('/api/interlocks', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.email, ...ruleForm })
            });
            if (res.ok) {
                addToast("Safety rule activated!");
                fetch(`/api/interlocks?userId=${user.email}`).then(r => r.json()).then(d => setMyRules(d.rules || []));
            } else {
                addToast("Failed to save rule", "error");
            }
        } catch (e) { addToast("Network error", "error"); }
        setRulesLoading(false);
    };

    const navItems = [{ id: 'dashboard', emoji: '📊', label: 'Dashboard' }, { id: 'chart', emoji: '📈', label: 'Chart' }, { id: 'screener', emoji: '🔍', label: 'Screener' }, { id: 'portfolio', emoji: '💼', label: 'Portfolio' }, { id: 'leaderboard', emoji: '🏆', label: 'Leaderboard' }, { id: 'safety', emoji: '🛡️', label: 'Safety' }, { id: 'learn', emoji: '🎓', label: 'Learn' }, { id: 'reviews', emoji: '⭐', label: 'Reviews' }];

    const selectStock = (sym) => { setSelSym(sym); setTab('chart'); setChartRange(5); };
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    /* ─── AUTH SCREEN ─── */
    if (!user) return <>
        <style dangerouslySetInnerHTML={{ __html: STYLE_TEXT }} />
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 20 }}>
            <div className="fade-in" style={{ background: 'var(--card)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, padding: 36, width: 400, maxWidth: '95vw' }}>
                <div style={{ textAlign: 'center', marginBottom: 30 }}>
                    <img src="/logo.png.png" alt="Labh Logo" style={{ width: 64, height: 64, objectFit: 'contain', marginBottom: 10 }} />
                    <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 28, margin: 0, background: 'linear-gradient(135deg,var(--accent),var(--green))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Labh</h1>
                    <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 6 }}>Trade smarter with Vibe AI</p>
                </div>
                <div style={{ display: 'flex', marginBottom: 24, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--muted)' }}>
                    {['login', 'register'].map(t => <button key={t} onClick={() => setAuthTab(t)} style={{ flex: 1, padding: '10px', border: 'none', background: authTab === t ? 'var(--accent)' : 'transparent', color: authTab === t ? '#fff' : 'var(--muted)', cursor: 'pointer', fontSize: 14, fontWeight: 600, textTransform: 'capitalize' }}>{t}</button>)}
                </div>
                {authTab === 'register' && <><input placeholder="Full Name" value={authForm.name} onChange={e => setAuthForm(p => ({ ...p, name: e.target.value }))} style={inputSt} /><select value={authForm.level} onChange={e => setAuthForm(p => ({ ...p, level: e.target.value }))} style={{ ...inputSt, marginBottom: 12 }}><option value="Beginner">Beginner — new to trading</option><option value="Intermediate">Intermediate — some experience</option><option value="Advanced">Advanced — seasoned trader</option></select></>}
                <input placeholder="Email" type="email" value={authForm.email} onChange={e => setAuthForm(p => ({ ...p, email: e.target.value }))} style={inputSt} />
                <input placeholder="Password" type="password" value={authForm.password} onChange={e => setAuthForm(p => ({ ...p, password: e.target.value }))} style={inputSt} />
                <button onClick={() => { if (!authForm.email || !authForm.password) { addToast('Please fill all fields', 'error'); return; } setUser({ name: authForm.name || 'Trader', email: authForm.email, level: authForm.level || 'Beginner' }); addToast('Welcome to Labh! 🎉'); }} style={{ width: '100%', padding: 14, border: 'none', borderRadius: 10, background: 'linear-gradient(135deg,var(--accent),#6366f1)', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 8 }}>{authTab === 'login' ? 'Sign In' : 'Create Account'}</button>
                <div style={{ background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 8, padding: '10px 14px', fontSize: 11, color: 'var(--gold)', marginTop: 16, textAlign: 'center' }}>⚠️ Educational platform for learning stock market concepts. No real trading.</div>
            </div>
        </div>
        <Toast toasts={toasts} />
    </>;

    const filteredWL = watchlist.filter(s => s.toLowerCase().includes(wlSearch.toLowerCase()));
    const unwatched = ALL_SYMS.filter(s => !watchlist.includes(s)).slice(0, 4);
    const screenerStocks = Object.values(STOCKS_DATA).filter(s => scrSector === 'All' || s.sector === scrSector).sort((a, b) => scrSort === 'change' ? Math.abs(b.change) - Math.abs(a.change) : scrSort === 'price' ? b.price - a.price : a.sym.localeCompare(b.sym));
    const movers = [...Object.values(STOCKS_DATA)].sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 4);
    const trending = [...Object.values(STOCKS_DATA)].sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 6);

    /* ─── MAIN LAYOUT ─── */
    return <>
        <style dangerouslySetInnerHTML={{ __html: STYLE_TEXT }} />
        <Toast toasts={toasts} />
        {tradeModal && <TradeModal stock={STOCKS_DATA[tradeModal.sym]} action={tradeModal.action} onClose={() => setTradeModal(null)} onConfirm={handleTrade} />}

        {/* TOPBAR */}
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 50, background: 'var(--sidebar)', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', padding: '0 16px', zIndex: 1000, gap: 12 }}>
            <button onClick={() => setMobileMenu(!mobileMenu)} style={{ display: 'none', background: 'none', border: 'none', color: 'var(--text)', fontSize: 22, cursor: 'pointer', padding: 4, ...(isMobileCheck() ? { display: 'block' } : {}) }} id="hamburger-btn">☰</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <img src="/logo.png.png" alt="Labh" style={{ width: 26, height: 26, objectFit: 'contain' }} />
                <span style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, background: 'linear-gradient(135deg,var(--accent),var(--green))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Labh</span>
            </div>
            <div className="topbar-ticker" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 20, fontSize: 12, color: 'var(--muted)', overflow: 'hidden' }}>
                <span>Nifty 50 <strong style={{ color: 'var(--red)', fontFamily: 'var(--font-head)' }}>25,178.65</strong> <span style={{ color: 'var(--red)' }}>▼ 1.25%</span></span>
                <span className="hide-mobile">Sensex <strong style={{ color: 'var(--red)', fontFamily: 'var(--font-head)' }}>81,287.19</strong> <span style={{ color: 'var(--red)' }}>▼ 1.17%</span></span>
            </div>
            <button onClick={() => setAiOpen(!aiOpen)} style={{ background: aiOpen ? 'rgba(59,130,246,.2)' : 'transparent', border: '1px solid var(--accent)', borderRadius: 8, padding: '6px 14px', color: 'var(--accent)', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }} id="ai-toggle-btn">{aiLoading ? <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }} /> : '✨'} Vibe AI</button>
            <Avatar name={user.name} size={30} idx={2} />
            <button onClick={() => { setUser(null); setPortfolio([]); setTrades([]); setAiMessages([]); }} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18, flexShrink: 0 }} title="Logout">⏻</button>
        </div>

        {/* MOBILE DRAWER */}
        {mobileMenu && <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)' }} onClick={() => setMobileMenu(false)}>
            <div onClick={e => e.stopPropagation()} style={{ width: 280, height: '100%', background: 'var(--sidebar)', padding: '60px 16px 16px', overflowY: 'auto', animation: 'slideInRight .25s ease' }}>
                <div style={{ marginBottom: 20, fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>Navigation</div>
                {navItems.map(n => <div key={n.id} onClick={() => { setTab(n.id); setMobileMenu(false); }} style={{ padding: '12px 14px', borderRadius: 8, marginBottom: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, background: tab === n.id ? 'rgba(59,130,246,.1)' : 'transparent', borderLeft: tab === n.id ? '3px solid var(--accent)' : '3px solid transparent', color: tab === n.id ? 'var(--text)' : 'var(--muted)', fontSize: 14 }}><span>{n.emoji}</span>{n.label}</div>)}
                <div style={{ marginTop: 24, marginBottom: 12, fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>Watchlist ({watchlist.length}/250)</div>
                {watchlist.map(s => {
                    const st = STOCKS_DATA[s]; return <div key={s} onClick={() => { selectStock(s); setMobileMenu(false); }} style={{ padding: '8px 10px', borderRadius: 6, marginBottom: 2, cursor: 'pointer', fontSize: 13, display: 'flex', justifyContent: 'space-between', background: selSym === s ? 'rgba(59,130,246,.08)' : 'transparent' }}>
                        <span style={{ fontWeight: 600 }}>{s}</span>
                        <span style={{ color: st.change >= 0 ? 'var(--green)' : 'var(--red)' }}>{st.change >= 0 ? '+' : ''}{st.change}%</span>
                    </div>;
                })}
            </div>
        </div>}

        <div style={{ display: 'flex', paddingTop: 50, minHeight: '100vh' }}>
            {/* LEFT NAV SIDEBAR */}
            <div className="left-sidebar" style={{ width: 200, background: 'var(--sidebar)', borderRight: '1px solid rgba(255,255,255,.05)', padding: '16px 0', display: 'flex', flexDirection: 'column', position: 'fixed', top: 50, bottom: 0, left: 0, overflowY: 'auto', ...(isMobileCheck() ? { display: 'none' } : {}) }}>
                <div style={{ flex: 1 }}>
                    {navItems.map(n => <div key={n.id} onClick={() => setTab(n.id)} style={{ padding: '12px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, borderLeft: tab === n.id ? '3px solid var(--accent)' : '3px solid transparent', background: tab === n.id ? 'rgba(59,130,246,.08)' : 'transparent', color: tab === n.id ? 'var(--text)' : 'var(--muted)', fontSize: 14, transition: 'all .15s' }}><span style={{ fontSize: 18 }}>{n.emoji}</span>{n.label}</div>)}
                </div>
                <div style={{ margin: '0 16px', padding: 14, background: 'rgba(16,208,122,.08)', border: '1px solid rgba(16,208,122,.2)', borderRadius: 12 }}>
                    <div style={{ fontSize: 11, color: 'var(--green)', marginBottom: 4 }}>Portfolio Value</div>
                    <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, color: 'var(--green)' }}>₹{totalCurrent ? totalCurrent.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '0'}</div>
                    <div style={{ fontSize: 11, color: totalPnl >= 0 ? 'var(--green)' : 'var(--red)', marginTop: 2 }}>{totalPnl >= 0 ? '+' : ''}₹{totalPnl.toFixed(0)} ({totalPnlPct.toFixed(2)}%)</div>
                </div>
            </div>

            {/* WATCHLIST SIDEBAR */}
            <div className="wl-sidebar" style={{ width: 220, background: 'var(--sidebar)', borderRight: '1px solid rgba(255,255,255,.05)', position: 'fixed', top: 50, bottom: 0, left: 200, overflowY: 'auto', padding: 0, ...(isMobileCheck() ? { display: 'none' } : {}) }}>
                <div style={{ padding: '12px 12px 8px' }}>
                    <div style={{ position: 'relative' }}><span style={{ position: 'absolute', left: 10, top: 9, color: 'var(--muted)', fontSize: 14 }}>🔍</span><input placeholder="Search stocks..." value={wlSearch} onChange={e => setWlSearch(e.target.value)} style={{ width: '100%', padding: '8px 8px 8px 32px', background: 'var(--bg)', border: '1px solid rgba(75,90,128,.3)', borderRadius: 8, color: 'var(--text)', fontSize: 13 }} /></div>
                </div>
                <div style={{ padding: '4px 12px 8px', fontSize: 12, color: 'var(--muted)' }}>Watchlist <span style={{ color: 'var(--text)' }}>{watchlist.length}</span> of 250</div>
                {filteredWL.map(s => {
                    const st = STOCKS_DATA[s]; const chgAmt = (st.price * st.change / 100).toFixed(2); return <div key={s} onClick={() => selectStock(s)} style={{ padding: '10px 12px', cursor: 'pointer', borderLeft: selSym === s ? '3px solid var(--accent)' : '3px solid transparent', background: selSym === s ? 'rgba(59,130,246,.06)' : 'transparent', transition: 'all .12s' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div><span style={{ fontWeight: 600, fontSize: 13 }}>{st.sym}</span><ExchangeBadge ex={st.exchange} /></div>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{ color: st.change >= 0 ? 'var(--green)' : 'var(--red)', fontSize: 12, fontWeight: 600 }}>{st.change >= 0 ? '+' : ''}{chgAmt}</span>
                                <span style={{ color: st.change >= 0 ? 'var(--green)' : 'var(--red)', fontSize: 11, marginLeft: 4 }}>({st.change >= 0 ? '+' : ''}{st.change}%)</span>
                            </div>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>₹{st.price.toFixed(2)}</div>
                    </div>;
                })}
                {unwatched.length > 0 && <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,.05)' }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>+ Add to Watchlist</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{unwatched.map(s => <button key={s} onClick={() => { setWatchlist(p => [...p, s]); addToast(`${s} added to watchlist`, 'info'); }} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--muted)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontSize: 11 }}>{s}</button>)}</div>
                </div>}
            </div>

            {/* MAIN CONTENT AREA */}
            <div style={{ marginLeft: isMobileCheck() ? 0 : 420, flex: 1, padding: isMobileCheck() ? '12px 12px 80px' : '24px', marginRight: aiOpen && !isMobileCheck() ? 380 : 0, transition: 'margin .3s', minHeight: 'calc(100vh - 50px)' }}>
                {/* ─── DASHBOARD TAB ─── */}
                {tab === 'dashboard' && <div className="fade-in">
                    <div style={{ background: 'linear-gradient(135deg,rgba(59,130,246,.15),rgba(99,102,241,.1))', border: '1px solid rgba(59,130,246,.2)', borderRadius: 16, padding: '24px 28px', marginBottom: 24 }}>
                        <div style={{ fontSize: 14, color: 'var(--muted)' }}>Welcome back,</div>
                        <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 24, marginTop: 4 }}>Hi, {user.name} 👋</h2>
                        <div style={{ marginTop: 12, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                            <div><div style={{ fontSize: 12, color: 'var(--muted)' }}>Portfolio Value</div><div style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 700 }}>₹{totalCurrent ? totalCurrent.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '0'}</div></div>
                            <div><div style={{ fontSize: 12, color: 'var(--muted)' }}>Total P&L</div><div style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 700, color: totalPnl >= 0 ? 'var(--green)' : 'var(--red)' }}>{totalPnl >= 0 ? '+' : ''}₹{totalPnl.toFixed(0)} <span style={{ fontSize: 14 }}>({totalPnlPct.toFixed(2)}%)</span></div></div>
                        </div>
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 16, marginBottom: 12 }}>🔥 Trending Stocks</h3>
                    <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 12, marginBottom: 24 }}>
                        {trending.map(s => <div key={s.sym} className="card-hover" onClick={() => selectStock(s.sym)} style={{ minWidth: 180, background: 'var(--card)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 14, padding: 16, cursor: 'pointer', flexShrink: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                                <div><div style={{ fontWeight: 700, fontSize: 15 }}>{s.sym}</div><div style={{ fontSize: 11, color: 'var(--muted)' }}>{s.sector}</div></div>
                                <ChangeBadge change={s.change} />
                            </div>
                            <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>₹{s.price.toFixed(2)}</div>
                            <Sparkline data={getSpark(s.sym)} color={s.change >= 0 ? 'var(--green)' : 'var(--red)'} w={140} h={32} />
                        </div>)}
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 16, marginBottom: 12 }}>📈 Portfolio Performance (60 Days)</h3>
                    <div style={{ background: 'var(--card)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 14, padding: 16, marginBottom: 24 }}><AreaChart data={PORTFOLIO_HISTORY} w={900} h={200} /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobileCheck() ? '1fr' : '1fr 1fr', gap: 20 }}>
                        <div style={{ background: 'var(--card)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 14, padding: 20 }}>
                            <h4 style={{ fontFamily: 'var(--font-head)', fontSize: 15, marginBottom: 14 }}>📊 Today's Biggest Movers</h4>
                            {movers.map(s => <div key={s.sym} onClick={() => selectStock(s.sym)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,.04)', cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontSize: 18 }}>{s.change >= 0 ? '🟢' : '🔴'}</span><div><div style={{ fontWeight: 600, fontSize: 14 }}>{s.sym}</div><div style={{ fontSize: 11, color: 'var(--muted)' }}>{s.sector}</div></div></div>
                                <ChangeBadge change={s.change} />
                            </div>)}
                        </div>
                        <div style={{ background: 'var(--card)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <h4 style={{ fontFamily: 'var(--font-head)', fontSize: 15, marginBottom: 14, alignSelf: 'flex-start' }}>💰 Portfolio Statistics</h4>
                            <DonutChart invested={totalInvested || 500000} current={totalCurrent || 575000} />
                            <div style={{ display: 'flex', gap: 20, marginTop: 16, fontSize: 12 }}>
                                <div><span style={{ color: 'var(--muted)' }}>Invested: </span><span>₹{(totalInvested || 500000).toLocaleString('en-IN')}</span></div>
                                <div><span style={{ color: 'var(--muted)' }}>Current: </span><span>₹{(totalCurrent || 575000).toLocaleString('en-IN')}</span></div>
                            </div>
                        </div>
                    </div>
                </div>}

                {/* ─── CHART TAB ─── */}
                {tab === 'chart' && <div className="fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><h2 style={{ fontFamily: 'var(--font-head)', fontSize: 24, fontWeight: 800 }}>{stock.sym}</h2><ExchangeBadge ex={stock.exchange} /><ChangeBadge change={stock.change} /></div>
                            <div style={{ fontFamily: 'var(--font-head)', fontSize: 36, fontWeight: 700, marginTop: 4 }}>₹{stock.price.toFixed(2)}</div>
                            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>O: ₹{(stock.price * 0.998).toFixed(2)} H: ₹{(stock.price * 1.012).toFixed(2)} L: ₹{(stock.price * 0.991).toFixed(2)} C: ₹{stock.price.toFixed(2)} V: 2.4M</div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => setTradeModal({ sym: selSym, action: 'BUY' })} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: 'var(--green)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>BUY</button>
                            <button onClick={() => setTradeModal({ sym: selSym, action: 'SELL' })} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: 'var(--red)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>SELL</button>
                        </div>
                    </div>
                    {/* Vibe Meter */}
                    <div style={{ background: 'linear-gradient(90deg, rgba(8,11,20,1) 0%, rgba(15,22,40,1) 100%)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 20 }}>
                        <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 80 }}>
                            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Vibe Score</div>
                            <div style={{ fontFamily: 'var(--font-head)', fontSize: 32, fontWeight: 800, color: vibeLoading ? 'var(--muted)' : (vibeScore?.score > 60 ? 'var(--green)' : vibeScore?.score < 40 ? 'var(--red)' : 'var(--gold)') }}>
                                {vibeLoading ? '...' : (vibeScore?.score || '--')}
                            </div>
                        </div>
                        <div style={{ flex: 1, paddingLeft: 20, borderLeft: '1px solid rgba(255,255,255,.1)' }}>
                            <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>
                                {vibeLoading ? 'Analyzing market sentiment...' : (vibeScore?.summary || 'Select a stock to see its AI Vibe Score.')}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                        {['1D', '5D', '1M', '3M', '6M', '1Y'].map((l, i) => <button key={l} onClick={() => setChartRange(i)} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: chartRange === i ? 'var(--accent)' : 'rgba(75,90,128,.15)', color: chartRange === i ? '#fff' : 'var(--muted)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>{l}</button>)}
                    </div>
                    <div style={{ background: 'var(--card)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 14, padding: 12, height: isMobileCheck() ? 300 : 460 }}>
                        <CandlestickChart sym={selSym} rangeIdx={chartRange} />
                    </div>
                    {/* Time Machine Backtester */}
                    <div style={{ background: 'var(--card)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 14, padding: 20, marginTop: 20 }}>
                        <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 16, marginBottom: 12 }}>⏳ Time Machine (AI Backtester)</h3>
                        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                            <input
                                value={backtestInput}
                                onChange={e => setBacktestInput(e.target.value)}
                                placeholder={`e.g. "Buy ${selSym} when it drops 5% in a day"`}
                                style={{ flex: 1, padding: '10px 14px', background: 'var(--bg)', border: '1px solid rgba(75,90,128,.3)', borderRadius: 8, color: 'var(--text)', fontSize: 14 }}
                            />
                            <button
                                onClick={handleBacktest}
                                disabled={backtestLoading || !backtestInput}
                                style={{ padding: '0 20px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', fontWeight: 600, cursor: backtestLoading || !backtestInput ? 'not-allowed' : 'pointer', opacity: backtestLoading || !backtestInput ? 0.7 : 1 }}>
                                {backtestLoading ? 'Running...' : 'Run Simulation'}
                            </button>
                        </div>
                        {backtestResult && <div className="fade-in" style={{ background: 'rgba(59,130,246,.08)', border: '1px solid rgba(59,130,246,.2)', borderRadius: 12, padding: 16 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 12 }}>
                                <div><div style={{ fontSize: 12, color: 'var(--muted)' }}>Condition parsed</div><div style={{ fontWeight: 600 }}>{backtestResult.parsedCondition}</div></div>
                                <div><div style={{ fontSize: 12, color: 'var(--muted)' }}>Est. P&L (6m)</div><div style={{ fontWeight: 700, fontSize: 18, color: String(backtestResult.hypotheticalPnL).includes('-') ? 'var(--red)' : 'var(--green)' }}>{backtestResult.hypotheticalPnL}</div></div>
                                <div><div style={{ fontSize: 12, color: 'var(--muted)' }}>Trades Executed</div><div style={{ fontWeight: 600 }}>{backtestResult.tradesExecuted}</div></div>
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, borderTop: '1px solid rgba(255,255,255,.05)', paddingTop: 12 }}><strong>AI Analysis:</strong> {backtestResult.explanation}</div>
                        </div>}
                    </div>
                </div>}

                {/* ─── SCREENER TAB ─── */}
                {tab === 'screener' && <div className="fade-in">
                    <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 22, marginBottom: 16 }}>🔍 Stock Screener</h2>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                        <select value={scrSector} onChange={e => setScrSector(e.target.value)} style={{ ...inputSt, width: 'auto', marginBottom: 0 }}>{SECTORS.map(s => <option key={s} value={s}>{s}</option>)}</select>
                        <select value={scrSort} onChange={e => setScrSort(e.target.value)} style={{ ...inputSt, width: 'auto', marginBottom: 0 }}><option value="change">Sort by Change</option><option value="price">Sort by Price</option><option value="name">Sort by Name</option></select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobileCheck() ? '1fr' : 'repeat(auto-fill,minmax(260,1fr))', gap: 14 }}>
                        {screenerStocks.map(s => <div key={s.sym} className="card-hover" onClick={() => selectStock(s.sym)} style={{ background: 'var(--card)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 14, padding: 18, cursor: 'pointer' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <div><div style={{ fontWeight: 700, fontSize: 16 }}>{s.sym}</div><div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{s.name}</div></div>
                                <ChangeBadge change={s.change} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}><span style={{ fontSize: 10, padding: '2px 8px', background: 'rgba(99,102,241,.12)', color: '#818cf8', borderRadius: 4 }}>{s.sector}</span><ExchangeBadge ex={s.exchange} /></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginTop: 12 }}>
                                <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 700 }}>₹{s.price.toFixed(2)}</div>
                                <Sparkline data={getSpark(s.sym)} color={s.change >= 0 ? 'var(--green)' : 'var(--red)'} w={80} h={28} />
                            </div>
                        </div>)}
                    </div>
                </div>}

                {/* ─── PORTFOLIO TAB ─── */}
                {tab === 'portfolio' && <div className="fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 22, margin: 0 }}>💼 My Portfolio</h2>
                        {portfolio.length > 0 && <button
                            onClick={handleRoast}
                            disabled={roastLoading}
                            style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, var(--red), var(--gold))', color: '#fff', fontWeight: 700, cursor: roastLoading ? 'not-allowed' : 'pointer', fontSize: 13, display: 'flex', gap: 6, opacity: roastLoading ? 0.7 : 1 }}>
                            {roastLoading ? '🔥 Roasting...' : '🔥 Roast Me'}
                        </button>}
                    </div>
                    {roastData && <div className="fade-in" style={{ background: 'rgba(245,69,92,.08)', border: '1px solid rgba(245,69,92,.3)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <div style={{ fontWeight: 700, color: 'var(--red)', fontSize: 15 }}>🔥 AI Roast Results</div>
                            <div style={{ fontSize: 12, color: 'var(--red)', fontWeight: 600, background: 'rgba(245,69,92,.15)', padding: '2px 8px', borderRadius: 6 }}>Risk Score: {roastData.riskScore}/10</div>
                        </div>
                        <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text)' }}>{roastData.roastText}</div>
                    </div>}
                    {portfolio.length === 0 ? <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                        <div style={{ fontSize: 64, marginBottom: 16 }}>📂</div>
                        <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 20, marginBottom: 8 }}>No Holdings Yet</h3>
                        <p style={{ color: 'var(--muted)', marginBottom: 20 }}>Start building your portfolio by browsing the market</p>
                        <button onClick={() => setTab('screener')} style={{ padding: '12px 28px', borderRadius: 10, border: 'none', background: 'var(--accent)', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>Browse Market</button>
                    </div> : <>
                        <div style={{ display: 'grid', gap: 12 }}>
                            {portfolio.map(h => {
                                const s = STOCKS_DATA[h.sym]; const cv = s.price * h.qty; const pnl = cv - h.avg * h.qty; const pnlPct = ((s.price - h.avg) / h.avg * 100);
                                return <div key={h.sym} className="card-hover" style={{ background: 'var(--card)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 14, padding: 18 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(59,130,246,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: 'var(--accent)' }}>{h.sym.slice(0, 2)}</div>
                                            <div><div style={{ fontWeight: 700, fontSize: 16 }}>{h.sym}</div><div style={{ fontSize: 12, color: 'var(--muted)' }}>{h.qty} shares · Avg ₹{h.avg.toFixed(2)}</div></div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700 }}>₹{cv.toFixed(0)}</div>
                                            <div style={{ color: pnl >= 0 ? 'var(--green)' : 'var(--red)', fontSize: 13 }}>{pnl >= 0 ? '+' : ''}₹{pnl.toFixed(0)} ({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%)</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button onClick={() => setTradeModal({ sym: h.sym, action: 'BUY' })} style={{ padding: '6px 16px', borderRadius: 6, border: 'none', background: 'var(--green)', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 12 }}>BUY</button>
                                            <button onClick={() => setTradeModal({ sym: h.sym, action: 'SELL' })} style={{ padding: '6px 16px', borderRadius: 6, border: 'none', background: 'var(--red)', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 12 }}>SELL</button>
                                        </div>
                                    </div>
                                </div>;
                            })}
                        </div>
                        {trades.length > 0 && <><h3 style={{ fontFamily: 'var(--font-head)', fontSize: 16, marginTop: 28, marginBottom: 12 }}>📋 Trade History</h3>
                            <div style={{ background: 'var(--card)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 14, overflow: 'hidden' }}>
                                {trades.map((t, i) => <div key={i} style={{ padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                                    <div><span style={{ color: t.action === 'BUY' ? 'var(--green)' : 'var(--red)', fontWeight: 700, marginRight: 8 }}>{t.action}</span>{t.sym} × {t.qty}</div>
                                    <div style={{ color: 'var(--muted)' }}>₹{t.price.toFixed(2)} · {t.time}</div>
                                </div>)}
                            </div>
                        </>}
                    </>}
                </div>}

                {/* ─── LEARN TAB ─── */}
                {tab === 'learn' && <div className="fade-in">
                    <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 22, marginBottom: 16 }}>🎓 Trading Academy</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobileCheck() ? '1fr' : 'repeat(auto-fill,minmax(300,1fr))', gap: 16, marginBottom: 40 }}>
                        {LEARN_TOPICS.map(t => <div key={t.title} className="card-hover" style={{ background: 'var(--card)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 14, padding: 20 }}>
                            <div style={{ fontSize: 32, marginBottom: 10 }}>{t.emoji}</div>
                            <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 17, marginBottom: 4 }}>{t.title}</h3>
                            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 10, lineHeight: 1.5 }}>{t.desc}</p>
                            <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 6, background: t.diff === 'Beginner' ? 'rgba(16,208,122,.1)' : t.diff === 'Intermediate' ? 'rgba(245,158,11,.1)' : 'rgba(245,69,92,.1)', color: t.diff === 'Beginner' ? 'var(--green)' : t.diff === 'Intermediate' ? 'var(--gold)' : 'var(--red)', fontWeight: 600, marginBottom: 12, display: 'inline-block' }}>{t.diff}</span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                                {t.prompts.map(p => <button key={p} onClick={() => { setAiOpen(true); setTimeout(() => sendAI(p), 100); }} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid rgba(59,130,246,.25)', background: 'rgba(59,130,246,.06)', color: 'var(--accent)', cursor: 'pointer', fontSize: 11 }}>{p}</button>)}
                            </div>
                        </div>)}
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 18, marginBottom: 16 }}>✨ Why Labh is Different</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobileCheck() ? '1fr' : 'repeat(3,1fr)', gap: 14 }}>
                        {[{ e: '🤖', t: 'AI-Powered Analysis', d: 'Unlike Groww & Zerodha, get instant AI insights on any stock' }, { e: '🎓', t: 'Built for Learning', d: 'Every feature is designed to educate, not just execute trades' }, { e: '🇮🇳', t: 'India-First Design', d: 'Built specifically for NSE, BSE with Indian market context' }, { e: '📊', t: 'Advanced Charts', d: 'TradingView-quality charts without the complexity' }, { e: '🛡️', t: 'Risk Awareness', d: 'Every AI response includes disclaimers for responsible investing' }, { e: '🆓', t: 'Free Forever', d: 'No hidden charges, no premium plans needed' }].map(f => <div key={f.t} style={{ background: 'var(--card)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, padding: 18 }}>
                            <div style={{ fontSize: 24, marginBottom: 8 }}>{f.e}</div>
                            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{f.t}</div>
                            <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{f.d}</div>
                        </div>)}
                    </div>
                </div>}

                {/* ─── REVIEWS TAB ─── */}
                {tab === 'reviews' && <div className="fade-in">
                    <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 22, marginBottom: 16 }}>⭐ User Reviews</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24, flexWrap: 'wrap' }}>
                        <div style={{ fontFamily: 'var(--font-head)', fontSize: 48, fontWeight: 800 }}>4.5</div>
                        <div><StarRating rating={4.5} size={22} /><div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{reviews.length + 1} reviews</div></div>
                    </div>
                    {!hasReviewed && <div style={{ background: 'var(--card)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 14, padding: 20, marginBottom: 24 }}>
                        <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 16, marginBottom: 12 }}>Submit Your Review</h3>
                        <div style={{ marginBottom: 12 }}><StarRating rating={myRating} onRate={setMyRating} size={32} interactive /></div>
                        <textarea placeholder="Share your experience with Labh..." value={myReview} onChange={e => setMyReview(e.target.value)} rows={3} style={{ ...inputSt, resize: 'vertical', marginBottom: 12 }} />
                        <button onClick={() => { if (!myRating) { addToast('Please select a rating', 'error'); return; } setReviews(p => [{ name: user.name, level: user.level, rating: myRating, text: myReview || 'Great platform!', date: 'Just now' }, ...p]); setHasReviewed(true); addToast('Review submitted! 🌟'); }} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>Submit Review</button>
                    </div>}
                    <div style={{ display: 'grid', gap: 14 }}>
                        {reviews.map((r, i) => <div key={i} className="card-hover" style={{ background: 'var(--card)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 14, padding: 18 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                                <Avatar name={r.name} size={38} idx={i} />
                                <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</div><div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}><span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(99,102,241,.12)', color: '#818cf8' }}>{r.level}</span><span style={{ fontSize: 11, color: 'var(--muted)' }}>{r.date}</span></div></div>
                                <StarRating rating={r.rating} size={14} />
                            </div>
                            <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6, opacity: .9 }}>{r.text}</p>
                        </div>)}
                    </div>
                </div>}

                {/* ─── LEADERBOARD TAB ─── */}
                {tab === 'leaderboard' && <div className="fade-in">
                    <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 22, marginBottom: 16 }}>🏆 Global Leaderboard</h2>
                    <div style={{ background: 'var(--card)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 14, overflow: 'hidden' }}>
                        {leaderboardLoading ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Loading top traders...</div> : leaderboard.length === 0 ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>No data to display. Run some trades first!</div> : leaderboard.map((u, i) => (
                            <div key={u._id || i} style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,.04)', display: 'flex', alignItems: 'center', gap: 16, background: u.name === user?.name ? 'rgba(59,130,246,.1)' : 'transparent' }}>
                                <div style={{ width: 30, textAlign: 'center', fontSize: i < 3 ? 24 : 16, fontWeight: 700, color: i === 0 ? 'var(--gold)' : i === 1 ? '#e2e8f0' : i === 2 ? '#b45309' : 'var(--muted)' }}>{i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${i + 1}`}</div>
                                <Avatar name={u.name || 'Trader'} size={40} idx={i} />
                                <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 16 }}>{u.name || 'Trader'} {u.name === user?.name && <span style={{ fontSize: 10, padding: '2px 6px', background: 'var(--accent)', color: '#fff', borderRadius: 4, marginLeft: 8 }}>YOU</span>}</div></div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, color: 'var(--green)' }}>₹{(u.netWorth || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>Net Worth</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>}

                {/* ─── SAFETY INTERLOCKS TAB ─── */}
                {tab === 'safety' && <div className="fade-in">
                    <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 22, marginBottom: 16 }}>🛡️ Safety Interlocks</h2>
                    <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>Set up logic-based rules to protect your portfolio from emotional trading. Our automated Cron job checks your portfolio every 5 minutes against your safety thresholds.</p>

                    <div style={{ display: 'grid', gridTemplateColumns: isMobileCheck() ? '1fr' : '1fr 1fr', gap: 20 }}>
                        <div style={{ background: 'var(--card)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 14, padding: 20 }}>
                            <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 16, marginBottom: 16 }}>+ Create New Rule</h3>
                            <label style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, display: 'block' }}>If this condition occurs...</label>
                            <select value={ruleForm.conditionType} onChange={e => setRuleForm({ ...ruleForm, conditionType: e.target.value })} style={inputSt}>
                                <option value="PORTFOLIO_DROP">Overall Portfolio Value Drops Below (₹)</option>
                                <option value="SINGLE_STOCK_DROP" disabled>Single Stock Drops By Percentage (Coming Soon)</option>
                            </select>

                            <label style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, display: 'block', marginTop: 12 }}>Threshold Amount (₹)</label>
                            <input type="number" value={ruleForm.thresholdValue} onChange={e => setRuleForm({ ...ruleForm, thresholdValue: Number(e.target.value) })} style={inputSt} />

                            <label style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, display: 'block', marginTop: 12 }}>...Then take this action</label>
                            <select value={ruleForm.action} onChange={e => setRuleForm({ ...ruleForm, action: e.target.value })} style={inputSt}>
                                <option value="LOCK_BUYING">Lock All Buying (24h Cool-off)</option>
                                <option value="LIQUIDATE_ALL" disabled>Liquidate Portfolio (Coming Soon)</option>
                            </select>

                            <button onClick={handleCreateRule} disabled={rulesLoading} style={{ width: '100%', padding: '12px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', fontWeight: 600, cursor: rulesLoading ? 'not-allowed' : 'pointer', marginTop: 8 }}>
                                {rulesLoading ? 'Saving...' : 'Activate Rule'}
                            </button>
                        </div>

                        <div>
                            <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 16, marginBottom: 16 }}>Active Restrictions</h3>
                            {myRules.length === 0 ? <div style={{ padding: 40, textAlign: 'center', background: 'var(--card)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 14 }}>
                                <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
                                <div style={{ color: 'var(--muted)', fontSize: 13 }}>No safety locks enabled.</div>
                            </div> : myRules.map(r => (
                                <div key={r._id} style={{ background: 'var(--card)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 14, padding: 16, marginBottom: 12, borderLeft: '3px solid var(--accent)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                        <div style={{ fontWeight: 600, fontSize: 14 }}>{r.conditionType.replace('_', ' ')}</div>
                                        <div style={{ fontSize: 11, padding: '2px 8px', background: 'rgba(59,130,246,.1)', color: 'var(--accent)', borderRadius: 4 }}>ACTIVE</div>
                                    </div>
                                    <div style={{ fontSize: 13, color: 'var(--muted)' }}>Threshold: <strong style={{ color: 'var(--text)' }}>₹{r.thresholdValue}</strong></div>
                                    <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Action: <strong style={{ color: 'var(--red)' }}>{r.action.replace('_', ' ')}</strong></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>}
            </div>

            {/* ─── AI PANEL ─── */}
            {aiOpen && <div style={{ position: 'fixed', right: 0, width: isMobileCheck() ? '100%' : 380, background: 'var(--sidebar)', borderLeft: '1px solid rgba(255,255,255,.06)', display: 'flex', flexDirection: 'column', zIndex: 1500, animation: isMobileCheck() ? 'slideUp .3s ease' : 'slideInRight .3s ease', ...(isMobileCheck() ? { bottom: 0, top: '40%', borderRadius: '16px 16px 0 0', borderTop: '1px solid rgba(255,255,255,.1)' } : { top: 50, bottom: 0 }) }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 22, background: 'linear-gradient(135deg,var(--accent),#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>✨</span>
                    <div style={{ flex: 1 }}><div style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700 }}>TradeVibe AI</div><div style={{ fontSize: 11, color: 'var(--muted)' }}>Not financial advice</div></div>
                    {aiMessages.length > 0 && <button onClick={clearChat} title="Clear chat" style={{ background: 'none', border: '1px solid rgba(75,90,128,.3)', borderRadius: 6, color: 'var(--muted)', fontSize: 12, cursor: 'pointer', padding: '4px 10px' }}>🗑️ Clear</button>}
                    <button onClick={() => setAiOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 20, cursor: 'pointer' }}>✕</button>
                </div>
                <div style={{ background: 'rgba(245,158,11,.08)', borderBottom: '1px solid rgba(245,158,11,.15)', padding: '8px 18px', fontSize: 11, color: 'var(--gold)', flexShrink: 0 }}>⚠️ AI analysis is educational only and is not SEBI-registered financial advice. AI can make mistakes.</div>
                <div ref={aiRef} style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
                    {aiMessages.length === 0 && <div style={{ padding: '20px 0' }}>
                        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>Ask me anything about Indian stocks! I'm TradeVibe AI, your market analysis assistant.</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {[`Analyze ${selSym} for me`, 'Explain RSI and how to use it', 'What is the PE ratio and why does it matter', 'Should I diversify my portfolio?', 'What are the risks of investing right now?', 'Explain support and resistance levels', 'How do I read candlestick patterns?', 'What is FII and DII activity?'].map(p => <button key={p} onClick={() => sendAI(p)} disabled={aiLoading} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(59,130,246,.2)', background: 'rgba(59,130,246,.06)', color: 'var(--accent)', cursor: aiLoading ? 'not-allowed' : 'pointer', fontSize: 12, opacity: aiLoading ? 0.5 : 1, textAlign: 'left' }}>{p}</button>)}
                        </div>
                    </div>}
                    {aiMessages.map((m, i) => <div key={i} style={{ marginBottom: 14, display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                        <div style={{ maxWidth: '88%' }}>
                            {m.role === 'assistant' && <div style={{ fontSize: 10, color: 'var(--accent)', marginBottom: 4, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>🤖 TradeVibe AI {m.time && <span style={{ color: 'var(--muted)', fontWeight: 400 }}>· {m.time}</span>}</div>}
                            {m.role === 'error' && <div style={{ fontSize: 10, color: 'var(--red)', marginBottom: 4, fontWeight: 600 }}>⚠️ Connection Error {m.time && <span style={{ color: 'var(--muted)', fontWeight: 400 }}>· {m.time}</span>}</div>}
                            <div style={{ padding: '10px 14px', borderRadius: 12, background: m.role === 'user' ? 'rgba(59,130,246,.15)' : m.role === 'error' ? 'rgba(245,69,92,.08)' : 'var(--card)', border: `1px solid ${m.role === 'user' ? 'rgba(59,130,246,.2)' : m.role === 'error' ? 'rgba(245,69,92,.2)' : 'rgba(255,255,255,.06)'}`, fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: m.text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />
                            {m.role === 'error' && <button onClick={() => retryLastMessage(m.failedMsg)} disabled={aiLoading} style={{ marginTop: 6, padding: '6px 14px', borderRadius: 6, border: '1px solid var(--accent)', background: 'rgba(59,130,246,.1)', color: 'var(--accent)', cursor: aiLoading ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600 }}>🔄 Retry</button>}
                            {m.role === 'user' && m.time && <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3, textAlign: 'right' }}>{m.time}</div>}
                        </div>
                    </div>)}
                    {aiLoading && <div style={{ marginBottom: 12 }}><div style={{ fontSize: 10, color: 'var(--accent)', marginBottom: 4, fontWeight: 600 }}>🤖 TradeVibe AI</div><div style={{ display: 'inline-flex', gap: 6, padding: '12px 16px', background: 'var(--card)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12 }}>{[0, 1, 2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', animation: `pulse 1s ease ${i * 0.2}s infinite` }} />)}</div></div>}
                    <div ref={msgEndRef} />
                </div>
                {aiMessages.some(m => m.role === 'assistant') && <div style={{ padding: '0 14px 8px' }}><button onClick={() => setTradeModal({ sym: selSym, action: 'BUY' })} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid var(--green)', background: 'rgba(16,208,122,.08)', color: 'var(--green)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>📈 Trade {selSym}</button></div>}
                <div style={{ padding: 14, borderTop: '1px solid rgba(255,255,255,.06)', display: 'flex', gap: 8 }}>
                    <textarea value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAI(); } }} placeholder={`Ask me anything about ${selSym} — or type in any language...`} rows={1} disabled={aiLoading} style={{ flex: 1, padding: '10px 14px', background: 'var(--bg)', border: '1px solid rgba(75,90,128,.3)', borderRadius: 10, color: 'var(--text)', fontSize: 13, resize: 'none', opacity: aiLoading ? 0.5 : 1 }} />
                    <button onClick={() => sendAI()} disabled={aiLoading || !aiInput.trim()} style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: (aiLoading || !aiInput.trim()) ? 'rgba(59,130,246,.4)' : 'var(--accent)', color: '#fff', cursor: (aiLoading || !aiInput.trim()) ? 'not-allowed' : 'pointer', fontSize: 16, flexShrink: 0 }}>{aiLoading ? <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }} /> : '➤'}</button>
                </div>
            </div>}
        </div>

        {/* MOBILE BOTTOM NAV */}
        {isMobileCheck() && <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 60, background: 'var(--sidebar)', borderTop: '1px solid rgba(255,255,255,.08)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 1000 }}>
            {[{ id: 'dashboard', e: '📊' }, { id: 'chart', e: '📈' }, { id: 'portfolio', e: '💼' }, { id: 'reviews', e: '⭐' }].map(n => <button key={n.id} onClick={() => setTab(n.id)} style={{ background: 'none', border: 'none', color: tab === n.id ? 'var(--accent)' : 'var(--muted)', fontSize: 22, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}><span>{n.e}</span><span style={{ fontSize: 9 }}>{n.id.charAt(0).toUpperCase() + n.id.slice(1)}</span></button>)}
            <button onClick={() => setAiOpen(!aiOpen)} style={{ background: 'none', border: 'none', color: aiOpen ? 'var(--accent)' : 'var(--muted)', fontSize: 22, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}><span>✨</span><span style={{ fontSize: 9 }}>AI</span></button>
        </div>}
    </>;
}

function isMobileCheck() { return typeof window !== 'undefined' && window.innerWidth < 768; }

const inputSt = { width: '100%', padding: '10px 14px', background: 'var(--bg)', border: '1px solid rgba(75,90,128,.3)', borderRadius: 8, color: 'var(--text)', fontSize: 14, marginBottom: 12 };
