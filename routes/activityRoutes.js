// routes/activityRoutes.js
import express from "express";
const router = express.Router();

// GET /api/activity - Get recent activities
router.get("/", (req, res) => {
  const activities = [
    {
      id: "1",
      action: "User login",
      user: "System",
      timestamp: new Date().toISOString(),
      type: "info",
    },
    // Add more activities as needed
  ];

  res.json(activities);
});

export default router;
