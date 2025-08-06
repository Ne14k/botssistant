import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// In-memory rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Fallback responses when API fails or quota exceeded
const FALLBACK_RESPONSES = [
  "Sorry, the demo is currently unavailable. Please try again later.",
  "I'm experiencing some technical difficulties right now. Please check back soon!",
  "The demo service is temporarily offline. Thank you for your patience.",
  "I'm currently unable to process your request. Please try again in a few moments.",
  "Our demo is taking a short break! Please come back later."
]

// Input sanitization function
function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/[<>]/g, '') // Remove angle brackets
    .slice(0, 1000) // Limit length
}

// Get client IP address
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIP || 'unknown'
  return ip
}

// Check and update rate limit
function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const dailyLimit = 50
  
  // Clean up expired entries (older than 24 hours)
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  }
  
  const userLimit = rateLimitStore.get(ip)
  
  if (!userLimit) {
    // First request from this IP
    const resetTime = now + (24 * 60 * 60 * 1000) // 24 hours from now
    rateLimitStore.set(ip, { count: 1, resetTime })
    return { allowed: true, remaining: dailyLimit - 1 }
  }
  
  if (now > userLimit.resetTime) {
    // Reset expired limit
    const resetTime = now + (24 * 60 * 60 * 1000)
    rateLimitStore.set(ip, { count: 1, resetTime })
    return { allowed: true, remaining: dailyLimit - 1 }
  }
  
  if (userLimit.count >= dailyLimit) {
    return { allowed: false, remaining: 0 }
  }
  
  // Increment count
  userLimit.count += 1
  rateLimitStore.set(ip, userLimit)
  
  return { allowed: true, remaining: dailyLimit - userLimit.count }
}

export async function GET(request: NextRequest) {
  try {
    // Check rate limit without incrementing
    const clientIP = getClientIP(request)
    const now = Date.now()
    const dailyLimit = 50
    
    // Clean up expired entries (older than 24 hours)
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetTime) {
        rateLimitStore.delete(key)
      }
    }
    
    const userLimit = rateLimitStore.get(clientIP)
    
    if (!userLimit || now > userLimit.resetTime) {
      // No usage yet or expired - return full limit
      return NextResponse.json({
        remaining: dailyLimit,
        resetTime: now + (24 * 60 * 60 * 1000)
      })
    }
    
    return NextResponse.json({
      remaining: Math.max(0, dailyLimit - userLimit.count),
      resetTime: userLimit.resetTime
    })
    
  } catch (error) {
    console.error('GET API route error:', error)
    return NextResponse.json({
      remaining: 0,
      resetTime: Date.now() + (24 * 60 * 60 * 1000)
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      )
    }
    
    // Sanitize input
    const sanitizedMessage = sanitizeInput(message)
    
    if (!sanitizedMessage) {
      return NextResponse.json(
        { error: 'Invalid message content' },
        { status: 400 }
      )
    }
    
    // Check rate limit
    const clientIP = getClientIP(request)
    const rateLimit = checkRateLimit(clientIP)
    
    if (!rateLimit.allowed) {
      const fallbackResponse = FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)]
      return NextResponse.json({
        message: "You've reached the daily demo limit of 50 messages. Please try again tomorrow!",
        fallback: true,
        remaining: 0
      })
    }
    
    // Initialize Gemini AI
    const apiKey = process.env.GEMINI_API_KEY
    
    if (!apiKey) {
      console.error('GEMINI_API_KEY not found in environment variables')
      const fallbackResponse = FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)]
      return NextResponse.json({
        message: fallbackResponse,
        fallback: true,
        remaining: rateLimit.remaining
      })
    }
    
    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
      
      // Create conversation prompt
      const prompt = `You are a helpful AI assistant for Botsistant, a chatbot platform. Keep responses concise and friendly. If users ask about Botsistant, explain that it's a platform for building AI chatbots for businesses.

User message: ${sanitizedMessage}`
      
      // Generate response
      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      if (!text) {
        throw new Error('Empty response from Gemini')
      }
      
      return NextResponse.json({
        message: text,
        fallback: false,
        remaining: rateLimit.remaining
      })
      
    } catch (geminiError) {
      console.error('Gemini API error:', geminiError)
      
      // Return fallback response
      return NextResponse.json({
        message: FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)],
        fallback: true,
        remaining: rateLimit.remaining
      })
    }
    
  } catch (error) {
    console.error('API route error:', error)
    
    const fallbackResponse = FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)]
    return NextResponse.json({
      message: fallbackResponse,
      fallback: true,
      remaining: 0
    }, { status: 500 })
  }
}