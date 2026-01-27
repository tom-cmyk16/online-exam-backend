import express from "express";
import { changePassword } from "../controllers/passwordController.js";

const router = express.Router();

// Route: PUT /api/password/:userId/change-password
router.put("/:userId/change-password", changePassword);

export default router;
