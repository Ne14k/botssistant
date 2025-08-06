const express = require("express")
const { PrismaClient } = require("@prisma/client")
const { authenticateToken } = require("../middleware/auth")
const { validate, schemas } = require("../middleware/validation")

const router = express.Router()
const prisma = new PrismaClient()

// All routes require authentication
router.use(authenticateToken)

/**
 * GET /client/dashboard
 * Get dashboard summary data
 */
router.get("/dashboard", async (req, res) => {
  try {
    const clientId = req.client.id

    // Get chatbot info
    const chatbot = await prisma.chatbot.findFirst({
      where: { clientId, isActive: true },
    })

    if (!chatbot) {
      return res.status(404).json({ error: "No active chatbot found" })
    }

    // Get summary statistics
    const [totalLeads, totalMessages, recentLeads] = await Promise.all([
      prisma.lead.count({
        where: { chatbotId: chatbot.id },
      }),
      prisma.message.count({
        where: { chatbotId: chatbot.id },
      }),
      prisma.lead.findMany({
        where: { chatbotId: chatbot.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          message: true,
          createdAt: true,
          status: true,
        },
      }),
    ])

    // Get message stats for the last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const messagesThisWeek = await prisma.message.count({
      where: {
        chatbotId: chatbot.id,
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    })

    res.json({
      chatbot: {
        id: chatbot.id,
        welcomeMessage: chatbot.welcomeMessage,
        themeColor: chatbot.themeColor,
        faqs: chatbot.faqs,
      },
      stats: {
        totalLeads,
        totalMessages,
        messagesThisWeek,
      },
      recentLeads,
    })
  } catch (error) {
    console.error("Dashboard error:", error)
    res.status(500).json({ error: "Failed to get dashboard data" })
  }
})

/**
 * GET /client/leads
 * Get all leads for the client
 */
router.get("/leads", async (req, res) => {
  try {
    const clientId = req.client.id
    const { page = 1, limit = 20, status, search } = req.query

    const chatbot = await prisma.chatbot.findFirst({
      where: { clientId, isActive: true },
    })

    if (!chatbot) {
      return res.status(404).json({ error: "No active chatbot found" })
    }

    // Build where clause
    const where = {
      chatbotId: chatbot.id,
      ...(status && { status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { message: { contains: search, mode: "insensitive" } },
        ],
      }),
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.lead.count({ where }),
    ])

    res.json({
      leads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    })
  } catch (error) {
    console.error("Get leads error:", error)
    res.status(500).json({ error: "Failed to get leads" })
  }
})

/**
 * PUT /client/leads/:id/status
 * Update lead status
 */
router.put("/leads/:id/status", async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body
    const clientId = req.client.id

    const validStatuses = ["new", "contacted", "converted", "closed"]
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" })
    }

    // Verify lead belongs to client
    const lead = await prisma.lead.findFirst({
      where: {
        id,
        chatbot: {
          clientId,
        },
      },
    })

    if (!lead) {
      return res.status(404).json({ error: "Lead not found" })
    }

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: { status },
    })

    res.json(updatedLead)
  } catch (error) {
    console.error("Update lead status error:", error)
    res.status(500).json({ error: "Failed to update lead status" })
  }
})

/**
 * PUT /client/chatbot/config
 * Update chatbot configuration
 */
router.put("/chatbot/config", validate(schemas.chatbotConfig), async (req, res) => {
  try {
    const clientId = req.client.id
    const { welcomeMessage, themeColor, faqs } = req.body

    const chatbot = await prisma.chatbot.findFirst({
      where: { clientId, isActive: true },
    })

    if (!chatbot) {
      return res.status(404).json({ error: "No active chatbot found" })
    }

    const updatedChatbot = await prisma.chatbot.update({
      where: { id: chatbot.id },
      data: {
        welcomeMessage,
        themeColor,
        faqs,
      },
    })

    res.json({
      message: "Chatbot configuration updated successfully",
      chatbot: {
        id: updatedChatbot.id,
        welcomeMessage: updatedChatbot.welcomeMessage,
        themeColor: updatedChatbot.themeColor,
        faqs: updatedChatbot.faqs,
      },
    })
  } catch (error) {
    console.error("Update chatbot config error:", error)
    res.status(500).json({ error: "Failed to update chatbot configuration" })
  }
})

module.exports = router