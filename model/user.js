import { ObjectId } from "mongodb";
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    favorite: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: "favorite.modelName", // Dynamic reference based on modelName
        },
        modelName: {
          type: String,
        },
      },
    ],

    uuid: { type: String, default: null },
    token: { type: String, default: null },
    read: { type: [String] },
    write: { type: [String] },
    phone: { type: [String] },
    assignedPins: { type: String },
    fName: { type: [String] },
    lName: { type: [String] },
    mName: { type: [String] },
    email: { type: String },
    password: { type: String },
    gender: { type: [String] },
    DOB: { type: [String] },
    occupationId: { type: mongoose.Schema.Types.ObjectId, ref: "occupation" },
    // occupationId: { type: String },
    country: { type: [String] },
    state: { type: [String] },
    city: { type: [String] },
    area: { type: [String] },
    street1: { type: [String] },
    street2: { type: [String] },
    pinCode: { type: [String] },
    uIdNumber: { type: [String] },
    profileImage: { type: [String] },
    aadhaarCardImage1: { type: [String] },
    aadhaarCardImage2: { type: [String] },
    aadharNumber: { type: [String] },
    role: { type: String, enum: ["admin", "user"] },
    deviceToken: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Delete", "Suspended", "Blocked"],
      default: "Active",
    },
    userCategory: { type: String, enum: ["A", "B", "α", "β"] },
    isVerified: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    isPinVerified: { type: Boolean, default: false },
    isOtpVerified: { type: Boolean, default: false },
    oneTimePin: { type: String },
    isActive: { type: Boolean, default: true },
    otp: { type: String },
    otpExpire: {
      type: Date,
      default: () => new Date(Date.now() + 1.5 * 60 * 1000),
    },

    updateCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const UserModel = mongoose.model("user", UserSchema);
