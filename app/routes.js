// app/routes.js
var mysql = require("mysql");
var dbconfig = require("../config/database");
var connection = mysql.createConnection(dbconfig.connection);
connection.query("USE " + dbconfig.database);

module.exports = function(app, passport, upload) {
  // =====================================
  // HOME PAGE (with login links) ========
  // =====================================
  app.get("/", function(req, res) {
    res.render("index.ejs"); // load the index.ejs file
  });

  // =====================================
  // LOGIN ===============================
  // =====================================
  // show the login form
  app.get("/login", function(req, res) {
    // render the page and pass in any flash data if it exists
    res.render("login.ejs", { message: req.flash("loginMessage") });
  });

  // process the login form
  app.post(
    "/studentlogin",
    passport.authenticate("local-login", {
      successRedirect: "/home", // redirect to the secure profile section
      failureRedirect: "/login", // redirect back to the signup page if there is an error
      failureFlash: true, // allow flash messages
    }),
    function(req, res) {
      console.log("hello");
      if (req.body.remember) {
        req.session.cookie.maxAge = 1000 * 60 * 3;
      } else {
        req.session.cookie.expires = false;
      }
      res.redirect("/");
    }
  );

  // =====================================
  // SIGNUP ==============================
  // =====================================
  // show the signup form
  app.get("/studentsignup", function(req, res) {
    // render the page and pass in any flash data if it exists
    res.render("students.ejs", {
      error: req.flash("signupMessage"),
    });
  });

  // process the signup form
  app.post(
    "/studentsignup",
    upload.single("pic"),
    passport.authenticate("local-signup", {
      successRedirect: "/home", // redirect to the secure profile section
      failureRedirect: "/signup", // redirect back to the signup page if there is an error
      failureFlash: true, // allow flash messages
    })
  );
  app.post("/student", upload.single("pic"), (req, res) => {
    res.json(req.body);
  });

  // =====================================
  // PROFILE SECTION =========================
  // =====================================
  // we will want this protected so you have to be logged in to visit
  // we will use route middleware to verify this (the isLoggedIn function)
  app.get("/profile", function(req, res) {
    res.render("profile.ejs", {
      user: req.user, // get the user out of session and pass to template
    });
  });

  app.get("/home", isLoggedIn, (req, res) => {
    connection.query(
      "SELECT * FROM users WHERE username = ?",
      [req.user.username],
      (err, user) => {
        console.log("+++++" + req.user);
        console.log(user[0]);
        res.render("home", { item: user[0] });
      }
    );
  });
  //
  // ====================================
  // Edit profile =======================
  // ====================================
  app.get("/editstudent", isLoggedIn, (req, res) => {
    connection.query(
      "SELECT * FROM users WHERE username = ?",
      [req.user.username],
      (err, user) => {
        console.log("+++++" + req.user);
        console.log(user[0]);
        res.render("editpagestudent", { item: user[0] });
      }
    );
  });
  app.post("/editstudent", upload.single("pic"), isLoggedIn, (req, res) => {
    console.log(req.file);
    connection.query(
      `UPDATE users SET ( password, address, name, email, dob, phone, pic, community, bloodGroup, aadharNumber ) values (?,?,?,?,?,?,?,?,?,?)`,
      [
        req.body.password,
        req.body.address,
        req.body.name,
        req.body.email,
        req.body.dob,
        req.body.phone,
        req.body.pic || req.file.originalname,
        req.body.community,
        req.body.bloodGroup,
        req.body.aadharNumber,
      ],
      (err, rows) => {
        console.log("+++++" + req.user);
        console.log(rows[0]);
        res.render("editpagestudent", { item: rows[0] });
      }
    );
  });
  // =====================================
  // LOGOUT ==============================
  // =====================================
  app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
  });
};

// route middleware to make sure
function isLoggedIn(req, res, next) {
  // if user is authenticated in the session, carry on
  if (req.isAuthenticated()) return next();

  // if they aren't redirect them to the home page
  res.redirect("/");
}
