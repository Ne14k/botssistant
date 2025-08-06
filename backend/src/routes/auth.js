const express = require("express")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { PrismaClient } = require("@prisma/client")
const { validate, schemas } = require("../middleware/validation")

const router = express.Router()
const prisma = new PrismaClient()

/**
 * POST /auth/signup
 * Register a new client
 */
router.post("/signup", validate(schemas.signup), async (req, res) => {
  try {
    const { businessName, email, password } = req.body

    // Check if client already exists
    const existingClient = await prisma.client.findUnique({
      where: { email },
    })

    if (existingClient) {
      return res.status(400).json({ error: "Email already registered" })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create client and default chatbot
    const client = await prisma.client.create({
      data: {
        businessName,
        email,
        hashedPassword,
        chatbots: {
          create: {
            welcomeMessage: `Hello! Welcome to ${businessName}. How can I help you today?`,
            themeColor: "#3B82F6",
            faqs: [
              {
                question: "What are your business hours?",
                answer: "We're open Monday to Friday, 9 AM to 6 PM.",
              },
              {
                question: "How can I contact you?",
                answer: "You can reach us through this chat or email us directly.",
              },
            ],
          },
        },
      },
      include: {
        chatbots: true,
      },
    })

    // Generate JWT token
    const token = jwt.sign({ clientId: client.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    })

    res.status(201).json({
      message: "Account created successfully",
      token,
      client: {
        id: client.id,
        businessName: client.businessName,
        email: client.email,
        chatbotId: client.chatbots[0].id,
      },
    })
  } catch (error) {
    console.error("Signup error:", error)
    res.status(500).json({ error: "Failed to create account" })
  }
})

/**
 * POST /auth/login
 * Authenticate client
 */
router.post("/login", validate(schemas.login), async (req, res) => {
  try {
    const { email, password } = req.body

    // Find client
    const client = await prisma.client.findUnique({
      where: { email },
      include: {
        chatbots: {
          where: { isActive: true },
          take: 1,
        },
      },
    })

    if (!client) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, client.hashedPassword)
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    // Generate JWT token
    const token = jwt.sign({ clientId: client.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    })

    res.json({
      message: "Login successful",
      token,
      client: {
        id: client.id,
        businessName: client.businessName,
        email: client.email,
        chatbotId: client.chatbots[0]?.id,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ error: "Login failed" })
  }
})

module.exports = router