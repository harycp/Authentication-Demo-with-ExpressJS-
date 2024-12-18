const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const flash = require("connect-flash");
const mongoose = require("mongoose");
const authRoutes = require("./routes/authRoutes");
const authMiddleware = require("./middlewares/authMiddleware");

const app = express();

// Set up environment and app
const SECRET = "supersecretkey"; // Replace with environment variable
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(flash());

// Flash message middleware
app.use((req, res, next) => {
  res.locals.flash_message = req.flash("flash_message");
  next();
});

// Connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/auth_demo", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Database connected"))
  .catch((err) => console.error(err));

// Routes
app.use(authRoutes);

// Protected route (only accessible with JWT)
app.get("/admin", authMiddleware, (req, res) => {
  res.render("admin", { username: req.user.username });
});

app.get("/profile", authMiddleware, (req, res) => {
  res.render("profile", { username: req.user.username });
});

// Start server
app.listen(8080, () => {
  console.log("Server started on http://localhost:8080");
});
