//appGuidevideoSchema

import mongoose from "mongoose";

const appGuidevideoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    videoName: {
      type: String,
      required: true,
    },
    videoSize: {
      type: Number, // store in bytes
      required: true,
    },
    videoExtension: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const AppGuidevideo = mongoose.model("AppGuidevideo", appGuidevideoSchema);

export default AppGuidevideo;