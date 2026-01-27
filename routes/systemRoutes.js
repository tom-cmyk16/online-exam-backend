import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  getSystemSettings,
  updateSystemSettings,
  getAuditLogs,
  getSystemStats
} from "../controllers/systemController.js";

const router = express.Router();

// All system routes are admin-only
router.get("/settings", protect, authorize("admin"), getSystemSettings);
router.put("/settings", protect, authorize("admin"), updateSystemSettings);
router.get("/audit-logs", protect, authorize("admin"), getAuditLogs);
router.get("/stats", protect, authorize("admin"), getSystemStats);

export default router;