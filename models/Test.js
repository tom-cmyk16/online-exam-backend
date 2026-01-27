const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  type: { type: String, enum: ["text", "multiple-choice"], required: true },
  options: [String],
  answer: { type: String, required: true },
  duration: Number,
  marks: Number,
});

const TestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  startTime: String,
  endTime: String,
  activeDuration: String,
  questions: [QuestionSchema],
  assignedDepartments: [String],
  assignedYears: [String],
  assignedSections: [String],
  assignedSubjects: [String],
});

module.exports = mongoose.model("Test", TestSchema);
