const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const User = require("./models/user");
const ErrorHandler = require("./ErrorHandler");
const session = require("express-session");
const flash = require("connect-flash");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
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

const auth = (req, res, next) => {
  if (!req.session.user_id) {
    req.flash("flash_message", "You must login first");
    res.redirect("/login");
  } else {
    next();
  }
};

const notAuth = (req, res, next) => {
  if (req.session.user_id) {
    req.flash("flash_message", "You are already logged in");
    res.redirect("/admin");
  } else {
    next();
  }
};

mongoose
  .connect("mongodb://localhost:27017/auth_demo")
  .then((result) => {
    console.log("Database connected");
  })
  .catch((err) => {
    console.log(err);
  });

const wrapAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch((err) => next(err));
  };
};

app.get("/", (req, res) => {
  res.send("Home Page");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post(
  "/register",
  wrapAsync(async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      req.flash("flash_message", "You must fill in all fields");
      return res.redirect("/register");
    }
    try {
      const user = new User({ username, password });
      await user.save();
      req.session.user_id = user._id;
      req.flash("flash_message", "You are now registered and can log in");
      res.redirect("/login");
    } catch (error) {
      req.flash("flash_message", "An error occurred during registration");
      res.redirect("/register");
    }
  })
);

app.get("/login", notAuth, (req, res) => {
  res.render("login");
});

app.post(
  "/login",
  wrapAsync(async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      req.flash("flash_message", "Both fields are required");
      return res.redirect("/login");
    } else {
      const foundUser = await User.findByCredentials(username, password);
      if (foundUser) {
        req.session.user_id = foundUser._id;
        req.flash("flash_message", "You are now logged in");
        res.redirect("/admin");
      } else {
        req.flash("flash_message", "Invalid username or password");
        res.redirect("/login");
      }
    }
  })
);

app.get("/admin", auth, (req, res) => {
  res.render("admin");
});

app.post("/logout", (req, res) => {
  // bisa juga dengan
  // req.session.user_id = null;
  req.session.destroy();
  res.redirect("/login");
});

app.get("/profile", auth, (req, res) => {
  res.send("Hello, " + req.session.user_id);
});

app.listen(8080, () => {
  console.log("Server started on http://localhost:8080");
});
