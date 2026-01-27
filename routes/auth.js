import express from "express";
import {
  loginUser,
  resetPassword,
  getMe,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", loginUser);
router.post("/reset-password", resetPassword);
router.get("/me", protect, getMe);

export default router;
