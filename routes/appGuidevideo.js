import express from "express";
import { getAppGuideVideo, uploadVideo } from "../controller/appGuidevideo.js";

const router = express.Router();

// POST /api/video/upload
router.post("/upload", uploadVideo);
router.get("/get-app-guide-video", getAppGuideVideo);


export default router;
