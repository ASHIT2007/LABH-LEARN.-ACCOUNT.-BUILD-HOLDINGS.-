import React, { useState } from 'react';

const STYLE_TEXT = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap');

*,*::before,*::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

:root {
    --bg-dark: #0a0a0a;
    --card-bg: rgba(16, 16, 16, 0.7);
    --border-subtle: rgba(255, 255, 255, 0.08);
    --accent-cyan: #22c55e;
    --accent-blue: #16a34a;
    --text-main: #f8fafc;
    --text-muted: #94a3b8;
    --input-bg: #141414;
    --danger: #ef4444;
    --warning-bg: rgba(245, 158, 11, 0.1);
    --warning-text: #f5b041;
}

body {
    background-color: var(--bg-dark);
    color: var(--text-main);
    font-family: 'Inter', sans-serif;
    -webkit-font-smoothing: antialiased;
}

/* Subtle background particles/gradient */
.auth-bg {
    position: fixed;
    inset: 0;
    background: radial-gradient(circle at 50% -20%, rgba(34, 197, 94, 0.15), transparent 60%),
                radial-gradient(circle at 100% 80%, rgba(22, 163, 74, 0.05), transparent 50%);
    z-index: -1;
}

.auth-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    position: relative;
}

.auth-card {
    width: 100%;
    max-width: 440px;
    background: var(--card-bg);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid var(--border-subtle);
    border-radius: 24px;
    padding: 40px;
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
    animation: authFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes authFadeIn {
    0% { opacity: 0; transform: translateY(20px) scale(0.98); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
}

.auth-header {
    text-align: center;
    margin-bottom: 32px;
}

.logo-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 12px;
}

.logo-image {
    width: 48px;
    height: 48px;
    object-fit: contain;
    border-radius: 12px;
    box-shadow: 0 0 20px rgba(34, 197, 94, 0.2);
}

.logo-icon {
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, var(--accent-cyan), var(--accent-blue));
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);
}

.logo-icon svg {
    width: 20px;
    height: 20px;
    color: #000;
}

.logo-text {
    font-size: 32px;
    font-weight: 800;
    letter-spacing: -1px;
    background: linear-gradient(135deg, #fff, #94a3b8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0;
}

.auth-subtitle {
    color: var(--text-muted);
    font-size: 15px;
    font-weight: 400;
}

/* Tabs */
.tabs-container {
    display: flex;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    padding: 4px;
    margin-bottom: 28px;
    position: relative;
}

.tab-btn {
    flex: 1;
    padding: 10px 0;
    font-size: 14px;
    font-weight: 600;
    border: none;
    background: transparent;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    color: var(--text-muted);
    z-index: 1;
}

.tab-btn.active {
    color: #fff;
}

.tab-indicator {
    position: absolute;
    top: 4px;
    bottom: 4px;
    width: calc(50% - 4px);
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    z-index: 0;
}

/* Form Elements */
.input-group {
    margin-bottom: 20px;
    position: relative;
}

.input-label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-muted);
    margin-bottom: 8px;
}

.input-field {
    width: 100%;
    background: var(--input-bg);
    border: 1px solid var(--border-subtle);
    color: var(--text-main);
    padding: 14px 16px;
    border-radius: 12px;
    font-size: 15px;
    transition: all 0.2s ease;
    outline: none;
    font-family: inherit;
}

.input-field:focus {
    border-color: var(--accent-cyan);
    background: rgba(0, 245, 212, 0.03);
    box-shadow: 0 0 0 3px rgba(0, 245, 212, 0.1);
}

.input-field::placeholder {
    color: #475569;
}

select.input-field {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 16px center;
    background-size: 16px;
    padding-right: 48px;
}

.password-toggle {
    position: absolute;
    right: 16px;
    top: 36px;
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s;
}

.password-toggle:hover {
    color: var(--text-main);
}

.forgot-link {
    display: block;
    text-align: right;
    font-size: 13px;
    color: var(--accent-blue);
    text-decoration: none;
    margin-top: 8px;
    font-weight: 500;
    transition: opacity 0.2s;
}

.forgot-link:hover {
    opacity: 0.8;
}

.submit-btn {
    width: 100%;
    padding: 16px;
    background: linear-gradient(to right, var(--accent-cyan), var(--accent-blue));
    color: #000;
    border: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    margin-top: 12px;
    transition: all 0.2s ease;
    box-shadow: 0 4px 14px rgba(0, 245, 212, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.submit-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 245, 212, 0.3);
}

.submit-btn:active {
    transform: translateY(0);
}

.submit-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
}

.warning-footer {
    margin-top: 32px;
    padding: 14px;
    background: var(--warning-bg);
    border: 1px solid rgba(245, 158, 11, 0.2);
    border-radius: 10px;
    display: flex;
    gap: 10px;
    align-items: flex-start;
}

.warning-footer svg {
    color: var(--warning-text);
    flex-shrink: 0;
    margin-top: 2px;
}

