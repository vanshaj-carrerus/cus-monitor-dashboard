import mongoose from "mongoose";

const ScreenshotSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        sessionId: {
            type: String,
        },
        email: {
            type: String,
        },
        imageUrl: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Auto-delete screenshots after 24 hours (86400 seconds)
ScreenshotSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

const Screenshot =
    mongoose.models.Screenshot || mongoose.model("Screenshot", ScreenshotSchema);

export default Screenshot;
