const express = require("express")
const { PrismaClient } = require("@prisma/client")
const { validate, schemas } = require("../middleware/validation")

const router = express.Router()
const prisma = new PrismaClient()

/**
 * POST /auth/sync-user
 * Sync Supabase user to clients table
 */
router.post("/sync-user", validate(schemas.syncUser), async (req, res) => {
  try {
    const { supabaseUserId, businessName, email } = req.body

    // Check if client already exists
    const existingClient = await prisma.client.findUnique({
      where: { supabaseUserId },
    })

    if (existingClient) {
      return res.status(200).json({
        message: "Client already exists",
        client: {
          id: existingClient.id,
          businessName: existingClient.businessName,
          email: existingClient.email,
          chatbotId: existingClient.chatbots?.[0]?.id,
        },
      })
    }

    // Create client and default chatbot
    const client = await prisma.client.create({
      data: {
        supabaseUserId,
        businessName,
        email,
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

    res.status(201).json({
      message: "Client synced successfully",
      client: {
        id: client.id,
        businessName: client.businessName,
        email: client.email,
        chatbotId: client.chatbots[0].id,
      },
    })
  } catch (error) {
    console.error("Sync user error:", error)
    res.status(500).json({ error: "Failed to sync user" })
  }
})

/**
 * GET /auth/client/:supabaseUserId
 * Get client data by Supabase user ID
 */
router.get("/client/:supabaseUserId", async (req, res) => {
  try {
    const { supabaseUserId } = req.params

    const client = await prisma.client.findUnique({
      where: { supabaseUserId },
      include: {
        chatbots: {
          where: { isActive: true },
          take: 1,
        },
      },
    })

    if (!client) {
      return res.status(404).json({ error: "Client not found" })
    }

    res.json({
      client: {
        id: client.id,
        businessName: client.businessName,
        email: client.email,
        chatbotId: client.chatbots[0]?.id,
      },
    })
  } catch (error) {
    console.error("Get client error:", error)
    res.status(500).json({ error: "Failed to get client" })
  }
})

module.exports = router