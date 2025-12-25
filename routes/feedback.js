import express from "express";
import {
  createFeatureRequest,
  getAllFeatureRequests,
  getFeatureRequestById,
  updateFeatureRequest,
  deleteFeatureRequest,
  updateFeatureRequestStatus,
} from "../controller/feedback.js";
import authenticate, { authenticateAdmin } from "../auth/middle.js";

const router = express.Router();

// Feature request routes
router.post("/", authenticate, createFeatureRequest);
router.get("/", authenticate, getAllFeatureRequests);
router.get("/:id", authenticate, getFeatureRequestById);
router.put("/feature-requests:id", authenticate, updateFeatureRequest);
router.delete("/:id", authenticate, deleteFeatureRequest);

// Admin feature request routes
router.get("/admin/list", authenticateAdmin, getAllFeatureRequests);
router.delete("/admin/:id", authenticateAdmin, deleteFeatureRequest);
router.put("/admin/status/:id", authenticateAdmin, updateFeatureRequestStatus);

export default router;
