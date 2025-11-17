import AppGuidevideo from "../model/appGuidevideoSchema.js";
import { saveBase64Video } from "../utils/video_store.js";

export const uploadVideo = async (req, res) => {
  try {
    const {
      title,
      description,
      metadata: { videoData, videoName, videoExtension, videoSize },
    } = req.body;

    if (!videoData || !videoName || !videoExtension || !title) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Save video file
    const videoPath = saveBase64Video(
      videoData,
      "videos/app-guide",
      videoName,
      videoExtension
    );

    // Save metadata in MongoDB
    const newVideo = await AppGuidevideo.create({
      title,
      description,
      videoName: videoPath,
      videoSize,
      videoExtension,
    });

    res.status(200).json({
      message: "Video uploaded successfully",
      data: newVideo,
    });
  } catch (error) {
    console.error("Error uploading video:", error);
    res
      .status(500)
      .json({ message: "Failed to upload video", error: error.message });
  }
};

export const getAppGuideVideo = async (req, res) => {
  try {
    const videos = await AppGuidevideo.find().sort({ createdAt: -1 });
    res
      .status(200)
      .json({ data: videos, message: "App guide videos fetched successfully" });
  } catch (error) {
    console.error("Error uploading video:", error);
    res
      .status(500)
      .json({ message: "Failed to upload video", error: error.message });
  }
};

export const setVideoVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    const { visibility } = req.body;

    if (typeof visibility !== "boolean") {
      return res.status(400).json({ message: "visibility must be a boolean" });
    }

    const updated = await AppGuidevideo.findByIdAndUpdate(
      id,
      { visibility },
      { new: true }
    );



    
    if (!updated) return res.status(404).json({ message: "Video not found" });

    res
      .status(200)
      .json({ message: "Video visibility updated", data: updated });
  } catch (error) {
    console.error("Error updating visibility:", error);
    res
      .status(500)
      .json({ message: "Failed to update visibility", error: error.message });
  }
};

export const getVisibleVideo = async (req, res) => {
  try {
    const video = await AppGuidevideo.findOne({ visibility: true }).sort({
      createdAt: -1,
    });
    if (!video)
      return res
        .status(404)
        .json({ message: "No visible video found", data: null });
    res.status(200).json({ message: "Visible video fetched", data: video });
  } catch (error) {
    console.error("Error fetching visible video:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch visible video", error: error.message });
  }
};
