/**
 * Trade Controller — Robust POST /api/trade execution
 * Handles BUY/SELL validation, balance checks, portfolio updates, and Logic-Based Interlocks.
 */

import User from '../models/User.js';
import Trade from '../models/Trade.js';
import mongoose from 'mongoose';

/**
 * Normalize holdings for frontend (supports both portfolioHoldings and legacy portfolio)
 */
export function formatUserForFrontend(user) {
    if (!user) return null;
    const userObj = typeof user.toObject === 'function' ? user.toObject() : { ...user };

    // Prefer portfolioHoldings; fallback to legacy portfolio
    const holdings = userObj.portfolioHoldings?.length
        ? userObj.portfolioHoldings
        : (userObj.portfolio || []);

    const portfolio = holdings.map((p) => ({
        sym: p.ticker || p.sym,
        qty: p.sharesOwned !== undefined ? p.sharesOwned : (p.quantity ?? p.qty),
        avg: p.averageBuyPrice !== undefined ? p.averageBuyPrice : (p.averagePrice ?? p.avg),
    }));

    return {
        ...userObj,
        name: userObj.name || userObj.fullName,
        portfolio,
        virtualBalance: userObj.virtualBalance ?? 100000,
    };
}

/**
 * Execute a trade (BUY or SELL)
 * Validates balance/shares, applies Logic-Based Interlocks, updates user and portfolio.
 */
export async function executeTrade(req, res) {
    try {
        const { email, ticker, action, quantity, currentPrice, executionPrice } = req.body;

        // Accept both currentPrice and executionPrice for compatibility
        const price = currentPrice ?? executionPrice;

        if (!email || !ticker || !action || quantity == null || price == null) {
            return res.status(400).json({
                error: 'Missing required fields: email, ticker, action, quantity, and currentPrice (or executionPrice) are required.',
            });
        }

        const act = String(action).toUpperCase();
        if (act !== 'BUY' && act !== 'SELL') {
            return res.status(400).json({ error: 'Action must be BUY or SELL.' });
        }

        const qty = Math.floor(Number(quantity));
        const priceNum = Number(price);

        if (qty < 1 || !Number.isFinite(priceNum) || priceNum <= 0) {
            return res.status(400).json({ error: 'Quantity must be at least 1 and price must be a positive number.' });
        }

        const totalAmount = qty * priceNum;
        const tickerUpper = String(ticker).toUpperCase();

        if (mongoose.connection.readyState !== 1) {
            return executeTradeMock(req, res, { email, act, tickerUpper, qty, priceNum, totalAmount });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: 'User not found.' });

        // ─── Logic-Based Interlocks (placeholder for upcoming safety interlock system) ───
        if (user.isLockedOut) {
            return res.status(403).json({ error: 'Trade locked by safety interlock.' });
        }
        if (user.tradingStatus === 'BUYING_LOCKED' && act === 'BUY') {
            return res.status(403).json({ error: 'Buying is currently locked by Safety Interlocks.' });
        }

        // Use portfolioHoldings; migrate from legacy portfolio if needed
        let holdings = user.portfolioHoldings || [];
        if (holdings.length === 0 && (user.portfolio?.length ?? 0) > 0) {
            holdings = (user.portfolio || []).map((p) => ({
                ticker: p.ticker || p.sym,
                sharesOwned: p.quantity ?? p.qty,
                averageBuyPrice: p.averagePrice ?? p.avg,
            }));
            user.portfolioHoldings = holdings;
            user.portfolio = undefined;
        }

        if (act === 'BUY') {
            if ((user.virtualBalance ?? 0) < totalAmount) {
                return res.status(400).json({ error: 'Insufficient balance' });
            }
            user.virtualBalance = (user.virtualBalance ?? 100000) - totalAmount;

            const existing = holdings.find((h) => h.ticker === tickerUpper);
            if (existing) {
                const prevCost = existing.sharesOwned * existing.averageBuyPrice;
                const newShares = existing.sharesOwned + qty;
                existing.sharesOwned = newShares;
                existing.averageBuyPrice = (prevCost + totalAmount) / newShares;
            } else {
                holdings.push({
                    ticker: tickerUpper,
                    sharesOwned: qty,
                    averageBuyPrice: priceNum,
                });
            }
            user.portfolioHoldings = holdings;
        } else {
            const existing = holdings.find((h) => h.ticker === tickerUpper);
            if (!existing || existing.sharesOwned < qty) {
                return res.status(400).json({ error: 'Insufficient quantity to sell' });
            }
            user.virtualBalance = (user.virtualBalance ?? 0) + totalAmount;
            existing.sharesOwned -= qty;
            if (existing.sharesOwned <= 0) {
                user.portfolioHoldings = holdings.filter((h) => h.ticker !== tickerUpper);
            }
        }

        const newTrade = new Trade({
            userId: user._id,
            action: act,
            ticker: tickerUpper,
            quantity: qty,
            executionPrice: priceNum,
            totalAmount,
        });
        await newTrade.save();
        await user.save();

        return res.json({
            message: 'Trade executed successfully',
            user: formatUserForFrontend(user),
            trade: newTrade,
        });
    } catch (err) {
        console.error('❌ Trade error:', err);
        return res.status(500).json({ error: 'Failed to execute trade' });
    }
}

