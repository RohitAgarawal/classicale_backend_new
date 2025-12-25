import jwt from "jsonwebtoken";
import { UserModel } from "../model/user.js";
import AdminModel from "../model/admin.js";
import config from "../utils/config.js";


export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization;

    if (!token || !token.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Invalid or missing Authorization token." });
    }

    const tokenWithoutBearer = token.split(" ")[1];
    const secretKey = config.jwt.secret;

    if (!secretKey) {
      console.error("❌ JWT_SECRET is not defined in .env file!");
      return res
        .status(500)
        .json({ error: "Server error: Missing secret key." });
    }

    const verifiedToken = jwt.verify(tokenWithoutBearer, secretKey);

    if (!verifiedToken.id || !verifiedToken.role) {
      return res.status(401).json({ error: "Invalid token data." });
    }

    if (verifiedToken.role === "admin") {
      const admin = await AdminModel.findById(verifiedToken.id);
      if (!admin) {
        return res.status(401).json({ error: "Admin not found." });
      }
      req.user = admin;
      return next();
    }

    if (verifiedToken.role === "user") {
      const user = await UserModel.findById(verifiedToken.id);
      if (!user) {
        return res.status(401).json({ error: "User not authenticated." });
      }

      // ✅ Session verification for users
      if (
        verifiedToken.sessionToken &&
        user.sessionToken !== verifiedToken.sessionToken
      ) {
        return res.status(401).json({
          code: "SESSION_INVALID",
          error:
            "This account is logged in on another device. Please log in again.",
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

      req.user = user;
      return next();
    }

    return res.status(403).json({ error: "Invalid role." });
  } catch (error) {
    console.error("Authentication failed:", error.message);
    return res
      .status(401)
      .json({ error: "Authentication failed. Please try again." });
  }
};

export const authenticateUser = authenticate;
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

export default authenticate;

