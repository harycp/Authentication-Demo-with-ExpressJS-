const jwt = require("jsonwebtoken");
const SECRET = "supersecretkey"; // Replace with environment variable

const auth = (req, res, next) => {
  let token = req.cookies["token"];

  if (!token) {
    req.flash("flash_message", "Access denied, no token provided");
    return res.redirect("/login");
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    req.flash("flash_message", "Invalid token");
    res.clearCookie("token");
    res.redirect("/login");
  }
};

module.exports = auth;
