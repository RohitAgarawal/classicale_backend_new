import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get runtime env
const NODE_ENV = process.env.NODE_ENV || "dev";

// Resolve current dir
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to .env file
let envPath;

if (NODE_ENV === "prod") {
  // Use external location for prod
  envPath = "/var/www/backend/classicale_backend.env";
} else {
  // Use local .env file in dev/staging
  envPath = path.resolve(__dirname, "..", ".env");
}

// Load .env file
dotenv.config({ path: envPath });
console.log(`Loaded environment variables from: ${envPath}`);


// Export configuration object with all environment variables
const config = {
  // Server configuration
  port: process.env.PORT || 3001,
  nodeEnv: NODE_ENV,
  path: NODE_ENV === "prod" ? process.env.PATH || "./env" : "./env",

  // Database configuration
  database: {
    url:
      NODE_ENV === "prod"
        ? process.env.MONGODB_URL
        : process.env.MONGODB_URL_DEV || process.env.MONGODB_URL_DEV,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },

  // Authentication
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: "7d", // Token expiration time
  },

  // Email configuration
  email: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    service: process.env.EMAIL_SERVICE || "gmail",
  },

  // File storage
  uploads: {
    root: process.env.UPLOADS_ROOT || "",
    allowedTypes: ["image/jpeg", "image/jpg", "image/png", "application/pdf"],
    maxSize: 10 * 1024 * 1024, // 10MB
  }
};

// Log the current environment (for debugging)
console.log(`Application running in ${NODE_ENV} environment`);

export default config;
