import express from "express";
import {
  createAboutUs,
  getAboutUs,
  updateAboutUs,
} from "../controller/about_us.js";

import authenticate, { authenticateAdmin } from "../auth/middle.js";

const router = express.Router();

// Create About Us (Admin only)
router.post("/", authenticateAdmin, createAboutUs);

// Get About Us information (Public)
router.get("/", authenticate, getAboutUs);

// Update About Us (Admin only)
router.put("/", authenticateAdmin, updateAboutUs);

export default router;
