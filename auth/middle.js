import jwt from "jsonwebtoken";
import { UserModel } from "../model/user.js";
import AdminModel from "../model/admin.js";
import config from "../utils/config.js";


export const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization;

    // console.log("________________________________");

    if (!token || !token.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Invalid or missing Authorization token." });
    }

    // ✅ Token extract karne ka safer way
    const tokenWithoutBearer = token.split(" ")[1];
    // console.log("Token without 'Bearer':", tokenWithoutBearer);

    const secretKey = config.jwt.secret;

    if (!secretKey) {
      console.error("❌ JWT_SECRET is not defined in .env file!");
      return res
        .status(500)
        .json({ error: "Server error: Missing secret key." });
    }
    // console.log("Using secret key:", secretKey);

    // ✅ Token decode hone se pehle check karein ki valid format hai ya nahi
    const decoded = jwt.decode(tokenWithoutBearer);
    if (!decoded) {
      console.error("❌ Invalid JWT format detected.");
      return res.status(401).json({ error: "Invalid token format." });
    }
    // console.log("Decoded Token (Without Verification):", decoded);

    // ✅ Token verify karna
    const verifiedToken = jwt.verify(tokenWithoutBearer, secretKey);
    // console.log("✅ Verified JWT payload:", verifiedToken);

    // ✅ Token me user ka ID check karein
    if (!verifiedToken.id) {
      console.error("Token does not contain user ID.");
      return res.status(401).json({ error: "Invalid token data." });
    }

    // ✅ Database me user ka ID check karein
    const user = await UserModel.findById(verifiedToken.id);

    if (!user) {
      return res.status(401).json({ error: "User not authenticated." });
    }

    // ✅ Session verification
    if (verifiedToken.sessionToken && user.sessionToken !== verifiedToken.sessionToken) {
      return res.status(401).json({ 
        code: "SESSION_INVALID", 
        error: "This account is logged in on another device. Please log in again." 
      });
    }

    if (user.isDeleted) {
      return res
        .status(403)
        .json({ code: "ACCOUNT_DELETED", error: "User account is deleted." });
    }
    if (!user.isActive) {
      return res.status(423).json({
        code: "ACCOUNT_LOCKED",
        error: "User account is not active.",
      });
    }
    // console.log("User is authenticated:", user._id);
    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error("JWT verification failed:", error.message);
    return res
      .status(401)
      .json({ error: "Authentication failed. Please try again." });
  }
};

export const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization;

    if (!token || !token.startsWith("Bearer ")) {
      return res.status(400).json({ error: "Missing Authorization token" });
    }

    const tokenWithoutBearer = token.split(" ")[1];
    const secretKey = config.jwt.secret;

    const verifiedToken = jwt.verify(tokenWithoutBearer, secretKey);

    if (!verifiedToken.id || verifiedToken.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Admin only." });
    }

    const admin = await AdminModel.findById(verifiedToken.id);
    if (!admin) {
      return res.status(401).json({ error: "Admin not found" });
    }

    req.user = admin;
    next();
  } catch (error) {
    console.error("Admin JWT verification failed:", error.message);
    return res.status(401).json({ error: "Authentication failed." });
  }
};

export default authenticateUser;
