import mongoose from "mongoose";

const UploadCounterSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    value: { type: Number, default: 0 },
});

const UploadCounter =
    mongoose.models.UploadCounter || mongoose.model("UploadCounter", UploadCounterSchema);

export default UploadCounter;
