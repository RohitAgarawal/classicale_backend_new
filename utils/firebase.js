import admin from 'firebase-admin';
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Import the service account key
// Import the service account key
import fs from 'fs';
import path from 'path';

// Construct dynamic path or use default for dev fallback (though env var is preferred)
const serviceAccountPath = path.resolve("./classical-18d8e-firebase-adminsdk-fbsvc-f16082352e.json");

let serviceAccount;
try {
  if (fs.existsSync(serviceAccountPath)) {
      serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  } else {
      console.error(`❌ Firebase Service Account file not found at: ${serviceAccountPath}`);
  }
} catch (e) {
  console.error("❌ Error reading Firebase Service Account file:", e);
}

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log("🔥 Firebase Admin Initialized Successfully");
} catch (error) {
  console.error("⚠️ Firebase Admin Initialization Error:", error);
}

export default admin;
