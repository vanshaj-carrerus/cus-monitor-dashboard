import mongoose from "mongoose";

const InviteSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: ['admin', 'manager', 'marketing', 'sales'], required: true },
    status: { type: String, enum: ['pending', 'accepted', 'expired'], default: 'pending' },
    token: { type: String, required: true, unique: true },
    name: { type: String },
    contactNumber: { type: String },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Manager' },
    expiresAt: { type: Date, default: () => new Date(+new Date() + 3 * 24 * 60 * 60 * 1000) } // 3 days from now
}, { timestamps: true });

const Invite = mongoose.models.Invite || mongoose.model("Invite", InviteSchema);
export default Invite;
