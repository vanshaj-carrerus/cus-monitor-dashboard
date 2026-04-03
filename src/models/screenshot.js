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

const Screenshot =
    mongoose.models.Screenshot || mongoose.model("Screenshot", ScreenshotSchema);

export default Screenshot;
