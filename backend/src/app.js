const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const morgan = require("morgan")
const rateLimit = require("express-rate-limit")
require("dotenv").config()

const authRoutes = require("./routes/auth")
const chatbotRoutes = require("./routes/chatbot")
const clientRoutes = require("./routes/client")
const { errorHandler } = require("./middleware/errorHandler")

const app = express()
const PORT = process.env.PORT || 3000

// Security middleware
app.use(helmet())

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Too many requests from this IP, please try again later.",
})
app.use(limiter)

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3001",
  credentials: true,
}))

// Body parsing middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Logging
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"))
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  })
})

// Simple test route
app.get("/", (req, res) => {
  res.json({ message: "AI Chatbot Backend is running!" })
})

// API routes
app.use("/auth", authRoutes)
app.use("/chatbot", chatbotRoutes)
app.use("/client", clientRoutes)

// Widget script endpoint
app.get("/widget.js", (req, res) => {
  const fs = require("fs")
  const path = require("path")

  try {
    const widgetScript = fs.readFileSync(path.join(__dirname, "widget", "widget.js"), "utf8")
    res.setHeader("Content-Type", "application/javascript")
    res.setHeader("Cache-Control", "public, max-age=3600")
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.send(widgetScript)
  } catch (error) {
    console.error("Widget serving error:", error)
    res.status(500).send("// Widget temporarily unavailable")
  }
})

// Widget CSS endpoint
app.get("/widget.css", (req, res) => {
  const fs = require("fs")
  const path = require("path")

  try {
    const widgetCSS = fs.readFileSync(path.join(__dirname, "widget", "widget.css"), "utf8")
    res.setHeader("Content-Type", "text/css")
    res.setHeader("Cache-Control", "public, max-age=3600")
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.send(widgetCSS)
  } catch (error) {
    console.error("Widget CSS serving error:", error)
    res.status(500).send("/* Widget CSS temporarily unavailable */")
  }
})

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" })
})

// Global error handler
app.use(errorHandler)

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📊 Environment: ${process.env.NODE_ENV}`)
  console.log(`🔗 Health check: http://localhost:${PORT}/health`)
})

module.exports = app