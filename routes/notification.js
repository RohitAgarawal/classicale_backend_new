import express from "express";
import authenticate from "../auth/middle.js";

const router = express.Router(); 

router.get('/getNotification', authenticate, getNotification);

export default router;
