import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  type: {
    type: String,
    enum: ["text", "multiple-choice", "true-false"],
    required: true,
  },
  options: [String],
  correctAnswer: String,
});

export default mongoose.model("Question", questionSchema);
