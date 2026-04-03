import mongoose from "mongoose";

const LocationSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    address: { type: String },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Location = mongoose.models.Location || mongoose.model("Location", LocationSchema);
export default Location;
