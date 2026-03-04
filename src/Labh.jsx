import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createChart, CrosshairMode } from 'lightweight-charts';
import Footer from './Footer';

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

function genCandles(base, n = 60) { const d = []; let o = base; for (let i = n - 1; i >= 0; i--) { const c = o * (1 + (Math.random() - 0.48) * 0.03); const h = Math.max(o, c) * (1 + Math.random() * 0.012); const l = Math.min(o, c) * (1 - Math.random() * 0.012); const v = Math.floor(5e5 + Math.random() * 3e6); const timeStr = new Date(Date.now() - 864e5 * i).toISOString().split('T')[0]; d.push({ open: +o.toFixed(2), high: +h.toFixed(2), low: +l.toFixed(2), close: +c.toFixed(2), value: v, time: timeStr }); o = c; } return d; }
function genArea(days = 60) { const d = []; let v = 1250000; for (let i = 0; i < days; i++) { v += v * (Math.random() - 0.47) * 0.015; d.push({ date: new Date(Date.now() - 864e5 * (days - i)).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), value: +v.toFixed(2) }); } return d; }
function genSparkline(base, n = 20) { const d = []; let v = base; for (let i = 0; i < n; i++) { v += v * (Math.random() - 0.48) * 0.02; d.push(+v.toFixed(2)); } return d; }

