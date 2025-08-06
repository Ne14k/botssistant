const express = require("express")
const { PrismaClient } = require("@prisma/client")
const { validateApiKey } = require("../middleware/auth")
const { validate, schemas } = require("../middleware/validation")
const { generateAIResponse } = require("../services/aiService")

const router = express.Router()
const prisma = new PrismaClient()

/**
 * GET /chatbot/:id/config
 * Get public chatbot configuration for widget
 */
router.get("/:id/config", async (req, res) => {
  try {
    const { id } = req.params

    const chatbot = await prisma.chatbot.findFirst({
      where: {
        id,
        isActive: true,
      },
      select: {
        id: true,
        welcomeMessage: true,
        themeColor: true,
        client: {
          select: {
            businessName: true,
          },
        },
      },
    })

    if (!chatbot) {
      return res.status(404).json({ error: "Chatbot not found" })
    }

    res.json({
      id: chatbot.id,
      welcomeMessage: chatbot.welcomeMessage,
      themeColor: chatbot.themeColor,
      businessName: chatbot.client.businessName,
    })
  } catch (error) {
    console.error("Get config error:", error)
    res.status(500).json({ error: "Failed to get chatbot configuration" })
  }
})

/**
 * POST /chatbot/:id/message
 * Process user message and return AI response
 */
router.post("/:id/message", validateApiKey, validate(schemas.message), async (req, res) => {
  try {
    const { id } = req.params
    const { message, sessionId = `session_${Date.now()}`, userInfo } = req.body

    // Get chatbot with FAQs
    const chatbot = await prisma.chatbot.findUnique({
      where: { id },
      include: {
        client: {
          select: { businessName: true },
        },
      },
    })

    if (!chatbot) {
      return res.status(404).json({ error: "Chatbot not found" })
    }

    // Save user message
    await prisma.message.create({
      data: {
        chatbotId: id,
        sessionId,
        role: "user",
        text: message,
        metadata: userInfo ? { userInfo } : null,
      },
    })

    // Generate AI response
    const aiResponse = await generateAIResponse(message, chatbot)

    // Save AI response
    await prisma.message.create({
      data: {
        chatbotId: id,
        sessionId,
        role: "bot",
        text: aiResponse,
      },
    })

    // Check if this looks like a lead (contains contact info or specific intent)
    const isLead = await checkForLead(message, userInfo)
    if (isLead) {
      await prisma.lead.create({
        data: {
          chatbotId: id,
          name: userInfo?.name,
          email: userInfo?.email,
          phone: userInfo?.phone,
          message: message,
          source: "chat",
        },
      })
    }

    res.json({
      response: aiResponse,
      sessionId,
    })
  } catch (error) {
    console.error("Message processing error:", error)
    res.status(500).json({ error: "Failed to process message" })
  }
})

/**
 * Helper function to detect potential leads
 */
async function checkForLead(message, userInfo) {
  // Simple lead detection logic
  const leadKeywords = [
    "contact",
    "call me",
    "email me",
    "interested",
    "quote",
    "price",
    "buy",
    "purchase",
    "service",
    "help",
    "consultation",
  ]

  const hasContactInfo = userInfo && (userInfo.email || userInfo.phone)
  const hasLeadIntent = leadKeywords.some((keyword) => message.toLowerCase().includes(keyword))

  return hasContactInfo || hasLeadIntent
}

module.exports = router