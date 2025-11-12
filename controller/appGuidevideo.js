import AppGuidevideo from "../model/appGuidevideoSchema.js";
import { saveBase64Video } from "../utils/video_store.js";

export const uploadVideo = async (req, res) => {
  try {
    const { title, description, videoData, videoExtension, videoSize } =
      req.body;

    if (!videoData || !videoExtension || !title) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Save video file
    const videoPath = saveBase64Video(
      videoData,
      "videos/app-guide",
      title,
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
