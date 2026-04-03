import mongoose from "mongoose";

const ActivityLogSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    app_name: { type: String, required: true },
    start_time: { type: Date, required: true },
    duration_seconds: { type: Number, required: true },
    site: { type: String, default: null },
}, { timestamps: true });

// Compound index for fast per-user queries sorted by time
ActivityLogSchema.index({ userId: 1, start_time: -1 });

const ActivityLog = mongoose.models.ActivityLog || mongoose.model("ActivityLog", ActivityLogSchema);
export default ActivityLog;
