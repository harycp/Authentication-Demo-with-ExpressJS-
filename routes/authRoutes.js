const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const notAuth = require("../middlewares/notAuthMiddleware");

// Routes untuk register, login, logout
router.get("/register", (req, res) => {
  res.render("register");
});

router.post("/register", authController.register);

router.get("/login", notAuth, (req, res) => {
  res.render("login");
});

router.post("/login", authController.login);

router.get("/logout", authController.logout);

module.exports = router;