const CANDLE_CACHE_V2 = {};
function getCandles(sym, n = 60) { if (!CANDLE_CACHE_V2[sym + n]) CANDLE_CACHE_V2[sym + n] = genCandles(STOCKS_DATA[sym].price, n); return CANDLE_CACHE_V2[sym + n]; }
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
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{--bg:#0B0C0E;--card:#16181C;--sidebar:#16181C;--accent:#3b82f6;--green:#00FFA3;--red:#FF4B55;--gold:#F7931A;--text:#FFFFFF;--muted:#8E929B;--font-head:'Inter',sans-serif;--font-body:'Inter',sans-serif;--font-mono:'JetBrains Mono',monospace;}
html,body{min-height:100vh;height:100%;}#root{min-height:100vh;}
body{background:var(--bg);color:var(--text);font-family:var(--font-body);overflow-x:hidden;}
::-webkit-scrollbar{width:6px;}::-webkit-scrollbar-track{background:#000000;}::-webkit-scrollbar-thumb{background:#2A2A2A;border-radius:3px;}
input,textarea,select,button{font-family:var(--font-body);outline:none;}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideInRight{from{transform:translateX(100%)}to{transform:translateX(0)}}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes toastIn{from{transform:translateX(120%);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes toastOut{from{transform:translateX(0);opacity:1}to{transform:translateX(120%);opacity:0}}
@keyframes glowPulse{0%,100%{text-shadow:0 0 8px rgba(59,130,246,.4),0 0 16px rgba(139,92,246,.3);opacity:.7}50%{text-shadow:0 0 16px rgba(59,130,246,.8),0 0 32px rgba(139,92,246,.6);opacity:1}}
@keyframes scanline{0%{transform:translateY(-100%)}100%{transform:translateY(100%)}}
@keyframes terminalBlink{0%,100%{opacity:1}50%{opacity:0}}
.fade-in{animation:fadeIn .4s ease both;}
.card-hover{transition:transform .2s,border-color .2s;}.card-hover:hover{border-color:rgba(255,255,255,.2);}
.glass-card{transition:all .3s ease;border:1px solid #2A2A2A;}.glass-card:hover{border-color:rgba(16,208,122,.5) !important;box-shadow:0 0 15px rgba(16,208,122,.1),0 4px 20px rgba(16,208,122,.05);transform:translateY(-2px);}
.ai-pulse{animation:glowPulse 1.5s ease-in-out infinite;}
.chat-scroll::-webkit-scrollbar{width:4px;}.chat-scroll::-webkit-scrollbar-track{background:transparent;}.chat-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,.08);border-radius:2px;}.chat-scroll::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,.15);}
.chip-btn{transition:all .3s ease;}.chip-btn:hover{border-color:#10D07A !important;color:#10D07A !important;background:rgba(16,208,122,.1) !important;}
.cmd-bar{transition:all .2s ease;}.cmd-bar:focus-within{border-color:#10D07A !important;box-shadow:0 0 0 1px rgba(16,208,122,.5);}
.send-btn{transition:background .2s ease;}.send-btn:hover:not(:disabled){background:#0eac64 !important;}
`;

export const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(val || 0);
};

/* ─── SMALL COMPONENTS ─── */
const Sparkline = ({ data, color = '#10d07a', w = 72, h = 32 }) => { if (!data || !data.length) return null; const mn = Math.min(...data), mx = Math.max(...data), r = mx - mn || 1; const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - mn) / r) * h}`).join(' '); return <svg width={w} height={h}><polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" /></svg>; };

const Avatar = ({ name, size = 36, idx = 0 }) => { const c = AVATAR_COLORS[idx % AVATAR_COLORS.length]; return <div style={{ width: size, height: size, borderRadius: '50%', background: c, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.42, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{(name || 'U')[0].toUpperCase()}</div>; };

const StarRating = ({ rating = 0, onRate, size = 16, interactive = false }) => { const [hover, setHover] = useState(0); return <div style={{ display: 'flex', gap: 2 }}>{[1, 2, 3, 4, 5].map(i => <span key={i} style={{ cursor: interactive ? 'pointer' : 'default', fontSize: size, color: i <= (hover || rating) ? 'var(--gold)' : 'var(--muted)', transition: 'color .15s' }} onMouseEnter={() => interactive && setHover(i)} onMouseLeave={() => interactive && setHover(0)} onClick={() => interactive && onRate && onRate(i)}>★</span>)}</div>; };

const Toast = ({ toasts }) => <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>{toasts.map(t => { const isSuccess = t.type === 'success'; const isError = t.type === 'error'; const accentColor = isSuccess ? 'var(--green)' : isError ? 'var(--red)' : 'var(--accent)'; return <div key={t.id} style={{ background: 'rgba(22,24,28,.95)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,.08)', borderLeft: `4px solid ${accentColor}`, borderRadius: 10, padding: '14px 20px', minWidth: 300, maxWidth: 400, animation: t.leaving ? 'toastOut .3s ease forwards' : 'toastIn .3s ease', fontFamily: 'var(--font-mono)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 10, boxShadow: `0 4px 24px rgba(0,0,0,.5), 0 0 12px ${isSuccess ? 'rgba(0,255,163,.1)' : isError ? 'rgba(255,75,85,.1)' : 'rgba(59,130,246,.1)'}` }}><span style={{ fontSize: 18, flexShrink: 0 }}>{isSuccess ? '✅' : isError ? '❌' : 'ℹ️'}</span><span style={{ color: 'var(--text)', lineHeight: 1.4 }}>{t.message}</span></div>; })}</div>;

const ExchangeBadge = ({ ex }) => <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: ex === 'NSE' ? 'rgba(59,130,246,.15)' : 'rgba(245,158,11,.15)', color: ex === 'NSE' ? 'var(--accent)' : 'var(--gold)', fontWeight: 600, marginLeft: 6 }}>{ex}</span>;

const ChangeBadge = ({ change, style: s = {} }) => <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 6, background: change >= 0 ? 'rgba(16,208,122,.12)' : 'rgba(245,69,92,.12)', color: change >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600, ...s }}>{change >= 0 ? '+' : ''}{change.toFixed(2)}%</span>;

/* ─── CANDLESTICK CHART ─── */
const CandlestickChart = ({ sym, rangeIdx = 5 }) => {
    const ranges = [1, 5, 22, 66, 132, 252];
    const n = Math.min(ranges[rangeIdx], 252);
    const candles = useMemo(() => getCandles(sym, n), [sym, n]);
    const chartContainerRef = useRef();

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: { background: { type: 'solid', color: 'transparent' }, textColor: '#8E929B', fontFamily: 'var(--font-mono)' },
            grid: { vertLines: { color: 'rgba(255, 255, 255, 0.03)' }, horzLines: { color: 'rgba(255, 255, 255, 0.03)' } },
            timeScale: { borderColor: 'rgba(255, 255, 255, 0.1)', timeVisible: true },
            rightPriceScale: { borderColor: 'rgba(255, 255, 255, 0.1)', scaleMargins: { top: 0.1, bottom: 0.2 } },
            crosshair: { mode: CrosshairMode.Normal },
            autoSize: true,
        });

        const candlestickSeries = chart.addCandlestickSeries({
            upColor: '#00FFA3', downColor: '#FF4B55', borderVisible: false, wickUpColor: '#00FFA3', wickDownColor: '#FF4B55',
        });

        const priceData = candles.map(({ open, high, low, close, time }) => ({ time, open, high, low, close }));
        candlestickSeries.setData(priceData);

        const volumeSeries = chart.addHistogramSeries({
            color: '#26a69a', priceFormat: { type: 'volume' }, priceScaleId: '', scaleMargins: { top: 0.8, bottom: 0 },
        });
        const volumeData = candles.map(c => ({ time: c.time, value: c.value, color: c.close >= c.open ? 'rgba(0, 255, 163, 0.25)' : 'rgba(255, 75, 85, 0.25)' }));
        volumeSeries.setData(volumeData);

        chart.timeScale().fitContent();

        return () => chart.remove();
    }, [candles]);

    const last = candles[candles.length - 1];

    return (
        <div style={{ position: 'relative', width: '100%', minHeight: 400, height: 400 }}>
            <div ref={chartContainerRef} style={{ width: '100%', height: 400, position: 'absolute', inset: 0 }} />
            <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10, display: 'flex', gap: 12, background: 'rgba(22,24,28,0.8)', padding: '4px 8px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                <span style={{ color: 'var(--muted)' }}>O <span style={{ color: 'var(--text)' }}>{last.open.toFixed(2)}</span></span>
                <span style={{ color: 'var(--muted)' }}>H <span style={{ color: 'var(--text)' }}>{last.high.toFixed(2)}</span></span>
                <span style={{ color: 'var(--muted)' }}>L <span style={{ color: 'var(--text)' }}>{last.low.toFixed(2)}</span></span>
                <span style={{ color: 'var(--muted)' }}>C <span style={{ color: last.close >= last.open ? 'var(--green)' : 'var(--red)' }}>{last.close.toFixed(2)}</span></span>
            </div>
        </div>
    );
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
const TradeModal = ({ stock, action = 'BUY', onClose, onConfirm, loading = false }) => {
    const [qty, setQty] = useState(1);
    if (!stock) return null;
    const total = qty * stock.price;
    const ac = action === 'BUY' ? 'var(--green)' : 'var(--red)';
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(12px)' }} onClick={loading ? undefined : onClose}>
            <div onClick={e => e.stopPropagation()} className="fade-in" style={{ background: 'rgba(22,24,28,.92)', backdropFilter: 'blur(16px)', border: `1px solid ${action === 'BUY' ? 'rgba(0,255,163,.15)' : 'rgba(255,75,85,.15)'}`, borderRadius: 16, padding: 28, width: 380, maxWidth: '92vw', boxShadow: `0 8px 40px rgba(0,0,0,.6), 0 0 20px ${action === 'BUY' ? 'rgba(0,255,163,.06)' : 'rgba(255,75,85,.06)'}` }}>
                <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 20, marginBottom: 4 }}><span style={{ color: ac }}>{action}</span> {stock.sym}</h3>
                <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16 }}>Current Price: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text)', fontWeight: 600 }}>₹{stock.price.toFixed(2)}</span></p>
                <label style={{ fontSize: 13, color: 'var(--muted)' }}>Quantity</label>
                <input type="number" min={1} value={qty} onChange={e => setQty(Math.max(1, +e.target.value))} disabled={loading} style={{ display: 'block', width: '100%', padding: '10px 14px', marginTop: 6, marginBottom: 12, background: 'var(--bg)', border: '1px solid var(--muted)', borderRadius: 8, color: 'var(--text)', fontSize: 16, fontFamily: 'var(--font-mono)', opacity: loading ? 0.7 : 1 }} />
                <div style={{ fontSize: 14, marginBottom: 8 }}>Estimated Total: <strong style={{ fontFamily: 'var(--font-mono)', fontSize: 18 }}>₹{total.toFixed(2)}</strong></div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>Order Type: Market Order</div>
                <div style={{ background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.25)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--gold)', marginBottom: 20 }}>⚠️ Simulated trade only — no real money involved. Educational purposes only.</div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={onClose} disabled={loading} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid var(--muted)', background: 'transparent', color: 'var(--text)', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14, opacity: loading ? 0.6 : 1 }}>Cancel</button>
                    <button onClick={() => onConfirm(action, stock.sym, qty, stock.price)} disabled={loading} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: ac, color: action === 'BUY' ? '#000' : '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600, opacity: loading ? 0.8 : 1 }}>
                        {loading ? 'Executing...' : (action === 'BUY' ? 'Buy Now' : 'Sell Now')}
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ─── HOME DASHBOARD TAB ─── */
const HomeTab = ({ user, totalCurrent, portfolio, setTab, setAiOpen }) => {
    return (
        <div className="fade-in" style={{ paddingBottom: 40, maxWidth: 1200, margin: '0 auto', marginTop: 24 }}>
            {/* Welcome Banner */}
            <div style={{ background: '#121212', border: '1px solid #2A2A2A', borderRadius: 16, padding: '24px 32px', marginBottom: 24 }}>
                <div style={{ fontSize: 14, color: 'var(--muted)' }}>Welcome back,</div>
                <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 26, marginTop: 4 }}>{user?.fullName || user?.name || 'Trader'} 👋</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 24 }}>
                {/* Portfolio Snapshot */}
                <div className="glass-card" style={{ background: '#121212', borderRadius: 16, padding: '24px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>Virtual Cash Balance</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 36, fontWeight: 700, color: '#10D07A' }}>
                        {formatCurrency(user?.virtualBalance || 100000)}
                    </div>
                    <div style={{ height: 1, background: '#2A2A2A', margin: '16px 0' }} />
                    <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>Total Portfolio Value</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 600, color: '#FFFFFF' }}>
                        {formatCurrency(totalCurrent || 0)}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="glass-card" style={{ background: '#121212', borderRadius: 16, padding: '24px 32px' }}>
                    <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 16, marginBottom: 16, color: '#FFFFFF' }}>⚡ Quick Actions</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <button onClick={() => setTab('chart')} className="glass-card" style={{ background: '#1A1A1A', borderRadius: 10, padding: 14, color: '#FFF', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                            <span style={{ fontSize: 18 }}>📈</span> <span style={{ fontWeight: 600, fontSize: 14 }}>Make a Trade</span>
                        </button>
                        <button onClick={() => setTab('portfolio')} className="glass-card" style={{ background: '#1A1A1A', borderRadius: 10, padding: 14, color: '#FFF', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                            <span style={{ fontSize: 18 }}>💼</span> <span style={{ fontWeight: 600, fontSize: 14 }}>View Portfolio</span>
                        </button>
                        <button onClick={() => setAiOpen(true)} className="glass-card" style={{ background: '#1A1A1A', borderRadius: 10, padding: 14, color: '#FFF', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                            <span style={{ fontSize: 18 }}>✨</span> <span style={{ fontWeight: 600, fontSize: 14 }}>Ask Labh Sathi</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Market Overview */}
            <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 16, marginBottom: 16, marginTop: 12, color: '#FFFFFF' }}>🌐 Market Overview</h3>
            <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8, marginBottom: 24 }}>
                {[
                    { name: 'NIFTY 50', price: '22,419.55', change: 0.85 },
                    { name: 'SENSEX', price: '73,803.15', change: 0.82 },
                    { name: 'BANK NIFTY', price: '48,159.00', change: -0.12 },
                    { name: 'NIFTY IT', price: '34,812.20', change: 1.25 }
                ].map((idx) => (
                    <div key={idx.name} className="glass-card" style={{ background: '#121212', borderRadius: 12, padding: 16, minWidth: 200, flexShrink: 0, cursor: 'pointer' }}>
                        <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>{idx.name}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, margin: '6px 0' }}>{idx.price}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)', color: idx.change >= 0 ? 'var(--green)' : 'var(--red)' }}>
                            {idx.change >= 0 ? '+' : ''}{idx.change}%
                        </div>
                    </div>
                ))}
            </div>

            {/* Top Movers */}
            <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 16, marginBottom: 16, color: '#FFFFFF' }}>🔥 Trending Movers</h3>
            <div style={{ background: '#121212', border: '1px solid #2A2A2A', borderRadius: 16, padding: '12px 24px' }}>
                {[
                    { sym: 'HDFCBANK', name: 'HDFC Bank Ltd', price: 1445.50, change: 1.25 },
                    { sym: 'RELIANCE', name: 'Reliance Ind.', price: 2950.00, change: 2.10 },
                    { sym: 'INFY', name: 'Infosys Ltd', price: 1452.80, change: -0.85 },
                    { sym: 'TATASTEEL', name: 'Tata Steel', price: 165.40, change: 3.40 }
                ].map((stock, i) => (
                    <div key={stock.sym} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: i < 3 ? '1px solid #2A2A2A' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{ background: '#1A1A1A', borderRadius: 8, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>{stock.sym[0]}</div>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: 15 }}>{stock.sym}</div>
                                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{stock.name}</div>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 600, fontSize: 15, fontFamily: 'var(--font-mono)' }}>₹{stock.price.toFixed(2)}</div>
                            <div style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)', color: stock.change >= 0 ? 'var(--green)' : 'var(--red)' }}>
                                {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

/* ─── MAIN APP ─── */
export default function App() {
    // Auth
    const [user, setUser] = useState(null);
    const [chartTradeTab, setChartTradeTab] = useState('Open Positions');
    const [chartTimeframe, setChartTimeframe] = useState('1D');
    const [authTab, setAuthTab] = useState('login');
    const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', level: 'Beginner' });
    // Nav
    const [tab, setTab] = useState('home');
    const [selSym, setSelSym] = useState('HDFCBANK');
    const [chartRange, setChartRange] = useState(5);
    // Markets
    const [marketData, setMarketData] = useState([]);
    const [marketLoading, setMarketLoading] = useState(false);
    const [marketError, setMarketError] = useState('');

    useEffect(() => {
        if (tab === 'screener' && marketData.length === 0 && !marketLoading && !marketError) {
            setMarketLoading(true);
            fetch('/api/markets')
                .then(r => r.ok ? r.json() : Promise.reject('Failed to load market data'))
                .then(d => { setMarketData(d); setMarketLoading(false); })
                .catch(e => { setMarketError('Failed to load market data.'); setMarketLoading(false); });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab]);

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
    const [tradeLoading, setTradeLoading] = useState(false);
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
    const aiSubmittingRef = useRef(false); // Ref-based lock to prevent double submissions

    const addToast = (message, type = 'success') => { const id = Date.now(); setToasts(p => [...p, { id, message, type }]); setTimeout(() => setToasts(p => p.map(t => t.id === id ? { ...t, leaving: true } : t)), 2800); setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3200); };

    const stock = STOCKS_DATA[selSym] || STOCKS_DATA['HDFCBANK'];
    const totalInvested = portfolio.reduce((s, h) => s + (h.avg || 0) * (h.qty || 0), 0);
    const totalCurrent = portfolio.reduce((s, h) => { const sd = STOCKS_DATA[h.sym]; return s + (sd ? sd.price : (h.avg || 0)) * (h.qty || 0); }, 0);
    const totalPnl = totalCurrent - totalInvested;
    const totalPnlPct = totalInvested ? ((totalPnl / totalInvested) * 100) : 0;

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
        return { reply: data.reply, tradeData: data.tradeData };
    }, [stock, portfolio, user]);

    const sendAI = useCallback(async (overrideText) => {
        const text = (overrideText || aiInput).trim();
        if (!text || aiLoading || aiSubmittingRef.current) return;
        aiSubmittingRef.current = true;

        const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        const newUserMsg = { role: 'user', text, time: now };
        setAiInput('');
        setAiLoading(true);

        // Step 1: Synchronously add the user message (no side effects inside the updater)
        setAiMessages(prev => {
            const cleaned = prev.filter(m => m.role !== 'error');
            return [...cleaned, newUserMsg];
        });

        // Step 2: Call API outside the state updater to avoid React 18 StrictMode double-fire
        try {
            // Build conversation from current messages + new user message
            const { reply, tradeData } = await callVibeAPI(
                [...aiMessages.filter(m => m.role !== 'error'), newUserMsg],
                text
            );
            const aiNow = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
            setAiMessages(p => [...p.filter(m => m.role !== 'error'), { role: 'assistant', text: reply, tradeData, time: aiNow }]);
        } catch (err) {
            const aiNow = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
            setAiMessages(p => [...p.filter(m => m.role !== 'error'), { role: 'error', text: err.message || '❌ Could not connect to AI.', time: aiNow, failedMsg: text }]);
        }
        setAiLoading(false);
        aiSubmittingRef.current = false;
    }, [aiInput, aiLoading, aiMessages, callVibeAPI]);

    const retryLastMessage = useCallback(async (failedText) => {
        if (aiLoading || aiSubmittingRef.current) return;
        aiSubmittingRef.current = true;
        setAiLoading(true);

        // Step 1: Remove error messages from state
        const cleaned = aiMessages.filter(m => m.role !== 'error');
        setAiMessages(cleaned);

        // Step 2: Call API outside the state updater
        try {
            const { reply, tradeData } = await callVibeAPI(cleaned, failedText);
            const aiNow = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
            setAiMessages(p => { const c = p.filter(m => m.role !== 'error'); return [...c, { role: 'assistant', text: reply, tradeData, time: aiNow }]; });
        } catch (err) {
            const aiNow = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
            setAiMessages(p => { const c = p.filter(m => m.role !== 'error'); return [...c, { role: 'error', text: err.message || '❌ Still unable to connect.', time: aiNow, failedMsg: failedText }]; });
        }
        setAiLoading(false);
        aiSubmittingRef.current = false;
    }, [aiLoading, aiMessages, callVibeAPI]);

    const clearChat = useCallback(() => { setAiMessages([]); }, []);

    useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [aiMessages]);

    const handleRoast = async () => {
        if (roastLoading || portfolio.length === 0) return;
        setRoastLoading(true); setRoastData(null);
        try {
            const res = await fetch('/api/roast', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ portfolio, balance: user?.virtualBalance || 500000 })
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

    const sentimentCacheRef = useRef({});
    useEffect(() => {
        if (tab === 'chart' && selSym && !vibeLoading) {
            // Skip if we already have a cached result for this symbol
            if (sentimentCacheRef.current[selSym]) {
                setVibeScore(sentimentCacheRef.current[selSym]);
                return;
            }
            const fetchVibe = async () => {
                setVibeLoading(true); setVibeScore(null);
                try {
                    const res = await fetch(`/api/sentiment/${selSym}`);
                    if (res.ok) {
                        const data = await res.json();
                        sentimentCacheRef.current[selSym] = data;
                        setVibeScore(data);
                    } else {
                        const fallback = { score: '⚠️', summary: 'AI is taking a break (Rate limit reached). Please try again in a minute.' };
                        sentimentCacheRef.current[selSym] = fallback;
                        setVibeScore(fallback);
                    }
                } catch (e) {
                    const fallback = { score: '❌', summary: 'Network error analyzing sentiment.' };
                    sentimentCacheRef.current[selSym] = fallback;
                    setVibeScore(fallback);
                }
                setVibeLoading(false);
            };
            fetchVibe();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selSym, tab]);

    const userEmail = user?.email;
    useEffect(() => {
        if (tab === 'leaderboard') {
            setLeaderboardLoading(true);
            fetch('/api/leaderboard').then(r => r.json()).then(d => { setLeaderboard(d.leaderboard || []); setLeaderboardLoading(false); }).catch(e => setLeaderboardLoading(false));
        } else if (tab === 'safety' && userEmail) {
            fetch(`/api/interlocks?userId=${userEmail}`).then(r => r.json()).then(d => setMyRules(d.rules || [])).catch(e => console.error(e));
        }
    }, [tab, userEmail]);

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

    const handleTrade = async (action, sym, qty, executionPrice) => {
        if (!user) return addToast('Please login first', 'error');
        if (tradeLoading) return;
        setTradeLoading(true);
        try {
            const res = await fetch('/api/trade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email,
                    action,
                    ticker: sym,
                    quantity: qty,
                    currentPrice: executionPrice,
                    executionPrice, // backward compat
                }),
            });
            const data = await res.json();

            if (res.ok) {
                addToast(`${action} ${qty} ${sym} successful!`);
                setTradeModal(null);
                // Instant UI update: sync user (including virtualBalance) and portfolio from response
                setUser(data.user);
                setPortfolio(data.user.portfolio || []);
                setTrades((p) => [{ sym, action, qty, price: executionPrice, time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) }, ...p].slice(0, 50));
            } else {
                addToast(data.error || `Failed to ${action}`, 'error');
            }
        } catch (err) {
            addToast(err.message || 'Network error making trade', 'error');
        } finally {
            setTradeLoading(false);
        }
    };

    const navItems = [{ id: 'dashboard', emoji: '📊', label: 'Dashboard' }, { id: 'chart', emoji: '📈', label: 'Chart' }, { id: 'screener', emoji: '🔍', label: 'Screener' }, { id: 'portfolio', emoji: '💼', label: 'Portfolio' }, { id: 'leaderboard', emoji: '🏆', label: 'Leaderboard' }, { id: 'safety', emoji: '🛡️', label: 'Safety' }, { id: 'learn', emoji: '🎓', label: 'Learn' }, { id: 'reviews', emoji: '⭐', label: 'Reviews' }];

    const selectStock = (sym) => { setSelSym(sym); setTab('chart'); setChartRange(5); };
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const isMobileCheck = () => isMobile;

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
                    {['login', 'register'].map(t => <button key={t} type="button" onClick={() => setAuthTab(t)} style={{ flex: 1, padding: '10px', border: 'none', background: authTab === t ? 'var(--accent)' : 'transparent', color: authTab === t ? '#fff' : 'var(--muted)', cursor: 'pointer', fontSize: 14, fontWeight: 600, textTransform: 'capitalize' }}>{t}</button>)}
                </div>
                <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!authForm.email || !authForm.password || (authTab === 'register' && !authForm.name)) { addToast('Please fill all fields', 'error'); return; }

                    const endpoint = authTab === 'login' ? '/api/auth/login' : '/api/auth/register';
                    try {
                        const res = await fetch(endpoint, {
                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(authForm)
                        });
                        const data = await res.json();
                        if (res.ok) {
                            setUser(data.user);
                            setPortfolio(data.user.portfolio || []);
                            addToast('Welcome to Labh! 🎉');
                        } else {
                            addToast(data.error || 'Authentication failed', 'error');
                        }
                    } catch (err) {
                        addToast('Network error', 'error');
                    }
                }}>
                    {authTab === 'register' && <><input required placeholder="Full Name" value={authForm.name} onChange={e => setAuthForm(p => ({ ...p, name: e.target.value }))} style={inputSt} /><select value={authForm.level} onChange={e => setAuthForm(p => ({ ...p, level: e.target.value }))} style={{ ...inputSt, marginBottom: 12 }}><option value="Beginner">Beginner — new to trading</option><option value="Intermediate">Intermediate — some experience</option><option value="Advanced">Advanced — seasoned trader</option></select></>}
                    <input required placeholder="Email" type="email" value={authForm.email} onChange={e => setAuthForm(p => ({ ...p, email: e.target.value }))} style={inputSt} />
                    <input required placeholder="Password" type="password" value={authForm.password} onChange={e => setAuthForm(p => ({ ...p, password: e.target.value }))} style={inputSt} />
                    <button type="submit" style={{ width: '100%', padding: 14, border: 'none', borderRadius: 10, background: 'linear-gradient(135deg,var(--accent),#6366f1)', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 8 }}>{authTab === 'login' ? 'Sign In' : 'Create Account'}</button>
                </form>
                <div style={{ background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 8, padding: '10px 14px', fontSize: 11, color: 'var(--gold)', marginTop: 16, textAlign: 'center' }}>⚠️ Educational platform for learning stock market concepts. No real trading.</div>
            </div>
        </div>
        <Toast toasts={toasts} />
    </>;

    const filteredWL = watchlist.filter(s => s.toLowerCase().includes(wlSearch.toLowerCase()));
    const unwatched = ALL_SYMS.filter(s => !watchlist.includes(s)).slice(0, 4);
    const screenerStocks = (marketData.length ? marketData : []).filter(s => scrSector === 'All' || s.sector === scrSector).sort((a, b) => scrSort === 'change' ? Math.abs(b.change) - Math.abs(a.change) : scrSort === 'price' ? b.price - a.price : a.sym.localeCompare(b.sym));
    const movers = [...Object.values(STOCKS_DATA)].sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 4);
    const trending = [...Object.values(STOCKS_DATA)].sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 6);

    /* ─── MAIN LAYOUT ─── */
    const figmaDataGenOrders = () => { const sp = stock?.price || 100; return Array.from({ length: 12 }).map((_, i) => ({ price: (sp * (1 + (Math.random() - 0.6) * 0.02)).toFixed(2), amount: (Math.random() * 2).toFixed(4), total: (Math.random() * 100).toFixed(2) })).sort((a, b) => b.price - a.price); };

    const parseTradeJson = (text) => {
        if (!text) return null;
        const match = typeof text === 'string' ? text.match(/```json\s*([\s\S]*?)\s*```/) : null;
        if (match) {
            try { return JSON.parse(match[1]); } catch (e) { }
        }
        return null;
    };

    return <>
        <style dangerouslySetInnerHTML={{ __html: STYLE_TEXT }} />
        <Toast toasts={toasts} />
        {tradeModal && <TradeModal stock={STOCKS_DATA[tradeModal.sym] || marketData.find(m => m.sym === tradeModal.sym)} action={tradeModal.action} onClose={() => setTradeModal(null)} onConfirm={handleTrade} loading={tradeLoading} />}

        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {/* TOP NAVIGATION BAR */}
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 60, background: 'var(--bg)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', padding: '0 24px', zIndex: 1000 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    <img src="/logo.png.png" alt="Labh" style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 6 }} />
                    <span style={{ fontSize: 13, color: '#fff', fontWeight: 500, letterSpacing: 0.5 }}>Learn · Analyze · Build Holdings</span>
                </div>

                <div style={{ display: 'flex', gap: 32, marginLeft: 64, flex: 1, fontSize: 14 }}>
                    <span onClick={() => setTab('home')} style={{ cursor: 'pointer', color: tab === 'home' ? '#fff' : 'var(--muted)', fontWeight: tab === 'home' ? 600 : 400 }}>Home</span>
                    <span onClick={() => setTab('chart')} style={{ cursor: 'pointer', color: tab === 'chart' ? '#fff' : 'var(--muted)', fontWeight: tab === 'chart' ? 600 : 400 }}>Trade</span>
                    <span onClick={() => setTab('portfolio')} style={{ cursor: 'pointer', color: tab === 'portfolio' ? '#fff' : 'var(--muted)', fontWeight: tab === 'portfolio' ? 600 : 400 }}>Portfolio</span>
                    <span onClick={() => setTab('screener')} style={{ cursor: 'pointer', color: tab === 'screener' ? '#fff' : 'var(--muted)', fontWeight: tab === 'screener' ? 600 : 400 }}>Markets</span>
                    <span onClick={() => setTab('analytics')} style={{ cursor: 'pointer', color: ['analytics', 'leaderboard', 'learn', 'safety'].includes(tab) ? '#fff' : 'var(--muted)', fontWeight: ['analytics', 'leaderboard', 'learn', 'safety'].includes(tab) ? 600 : 400 }}>Analytics</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexShrink: 0, fontSize: 13, ...(isMobileCheck() ? { display: 'none' } : {}) }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted)' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 10px var(--green)' }} /> Connected
                    </div>
                    <div style={{ height: 24, width: 1, background: 'rgba(255,255,255,.1)' }} />
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <div style={{ color: 'var(--muted)' }}>Cash: <strong style={{ color: '#fff', fontSize: 14, fontFamily: 'var(--font-mono)' }}>{formatCurrency(user?.virtualBalance ?? 100000)}</strong></div>
                        <div style={{ height: 16, width: 1, background: 'rgba(255,255,255,.15)' }} />
                        <div style={{ color: 'var(--muted)' }}>Portfolio: <strong style={{ color: 'var(--green)', fontSize: 14, fontFamily: 'var(--font-mono)' }}>{formatCurrency(totalCurrent || 0)}</strong></div>
                    </div>
                    <button onClick={() => setAiOpen(!aiOpen)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,.1)', borderRadius: 6, padding: '6px 12px', color: 'var(--text)', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>✨ Labh Sathi</button>
                    <div style={{ height: 24, width: 1, background: 'rgba(255,255,255,.1)' }} />
                    <div style={{ position: 'relative' }} onMouseEnter={e => e.currentTarget.querySelector('.dropdown').style.opacity = '1'} onMouseLeave={e => e.currentTarget.querySelector('.dropdown').style.opacity = '0'}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#10D07A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                            {(user?.fullName || user?.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="dropdown" style={{ position: 'absolute', right: 0, top: '100%', marginTop: 8, width: 160, background: '#121212', border: '1px solid #2A2A2A', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,.5)', opacity: 0, transition: 'opacity .2s ease', zIndex: 50, overflow: 'hidden' }}>
                            <button onClick={() => { setUser(null); setAuthTab('login'); }} style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', color: '#FF4B55', textAlign: 'left', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
                {isMobileCheck() && <button onClick={() => setMobileMenu(!mobileMenu)} style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: 24, cursor: 'pointer', marginLeft: 'auto' }}>☰</button>}
            </div>

            {/* MOBILE DRAWER */}
            {mobileMenu && <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)' }} onClick={() => setMobileMenu(false)}><div onClick={e => e.stopPropagation()} style={{ width: 280, height: '100%', background: 'var(--card)', padding: '60px 16px 16px', animation: 'slideInRight .25s ease' }}>{navItems.map(n => <div key={n.id} onClick={() => { setTab(n.id); setMobileMenu(false); }} style={{ padding: '12px 14px', marginBottom: 4, cursor: 'pointer', color: tab === n.id ? 'var(--text)' : 'var(--muted)', fontSize: 14 }}>{n.emoji} {n.label}</div>)}</div></div>}

            <div style={{ paddingTop: 60, minHeight: 'calc(100vh - 60px)', background: 'var(--bg)', paddingLeft: isMobileCheck() ? 12 : 24, paddingRight: isMobileCheck() ? 12 : (aiOpen ? 404 : 24), transition: 'padding 0.3s', flex: 1 }}>

                {tab === 'home' && <HomeTab user={user} totalCurrent={totalCurrent} portfolio={portfolio} setTab={setTab} setAiOpen={setAiOpen} />}

                {/* ─── ANALYTICS SUB-NAV ─── */}
                {['analytics', 'leaderboard', 'safety', 'learn'].includes(tab) && (
                    <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: 24, overflowX: 'auto' }}>
                        {[
                            { id: 'analytics', label: 'Overview' },
                            { id: 'leaderboard', label: 'Leaderboard' },
                            { id: 'safety', label: 'Interlock Rules' },
                            { id: 'learn', label: 'Learn' }
                        ].map(t => (
                            <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '16px 0', background: 'none', border: 'none', borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent', color: tab === t.id ? '#fff' : 'var(--muted)', fontSize: 14, fontWeight: tab === t.id ? 600 : 400, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                {t.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* ─── ANALYTICS TAB ─── */}
                {tab === 'analytics' && <div className="fade-in">
                    <div style={{ background: 'linear-gradient(135deg,rgba(59,130,246,.15),rgba(99,102,241,.1))', border: '1px solid rgba(59,130,246,.2)', borderRadius: 16, padding: '24px 28px', marginBottom: 24 }}>
                        <div style={{ fontSize: 14, color: 'var(--muted)' }}>Welcome back,</div>
                        <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 24, marginTop: 4 }}>Hi, {user?.fullName || user?.name || 'Trader'} 👋</h2>
                        <div style={{ marginTop: 12, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                            <div><div style={{ fontSize: 12, color: 'var(--muted)' }}>Portfolio Value</div><div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700 }}>{formatCurrency(totalCurrent || 0)}</div></div>
                            <div><div style={{ fontSize: 12, color: 'var(--muted)' }}>Total P&L</div><div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700, color: totalPnl >= 0 ? 'var(--green)' : 'var(--red)' }}>{totalPnl >= 0 ? '+' : ''}{formatCurrency(Math.abs(totalPnl))} <span style={{ fontSize: 14, fontFamily: 'var(--font-mono)' }}>({totalPnlPct.toFixed(2)}%)</span></div></div>
                        </div>
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 16, marginBottom: 12 }}>🔥 Trending Stocks</h3>
                    <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 12, marginBottom: 24 }}>
                        {trending.map(s => <div key={s.sym} className="card-hover" style={{ minWidth: 180, background: 'var(--card)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 14, padding: 16, flexShrink: 0 }}>
                            <div onClick={() => selectStock(s.sym)} style={{ cursor: 'pointer' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                                    <div><div style={{ fontWeight: 700, fontSize: 15 }}>{s.sym}</div><div style={{ fontSize: 11, color: 'var(--muted)' }}>{s.sector}</div></div>
                                    <ChangeBadge change={s.change} />
                                </div>
                                <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>₹{s.price.toFixed(2)}</div>
                                <Sparkline data={getSpark(s.sym)} color={s.change >= 0 ? 'var(--green)' : 'var(--red)'} w={140} h={32} />
                            </div>
                            <div style={{ display: 'flex', gap: 6, marginTop: 10 }} onClick={e => e.stopPropagation()}>
                                <button onClick={() => setTradeModal({ sym: s.sym, action: 'BUY' })} style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: 'none', background: 'var(--green)', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 11 }}>Buy</button>
                                <button onClick={() => setTradeModal({ sym: s.sym, action: 'SELL' })} style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: 'none', background: 'var(--red)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 11 }}>Sell</button>
                            </div>
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
                {tab === 'chart' && <div className="fade-in" style={{ paddingTop: 20, paddingBottom: 40 }}>
                    {/* HERO STATS ROW */}
                    <div style={{ display: 'grid', gridTemplateColumns: isMobileCheck() ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 16, marginBottom: 24, marginTop: 24 }}>
                        {[
                            { k: '24h High', v: (stock.price * 1.02).toFixed(2), c: 'var(--green)', i: '↗' },
                            { k: '24h Low', v: (stock.price * 0.98).toFixed(2), c: 'var(--red)', i: '↘' },
                            { k: '24h Volume', v: '28,432', c: 'var(--muted)', i: '📊' },
                            { k: 'Open Interest', v: '1.82B', c: 'var(--green)', i: '∿' }
                        ].map(st => (
                            <div key={st.k} style={{ background: 'var(--card)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: st.c, fontSize: 18 }}>{st.i}</div>
                                <div>
                                    <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>{st.k}</div>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 600 }}>{st.k.includes('Volume') ? st.v : '₹' + st.v}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: isMobileCheck() ? '1fr' : '1fr 340px', gap: 32 }}>
                        {/* LEFT COLUMN */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            {/* Pair Header & Chart */}
                            <div style={{ background: 'var(--card)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 24 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                            <div style={{ width: 32, height: 32, borderRadius: 16, background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 700, fontSize: 14 }}>{stock.sym[0]}</div>
                                            <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 24, fontWeight: 700, margin: 0 }}>{stock.sym}/INR</h2>
                                            <span style={{ fontSize: 12, color: 'var(--muted)', display: isMobileCheck() ? 'none' : 'block' }}>{stock.name}</span>

                                            <div style={{ display: 'flex', gap: 4, marginLeft: isMobileCheck() ? 0 : 16 }}>
                                                {['1H', '4H', '1D', '1W', '1M'].map(tf => (
                                                    <button key={tf} onClick={() => setChartTimeframe(tf)} style={{ background: chartTimeframe === tf ? 'rgba(0,255,163,0.1)' : 'transparent', color: chartTimeframe === tf ? 'var(--green)' : 'var(--muted)', border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: 12, fontWeight: chartTimeframe === tf ? 600 : 400, cursor: 'pointer' }}>{tf}</button>
                                                ))}
                                            </div>

                                            <div style={{ display: 'flex', gap: 8, marginLeft: isMobileCheck() ? 0 : 24 }}>
                                                <button onClick={() => setTradeModal({ action: 'BUY', sym: stock.sym })} style={{ background: 'var(--green)', color: '#000', border: 'none', borderRadius: 6, padding: '6px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,255,163,0.2)' }}>BUY {stock.sym}</button>
                                                <button onClick={() => setTradeModal({ action: 'SELL', sym: stock.sym })} style={{ background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 10px rgba(255,75,85,0.2)' }}>SELL</button>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
                                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 36, fontWeight: 700 }}>₹{stock.price.toFixed(2)}</span>
                                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: stock.change >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                                                {stock.change >= 0 ? '+' : ''}{(stock.price * stock.change / 100).toFixed(2)} ({stock.change >= 0 ? '+' : ''}{stock.change}%)
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <select value={selSym} onChange={e => { setSelSym(e.target.value); setChartRange(5); }} style={{ appearance: 'none', padding: '10px 32px 10px 16px', borderRadius: 8, background: '#16181C', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                                            {ALL_SYMS.map(s => <option key={s} value={s} style={{ background: '#16181C', color: '#fff', padding: '8px' }}>{s}</option>)}
                                        </select>
                                        <span style={{ position: 'absolute', right: 12, top: 10, pointerEvents: 'none', fontSize: 12 }}>▼</span>
                                    </div>
                                </div>
                                <CandlestickChart sym={selSym} rangeIdx={chartTimeframe === '1D' ? 5 : chartTimeframe === '1W' ? 4 : 2} />
                            </div>

                            {/* Tables */}
                            <div style={{ background: 'var(--card)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, overflow: 'hidden' }}>
                                <div style={{ display: 'flex', gap: 24, padding: '0 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', overflowX: 'auto' }}>
                                    {['Open Positions', 'Open Orders', 'Trade History'].map(t => (
                                        <button key={t} onClick={() => setChartTradeTab(t)} style={{ padding: '20px 0', background: 'none', border: 'none', borderBottom: chartTradeTab === t ? '2px solid var(--green)' : '2px solid transparent', color: chartTradeTab === t ? '#fff' : 'var(--muted)', fontSize: 14, fontWeight: chartTradeTab === t ? 600 : 400, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                            {t} {t === 'Open Positions' && <span style={{ background: 'rgba(0,255,163,0.1)', color: 'var(--green)', padding: '2px 6px', borderRadius: 4, fontSize: 11, marginLeft: 8 }}>{portfolio.length}</span>}
                                        </button>
                                    ))}
                                </div>
                                <div style={{ padding: 24, overflowX: 'auto' }}>
                                    {chartTradeTab === 'Open Positions' && (
                                        portfolio.length === 0 ? <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>No open positions.</div> :
                                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13, minWidth: 500 }}>
                                                <thead>
                                                    <tr style={{ color: 'var(--muted)' }}>
                                                        <th style={{ paddingBottom: 16, fontWeight: 400 }}>Symbol</th>
                                                        <th style={{ paddingBottom: 16, fontWeight: 400 }}>Side</th>
                                                        <th style={{ paddingBottom: 16, fontWeight: 400 }}>Qty</th>
                                                        <th style={{ paddingBottom: 16, fontWeight: 400 }}>Entry</th>
                                                        <th style={{ paddingBottom: 16, fontWeight: 400, textAlign: 'right' }}>Current PN&L</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {portfolio.map(h => {
                                                        const s = STOCKS_DATA[h.sym]; if (!s) return null; const cv = s.price * h.qty; const pnl = cv - h.avg * h.qty;
                                                        return <tr key={h.sym} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                            <td style={{ padding: '16px 0', fontWeight: 600 }}>{h.sym} <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: 4, marginLeft: 8 }}>{s.exchange}</span></td>
                                                            <td style={{ padding: '16px 0' }}><span style={{ color: 'var(--green)', background: 'rgba(0,255,163,0.1)', padding: '4px 8px', borderRadius: 4, fontWeight: 600, fontSize: 11 }}>Long</span></td>
                                                            <td style={{ padding: '16px 0', fontFamily: 'var(--font-mono)' }}>{h.qty}</td>
                                                            <td style={{ padding: '16px 0', fontFamily: 'var(--font-mono)' }}>{h.avg.toFixed(2)}</td>
                                                            <td style={{ padding: '16px 0', textAlign: 'right', fontFamily: 'var(--font-mono)', color: pnl >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>{pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}</td>
                                                        </tr>;
                                                    })}
                                                </tbody>
                                            </table>
                                    )}
                                    {chartTradeTab === 'Trade History' && (
                                        trades.length === 0 ? <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>No recent trades.</div> :
                                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13, minWidth: 500 }}>
                                                <thead><tr style={{ color: 'var(--muted)' }}><th style={{ paddingBottom: 16, fontWeight: 400 }}>Symbol</th><th style={{ paddingBottom: 16, fontWeight: 400 }}>Action</th><th style={{ paddingBottom: 16, fontWeight: 400 }}>Qty</th><th style={{ paddingBottom: 16, fontWeight: 400 }}>Price</th><th style={{ paddingBottom: 16, fontWeight: 400, textAlign: 'right' }}>Time</th></tr></thead>
                                                <tbody>
                                                    {trades.map((t, i) => <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                        <td style={{ padding: '12px 0', fontWeight: 600 }}>{t.sym}</td>
                                                        <td style={{ padding: '12px 0', color: t.action === 'BUY' ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>{t.action}</td>
                                                        <td style={{ padding: '12px 0', fontFamily: 'var(--font-mono)' }}>{t.qty}</td>
                                                        <td style={{ padding: '12px 0', fontFamily: 'var(--font-mono)' }}>{t.price.toFixed(2)}</td>
                                                        <td style={{ padding: '12px 0', textAlign: 'right', color: 'var(--muted)' }}>{t.time}</td>
                                                    </tr>)}
                                                </tbody>
                                            </table>
                                    )}
                                    {chartTradeTab === 'Open Orders' && <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>No open orders.</div>}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            {/* Order Book */}
                            <div style={{ background: 'var(--card)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                    <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 16, margin: 0 }}>Order Book</h3>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <div style={{ width: 14, height: 14, borderRadius: 2, background: 'rgba(255,75,85,0.2)', border: '1px solid rgba(255,75,85,0.5)' }} />
                                        <div style={{ width: 14, height: 14, borderRadius: 2, background: 'rgba(0,255,163,0.2)', border: '1px solid rgba(0,255,163,0.5)' }} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginBottom: 16 }}>
                                    <div>Price (INR)</div>
                                    <div style={{ display: 'flex', gap: 32 }}><div>Amount</div><div>Total</div></div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
                                    {figmaDataGenOrders().slice(0, 9).map((o, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontFamily: 'var(--font-mono)', position: 'relative', padding: '2px 0' }}>
                                            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: `${Math.random() * 60 + 10}%`, background: 'rgba(255,75,85,0.08)', zIndex: 0 }} />
                                            <div style={{ color: 'var(--red)', zIndex: 1, paddingLeft: 4 }}>{o.price}</div>
                                            <div style={{ display: 'flex', gap: 24, color: 'var(--text)', zIndex: 1, minWidth: 100, justifyContent: 'flex-end', paddingRight: 4 }}>
                                                <span>{o.amount}</span><span style={{ color: 'var(--muted)', width: 48, textAlign: 'right' }}>{o.total}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: 16, display: 'flex', justifyContent: 'center', gap: 12, alignItems: 'center' }}>
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: stock.change >= 0 ? 'var(--green)' : 'var(--red)' }}>₹{stock.price.toFixed(2)}</span>
                                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>Spread: 0.15</span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {figmaDataGenOrders().slice(0, 9).map((o, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontFamily: 'var(--font-mono)', position: 'relative', padding: '2px 0' }}>
                                            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: `${Math.random() * 60 + 10}%`, background: 'rgba(0,255,163,0.08)', zIndex: 0 }} />
                                            <div style={{ color: 'var(--green)', zIndex: 1, paddingLeft: 4 }}>{(o.price * 0.99).toFixed(2)}</div>
                                            <div style={{ display: 'flex', gap: 24, color: 'var(--text)', zIndex: 1, minWidth: 100, justifyContent: 'flex-end', paddingRight: 4 }}>
                                                <span>{o.amount}</span><span style={{ color: 'var(--muted)', width: 48, textAlign: 'right' }}>{o.total}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ background: 'var(--card)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 20 }}>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <button onClick={() => setTradeModal({ sym: selSym, action: 'BUY' })} style={{ flex: 1, background: 'var(--green)', color: '#000', border: 'none', borderRadius: 8, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Buy {selSym}</button>
                                    <button onClick={() => setTradeModal({ sym: selSym, action: 'SELL' })} style={{ flex: 1, background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 8, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Sell {selSym}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>}

                {/* ─── SCREENER TAB ─── */}
                {tab === 'screener' && <div className="fade-in">
                    <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 22, marginBottom: 16 }}>🔍 Stock Screener</h2>

                    {marketLoading && <div style={{ padding: '40px', textAlign: 'center', color: 'var(--accent)', fontSize: 16 }}>Loading market data...</div>}
                    {marketError && <div style={{ padding: '40px', textAlign: 'center', color: 'var(--red)', fontSize: 16 }}>{marketError}</div>}

                    {!marketLoading && !marketError && <>
                        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                            <select value={scrSector} onChange={e => setScrSector(e.target.value)} style={{ ...inputSt, width: 'auto', marginBottom: 0 }}>{SECTORS.map(s => <option key={s} value={s}>{s}</option>)}</select>
                            <select value={scrSort} onChange={e => setScrSort(e.target.value)} style={{ ...inputSt, width: 'auto', marginBottom: 0 }}><option value="change">Sort by Change</option><option value="price">Sort by Price</option><option value="name">Sort by Name</option></select>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobileCheck() ? '1fr' : 'repeat(auto-fill,minmax(260,1fr))', gap: 14 }}>
                            {screenerStocks.map(s => <div key={s.sym} className="card-hover" style={{ background: 'var(--card)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 14, padding: 18 }}>
                                <div onClick={() => selectStock(s.sym)} style={{ cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div><div style={{ fontWeight: 700, fontSize: 16 }}>{s.sym}</div><div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{s.name}</div></div>
                                        <ChangeBadge change={s.change} />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}><span style={{ fontSize: 10, padding: '2px 8px', background: 'rgba(99,102,241,.12)', color: '#818cf8', borderRadius: 4 }}>{s.sector}</span><ExchangeBadge ex={s.exchange} /></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginTop: 12 }}>
                                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700 }}>₹{s.price.toFixed(2)}</div>
                                        <Sparkline data={getSpark(s.sym)} color={s.change >= 0 ? 'var(--green)' : 'var(--red)'} w={80} h={28} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,.06)' }} onClick={e => e.stopPropagation()}>
                                    <button onClick={() => setTradeModal({ sym: s.sym, action: 'BUY' })} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none', background: 'var(--green)', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>Buy</button>
                                    <button onClick={() => setTradeModal({ sym: s.sym, action: 'SELL' })} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none', background: 'var(--red)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>Sell</button>
                                </div>
                            </div>)}
                        </div>
                    </>}
                </div>}


                {/* ─── PORTFOLIO TAB ─── */}
                {tab === 'portfolio' && <div className="fade-in" style={{ paddingTop: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                        <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 22, margin: 0 }}>💼 My Portfolio</h2>
                        {portfolio.length > 0 && <button
                            onClick={handleRoast}
                            disabled={roastLoading}
                            style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, var(--red), var(--gold))', color: '#fff', fontWeight: 700, cursor: roastLoading ? 'not-allowed' : 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, opacity: roastLoading ? 0.7 : 1, flexShrink: 0 }}>
                            {roastLoading ? '🔥 Roasting...' : '🔥 Roast Me'}
                        </button>}
                    </div>
                    {roastData && <div style={{ position: 'fixed', inset: 0, zIndex: 6000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(8px)' }} onClick={() => setRoastData(null)}>
                        <div onClick={e => e.stopPropagation()} className="fade-in" style={{ background: '#000000', border: '1px solid rgba(16,208,122,.3)', borderRadius: 12, padding: '32px 28px', width: 540, maxWidth: '95vw', maxHeight: '80vh', overflowY: 'auto', position: 'relative', boxShadow: '0 0 40px rgba(16,208,122,.08), 0 0 80px rgba(0,0,0,.8)' }}>
                            {/* Scanline overlay */}
                            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: 12, opacity: 0.03 }}><div style={{ width: '100%', height: '200%', background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(16,208,122,.5) 2px, rgba(16,208,122,.5) 4px)', animation: 'scanline 8s linear infinite' }} /></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, position: 'relative' }}>
                                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#10D07A', fontSize: 16 }}>{'>'} ROAST_RESULTS.exe</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: '#10D07A', fontWeight: 600, background: 'rgba(16,208,122,.1)', padding: '4px 10px', borderRadius: 4, border: '1px solid rgba(16,208,122,.3)' }}>RISK: {roastData.riskScore}/10</div>
                                    <button onClick={() => setRoastData(null)} style={{ background: 'none', border: '1px solid rgba(16,208,122,.3)', borderRadius: 4, color: '#10D07A', fontSize: 14, cursor: 'pointer', padding: '4px 10px', fontFamily: 'var(--font-mono)' }}>✕ CLOSE</button>
                                </div>
                            </div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, lineHeight: 1.8, color: '#10D07A', whiteSpace: 'pre-wrap', position: 'relative' }}>
                                <span style={{ color: 'rgba(16,208,122,.5)' }}>$ </span>{roastData.roastText}
                                <span style={{ display: 'inline-block', width: 8, height: 16, background: '#10D07A', marginLeft: 2, animation: 'terminalBlink 1s step-end infinite', verticalAlign: 'text-bottom' }} />
                            </div>
                        </div>
                    </div>}
                    {portfolio.length === 0 ? <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                        <div style={{ fontSize: 64, marginBottom: 16 }}>📂</div>
                        <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 20, marginBottom: 8 }}>No Holdings Yet</h3>
                        <p style={{ color: 'var(--muted)', marginBottom: 20 }}>Start building your portfolio by browsing the market</p>
                        <button onClick={() => setTab('screener')} style={{ padding: '12px 28px', borderRadius: 10, border: 'none', background: 'var(--accent)', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>Browse Market</button>
                    </div> : <>
                        <div style={{ display: 'grid', gap: 12 }}>
                            {portfolio.map(h => {
                                const s = STOCKS_DATA[h.sym]; if (!s) return null; const cv = s.price * h.qty; const pnl = cv - h.avg * h.qty; const pnlPct = ((s.price - h.avg) / h.avg * 100);
                                return <div key={h.sym} className="card-hover" style={{ background: 'var(--card)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 14, padding: 18 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(59,130,246,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: 'var(--accent)' }}>{h.sym.slice(0, 2)}</div>
                                            <div><div style={{ fontWeight: 700, fontSize: 16 }}>{h.sym}</div><div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{h.qty} shares · Avg {formatCurrency(h.avg)}</div></div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700 }}>{formatCurrency(cv)}</div>
                                            <div style={{ color: pnl >= 0 ? 'var(--green)' : 'var(--red)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>{pnl >= 0 ? '+' : ''}{formatCurrency(Math.abs(pnl))} ({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%)</div>
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
            </div >

            {/* ─── AI PANEL ─── */}
            {
                aiOpen && <div style={{ position: 'fixed', right: 0, width: isMobileCheck() ? '100%' : 380, background: 'var(--sidebar)', borderLeft: '1px solid rgba(255,255,255,.06)', display: 'flex', flexDirection: 'column', zIndex: 1500, animation: isMobileCheck() ? 'slideUp .3s ease' : 'slideInRight .3s ease', ...(isMobileCheck() ? { bottom: 0, top: '40%', borderRadius: '16px 16px 0 0', borderTop: '1px solid rgba(255,255,255,.1)' } : { top: 50, bottom: 0 }) }}>
                    <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className={aiLoading ? 'ai-pulse' : ''} style={{ fontSize: 22, background: 'linear-gradient(135deg,var(--accent),#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', transition: 'all .3s' }}>✨</span>
                        <div style={{ flex: 1 }}><div style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700 }}>Labh Sathi</div><div style={{ fontSize: 11, color: 'var(--muted)' }}>{aiLoading ? 'Thinking...' : 'Not financial advice'}</div></div>
                        {aiMessages.length > 0 && <button onClick={clearChat} title="Clear chat" style={{ background: 'none', border: '1px solid rgba(75,90,128,.3)', borderRadius: 6, color: 'var(--muted)', fontSize: 12, cursor: 'pointer', padding: '4px 10px' }}>🗑️ Clear</button>}
                        <button onClick={() => setAiOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 20, cursor: 'pointer' }}>✕</button>
                    </div>
                    <div style={{ background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.2)', margin: '12px 14px 0', padding: '10px 14px', fontSize: 11, color: '#F59E0B', borderRadius: 10, lineHeight: 1.5, flexShrink: 0 }}>⚠️ AI analysis is educational only and is not SEBI-registered financial advice. AI can make mistakes.</div>
                    <div ref={aiRef} className="chat-scroll" style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
                        {aiMessages.length === 0 && <div style={{ padding: '20px 0' }}>
                            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.6 }}>Ask me anything about Indian stocks! I'm Labh Sathi, your market analysis assistant.</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {[`Analyze ${selSym} for me`, 'Explain RSI and how to use it', 'What is PE ratio?', 'Diversify my portfolio?', 'Risks of investing now?', 'Support & Resistance', 'Candlestick patterns', 'FII & DII activity'].map(p => <button className="chip-btn" key={p} onClick={() => sendAI(p)} disabled={aiLoading} style={{ padding: '6px 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,.12)', background: '#1A1A1A', color: '#9CA3AF', cursor: aiLoading ? 'not-allowed' : 'pointer', fontSize: 12, opacity: aiLoading ? 0.5 : 1, fontWeight: 500, whiteSpace: 'nowrap' }}>{p}</button>)}
                            </div>
                        </div>}
                        {aiMessages.map((m, i) => {
                            const tradeJson = m.role === 'assistant' ? parseTradeJson(m.text) : null;
                            const cleanText = tradeJson ? m.text.replace(/```json\s*[\s\S]*?\s*```/, '').trim() : m.text;
                            return <div key={i} style={{ marginBottom: 14, display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                                <div style={{ maxWidth: '88%' }}>
                                    {m.role === 'assistant' && <div style={{ fontSize: 10, color: 'var(--accent)', marginBottom: 4, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>🤖 Labh Sathi {m.time && <span style={{ color: 'var(--muted)', fontWeight: 400 }}>· {m.time}</span>}</div>}
                                    {m.role === 'error' && <div style={{ fontSize: 10, color: 'var(--red)', marginBottom: 4, fontWeight: 600 }}>⚠️ Connection Error {m.time && <span style={{ color: 'var(--muted)', fontWeight: 400 }}>· {m.time}</span>}</div>}
                                    {cleanText && <div style={{ padding: '10px 14px', borderRadius: 12, background: m.role === 'user' ? 'rgba(59,130,246,.15)' : m.role === 'error' ? 'rgba(245,69,92,.08)' : 'var(--card)', border: `1px solid ${m.role === 'user' ? 'rgba(59,130,246,.2)' : m.role === 'error' ? 'rgba(245,69,92,.2)' : 'rgba(255,255,255,.06)'}`, fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: cleanText.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />}

                                    {tradeJson && (
                                        <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 12, padding: 16, marginTop: cleanText ? 12 : 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                                <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, color: '#FFFFFF' }}>{tradeJson.ticker}</div>
                                                <div style={{ fontSize: 14, fontWeight: 700, color: tradeJson.action?.toUpperCase() === 'BUY' ? '#10D07A' : '#FF4B55', padding: '4px 8px', background: tradeJson.action?.toUpperCase() === 'BUY' ? 'rgba(16,208,122,0.1)' : 'rgba(255,75,85,0.1)', borderRadius: 6 }}>{tradeJson.action}</div>
                                            </div>
                                            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
                                                <span style={{ color: '#FFFFFF' }}>Qty: {tradeJson.quantity}</span><br />
                                                {tradeJson.reasoning}
                                            </div>
                                            <div style={{ display: 'flex', gap: 10 }}>
                                                <button onClick={() => console.log('Confirm Order', tradeJson)} style={{ flex: 1, padding: '8px', borderRadius: 6, border: 'none', background: '#10D07A', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Confirm Order</button>
                                                <button onClick={() => console.log('Cancel Order', tradeJson)} style={{ flex: 1, padding: '8px', borderRadius: 6, border: '1px solid #2A2A2A', background: 'transparent', color: '#FFF', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
                                            </div>
                                        </div>
                                    )}

                                    {m.role === 'error' && <button onClick={() => retryLastMessage(m.failedMsg)} disabled={aiLoading} style={{ marginTop: 6, padding: '6px 14px', borderRadius: 6, border: '1px solid var(--accent)', background: 'rgba(59,130,246,.1)', color: 'var(--accent)', cursor: aiLoading ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600 }}>🔄 Retry</button>}
                                    {m.role === 'user' && m.time && <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3, textAlign: 'right' }}>{m.time}</div>}
                                </div>
                            </div>;
                        })}
                        {aiLoading && <div style={{ marginBottom: 12 }}><div style={{ fontSize: 10, color: 'var(--accent)', marginBottom: 4, fontWeight: 600 }}>🤖 Labh Sathi</div><div style={{ display: 'inline-flex', gap: 6, padding: '12px 16px', background: 'var(--card)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12 }}>{[0, 1, 2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', animation: `pulse 1s ease ${i * 0.2}s infinite` }} />)}</div></div>}
                        <div ref={msgEndRef} />
                    </div>
                    {aiMessages.some(m => m.role === 'assistant') && <div style={{ padding: '0 14px 8px', display: 'flex', gap: 8 }}>
                        <button onClick={() => setTradeModal({ sym: selSym, action: 'BUY' })} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: 'var(--green)', color: '#000', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Buy {selSym}</button>
                        <button onClick={() => setTradeModal({ sym: selSym, action: 'SELL' })} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: 'var(--red)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Sell {selSym}</button>
                    </div>}
                    <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,.06)' }}>
                        <div className="cmd-bar" style={{ display: 'flex', alignItems: 'center', background: '#1A1A1A', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, padding: 4 }}>
                            <textarea value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAI(); } }} placeholder={`Ask about ${selSym}...`} rows={1} disabled={aiLoading} style={{ flex: 1, padding: '8px 12px', background: 'transparent', border: 'none', borderRadius: 8, color: 'var(--text)', fontSize: 13, resize: 'none', opacity: aiLoading ? 0.5 : 1, lineHeight: 1.4 }} />
                            <button className="send-btn" onClick={() => sendAI()} disabled={aiLoading || !aiInput.trim()} style={{ width: 36, height: 36, borderRadius: 8, border: 'none', background: (aiLoading || !aiInput.trim()) ? 'rgba(16,208,122,.3)' : '#10D07A', color: '#000', cursor: (aiLoading || !aiInput.trim()) ? 'not-allowed' : 'pointer', fontSize: 16, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{aiLoading ? <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }} /> : '➤'}</button>
                        </div>
                    </div>
                </div>
            }

            <Footer />

            {/* MOBILE BOTTOM NAV */}
            {
                isMobileCheck() && <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 60, background: 'var(--sidebar)', borderTop: '1px solid rgba(255,255,255,.08)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 1000 }}>
                    {[{ id: 'dashboard', e: '📊' }, { id: 'chart', e: '📈' }, { id: 'portfolio', e: '💼' }, { id: 'reviews', e: '⭐' }].map(n => <button key={n.id} onClick={() => setTab(n.id)} style={{ background: 'none', border: 'none', color: tab === n.id ? 'var(--accent)' : 'var(--muted)', fontSize: 22, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}><span>{n.e}</span><span style={{ fontSize: 9 }}>{n.id.charAt(0).toUpperCase() + n.id.slice(1)}</span></button>)}
                    <button onClick={() => setAiOpen(!aiOpen)} style={{ background: 'none', border: 'none', color: aiOpen ? 'var(--accent)' : 'var(--muted)', fontSize: 22, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}><span>✨</span><span style={{ fontSize: 9 }}>AI</span></button>
                </div>
            }
        </div >
    </>;
}

function isMobileCheck() { return typeof window !== 'undefined' && window.innerWidth < 768; }

const inputSt = { width: '100%', padding: '10px 14px', background: 'var(--bg)', border: '1px solid rgba(75,90,128,.3)', borderRadius: 8, color: 'var(--text)', fontSize: 14, marginBottom: 12 };