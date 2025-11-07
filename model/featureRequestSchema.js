import mongoose from "mongoose";
const featureRequestSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
      maxLength: 5000,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    status: {
      type: String,
      default: "pending",
      enum: ["pending", "accepted", "declined"],
    },
    statusMessage: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export const FeatureRequest = mongoose.model(
  "FeatureRequest",
  featureRequestSchema
);
