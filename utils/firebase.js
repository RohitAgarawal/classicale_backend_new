import admin from 'firebase-admin';
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Import the service account key
const serviceAccount = require("./classical-18d8e-firebase-adminsdk-fbsvc-f16082352e.json");

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log("🔥 Firebase Admin Initialized Successfully");
} catch (error) {
  console.error("⚠️ Firebase Admin Initialization Error:", error);
}

export default admin;