.warning-footer span {
    font-size: 12px;
    color: var(--warning-text);
    line-height: 1.5;
}

@media (max-width: 480px) {
    .auth-card {
        padding: 32px 24px;
        border-radius: 20px;
    }
    .logo-text { font-size: 28px; }
}
`;

export default function Auth({ onLoginSuccess, addToast }) {
    const [authTab, setAuthTab] = useState('login');
    const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', level: 'Beginner' });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!authForm.email || !authForm.password || (authTab === 'register' && !authForm.name)) {
            addToast('Please fill all required fields', 'error');
            return;
        }

        setLoading(true);
        const endpoint = authTab === 'login' ? '/api/auth/login' : '/api/auth/register';

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(authForm)
            });
            const data = await res.json();

            if (res.ok) {
                if (authTab === 'register') {
                    addToast('Welcome to Labh! 🎉 Account created successfully.');
                } else {
                    addToast(`Welcome back, ${data.user.name || data.user.fullName || 'Trader'}!`);
                }
                setTimeout(() => {
                    onLoginSuccess(data.user, data.user.portfolio || []);
                }, 500); // slight delay to show the nice toast
            } else {
                addToast(data.error || 'Authentication failed', 'error');
            }
        } catch (err) {
            addToast('Network error while connecting to server', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field) => (e) => {
        setAuthForm(prev => ({ ...prev, [field]: e.target.value }));
    };

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: STYLE_TEXT }} />
            <div className="auth-bg"></div>
            <div className="auth-container">
                <div className="auth-card">
                    {/* Header */}
                    <div className="auth-header">
                        <div className="logo-container">
                            <img src="/logo.png.png" alt="Labh Logo" className="logo-image" />
                            <h1 className="logo-text">Labh</h1>
                        </div>
                        <p className="auth-subtitle">Trade smarter with Vibe AI</p>
                    </div>

                    {/* Tabs */}
                    <div className="tabs-container">
                        <div
                            className="tab-indicator"
                            style={{ transform: authTab === 'login' ? 'translateX(0)' : 'translateX(100%)' }}
                        />
                        <button
                            type="button"
                            className={`tab-btn ${authTab === 'login' ? 'active' : ''}`}
                            onClick={() => setAuthTab('login')}
                        >
                            Sign In
                        </button>
                        <button
                            type="button"
                            className={`tab-btn ${authTab === 'register' ? 'active' : ''}`}
                            onClick={() => setAuthTab('register')}
                        >
                            Register
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        {authTab === 'register' && (
                            <>
                                <div className="input-group fade-in">
                                    <label className="input-label" htmlFor="name">Full Name</label>
                                    <input
                                        id="name"
                                        className="input-field"
                                        required
                                        placeholder="Enter your full name"
                                        value={authForm.name}
                                        onChange={handleInputChange('name')}
                                    />
                                </div>
                                <div className="input-group fade-in">
                                    <label className="input-label" htmlFor="level">Experience Level</label>
                                    <select
                                        id="level"
                                        className="input-field"
                                        value={authForm.level}
                                        onChange={handleInputChange('level')}
                                    >
                                        <option value="Beginner" style={{ background: '#141414' }}>Beginner — new to trading</option>
                                        <option value="Intermediate" style={{ background: '#141414' }}>Intermediate — some experience</option>
                                        <option value="Advanced" style={{ background: '#141414' }}>Advanced — seasoned trader</option>
                                    </select>
                                </div>
                            </>
                        )}

                        <div className="input-group">
                            <label className="input-label" htmlFor="email">Email Address</label>
                            <input
                                id="email"
                                className="input-field"
                                required
                                placeholder="name@example.com"
                                type="email"
                                value={authForm.email}
                                onChange={handleInputChange('email')}
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label" htmlFor="password">Password</label>
                            <input
                                id="password"
                                className="input-field"
                                required
                                placeholder={authTab === 'login' ? "Enter your password" : "Create a password"}
                                type={showPassword ? "text" : "password"}
                                value={authForm.password}
                                onChange={handleInputChange('password')}
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex="-1"
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                )}
                            </button>
                            {authTab === 'login' && (
                                <a href="#" className="forgot-link" onClick={(e) => { e.preventDefault(); addToast('Password reset flow not implemented in demo', 'warning'); }}>
                                    Forgot password?
                                </a>
                            )}
                        </div>

                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? (
                                <svg className="animate-spin" width="20" height="20" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : null}
                            {loading ? 'Processing...' : (authTab === 'login' ? 'Sign In' : 'Create Account')}
                        </button>
                    </form>

                    {/* Footer Warning */}
                    <div className="warning-footer">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                            <line x1="12" y1="9" x2="12" y2="13"></line>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                        <span>Educational platform for learning stock market concepts. <strong>No real trading or money involved.</strong></span>
                    </div>
                </div>
            </div>
        </>
    );
}
