import re
import codecs

filepath = r"c:\Users\ASHIT TIWARY\OneDrive\Desktop\STOCKS\src\Labh.jsx"
with codecs.open(filepath, "r", "utf-8") as f:
    code = f.read()

# 1. Update STYLE_TEXT
new_style = """const STYLE_TEXT = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{--bg:#0B0C0E;--card:#16181C;--sidebar:#16181C;--accent:#3b82f6;--green:#00FFA3;--red:#FF4B55;--gold:#F7931A;--text:#FFFFFF;--muted:#8E929B;--font-head:'Inter',sans-serif;--font-body:'Inter',sans-serif;--font-mono:'JetBrains Mono',monospace;}
body{background:var(--bg);color:var(--text);font-family:var(--font-body);overflow-x:hidden;}
::-webkit-scrollbar{width:6px;}::-webkit-scrollbar-track{background:var(--bg);}::-webkit-scrollbar-thumb{background:#2A2D35;border-radius:3px;}
input,textarea,select,button{font-family:var(--font-body);outline:none;}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideInRight{from{transform:translateX(100%)}to{transform:translateX(0)}}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes toastIn{from{transform:translateX(120%);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes toastOut{from{transform:translateX(0);opacity:1}to{transform:translateX(120%);opacity:0}}
.fade-in{animation:fadeIn .4s ease both;}
.card-hover{transition:transform .2s,border-color .2s;}.card-hover:hover{border-color:rgba(255,255,255,.2);}
`;"""
code = re.sub(r'const STYLE_TEXT = `.*?`;', new_style, code, flags=re.DOTALL)

# 2. Update CandlestickChart Line Chart with Green Glow
new_chart = """const CandlestickChart = ({ sym, rangeIdx = 5 }) => {
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
    const W = dims.w, H = dims.h, pad = { t: 10, b: 30, l: 0, r: 50 }, chartH = H - pad.t - pad.b, chartW = W - pad.l - pad.r;
    const priceH = chartH;
    const prices = candles.flatMap(c => [c.h, c.l]);
    const mn = Math.min(...prices), mx = Math.max(...prices), pr = mx - mn || 1;
    const xC = i => pad.l + i * (chartW / Math.max(1, candles.length - 1));
    const yP = v => pad.t + priceH - (((v - mn) / pr) * priceH);

    const linePath = candles.map((c, i) => `${xC(i)},${yP(c.c)}`).join(' ');
    const areaPath = `${xC(0)},${pad.t + priceH} ${linePath} ${xC(candles.length - 1)},${pad.t + priceH}`;
    const isUp = candles[candles.length - 1].c >= candles[0].c;
    const color = isUp ? 'var(--green)' : 'var(--red)';

    return <div ref={ref} style={{ width: '100%', height: '100%', minHeight: 400, position: 'relative' }}>
        <svg width={W} height={H} style={{ display: 'block' }} onMouseMove={e => { const rect = ref.current.getBoundingClientRect(); const mx2 = e.clientX - rect.left - pad.l; const idx = Math.round(mx2 / (chartW / candles.length)); if (idx >= 0 && idx < candles.length) setHover(idx); else setHover(null); }} onMouseLeave={() => setHover(null)}>
            <defs>
                <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            {Array.from({ length: 5 }).map((_, i) => { const v = mn + pr * (i / 4); const y = yP(v); return <g key={i}><line x1={0} x2={chartW} y1={y} y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth={1} /><text x={W - 5} y={y + 4} textAnchor="end" fill="var(--muted)" fontSize={11} fontFamily="var(--font-mono)">₹{v.toFixed(1)}k</text></g>; })}
            
            <polygon points={areaPath} fill="url(#chartGlow)" />
            <polyline points={linePath} fill="none" stroke={color} strokeWidth="2" style={{ filter: `drop-shadow(0 0 4px ${color}50)` }} />
            
            {candles.filter((_, i) => i % Math.max(1, Math.floor(candles.length / 6)) === 0).map((c, i) => { const idx = candles.indexOf(c); return <text key={i} x={xC(idx)} y={H - 5} textAnchor="middle" fill="var(--muted)" fontSize={11} fontFamily="var(--font-mono)">{c.date}</text>; })}
            
            {hover !== null && <>
                <line x1={xC(hover)} x2={xC(hover)} y1={pad.t} y2={pad.t + chartH} stroke="var(--muted)" strokeDasharray="4,4" opacity={0.5} />
                <circle cx={xC(hover)} cy={yP(candles[hover].c)} r={4} fill={color} />
                <rect x={xC(hover) - 30} y={H - 24} width={60} height={20} fill="var(--card)" rx={4} stroke="rgba(255,255,255,0.1)" />
                <text x={xC(hover)} y={H - 10} textAnchor="middle" fill="var(--text)" fontSize={10}>{candles[hover].date}</text>
            </>}
        </svg>
        {hover !== null && <div style={{ position: 'absolute', top: 10, left: 10, background: 'var(--card)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 6, padding: '6px 10px', fontSize: 12, pointerEvents: 'none', fontFamily: 'var(--font-mono)', display: 'flex', gap: 12 }}>
            <span style={{color: 'var(--muted)'}}>O <span style={{color: 'var(--text)'}}>{candles[hover].o.toFixed(2)}</span></span>
            <span style={{color: 'var(--muted)'}}>H <span style={{color: 'var(--text)'}}>{candles[hover].h.toFixed(2)}</span></span>
            <span style={{color: 'var(--muted)'}}>L <span style={{color: 'var(--text)'}}>{candles[hover].l.toFixed(2)}</span></span>
            <span style={{color: 'var(--muted)'}}>C <span style={{color: 'var(--green)'}}>{candles[hover].c.toFixed(2)}</span></span>
        </div>}
    </div>;
};"""
code = re.sub(r'const CandlestickChart = \(\{ sym, rangeIdx = 5 \}\) => \{.*?\n\};\n\n/\* ─── AREA CHART ─── \*/', new_chart + '\n\n/* ─── AREA CHART ─── */', code, flags=re.DOTALL)


