import express from "express";
import {
  getAppGuideVideo,
  uploadVideo,
  getVisibleVideo,
  deleteVideo,
} from "../controller/appGuidevideo.js";
import { setVideoVisibility } from "../controller/appGuidevideo.js";

import authenticate, { authenticateAdmin } from "../auth/middle.js";

const router = express.Router();

// POST /api/video/upload
router.post("/upload", authenticateAdmin, uploadVideo);
router.get("/get-app-guide-video", authenticate, getAppGuideVideo);
router.get("/get-visible-video", authenticate, getVisibleVideo);
router.patch("/visibility/:id", authenticateAdmin, setVideoVisibility);
router.delete("", authenticateAdmin, deleteVideo);

export default router;
