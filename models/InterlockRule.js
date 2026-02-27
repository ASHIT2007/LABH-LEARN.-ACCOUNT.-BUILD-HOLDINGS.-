import mongoose from 'mongoose';

const interlockRuleSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Example: "PORTFOLIO_DROP", "STOCK_DROP"
    conditionType: { type: String, required: true },

    // Example: 10 (for 10%), or a specific monetary amount
    thresholdValue: { type: Number, required: true },

    // Example: "LOCK_BUYING", "SELL_ALL", "ALERT_ONLY"
    action: { type: String, required: true },

    isActive: { type: Boolean, default: true },
    lastTriggeredAt: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.model('InterlockRule', interlockRuleSchema);
