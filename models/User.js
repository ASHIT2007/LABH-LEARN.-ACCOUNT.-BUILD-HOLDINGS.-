import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    passwordHash: { type: String, required: true },

    // Feature 4: Virtual Currency & Leaderboard
    virtualBalance: { type: Number, default: 100000 },

    // Track current holdings for the Leaderboard & Interlocks
    portfolio: [{
        ticker: { type: String, required: true },
        quantity: { type: Number, required: true },
        averagePrice: { type: Number, required: true }
    }],

    // Track system status (e.g., if an interlock triggered a freeze)
    tradingStatus: {
        type: String,
        enum: ['ACTIVE', 'BUYING_LOCKED'],
        default: 'ACTIVE'
    }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
