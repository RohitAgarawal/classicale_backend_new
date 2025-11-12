import express from "express";
import { uploadVideo } from "../controller/appGuidevideo.js";

const router = express.Router();

// POST /api/video/upload
router.post("/upload", uploadVideo);

export default router;
