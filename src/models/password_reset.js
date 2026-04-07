import mongoose from "mongoose";

const PasswordResetSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, index: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

const PasswordReset =
  mongoose.models.PasswordReset || mongoose.model("PasswordReset", PasswordResetSchema);
export default PasswordReset;
