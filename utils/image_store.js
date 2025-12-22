import { log } from "console";
import  config  from "./config.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Fix __dirname for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// root path of server
const uploadsRoot = "/var/www/classical_uploads";

// Utility to save a base64 image 
export const saveBase64Image = (base64String, folderPath, filenamePrefix) => {
  try {
    // console.log(base64String);
    const matches = base64String.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error("Invalid base64 image string");
    }

    const imageExtension = matches[1].split("/")[1]; // e.g., 'png', 'jpeg'
    const imageData = matches[2];
    const buffer = Buffer.from(imageData, "base64");

    const filename = `${filenamePrefix}_${Date.now()}.${imageExtension}`;
    var fullFolderPath;
    if (config.nodeEnv === "dev") {
      // Go to root -> public -> folderPath (like profileImages or aadharcardImages)
      fullFolderPath = path.join(__dirname, "..", "public", folderPath);
    } else {
      // Store directly in the external uploads directory
      fullFolderPath = path.join(config.uploads.root, "public", folderPath);
    }
    console.log(`Saving image to: ${fullFolderPath}/${filename}`);
    
    if (!fs.existsSync(fullFolderPath)) {
      throw new Error(`Folder path does not exist: ${fullFolderPath}`);
    }



    if (!fs.existsSync(fullFolderPath)) {
      fs.mkdirSync(fullFolderPath, { recursive: true });
    }

    const filePath = path.join(fullFolderPath, filename);
    fs.writeFileSync(filePath, buffer);
    return `/public/${folderPath}/${filename}`;
  } catch (error) {
    log("Error saving base64 image:", error);
    throw error; // Re-throw the error for further handling
  }
};
