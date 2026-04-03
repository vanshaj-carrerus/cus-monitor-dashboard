import mongoose from "mongoose";

const TimeEntrySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true }, // Normalized to YYYY-MM-DD
    sessions: [{
        sessionId: { type: String, required: true },
        startTime: { type: Date, default: Date.now },
        lastHeartbeat: { type: Date, default: Date.now },
        isActive: { type: Boolean, default: true }
    }],
    productiveSeconds: { type: Number, default: 0 },
    unproductiveSeconds: { type: Number, default: 0 },
    totalTrackedSeconds: { type: Number, default: 0 }
}, { timestamps: true });

// Compound index to ensure uniqueness for a given user per day
TimeEntrySchema.index({ userId: 1, date: 1 }, { unique: true });

const TimeEntry = mongoose.models.TimeEntry || mongoose.model("TimeEntry", TimeEntrySchema);
export default TimeEntry;
