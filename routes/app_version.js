import express from "express";
import {
  createAppVersion,
  getAllVersions,
  getLatestVersion,
  getVersionById,
  updateVersion,
  deleteVersion,
} from "../controller/app_version.js";

import authenticate, { authenticateAdmin } from "../auth/middle.js";

const router = express.Router();

// Create new app version
router.post("/", authenticateAdmin, createAppVersion);

// Get all versions
router.get("/all", authenticateAdmin, getAllVersions);

// Get latest version
router.get("/latest", authenticate, getLatestVersion);

// Get specific version
router.get("/:id", authenticate, getVersionById);

// Update version
router.put("/:id", authenticateAdmin, updateVersion);

// Delete version
router.delete("/:id", authenticateAdmin, deleteVersion);

export default router;
