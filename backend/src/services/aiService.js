const { generateText } = require("ai")
const { google } = require("@ai-sdk/google")

/**
 * Generate AI response based on user message and chatbot context
 */
async function generateAIResponse(userMessage, chatbot) {
  try {
    // Prepare context from FAQs
    const faqContext = chatbot.faqs.map((faq) => `Q: ${faq.question}\nA: ${faq.answer}`).join("\n\n")

    // Create system prompt
    const systemPrompt = `You are a helpful customer service chatbot for ${chatbot.client.businessName}. 

Your role is to:
1. Answer customer questions professionally and helpfully
2. Use the provided FAQ information when relevant
3. Be friendly and conversational
4. If you don't know something, politely say so and suggest they contact the business directly
5. Keep responses concise but informative
6. Try to capture leads by asking for contact information when appropriate

Business FAQs:
${faqContext}

Welcome message: ${chatbot.welcomeMessage}

Always maintain a professional, helpful tone that represents ${chatbot.client.businessName} well.`

    const { text } = await generateText({
      model: google("gemini-1.5-flash"),
      system: systemPrompt,
      prompt: userMessage,
      maxTokens: 300,
      temperature: 0.7,
    })

    return text
  } catch (error) {
    console.error("AI service error:", error)

    // Fallback response
    return "I apologize, but I'm having trouble processing your request right now. Please try again in a moment, or feel free to contact us directly for immediate assistance."
  }
}

module.exports = {
  generateAIResponse,
}