import mongoose from 'mongoose';

const StreamSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: false },
    controlEnabled: { type: Boolean, default: false },
    controllerId: { type: String, default: '' },
    lastControlAt: { type: Date, default: null },
    reasonStopped: { type: String, default: '' },
    latestFrame: { type: String, default: '' },
    updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.Stream || mongoose.model('Stream', StreamSchema);
