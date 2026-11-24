require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.disable("x-powered-by");
app.use(helmet());

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000,http://localhost:5173")
  .split(",").map((s) => s.trim()).filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Allow server-to-server requests and local tools that do not send Origin.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS."));
  },
  credentials: true
}));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

app.use("/api", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false
}));

app.get("/", (req, res) => {
  res.json({
    success: true,
    name: "Criminal Act Database Management System API",
    version: "1.0.0",
    health: "/api/health",
    documentation: "See README.md for routes and request examples."
  });
});

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "CADMS API is running.", timestamp: new Date().toISOString() });
});

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/users", require("./routes/users.routes"));
app.use("/api/thanas", require("./routes/thana.routes"));
app.use("/api/officers", require("./routes/officers.routes"));
app.use("/api/complaints", require("./routes/complaints.routes"));
app.use("/api", require("./routes/workflow.routes"));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
