const express = require("express");
const router = express.Router();
const {
  getTests,
  createTest,
  updateTest,
  deleteTest,
  addQuestion,
  assignTest,
} = require("../controllers/testController");

router.get("/", getTests);
router.post("/", createTest);
router.put("/:id", updateTest);
router.delete("/:id", deleteTest);
router.post("/:id/questions", addQuestion);
router.put("/:id/assign", assignTest);

module.exports = router;
