const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const path = require("path");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const flash = require("connect-flash");
const User = require("./models/user");
const app = express();

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

app.use((req, res, next) => {
  res.locals.flash_message = req.flash("flash_message");
  next();
});

mongoose
  .connect("mongodb://localhost:27017/auth_demo", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Database connected"))
  .catch((err) => console.error(err));

// Middleware for JWT authentication
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

const notAuth = (req, res, next) => {
  const token = req.cookies["token"];
  if (token) {
    req.flash("flash_message", "You are already logged in");
    return res.redirect("/admin");
  }
  next();
};

app.get("/", (req, res) => {
  res.send("Home Page");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
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
});

app.get("/login", notAuth, (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
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

    // Generate JWT token
    const token = jwt.sign({ _id: user._id, username: user.username }, SECRET, {
      expiresIn: "1h",
    });

    // Save token in cookies
    res.cookie("token", token, { httpOnly: true, secure: false }); // Set `secure: true` in production with HTTPS
    req.flash("flash_message", "Logged in successfully");
    res.redirect("/admin");
  } catch (error) {
    req.flash("flash_message", "Error logging in");
    res.redirect("/login");
  }
});

app.get("/admin", auth, (req, res) => {
  res.render("admin", { username: req.user.username });
});

app.get("/profile", auth, (req, res) => {
  res.render("profile", { username: req.user.username });
});

app.get("/logout", (req, res) => {
  res.clearCookie("token");
  req.flash("flash_message", "Logged out successfully");
  res.redirect("/login");
});

app.listen(8080, () => {
  console.log("Server started on http://localhost:8080");
});
