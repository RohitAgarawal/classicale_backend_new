console.log("Hello world!");
import { ConditionModel } from "./model/conditon.js";
import express from "express";
import mongoose from "mongoose";
import config from "./utils/config.js";
import bcrypt from "bcryptjs";
import http from "http";
import { Server } from "socket.io";
import UserRouter from "./routes/user.js";
import ProductRouter from "./routes/product.js";
import CommunicateRouter from "./routes/chat.js";
import AdminRouter from "./routes/admin.js";
import Admin from "./model/admin.js";
import SendOtpRouter from "./routes/sendOtp.js";
import path from "path";
import cors from "cors";
import LocationRouter from "./routes/location.js";
import { log } from "console";
import socketInit from "./socket.js";
import AppVersionRoute from "./routes/app_version.js";
import FeedbackRouter from "./routes/feedback.js";
import AboutUsRouter from "./routes/about_us.js";
import { AboutUs } from "./model/about_us.js";
import AppGuidevideoRouter from "./routes/appGuidevideo.js";

const app = express();
app.use(express.json({ limit: "10mb" })); // or even higher like '50mb'
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.use(cors());
const PORT = config.port;
const server = http.createServer(app);
// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  },
});
const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);
await mongoose
  .connect(config.database.url)
  .then(async () => {
    console.log("Connected to MongoDB Atlas!");
    await Promise.all([
      createAdminIfNotExists(),
      createDefaultAboutUsIfNotExists(),
    ]);
  })
  .catch((error) => console.error("Error connecting to MongoDB:", error));

export async function createDefaultAboutUsIfNotExists() {
  try {
    const aboutUsExists = await AboutUs.findOne();

    if (!aboutUsExists) {
      const defaultAboutUs = new AboutUs({
        our_mission:
          "To revolutionize the way people buy and sell products by creating a trusted, sustainable marketplace that empowers communities and promotes conscious consumption.",
        our_story:
          "Founded with a vision to make a difference, our journey began with a simple idea: create a platform where quality meets affordability, where every transaction tells a story, and where community values drive commerce.",
        happy_customer: 1000,
        products: 500,
        statisfaction: 95,
        our_values: [
          {
            icon: "trust",
            title: "Trust & Transparency",
            description:
              "Building lasting relationships through honest interactions and clear communication.",
          },
          {
            icon: "community",
            title: "Community First",
            description:
              "Fostering a supportive environment where everyone can thrive and grow together.",
          },
          {
            icon: "quality",
            title: "Quality Assurance",
            description:
              "Maintaining high standards in every aspect of our service delivery.",
          },
        ],
        name: "Classicale",
        tag_line: "Where Quality Meets Community",
      });

      await defaultAboutUs.save();
      console.log("Default About Us created successfully!");
    }
  } catch (error) {
    console.error("Error creating default About Us:", error);
  }
}

async function createAdminIfNotExists() {
  try {
    const adminExists = await Admin.findOne({ role: "admin" });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      const admin = new Admin({
        username: "admin",
        email: "admin@example.com",
        password: hashedPassword,
        role: "admin",
      });

      await admin.save();
      console.log("Admin user created successfully!");
    } else {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      const updatedAdmin = await Admin.findOneAndUpdate(
        { role: "admin" },
        {
          username: "admin",
          email: "admin@example.com",
          password: hashedPassword,
        },
        { new: true }
      );

      // console.log("Admin user updated successfully!", updatedAdmin);
    }
  } catch (error) {
    console.error("Error creating or updating admin user:", error);
  }
}

if (config.nodeEnv === "dev") {
  console.log("Serving static files from:", path.join(__dirname, "public"));
  app.use("/public", express.static(path.join(__dirname, "public")));
} else {
  console.log(
    "Serving static files from:",
    path.join(config.uploads.root, "public")
  );
  app.use("/public", express.static(path.join(config.uploads.root, "public")));
}

app.use("/api/products", ProductRouter);
app.use("/api/admin", AdminRouter);
app.use("/api/user", UserRouter);
app.use("/api/otp", SendOtpRouter);
app.use("/api/chat", CommunicateRouter);
app.use("/api/location", LocationRouter);
app.use("/api/app-version", AppVersionRoute);
app.use("/api/feedback", FeedbackRouter);
app.use("/api/feature-request", FeedbackRouter);
app.use("/api/about-us", AboutUsRouter);
app.use("/api/app-guide-video", AppGuidevideoRouter);

if (config.nodeEnv === "dev") {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
} else {
  server.listen(PORT, "127.0.0.1", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

io.on("error", (error) => {
  console.log("Socket.IO global error:", error);
});
socketInit(io);

export { io };
log("Socket setup completed");
export default app;
