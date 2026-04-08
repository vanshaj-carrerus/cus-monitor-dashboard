import mongoose from "mongoose";

const CommonUserSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    userEmail: { type: String, required: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    teamLeaderEmail: { type: String, required: true },
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Manager' },
    active: { type: Boolean, default: false },
    lastLogin: { type: Date, default: Date.now }
}, { timestamps: true });

const CommonUser = mongoose.models.CommonUser || mongoose.model("CommonUser", CommonUserSchema);
export default CommonUser;