# 3. Add Component State
states_injection = """    // Auth
    const [user, setUser] = useState(null);
    const [chartTradeTab, setChartTradeTab] = useState('Open Positions');
    const [chartTimeframe, setChartTimeframe] = useState('1D');
"""
code = code.replace("    // Auth\n    const [user, setUser] = useState(null);", states_injection)

# 4. Replace TOPBAR and sidebars
layout_start = code.find("/* ─── MAIN LAYOUT ─── */")
dashboard_tab_start = code.find("{/* ─── DASHBOARD TAB ─── */}")

new_layout = """/* ─── MAIN LAYOUT ─── */
    const figmaDataGenOrders = () => Array.from({length: 12}).map((_,i) => ({ price: (stock.price * (1 + (Math.random()-0.6)*0.02)).toFixed(2), amount: (Math.random()*2).toFixed(4), total: (Math.random()*100).toFixed(2) })).sort((a,b) => b.price - a.price);

    return <>
        <style dangerouslySetInnerHTML={{ __html: STYLE_TEXT }} />
        <Toast toasts={toasts} />
        {tradeModal && <TradeModal stock={STOCKS_DATA[tradeModal.sym]} action={tradeModal.action} onClose={() => setTradeModal(null)} onConfirm={handleTrade} />}

        {/* TOP NAVIGATION BAR */}
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 60, background: 'var(--bg)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', padding: '0 24px', zIndex: 1000 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                <div style={{ background: 'var(--green)', width: 32, height: 32, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#000', fontSize: 18 }}>T</div>
                <span style={{ fontFamily: 'var(--font-head)', fontSize: 17, fontWeight: 700, letterSpacing: 1 }}>TERMINAL</span>
            </div>
            
            <div style={{ display: 'flex', gap: 32, marginLeft: 48, flex: 1, fontSize: 14 }}>
                <span onClick={() => setTab('chart')} style={{cursor:'pointer', color: tab === 'chart' ? '#fff' : 'var(--muted)', fontWeight: tab === 'chart' ? 600 : 400}}>Trade</span>
                <span onClick={() => setTab('portfolio')} style={{cursor:'pointer', color: tab === 'portfolio' ? '#fff' : 'var(--muted)', fontWeight: tab === 'portfolio' ? 600 : 400}}>Portfolio</span>
                <span onClick={() => setTab('screener')} style={{cursor:'pointer', color: tab === 'screener' ? '#fff' : 'var(--muted)', fontWeight: tab === 'screener' ? 600 : 400}}>Markets</span>
                <span onClick={() => setTab('dashboard')} style={{cursor:'pointer', color: ['dashboard','leaderboard','learn','safety'].includes(tab) ? '#fff' : 'var(--muted)', fontWeight: ['dashboard','leaderboard','learn','safety'].includes(tab) ? 600 : 400}}>Analytics</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexShrink: 0, fontSize: 13, ...(isMobileCheck() ? {display:'none'}:{}) }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted)' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 10px var(--green)' }} /> Connected
                </div>
                <div style={{ height: 24, width: 1, background: 'rgba(255,255,255,.1)' }} />
                <div style={{ color: 'var(--muted)' }}>Balance: <strong style={{ color: '#fff', fontSize: 14, fontFamily: 'var(--font-mono)' }}>₹{totalCurrent ? totalCurrent.toLocaleString('en-IN') : '500,000'}</strong></div>
                <button onClick={() => setAiOpen(!aiOpen)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,.1)', borderRadius: 6, padding: '6px 12px', color: 'var(--text)', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>✨ Vibe AI</button>
            </div>
            {isMobileCheck() && <button onClick={() => setMobileMenu(!mobileMenu)} style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: 24, cursor: 'pointer', marginLeft: 'auto' }}>☰</button>}
        </div>

        {/* MOBILE DRAWER */}
        {mobileMenu && <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)' }} onClick={() => setMobileMenu(false)}><div onClick={e => e.stopPropagation()} style={{ width: 280, height: '100%', background: 'var(--card)', padding: '60px 16px 16px', animation: 'slideInRight .25s ease' }}>{navItems.map(n => <div key={n.id} onClick={() => { setTab(n.id); setMobileMenu(false); }} style={{ padding: '12px 14px', marginBottom: 4, cursor: 'pointer', color: tab === n.id ? 'var(--text)' : 'var(--muted)', fontSize: 14 }}>{n.emoji} {n.label}</div>)}</div></div>}

        <div style={{ paddingTop: 60, minHeight: '100vh', background: 'var(--bg)', paddingLeft: isMobileCheck() ? 12 : 24, paddingRight: isMobileCheck() ? 12 : (aiOpen ? 404 : 24), transition: 'padding 0.3s' }}>
                """

