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
    visibility: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const AppGuidevideo = mongoose.model("AppGuidevideo", appGuidevideoSchema);

export default AppGuidevideo;

// Ensure only one video is visible at a time.
// When a document is saved with visibility=true, set visibility=false for all other documents.
appGuidevideoSchema.pre("save", async function (next) {
  try {
    if (this.visibility) {
      await this.constructor.updateMany(
        { _id: { $ne: this._id } },
        { visibility: false }
      );
    }
    next();
  } catch (err) {
    next(err);
  }
});

// For findOneAndUpdate (used by findByIdAndUpdate), check the update payload.
appGuidevideoSchema.pre("findOneAndUpdate", async function (next) {
  try {
    const update = this.getUpdate();
    if (!update) return next();

    // Check $set or direct visibility field
    const visibility =
      (update.$set && update.$set.visibility) ?? update.visibility;
    if (visibility) {
      // determine the id being updated
      const query = this.getQuery();
      const id = query && query._id ? query._id : null;
      await this.model.updateMany({ _id: { $ne: id } }, { visibility: false });
    }
    next();
  } catch (err) {
    next(err);
  }
});
