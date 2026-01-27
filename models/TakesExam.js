// models/TakesExam.js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const AnswerSchema = new Schema({
  questionId: { type: String, required: true },
  value: { type: String, required: true },
});

const TakesExamSchema = new Schema(
  {
    examId: { type: Schema.Types.ObjectId, ref: "Exam", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    answers: { type: [AnswerSchema], default: [] },
    score: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["started", "submitted"],
      default: "started",
    }, // Track exam session status
    adjustedScore: { type: Number, default: null }, // For manual corrections
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" }, // Instructor who reviewed
    reviewNotes: { type: String }, // Notes from reviewer
    isReviewed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

TakesExamSchema.index({ examId: 1, studentId: 1 }, { unique: true });

const TakesExam = model("TakesExam", TakesExamSchema);

export default TakesExam;