code = code[:layout_start] + new_layout + "\n                " + code[dashboard_tab_start:]

# 5. We need to replace the old CHART component with our FIGMA revamp.
old_chart_regex = r'\{\/\* ─── CHART TAB ─── \*\/\}.*?\{\/\* ─── SCREENER TAB ─── \*\/\}'

new_figma_chart = """{/* ─── CHART TAB ─── */}
                {tab === 'chart' && <div className="fade-in">
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

                    <div style={{ display: 'grid', gridTemplateColumns: isMobileCheck() ? '1fr' : '1fr 340px', gap: 24 }}>
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
                                                {['1H','4H','1D','1W','1M'].map(tf => (
                                                    <button key={tf} onClick={() => setChartTimeframe(tf)} style={{ background: chartTimeframe === tf ? 'rgba(0,255,163,0.1)' : 'transparent', color: chartTimeframe === tf ? 'var(--green)' : 'var(--muted)', border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: 12, fontWeight: chartTimeframe === tf ? 600 : 400, cursor: 'pointer' }}>{tf}</button>
                                                ))}
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
                                        <select value={selSym} onChange={e => {setSelSym(e.target.value); setChartRange(5);}} style={{ appearance: 'none', padding: '10px 32px 10px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                                            {ALL_SYMS.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                        <span style={{position:'absolute', right: 12, top: 10, pointerEvents: 'none', fontSize: 12}}>▼</span>
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
                                                    const s = STOCKS_DATA[h.sym]; const cv = s.price * h.qty; const pnl = cv - h.avg * h.qty;
                                                    return <tr key={h.sym} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                        <td style={{ padding: '16px 0', fontWeight: 600 }}>{h.sym} <span style={{ fontSize: 10, background:'rgba(255,255,255,0.1)', padding:'2px 4px', borderRadius:4, marginLeft:8}}>{s.exchange}</span></td>
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
                                            <thead><tr style={{ color: 'var(--muted)' }}><th style={{ paddingBottom: 16, fontWeight: 400 }}>Symbol</th><th style={{ paddingBottom: 16, fontWeight: 400 }}>Action</th><th style={{ paddingBottom: 16, fontWeight: 400 }}>Qty</th><th style={{ paddingBottom: 16, fontWeight: 400 }}>Price</th><th style={{ paddingBottom: 16, fontWeight: 400, textAlign:'right' }}>Time</th></tr></thead>
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
                                            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: `${Math.random()*60 + 10}%`, background: 'rgba(255,75,85,0.08)', zIndex: 0 }} />
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
                                            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: `${Math.random()*60 + 10}%`, background: 'rgba(0,255,163,0.08)', zIndex: 0 }} />
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

                {/* ─── SCREENER TAB ─── */}"""

code = re.sub(old_chart_regex, new_figma_chart, code, flags=re.DOTALL)

with codecs.open(filepath, "w", "utf-8") as f:
    f.write(code)
print("Transformation Complete")
