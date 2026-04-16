import mongoose from "mongoose";

const InviteSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: ['admin', 'manager', 'common', 'team_leader', 'common_compliance', 'admin_compliance'], required: true },
    status: { type: String, enum: ['pending', 'accepted', 'expired'], default: 'pending' },
    token: { type: String, required: true, unique: true },
    name: { type: String },
    contactNumber: { type: String },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Manager' },
    teamLeaderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    expiresAt: { type: Date, default: () => new Date(+new Date() + 3 * 24 * 60 * 60 * 1000) } // 3 days from now
}, { timestamps: true });

const Invite = mongoose.models.Invite || mongoose.model("Invite", InviteSchema);

if (mongoose.models.Invite && mongoose.models.Invite.schema.path('role') && mongoose.models.Invite.schema.path('role').options?.enum) {
    const rolePath = mongoose.models.Invite.schema.path('role');
    const enumValues = rolePath.options.enum || [];
    ['common_compliance', 'admin_compliance'].forEach((role) => {
        if (!enumValues.includes(role)) enumValues.push(role);
    });
}

export default Invite;
