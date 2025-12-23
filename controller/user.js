import { UserModel } from "../model/user.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { CodeModel } from "../model/pin.js";
import mongoose from "mongoose";
import { OccupationModel } from "../model/occupation.js";
import { read } from "fs";
import { SubProductTypeModel } from "../model/sub_product_type.js";
import { ProductTypeModel } from "../model/product_type.js";
import { saveBase64Image } from "../utils/image_store.js";
import { ReportProductModel } from "../model/reoprt_product.js";
import { RatingModel } from "../model/rating.js";
import config from "../utils/config.js";
import { sendEmail } from "../utils/sent_email.js";

const generateOtp = (firstName, lastName) => {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const allChars = letters + digits;

  let otp = "";

  // Ensure at least one letter and one digit
  otp += letters[Math.floor(Math.random() * letters.length)];
  otp += digits[Math.floor(Math.random() * digits.length)];

  // Fill the remaining 4 characters with random alphanumeric characters
  for (let i = 0; i < 4; i++) {
    otp += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the OTP so the first 2 characters aren't always predictable
  otp = otp
    .split("")
    .sort(() => 0.5 - Math.random())
    .join("");

  console.log("Generated OTP:", otp);
  return otp;
};

export const userSignUp = async (req, res) => {
  console.log("++++++++++++++++++++++++++++++");
  try {
    const {
      phone,
      fName,
      lName,
      mName,
      email,
      password,
      gender,
      DOB,
      occupationId,
      state,
      city,
      country,
      area,
      street1,
      street2,
      pinCode,
      aadharNumber,
      userCategory,
      otherOccupationName,
      aadharImage,
      profileImage,
      uIdNumber,
    } = req.body;

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    console.log(req.body);

    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ message: "Please enter a valid email address!" });
    }

    // ✅ Step 2: Check if user already exists
    const existingUser = await UserModel.findOne({ email, userCategory });
    if (existingUser) {
      return res.status(400).json({ message: "Already exists Email" });
    }

    // // Check if user already exists
    const hashedPassword = await bcrypt.hash(password, 10);

    // Handle file paths correctly
    let profileImagePath = "";
    let aadhaarFrontPath = "";
    let aadhaarBackPath = "";
    if (profileImage) {
      profileImagePath = saveBase64Image(
        profileImage,
        "profileImages",
        "profile"
      );
    } else {
      return res.status(400).json({ message: "profile image not found" });
    }

    if (aadharImage?.front) {
      aadhaarFrontPath = saveBase64Image(
        aadharImage.front,
        "aadharcardImages",
        "aadhar_front"
      );
    } else {
      return res.status(400).json({ message: "Aadhar card image not found" });
    }

    if (aadharImage?.back) {
      aadhaarBackPath = saveBase64Image(
        aadharImage.back,
        "aadharcardImages",
        "aadhar_back"
      );
    } else {
      return res.status(400).json({ message: "Aadhar card image not found" });
    }

    let isAdminVerify = userCategory === "A" || userCategory === "α";

    let read = [];
    let write = [];

    if (userCategory === "A") {
      read = ["A", "B", "D", "E"];
      write = ["A", "B"];
    } else if (userCategory === "B") {
      read = ["B", "C", "D", "E"];
      write = ["C"];
    } else if (userCategory === "α") {
      read = ["D"];
      write = ["D"];
    } else if (userCategory === "β") {
      read = ["E"];
      write = ["E"];
    }
    let newOccupationId = occupationId;
    if (occupationId === "67d988345682680a67eee2c8") {
      const occupation = await OccupationModel.findOne({
        name: otherOccupationName,
      });

      if (occupation) {
        return res.status(400).json({ message: "Occupation already exist." });
      }

      const occupationNew = new OccupationModel({
        name: otherOccupationName,
      });
      await occupationNew.save();
      newOccupationId = occupationNew._id;
    }

    // Create user
    const newUser = new UserModel({
      read,
      write,
      phone,
      fName,
      lName,
      mName,
      email,
      password: hashedPassword,
      gender,
      DOB,
      occupationId: new mongoose.Types.ObjectId(newOccupationId),
      state,
      city,
      country,
      uIdNumber,
      area,
      street1,
      street2,
      pinCode,
      profileImage: profileImagePath,
      aadhaarCardImage1: aadhaarFrontPath,
      aadhaarCardImage2: aadhaarBackPath,
      aadharNumber,
      role: "user",
      userCategory,
      isVerified: !isAdminVerify,
      isDeleted: false,
      isBlocked: false,
      isPinVerified: !isAdminVerify,
      isOtpVerified: isAdminVerify,
      isActive: true,
    });

    // Save user
    await newUser.save();

    res
      .status(200)
      .json({ message: "User registered successfully", user: newUser });
  } catch (error) {
    console.log("Error:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Invalid User Category",
        error: error.message, // optional: send all error messages
      });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
