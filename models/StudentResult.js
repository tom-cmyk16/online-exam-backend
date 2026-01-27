import mongoose from "mongoose";

const studentResultSchema = new mongoose.Schema({
  studentName: { type: String, required: true },
  department: { type: String, required: true },
  exam: {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: "Exam" },
    title: String,
  },
  answers: [{ questionId: String, answer: String }],
  score: Number,
  submittedAt: { type: Date, default: Date.now },
});

export default mongoose.model("StudentResult", studentResultSchema);
