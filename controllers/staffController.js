import Staff from "../models/Staff.js";
import bcrypt from "bcryptjs";

// GET all staff
export const getStaff = async (req, res) => {
  try {
    const staff = await Staff.find();
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CREATE staff
export const createStaff = async (req, res) => {
  try {
    const { name, staffId, email, role, division, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newStaff = new Staff({
      name,
      staffId,
      email,
      role,
      division,
      password: hashedPassword,
    });
    const savedStaff = await newStaff.save();
    res.status(201).json(savedStaff);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// UPDATE staff
export const updateStaff = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    Object.assign(staff, req.body);
    if (req.body.password) {
      staff.password = await bcrypt.hash(req.body.password, 10);
    }

    const updatedStaff = await staff.save();
    res.json(updatedStaff);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE staff
export const deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ message: "Staff not found" });
    await staff.remove();
    res.json({ message: "Staff deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