export const userLogin = async (req, res) => {
  const { email, password, userCategory } = req.body;
  console.log("User:---", email, password, userCategory);
  try {
    // ✅ Find User
    const user = await UserModel.findOne({ email, userCategory });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.isDeleted) {
      return res
        .status(404)
        .json({ code: "ACCOUNT_DELETED", error: "User account is deleted." });
    }
    if (!user.isActive) {
      return res.status(423).json({
        code: "ACCOUNT_LOCKED",
        error: "User account is not active.",
      });
    }
    if (String(user.userCategory) !== String(userCategory)) {
      return res.status(404).json({ message: "Invalid category" });
    }

    // ✅ Check Password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid password" });
    }

    console.log("++++++++++++++++++++++++++++++++++++++++++++++++");
    // ✅ Check if First-Time Login
    let requiresVerification = false;
    let verificationType = null;

    if (user.userCategory === "A" && !user.isPinVerified) {
      requiresVerification = true;
      verificationType = "PIN";
    } else if (user.userCategory === "B" && !user.isOtpVerified) {
      requiresVerification = true;
      verificationType = "OTP";
      const otp = generateOtp(user.fName.last, user.lName.last);
      user.otp = otp;
      user.otpExpire = Date.now() + 1.5 * 120 * 1000; // 2 minute 30 seconds
      await user.save();
      await sendEmail(email, "Your OTP Code", `Your OTP is: ${otp}`);
    }
    if (user.userCategory === "α" && !user.isPinVerified) {
      requiresVerification = true;
      verificationType = "PIN";
      // const otp = generateOtp(user.fName, user.lName);
      // user.otp = otp;
      // user.otpExpire = Date.now() + 1.5 * 60 * 1000; // 1 minute 30 seconds
      await user.save();
    }
    if (user.userCategory === "β" && !user.isOtpVerified) {
      requiresVerification = true;
      verificationType = "OTP";
      const otp = generateOtp(user.fName, user.lName);
      user.otp = otp;
      user.otpExpire = Date.now() + 1.5 * 120 * 1000; // 2 minute 30 seconds
      await user.save();
      await sendEmail(email, "Your OTP Code", `Your OTP is: ${otp}`);
    }

    // ✅ Generate Token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        uIdNumber: user.uIdNumber,
        read: user.read,
        write: user.write,
        userId: user._id,
        phone: user.phone,
        fName: user.fName,
        mName: user.mName,
        lName: user.lName,
        DOB: user.DOB,
        gender: user.gender,
        email: user.email,
        phone: user.phone,
        role: user.role,
        state: user.state,
        district: user.district,
        area: user.area,
        country: user.country,
        userCategory: user.userCategory,
        aadhaarCardImage1: user.aadhaarCardImage1,
        aadhaarCardImage2: user.aadhaarCardImage2,
        profileImage: user.profileImage,
        verificationStatus: user.verificationStatus,
        verificationType,
        requiresVerification,
        isPinVerified: user.isPinVerified,
        isOtpVerified: user.isOtpVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        aadharNumber: user.aadharNumber,
        isBlocked: user.isBlocked,
        isDeleted: user.isDeleted,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
