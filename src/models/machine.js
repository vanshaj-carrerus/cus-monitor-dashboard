import mongoose from "mongoose";

const MachineSchema = new mongoose.Schema({
    machineId: { type: String, required: true, unique: true },
    deviceName: { type: String },
    lastSeen: { type: Date, default: Date.now }
}, { timestamps: true });

const Machine = mongoose.models.Machine || mongoose.model("Machine", MachineSchema);
export default Machine;
