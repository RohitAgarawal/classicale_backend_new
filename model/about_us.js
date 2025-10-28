import mongoose from "mongoose";
import config from "../utils/config";

const ourValueSchema = new mongoose.Schema({
  icon: {
    type: String,
    required: true,
    enum: config.icons,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
});

const aboutUsSchema = new mongoose.Schema(
  {
    our_mission: {
      type: String,
      required: true,
    },
    our_story: {
      type: String,
      required: true,
    },
    happy_customer: {
      type: Number,
      required: true,
      default: 0,
    },
    products: {
      type: Number,
      required: true,
      default: 0,
    },
    statisfaction: {
      type: Number,
      required: true,
      default: 0,
    },
    our_values: [ourValueSchema],
    name: {
      type: String,
      required: true,
    },
    tag_line: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const AboutUs = mongoose.model("AboutUs", aboutUsSchema);