export const updateUser = async (req, res) => {
  try {
    const userId = req.body.userId;
    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const updatedFields = req.body;

    // Loop through fields
    for (const key in updatedFields) {
      if (Array.isArray(user[key]) && typeof updatedFields[key] === "string") {
        user[key] = [user[key][1] || user[key][0] || "", updatedFields[key]];
      } else if (
        Array.isArray(user[key]) &&
        Array.isArray(updatedFields[key])
      ) {
        user[key] = [user[key][1] || user[key][0] || "", updatedFields[key][0]];
      } else if (updatedFields[key]) {
        user[key] = updatedFields[key];
      }
    }

    // ✅ Save base64 profile image to public and set URL
    if (
      updatedFields.profileImageBase64 &&
      updatedFields.profileImageBase64.startsWith("data:image")
    ) {
      const imagePath = saveBase64Image(
        updatedFields.profileImageBase64,
        "profileImages",
        "profile"
      );
      console.log("Image Path:", imagePath);
      user.profileImage = [
        user.profileImage?.[1] || user.profileImage?.[0] || "",
        imagePath,
      ];
    }

    // ✅ Save base64 Aadhaar front image and update path
    if (
      updatedFields.aadhaarImage1 &&
      updatedFields.aadhaarImage1.startsWith("data:image")
    ) {
      const frontPath = saveBase64Image(
        updatedFields.aadhaarImage1,
        "aadhaarCardImage1",
        "aadhar_front"
      );
      //user.aadhaarCardImage1 = frontPath;
      console.log("Image Path:", frontPath);
      user.aadhaarCardImage1 = [
        user.aadhaarCardImage1?.[1] || user.aadhaarCardImage1?.[0] || "",
        frontPath,
      ];
    }

    // ✅ Save base64 Aadhaar back image and update path
    if (
      updatedFields.aadhaarImage2 &&
      updatedFields.aadhaarImage2.startsWith("data:image")
    ) {
      const backPath = saveBase64Image(
        updatedFields.aadhaarImage2,
        "aadhaarCardImage2",
        "aadhar_back"
      );
      console.log("Image Path:", backPath);
      user.aadhaarCardImage2 = [
        user.aadhaarCardImage2?.[1] || user.aadhaarCardImage2?.[0] || "",
        backPath,
      ];
    }

    if (user.updateCount >= 3) {
      return res.status(403).json({
        message:
          "Your profile has been updated more than 3 times. Please contact customer support.",
      });
    }
    user.updateCount = (user.updateCount || 0) + 1;

    await user.save();

    return res.status(200).json({
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update Error:", error);
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

export const getUserByID = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const user = await UserModel.findById(userId)
      .select("-password -otp -otpExpire") // Exclude sensitive fields
      .populate("occupationId"); // Populate the occupationId field

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Error in getUserByID:", error);
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { userCategory, userId, oldPassword, newPassword } = req.body;

    // ✅ Step 1: Check if user exists
    const user = await UserModel.findOne({
      _id: userId,
      userCategory: userCategory,
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Step 2: Verify Old Password
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    // ✅ Step 3: Hash New Password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // ✅ Step 4: Update Password in Database
    user.password = hashedNewPassword;
    await user.save();

    return res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Error resetting password:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const getOccupation = async (req, res) => {
  try {
    const occupations = await OccupationModel.find();
    return res.status(200).json({ occupations });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching user", error: error.message });
  }
};

export const verifyPin = async (req, res) => {
  try {
    const { userId, pin } = req.body;
    console.log("Incoming PIN Verification Request:", req.body);

    // Validate request data
    if (!userId || !pin) {
      console.warn("Missing required fields:", { userId, pin });
      return res.status(400).json({ message: "User ID and PIN are required" });
    }

    // Find user in the database
    const user = await UserModel.findById(userId);
    if (!user) {
      console.warn("User not found:", userId);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("User found:", {
      userId: user._id,
      assignedPins: user.assignedPins,
    });

    // Validate PIN against database
    const existingPin = await CodeModel.findOne({ code: pin });
    if (!existingPin) {
      console.warn("Invalid PIN entered:", pin);
      return res.status(400).json({ message: "Invalid PIN" });
    }

    if (existingPin.use_count >= existingPin.max_count) {
      console.warn("MAx limit reach", pin);
      return res
        .status(400)
        .json({ message: "Max user limit reach in this pin." });
    }
    // existingPin.use_count += 1;
    await existingPin.save();

    // Assign PIN to user and mark as verified
    user.assignedPins = pin;
    user.isPinVerified = true;
    await user.save();
    console.info("PIN assigned and verified for user:", userId);

    // Update CodeModel with assigned user
    const userIdObject = new mongoose.Types.ObjectId(user._id);
    await CodeModel.findOneAndUpdate(
      { code: pin },
      {
        $addToSet: { assignedUsers: userIdObject },
        $inc: { assignedCount: 1 },
      }
    );
    console.info("Updated CodeModel for PIN:", pin);

    // ✅ Generate Token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    return res.status(200).json({
      message: "PIN verified successfully!",
      token,
      user: {
        read: user.read,
        write: user.write,
        userId: user._id,
        phone: user.phone,
        fName: user.fName,
        mName: user.mName,
        lName: user.lName,
        DOB: user.DOB,
        gender: user.gender,
        email: user.email,
        phone: user.phone,
        role: user.role,
        state: user.state,
        district: user.district,
        area: user.area,
        country: user.country,
        userCategory: user.userCategory,
        aadhaarCardImage1: user.aadhaarCardImage1,
        aadhaarCardImage2: user.aadhaarCardImage2,
        profileImage: user.profileImage,
        verificationStatus: user.verificationStatus,
        isPinVerified: user.isPinVerified,
        isOtpVerified: user.isOtpVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        aadharNumber: user.aadharNumber,
        isBlocked: user.isBlocked,
        isDeleted: user.isDeleted,
      },
    });
  } catch (error) {
    console.error("PIN verification error:", error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

export const verifyOtp = async (req, res) => {
  const { userId, otp } = req.body;

  try {
    console.log("Incoming OTP Verification Request:", req.body);

    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Ensure the user is verified before verifying OTP
    if (user.isPinVerified !== true) {
      return res
        .status(400)
        .json({ message: "User is not verified yet by admin" });
    }

    // Check if OTP exists and is not expired
    const currentTime = new Date().getTime();
    if (user.otpExpire < currentTime) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // OTP is valid and not used yet
    user.isOtpVerified = true; // Mark OTP as used
    user.otp = null; // Clear OTP
    user.otpExpire = null; // Clear OTP expiration time
    await user.save();
    // ✅ Generate Token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // Send the user details in the response
    return res.status(200).json({
      message: "OTP verified successfully",
      token,
      user: {
        read: user.read,
        write: user.write,
        userId: user._id,
        phone: user.phone,
        fName: user.fName,
        mName: user.mName,
        lName: user.lName,
        DOB: user.DOB,
        gender: user.gender,
        email: user.email,
        phone: user.phone,
        role: user.role,
        state: user.state,
        district: user.district,
        area: user.area,
        country: user.country,
        userCategory: user.userCategory,
        aadhaarCardImage1: user.aadhaarCardImage1,
        aadhaarCardImage2: user.aadhaarCardImage2,
        profileImage: user.profileImage,
        verificationStatus: user.verificationStatus,
        isPinVerified: user.isPinVerified,
        isOtpVerified: user.isOtpVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        aadharNumber: user.aadharNumber,
        isBlocked: user.isBlocked,
        isDeleted: user.isDeleted,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const createNewPassword = async (req, res) => {
  const { category, email, password } = req.body; // New password from user

  try {
    if (!email || !password || !category) {
      return res
        .status(400)
        .json({ message: "Email, password, and userCategory are required" });
    }
    // Find user by email
    const user = await UserModel.findOne({ email, userCategory: category });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if OTP has expired (1 hour validity)
    const otpExpirationTime = 60 * 60 * 1000; // 1 hour in milliseconds
    if (Date.now() - user.otpTimestamp > otpExpirationTime) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    // Hash the new password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user's password
    user.password = hashedPassword;

    // Optionally, reset OTP and timestamp after password update
    user.otp = null;
    user.otpTimestamp = null;

    // Save the updated user
    await user.save();

    // Return success response
    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while updating the password" });
  }
};

export const checkBothUser = async (req, res) => {
  const { email } = req.body;
  const user = await UserModel.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json({ userType: user.userCategory });
};

export const getOtherOccupations = async (req, res) => {
  try {
    const otherOccupations = await UserModel.find(
      { otherOccupation: { $ne: "" } }, // खाली (empty) values को हटा दें
      { _id: 0, otherOccupation: 1 } // केवल otherOccupation फ़ील्ड लाएं
    );

    // Duplicate values को हटाएं (Set का उपयोग करके)
    const uniqueOtherOccupations = [
      ...new Set(otherOccupations.map((item) => item.otherOccupation)),
    ];

    return res.status(200).json(uniqueOtherOccupations);
  } catch (err) {
    console.error("Error fetching other occupations:", err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getProductTypes = async (req, res) => {
  try {
    const sub_product_types = await SubProductTypeModel.find().populate({
      path: "productType",
    });

    console.log(sub_product_types);

    return res.status(200).json({
      success: true,
      message: "Product sub type fetch successfully.",
      sub_product_types,
    });
  } catch (err) {
    console.error("Error fetching product types:", err);
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

export const getProductSubType = async (req, res) => {
  try {
    console.log("Product Sub Type");
    const { sub_product_type_id } = req.params;
    console.log(sub_product_type_id);
    const sub_product_types = await SubProductTypeModel.find({
      productType: sub_product_type_id,
    }).populate({
      path: "productType",
    });

    return res.status(200).json({
      success: true,
      message: "sub product type fetch successfully.",
      sub_product_types,
    });
  } catch (err) {
    console.error("Error fetching product sub types:", err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const repostProducts = async (req, res) => {
  try {
    const { productId, userId, desctiption, modelName, image } = req.body;
    let imagePath = "";
    if (!productId || !userId || !desctiption || !modelName) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (image && image.startsWith("data:image")) {
      const imgPath = saveBase64Image(
        image,
        "ReportProductImages",
        "report_product"
      );
      //user.aadhaarCardImage1 = frontPath;
      imagePath = imgPath;
    }

    if (imagePath.isEmpty) {
      return res.status(400).json({ message: "Image is required" });
    }

    const newReportProduct = new ReportProductModel({
      userId: userId,
      productId: productId,
      desctiption: desctiption,
      image: imagePath,
      modelName: modelName,
    });

    await newReportProduct.save();

    return res.status(200).json({
      message: "Product reported successfully",
      reportProduct: newReportProduct,
    });
  } catch (error) {
    console.error("Error reporting product:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const createRating = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ msg: "Rating must be between 1 and 5" });
    }

    const newRating = new RatingModel({
      user: userId,
      rating,
      comment,
    });

    await newRating.save();

    return res.status(201).json(newRating);
  } catch (err) {
    console.error(err);

    // 💥 Duplicate error handling
    if (err.code === 11000) {
      return res.status(409).json({
        msg: "You have already submitted this rating.",
      });
    }

    return res.status(500).json({ msg: "Server error" });
  }
};

export const reportChat = async (req, res) => {
  try {
    const {
      reportedBy,
      reportedUser,
      conversationId,
      message,
      description,
      image,
    } = req.body;

    if (!reportedBy || !reportedUser || !description) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    let imagePath = "";

    if (image && image.startsWith("data:image")) {
      imagePath = saveBase64Image(image, "ChatReportImages", "chat_report");
    }

    const chatReport = new ChatReport({
      reportedBy,
      reportedUser,
      conversationId,
      message,
      description,
      image: imagePath,
    });

    await chatReport.save();

    return res.status(200).json({
      message: "Chat reported successfully",
      report: chatReport,
    });
  } catch (error) {
    console.error("Error reporting chat:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const updateDeviceToken = async (req, res) => {
  try {
    const { userId, deviceToken } = req.body;
    // console.log("Updating device token:", userId, deviceToken);

    if (!userId || !deviceToken) {
      return res.status(400).json({ message: "userId and deviceToken are required" });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.deviceToken = deviceToken;
    await user.save();

    return res.status(200).json({ 
      success: true, 
      message: "Device token updated successfully" 
    });
  } catch (error) {
    console.error("Error updating device token:", error);
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};
