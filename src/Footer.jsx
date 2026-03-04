import React, { useState } from 'react';

export default function Footer() {
    return (
        <footer style={{
            background: '#0A0A0A',
            borderTop: '1px solid #2A2A2A',
            color: '#A3A3A3',
            padding: '48px 24px 24px 24px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            marginTop: 'auto', // Pushes footer to bottom if container has min-height 100vh
            width: '100%',
            boxSizing: 'border-box'
        }}>
            <style>
                {`
                    .labh-footer-grid {
                        display: grid;
                        grid-template-columns: 1fr;
                        gap: 32px;
                        max-width: 1200px;
                        margin: 0 auto;
                    }
                    @media (min-width: 640px) {
                        .labh-footer-grid {
                            grid-template-columns: repeat(2, 1fr);
                        }
                    }
                    @media (min-width: 1024px) {
                        .labh-footer-grid {
                            grid-template-columns: repeat(4, 1fr);
                        }
                    }
                    .labh-footer-link {
                        color: #A3A3A3;
                        text-decoration: none;
                        font-size: 14px;
                        margin-bottom: 12px;
                        display: block;
                        transition: color 0.2s ease;
                        cursor: pointer;
                    }
                    .labh-footer-link:hover {
                        color: #10D07A;
                    }
                    .labh-footer-heading {
                        color: #FFFFFF;
                        font-family: var(--font-head, inherit);
                        font-weight: 700;
                        font-size: 16px;
                        margin-bottom: 20px;
                    }
                `}
            </style>

            <div className="labh-footer-grid">
                {/* Column 1 */}
                <div>
                    <div className="labh-footer-heading">Company</div>
                    <a className="labh-footer-link" href="#">About Labh</a>
                    <a className="labh-footer-link" href="#">Careers</a>
                    <a className="labh-footer-link" href="#">Press</a>
                    <a className="labh-footer-link" href="#">Engineering Blog</a>
                </div>

                {/* Column 2 */}
                <div>
                    <div className="labh-footer-heading">Products</div>
                    <a className="labh-footer-link" href="#">Vibe AI Trading</a>
                    <a className="labh-footer-link" href="#">Portfolio Analytics</a>
                    <a className="labh-footer-link" href="#">Options Screener</a>
                    <a className="labh-footer-link" href="#">The Time Machine</a>
                </div>

                {/* Column 3 */}
                <div>
                    <div className="labh-footer-heading">Support & Legal</div>
                    <a className="labh-footer-link" href="#">Help Center</a>
                    <a className="labh-footer-link" href="#">API Documentation</a>
                    <a className="labh-footer-link" href="#">Terms of Service</a>
                    <a className="labh-footer-link" href="#">Privacy Policy</a>
                    <a className="labh-footer-link" href="#">Risk Disclosures</a>
                </div>

                {/* Column 4 */}
                <div>
                    <div className="labh-footer-heading">Connect</div>
                    <a className="labh-footer-link" href="https://x.com/Namantiwar958" target="_blank" rel="noopener noreferrer">Twitter / X</a>
                    <a className="labh-footer-link" href="#" target="_blank" rel="noopener noreferrer">Discord Community</a>
                    <a className="labh-footer-link" href="https://www.linkedin.com/in/ashit-tiwary-933369277/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                    <a className="labh-footer-link" href="https://github.com/ASHIT2007" target="_blank" rel="noopener noreferrer">GitHub</a>
                    <a className="labh-footer-link" href="https://www.instagram.com/ashit_tiwary/" target="_blank" rel="noopener noreferrer">Instagram</a>
                </div>
            </div>

            {/* Bottom Sub-Footer Section */}
            <div style={{
                maxWidth: 1200,
                margin: '48px auto 0',
                paddingTop: 24,
                borderTop: '1px solid #2A2A2A',
                display: 'flex',
                flexDirection: 'column',
                gap: 16
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ background: '#10D07A', width: 24, height: 24, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#000', fontSize: 13 }}>L</div>
                        <span style={{ fontFamily: 'var(--font-head, inherit)', fontSize: 18, fontWeight: 700, color: '#FFFFFF', letterSpacing: 0.5 }}>Labh</span>
                    </div>
                    <div style={{ fontSize: 13 }}>
                        © 2026 TradeVibe (Labh) Technologies. All rights reserved.
                    </div>
                </div>
                <div style={{ fontSize: 11, color: '#666', lineHeight: 1.5, marginTop: 8 }}>
                    Disclaimer: Labh is an educational simulator. Real trading involves significant risk of loss. The "Vibe AI" and market data shown are for demonstration and educational purposes only and do not constitute financial advice.
                </div>
            </div>

            <div style={{ height: 60 }} className="mobile-nav-spacer"></div>
            <style>
                {`
                    @media (min-width: 768px) {
                        .mobile-nav-spacer { display: none; }
                    }
                `}
            </style>
        </footer>
    );
}
