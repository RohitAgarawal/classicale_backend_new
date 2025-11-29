import config from "../utils/config.js";
import mongoose from "mongoose";
import readline from "readline";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import Models
import { UserModel } from "../model/user.js";
import { FeatureRequest } from "../model/featureRequestSchema.js";
import ChatReportModel from "../model/report_chat_model.js";
import { CommunicateModel } from "../model/chat.js";
import { ConversationModel } from "../model/conversation.js";
import { RatingModel } from "../model/rating.js";
import { ReportProductModel } from "../model/reoprt_product.js";

// Import Product Models
import { BikeModel } from "../model/bike.js";
import { CarModel } from "../model/car.js";
import { BookSportHobbyModel } from "../model/book_sport_hobby.js";
import { ElectronicModel } from "../model/electronic.js";
import { FurnitureModel } from "../model/furniture.js";
import { JobModel } from "../model/job.js";
import { PetModel } from "../model/pet.js";
import { SmartPhoneModel } from "../model/smart_phone.js";
import { ServicesModel } from "../model/services.js";
import { OtherModel } from "../model/other.js";
import { PropertyModel } from "../model/property.js";
import { CodeModel } from "../model/pin.js";

const models = {
  User: UserModel,
  FeatureRequest: FeatureRequest,
  ChatReport: ChatReportModel,
  Chat: CommunicateModel,
  Conversation: ConversationModel,
  Rating: RatingModel,
  ReportProduct: ReportProductModel,
  
  // Products
  Bike: BikeModel,
  Car: CarModel,
  BookSportHobby: BookSportHobbyModel,
  Electronic: ElectronicModel,
  Furniture: FurnitureModel,
  Job: JobModel,
  Pet: PetModel,
  SmartPhone: SmartPhoneModel,
  Services: ServicesModel,
  Other: OtherModel,
  Property: PropertyModel,
};

// Create readline interface for user confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askConfirmation(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
    });
  });
}

async function clearData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.database.url, config.database.options);
    console.log("Connected to MongoDB");

    console.log(
      "\n⚠️  WARNING: This will delete ALL data from the following collections:"
    );
    Object.keys(models).forEach((name) => console.log(` - ${name}`));
    console.log("\nPreserved collections (NOT deleted):");
    console.log(" - Product Types, Occupations, Admin, Codes, etc.");
    console.log("\nThis action cannot be undone!");

    const confirmed = await askConfirmation(
      "\nAre you sure you want to proceed? (y/N): "
    );

    if (!confirmed) {
      console.log("\nOperation cancelled by user");
      return;
    }

    console.log("\nStarting deletion process...");

    for (const [name, Model] of Object.entries(models)) {
      try {
        const result = await Model.deleteMany({});
        console.log(`✅ ${name}: Deleted ${result.deletedCount} documents`);
      } catch (err) {
        console.error(`❌ Error deleting ${name}:`, err.message);
      }
    }

    // Reset Access Pins
    try {
      console.log("\nResetting Access Pins...");
      const result = await CodeModel.updateMany(
        {},
        { $set: { use_count: 0 } }
      );
      console.log(`✅ Reset ${result.modifiedCount} access pins`);
    } catch (err) {
      console.error("❌ Error resetting access pins:", err.message);
    }

    // Clear Public Images
    console.log("\nClearing Public Images...");
    const publicDirs = [
      "productImages",
      "profileImages",
      "ReportProductImages",
      "chat",
      "aadhaarCardImage",
      "aadhaarCardImage1",
      "aadhaarCardImage2",
      "aadharcardImages",
    ];

    const publicPath = path.join(__dirname, "../public");

    for (const dir of publicDirs) {
      const dirPath = path.join(publicPath, dir);
      if (fs.existsSync(dirPath)) {
        try {
          const files = fs.readdirSync(dirPath);
          let deletedCount = 0;
          for (const file of files) {
            if (file !== ".gitkeep" && file !== ".DS_Store") {
              fs.unlinkSync(path.join(dirPath, file));
              deletedCount++;
            }
          }
          if (deletedCount > 0) {
            console.log(`✅ Cleared ${deletedCount} files from public/${dir}`);
          }
        } catch (err) {
          console.error(`❌ Error clearing public/${dir}:`, err.message);
        }
      }
    }

    console.log("\n✅ Data clearing process completed.");
  } catch (err) {
    console.error("❌ Operation failed:", err.message);
  } finally {
    rl.close();
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

clearData();
