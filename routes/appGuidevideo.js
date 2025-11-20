import express from "express";
import {
  getAppGuideVideo,
  uploadVideo,
  getVisibleVideo,
  deleteVideo,
} from "../controller/appGuidevideo.js";
import { setVideoVisibility } from "../controller/appGuidevideo.js";

const router = express.Router();

// POST /api/video/upload
router.post("/upload", uploadVideo);
router.get("/get-app-guide-video", getAppGuideVideo);
router.get("/get-visible-video", getVisibleVideo);
router.patch("/visibility/:id", setVideoVisibility);
router.delete("/delete/:id", deleteVideo);

export default router;
