import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: ['admin', 'manager', 'common', 'team_leader', 'common_compliance', 'admin_compliance'], default: 'common' },
    teamLeaderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", UserSchema);

if (mongoose.models.User && mongoose.models.User.schema.path('role') && mongoose.models.User.schema.path('role').options?.enum) {
    const rolePath = mongoose.models.User.schema.path('role');
    const enumValues = rolePath.options.enum || [];
    ['common_compliance', 'admin_compliance'].forEach((role) => {
        if (!enumValues.includes(role)) enumValues.push(role);
    });
}

export default User;
