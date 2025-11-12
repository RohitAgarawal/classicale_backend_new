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