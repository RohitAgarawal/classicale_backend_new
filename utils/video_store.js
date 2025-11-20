import { log } from "console";
import config from "./config.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Function: Save base64 video file
export const saveBase64Video = (base64String, folderPath, filenamePrefix, extension) => {
  try {
    if (!base64String || typeof base64String !== "string") {
      throw new Error("Invalid base64 video string");
    }

    // 🧠 Handle both prefixed and raw base64 (since Flutter sends raw)
    const base64Data = base64String.includes("base64,")
      ? base64String.split("base64,")[1]
      : base64String;

    // ✅ Decode base64 → binary buffer
    const buffer = Buffer.from(base64Data, "base64");

    // ✅ Create filename
    const filename = `${filenamePrefix}_${Date.now()}.${extension || "mp4"}`;

    // ✅ Set full folder path based on environment
    const fullFolderPath =
      config.nodeEnv === "dev"
        ? path.join(__dirname, "..", "public", folderPath)
        : path.join(config.uploads.root, "public", folderPath);

    // ✅ Ensure directory exists
    if (!fs.existsSync(fullFolderPath)) {
      fs.mkdirSync(fullFolderPath, { recursive: true });
    }

    // ✅ Save file
    const filePath = path.join(fullFolderPath, filename);
    fs.writeFileSync(filePath, buffer);

    log(`✅ Video saved at: ${filePath}`);
    return `/public/${folderPath}/${filename}`;
  } catch (error) {
    log("❌ Error saving base64 video:", error);
    throw error;
  }
};

// ✅ Function: Delete video file
export const deleteVideoFile = (storedPath) => {
  try {
    if (!storedPath) return;

    // Remove leading '/public/' to get the relative path inside the public folder
    const relativePath = storedPath.replace(/^\/public\//, "");

    const fullPath =
      config.nodeEnv === "dev"
        ? path.join(__dirname, "..", "public", relativePath)
        : path.join(config.uploads.root, "public", relativePath);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      log(`✅ Video deleted: ${fullPath}`);
    } else {
      log(`⚠️ Video file not found: ${fullPath}`);
    }
  } catch (error) {
    log("❌ Error deleting video file:", error);
    // We don't throw here to allow the DB record deletion to proceed even if file deletion fails
    // or maybe we should? Usually better to log and continue or throw.
    // Given the user request "delete video by id and also delete from storage", 
    // if storage deletion fails, maybe we should still delete the DB record or warn.
    // I'll log it but won't throw to ensure DB consistency is prioritized or at least handled in controller.
  }
};