import express from "express";
import {
  adminLogin,
  deleteProduct,
  deleteUser,
  getAccesCode,
  getAllProductByCategory,
  getAllUser,
  getProductById,
  getProductType,
  getProductWithType,
  getReportCount,
  getReportDetailsById,
  getReportedProducts,
  getUserByUserCategory,
  getUserCategory,
  getUserListByAssignPin,
  sendOtpToUser,
  sendPinAccess,
  updateProduct,
  userAccess,
  userActiveOrInactive,
  getUserByID,
  getAllRatings,
  updateReportStatus,
  getReportsForExport,
} from "../controller/admin.js";

import multer from "multer";
import  { authenticateAdmin } from "../auth/middle.js";
import { getProductsByUser } from "../controller/product.js";


const router = express.Router();

const memoryStorage = multer.memoryStorage();

// Admin login route
router.post("/login",adminLogin);

router.get("/get_productS_Type", authenticateAdmin, getProductType);

router.get("/get_product_with_type", authenticateAdmin, getProductWithType);

router.get(
  "/get_user_by_userCategory",
  authenticateAdmin,
  getUserByUserCategory
);


router.get("/get-product-by-id", authenticateAdmin, getProductById);
router.get("/get_product", authenticateAdmin, getProductById);

router.put("/update_product_for_admin", authenticateAdmin, updateProduct);

router.delete("/delete_product_by_admin", authenticateAdmin, deleteProduct);

router.get("/get_user_category", authenticateAdmin, getUserCategory);

router.delete("/delete_user_by_admin", authenticateAdmin, deleteUser);

router.get("/get_all_user", authenticateAdmin, getAllUser);

router.get("/get-access-codes", authenticateAdmin, getAccesCode);

router.post("/access_pin", authenticateAdmin, sendPinAccess);

router.post("/access_otp", authenticateAdmin, sendOtpToUser);

router.post("/user-access", authenticateAdmin, userAccess);

router.post("/user_active_inActive", authenticateAdmin, userActiveOrInactive);

router.get("/report_product", authenticateAdmin, getReportedProducts);

router.get(
  "/get_report_product_by_id",
  authenticateAdmin,
  getReportDetailsById
);

router.get("/get_report_count", authenticateAdmin, getReportCount);

router.get(
  "/get_product_by_category",
  authenticateAdmin,
  getAllProductByCategory
);

router.get(
  "/get-user-by-assign-pin",
  authenticateAdmin,
  getUserListByAssignPin
);

router.get("/getUserByID", authenticateAdmin, getUserByID);

router.get("/get-product-by-userId", authenticateAdmin, getProductsByUser);

router.get("/get-all-ratings", authenticateAdmin, getAllRatings);

//router.get("/product_active_inactive", productActiveOrInactive);


router.put("/update-report-status", authenticateAdmin, updateReportStatus);

router.get("/export-reports", authenticateAdmin, getReportsForExport);

export default router;
