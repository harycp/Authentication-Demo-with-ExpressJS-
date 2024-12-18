const jwt = require("jsonwebtoken");
const User = require("../models/user");
const SECRET = "supersecretkey"; // Replace with environment variable

// Register user
exports.register = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    req.flash("flash_message", "All fields are required");
    return res.redirect("/register");
  }

  try {
    const user = new User({ username, password });
    await user.save();
    req.flash("flash_message", "User registered successfully");
    res.redirect("/login");
  } catch (error) {
    req.flash("flash_message", "Error registering user");
    res.redirect("/register");
  }
};

// Login user
exports.login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    req.flash("flash_message", "Both fields are required");
    return res.redirect("/login");
  }

  try {
    const user = await User.findByCredentials(username, password);
    if (!user) {
      req.flash("flash_message", "Invalid username or password");
      return res.redirect("/login");
    }

    const token = jwt.sign({ _id: user._id, username: user.username }, SECRET, {
      expiresIn: "1h",
    });

    res.cookie("token", token, { httpOnly: true, secure: false }); // Set `secure: true` in production with HTTPS
    req.flash("flash_message", "Logged in successfully");
    res.redirect("/admin");
  } catch (error) {
    req.flash("flash_message", "Error logging in");
    res.redirect("/login");
  }
};

// Logout user
exports.logout = (req, res) => {
  res.clearCookie("token");
  req.flash("flash_message", "Logged out successfully");
  res.redirect("/login");
};
