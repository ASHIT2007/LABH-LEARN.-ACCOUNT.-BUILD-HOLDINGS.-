import mongoose from 'mongoose';

const tradeSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, enum: ['BUY', 'SELL'], required: true },
    ticker: { type: String, required: true },
    quantity: { type: Number, required: true },
    executionPrice: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now }
});

export default mongoose.model('Trade', tradeSchema);
