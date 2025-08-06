const jwt = require("jsonwebtoken")
const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

/**
 * Middleware to authenticate JWT tokens for client portal access
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"]
    const token = authHeader && authHeader.split(" ")[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: "Access token required" })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Verify client still exists and is active
    const client = await prisma.client.findUnique({
      where: { id: decoded.clientId },
      select: { id: true, email: true, businessName: true },
    })

    if (!client) {
      return res.status(401).json({ error: "Invalid token - client not found" })
    }

    req.client = client
    next()
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" })
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" })
    }

    console.error("Auth middleware error:", error)
    res.status(500).json({ error: "Authentication failed" })
  }
}

/**
 * Middleware to validate API keys for widget access
 */
const validateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers["x-api-key"] || req.query.apiKey
    const chatbotId = req.params.id

    if (!chatbotId) {
      return res.status(400).json({ error: "Chatbot ID required" })
    }

    // For Phase 2, we'll use the chatbot ID as the API key for simplicity
    // In production, you'd want proper API key management
    if (apiKey !== chatbotId) {
      return res.status(401).json({ error: "Invalid API key" })
    }

    // Verify chatbot exists and is active
    const chatbot = await prisma.chatbot.findFirst({
      where: {
        id: chatbotId,
        isActive: true,
      },
      include: {
        client: {
          select: { id: true, businessName: true },
        },
      },
    })

    if (!chatbot) {
      return res.status(404).json({ error: "Chatbot not found or inactive" })
    }

    req.chatbot = chatbot
    next()
  } catch (error) {
    console.error("API key validation error:", error)
    res.status(500).json({ error: "API key validation failed" })
  }
}

module.exports = {
  authenticateToken,
  validateApiKey,
}