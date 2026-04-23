const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(express.json());
app.use(cors());

const SECRET = "secretkey";

// Connect MongoDB
mongoose.connect("mongodb://mongodb:27017/eauth");

// Schema with role field
const UserSchema = new mongoose.Schema({
  username: String,
  otp: String,
  role: { type: String, default: "user" } // "user" or "admin"
});

const User = mongoose.model("User", UserSchema);

// Middleware: Verify JWT Token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    console.log("❌ No token provided");
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded; // { username, role }
    console.log("✅ Token verified for user:", req.user.username, "role:", req.user.role);
    next();
  } catch (err) {
    console.log("❌ Invalid token:", err.message);
    res.status(403).json({ success: false, message: "Invalid token" });
  }
};

// Middleware: Check Admin Role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    console.log("❌ Access denied for user:", req.user.username, "role:", req.user.role);
    return res.status(403).json({ success: false, message: "Access denied. Admin only." });
  }
  console.log("✅ Admin access granted for user:", req.user.username);
  next();
};

// LOGIN → generate OTP
app.post("/login", async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ success: false, message: "Username required" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    let user = await User.findOne({ username });

    if (!user) {
      const role = username === "admin" ? "admin" : "user";
      user = new User({ username, otp, role });
      console.log("👤 New user created:", username, "with role:", role);
    } else {
      user.otp = otp;
      console.log("🔄 Existing user:", username, "with role:", user.role);
    }

    await user.save();

    console.log("📱 OTP for", username, ":", otp);
    res.json({ success: true, message: "OTP sent (check terminal)" });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// VERIFY OTP → Generate JWT with role
app.post("/verify", async (req, res) => {
  try {
    const { username, otp } = req.body;

    if (!username || !otp) {
      return res.status(400).json({ success: false, message: "Username and OTP required" });
    }

    const user = await User.findOne({ username });

    if (!user) {
      console.log("❌ User not found:", username);
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.otp !== otp) {
      console.log("❌ Invalid OTP for user:", username);
      return res.status(401).json({ success: false, message: "Invalid OTP" });
    }

    // Create JWT with username and role
    const token = jwt.sign({ username: user.username, role: user.role }, SECRET, {
      expiresIn: "1h",
    });

    console.log("✅ JWT issued for user:", username, "with role:", user.role);
    res.json({ success: true, token });
  } catch (err) {
    console.error("❌ Verify error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Protected route: Admin only
app.get("/admin", verifyToken, requireAdmin, (req, res) => {
  res.json({
    success: true,
    message: "✅ Welcome Admin!",
    user: req.user.username,
    role: req.user.role
  });
});

// Protected route: User info (any authenticated user)
app.get("/profile", verifyToken, (req, res) => {
  res.json({
    success: true,
    message: "✅ User profile",
    user: req.user.username,
    role: req.user.role
  });
});

app.listen(4001, () => console.log("Auth Service running on 4001"));