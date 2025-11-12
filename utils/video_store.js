import { log } from "console";
import config from "./config.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const saveBase64Video = (
  base64String,
  folderPath,
  filenamePrefix,
  extension = "mp4"
) => {
  try {
    // Convert base64 to buffer for video
    const buffer = Buffer.from(base64String, "base64");

    const filename = `${filenamePrefix}_${Date.now()}.${extension}`;

    let fullFolderPath;
    if (config.nodeEnv === "dev") {
      fullFolderPath = path.join(__dirname, "..", "public", folderPath);
    } else {
      fullFolderPath = path.join(config.uploads.root, "public", folderPath);
    }

    // Ensure folder exists
    if (!fs.existsSync(fullFolderPath)) {
      fs.mkdirSync(fullFolderPath, { recursive: true });
    }

    const filePath = path.join(fullFolderPath, filename);
    fs.writeFileSync(filePath, buffer);

    console.log(`✅ Video saved at: ${filePath}`);
    return `/public/${folderPath}/${filename}`;
  } catch (error) {
    log("❌ Error saving base64 video:", error);
    throw error;
  }
};
