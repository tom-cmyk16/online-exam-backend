const mongoose = require("mongoose");

const StaffSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  username: { type: String, required: true },
  email: String,
  role: {
    type: String,
    enum: ["admin", "instructor", "student"],
    required: true,
  },
  department: String,
  year: String,
  section: String,
  password: { type: String, required: true },
});

module.exports = mongoose.model("Staff", StaffSchema);
