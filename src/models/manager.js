import mongoose from "mongoose";
import "./department";
import "./location";

const ManagerSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    managedDepartments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Department' }],
    managedLocations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Location' }],
    permissions: [String],
}, { timestamps: true });

const Manager = mongoose.models.Manager || mongoose.model("Manager", ManagerSchema);
export default Manager;
