import express from "express";
import {
  userSignUp,
  updateUser,
  userLogin,
  verifyOtp,
  createNewPassword,
  checkBothUser,
  getOtherOccupations,
  verifyPin,
  getOccupation,
  resetPassword,
  getProductTypes,
  getProductSubType,
  getUserByID,
  repostProducts,
  createRating,
  reportChat,
  updateDeviceToken,
} from "../controller/user.js";
import { upload } from "../upload.js";
import authenticateUser from "../auth/middle.js";
const router = express.Router();
router.post("/login", userLogin);
router.post("/signup", userSignUp);
router.post("/createNewPassword", createNewPassword);
router.get("/getOccupation", getOccupation);
router.post("/verifyPin", verifyPin);
router.post("/verifyOtpUser", verifyOtp);
router.post("/reset-password", resetPassword);

router.post("/report-product", authenticateUser, repostProducts);
router.put(
  "/updateUser",
  updateUser
);
router.put("/update-device-token", authenticateUser, updateDeviceToken);
router.get("/getUserByID", authenticateUser, getUserByID);

router.post("/checkBoth", authenticateUser, checkBothUser);

router.get("/get-occupations", authenticateUser, getOtherOccupations);

router.get("/get-productType", authenticateUser, getProductTypes);

router.get(
  "/get-sub-product-type/:sub_product_type_id",
  authenticateUser,
  getProductSubType
);

router.post("/add_rating", authenticateUser, createRating);
  
router.post("/report_chat", reportChat);

export default router;

//  http://localhost:3000/api/signup