/**
 * In-memory fallback when MongoDB is not connected
 */
function executeTradeMock(req, res, { email, act, tickerUpper, qty, priceNum, totalAmount }) {
    const { mockUsers, mockTrades } = req.app.locals;
    if (!mockUsers || !mockTrades) {
        return res.status(503).json({ error: 'Database not connected and mock data unavailable.' });
    }

    const user = mockUsers.find((u) => u.email === email);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    if (user.isLockedOut) {
        return res.status(403).json({ error: 'Trade locked by safety interlock.' });
    }
    if (user.tradingStatus === 'BUYING_LOCKED' && act === 'BUY') {
        return res.status(403).json({ error: 'Buying is currently locked by Safety Interlocks.' });
    }

    let holdings = user.portfolioHoldings || user.portfolio || [];
    if (holdings.length > 0 && holdings[0].quantity !== undefined) {
        holdings = holdings.map((p) => ({
            ticker: p.ticker || p.sym,
            sharesOwned: p.quantity ?? p.qty,
            averageBuyPrice: p.averagePrice ?? p.avg,
        }));
        user.portfolioHoldings = holdings;
    }

    if (act === 'BUY') {
        if ((user.virtualBalance ?? 100000) < totalAmount) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }
        user.virtualBalance = (user.virtualBalance ?? 100000) - totalAmount;
        const existing = holdings.find((h) => h.ticker === tickerUpper);
        if (existing) {
            const prevCost = existing.sharesOwned * existing.averageBuyPrice;
            existing.sharesOwned += qty;
            existing.averageBuyPrice = (prevCost + totalAmount) / existing.sharesOwned;
        } else {
            holdings.push({ ticker: tickerUpper, sharesOwned: qty, averageBuyPrice: priceNum });
        }
        user.portfolioHoldings = holdings;
    } else {
        const existing = holdings.find((h) => h.ticker === tickerUpper);
        if (!existing || existing.sharesOwned < qty) {
            return res.status(400).json({ error: 'Insufficient quantity to sell' });
        }
        user.virtualBalance = (user.virtualBalance ?? 0) + totalAmount;
        existing.sharesOwned -= qty;
        if (existing.sharesOwned <= 0) {
            user.portfolioHoldings = holdings.filter((h) => h.ticker !== tickerUpper);
        }
    }

    const newTrade = {
        _id: Date.now().toString(),
        userId: user._id,
        action: act,
        ticker: tickerUpper,
        quantity: qty,
        executionPrice: priceNum,
        totalAmount,
        timestamp: new Date(),
    };
    mockTrades.push(newTrade);

    return res.json({
        message: 'Trade executed successfully',
        user: formatUserForFrontend(user),
        trade: newTrade,
    });
}
