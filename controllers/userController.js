import User from "../models/User.js";

// @desc Get all users
// @route GET /api/manageuser
// @access Admin
export const getUsers = async (req, res) => {
  const users = await User.find();
  res.json(users);
};

// @desc Create a user
// @route POST /api/manageuser
// @access Admin
export const createUser = async (req, res) => {
  const { username, email, password, fullName, role } = req.body;
  const exist = await User.findOne({ username });
  if (exist)
    return res.status(400).json({ message: "Username already exists" });

  const newUser = await User.create(req.body);
  res.status(201).json(newUser);
};

// @desc Update user
// @route PUT /api/manageuser/:id
// @access Admin
export const updateUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  Object.assign(user, req.body);
  await user.save();
  res.json(user);
};

// @desc Delete user
// @route DELETE /api/manageuser/:id
// @access Admin
export const deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  await user.remove();
  res.json({ message: "User deleted" });
};

// @desc Toggle user active status
// @route PATCH /api/manageuser/:id/status
// @access Admin
export const toggleUserStatus = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.isActive = !user.isActive;
  await user.save();
  res.json(user);
};
