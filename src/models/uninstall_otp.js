import mongoose from "mongoose";

const UninstallOtpSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    expiresAt: { type: Date, required: true, index: true, expires: 0 },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

UninstallOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const UninstallOtp =
  mongoose.models.UninstallOtp || mongoose.model("UninstallOtp", UninstallOtpSchema);

export default UninstallOtp;
