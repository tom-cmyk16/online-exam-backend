const mongoose = require("mongoose");

const SubjectSchema = new mongoose.Schema({
  code: { type: String, required: true },
  name: { type: String, required: true },
  department: { type: String, required: true },
  year: { type: String, required: true },
  credits: { type: Number, default: 3 },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
  program: { type: String, required: true },
  sections: [String],
});

module.exports = mongoose.model("Subject", SubjectSchema);
