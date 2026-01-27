import mongoose from "mongoose";

const questionBankSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    type: {
      type: String,
      enum: ["text", "multiple-choice", "true-false"],
      default: "text",
    },
    options: [String],
    correctAnswer: { type: String },
    duration: Number,
    marks: Number,
    chapter: String,
    topic: String,
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    createdBy: {
      _id: mongoose.Schema.Types.ObjectId,
      fullName: String,
      department: String,
    },
    department: String, // Restrict to department
  },
  { timestamps: true }
);

export default mongoose.model("QuestionBank", questionBankSchema);
