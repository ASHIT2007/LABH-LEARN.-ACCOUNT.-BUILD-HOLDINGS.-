import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    passwordHash: { type: String, required: true },

    // Feature 4: Virtual Currency & Leaderboard
    virtualBalance: { type: Number, default: 100000 },

    // Track current holdings for the Leaderboard & Interlocks
    portfolioHoldings: [{
        ticker: { type: String, required: true },
        sharesOwned: { type: Number, required: true },
        averageBuyPrice: { type: Number, required: true }
    }],

    // Legacy: kept for backward compatibility during migration
    portfolio: [{
        ticker: { type: String },
        quantity: { type: Number },
        averagePrice: { type: Number }
    }],

    // Track system status (e.g., if an interlock triggered a freeze)
    tradingStatus: {
        type: String,
        enum: ['ACTIVE', 'BUYING_LOCKED'],
        default: 'ACTIVE'
    }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
