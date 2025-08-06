'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
  fallback?: boolean
}

interface ApiResponse {
  message: string
  fallback: boolean
  remaining: number
}

interface RemainingResponse {
  remaining: number
  resetTime: number
}

export default function DemoChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! Welcome to Botsistant! 👋 I\'m here to demonstrate our AI chatbot capabilities. Ask me anything about our platform, or just have a conversation!',
      sender: 'bot',
      timestamp: new Date()
    }
  ])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [remainingMessages, setRemainingMessages] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchRemainingMessages = async () => {
    try {
      const response = await fetch('/api/chat', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data: RemainingResponse = await response.json()
        setRemainingMessages(data.remaining)
      }
    } catch (error) {
      console.error('Error fetching remaining messages:', error)
      // Default to 50 if there's an error
      setRemainingMessages(50)
    }
  }

  useEffect(() => {
    fetchRemainingMessages()
  }, [])

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        text: 'Hello! Welcome to Botsistant! 👋 I\'m here to demonstrate our AI chatbot capabilities. Ask me anything about our platform, or just have a conversation!',
        sender: 'bot',
        timestamp: new Date()
      }
    ])
    setError(null)
  }

  const sanitizeInput = (input: string): string => {
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/[<>]/g, '')
      .slice(0, 1000)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || isTyping) return

    const sanitizedInput = sanitizeInput(inputText)
    if (!sanitizedInput) {
      setError('Please enter a valid message')
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: sanitizedInput,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsTyping(true)
    setError(null)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: sanitizedInput }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: ApiResponse = await response.json()
      
      setRemainingMessages(data.remaining)

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.message,
        sender: 'bot',
        timestamp: new Date(),
        fallback: data.fallback
      }

      setMessages(prev => [...prev, botMessage])

    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I\'m having trouble connecting right now. Please try again in a moment!',
        sender: 'bot',
        timestamp: new Date(),
        fallback: true
      }
      setMessages(prev => [...prev, errorMessage])
      setError('Connection error. Please try again.')
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 h-[700px] flex flex-col backdrop-blur-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 dark:from-blue-700 dark:via-purple-700 dark:to-blue-800 text-white p-6 rounded-t-2xl flex justify-between items-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm"></div>
        <div className="relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight">Botsistant AI</h3>
              <p className="text-sm text-white/80 font-medium">
                Intelligent Conversation Engine
              </p>
            </div>
          </div>
        </div>
        <div className="relative z-10 text-right">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-white/10 rounded-full px-3 py-1 backdrop-blur-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-white/90 font-medium">Online</span>
            </div>
            <button
              onClick={clearChat}
              className="bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm transition-all duration-200 hover:scale-105 font-medium"
            >
              Clear Chat
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg p-4 m-4 flex items-center space-x-3">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.232 20.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-red-700 dark:text-red-200 text-sm font-medium">{error}</p>
        </div>
      )}
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-gray-50/50 to-white dark:from-gray-800/50 dark:to-gray-900">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
          >
            <div className={`flex items-start space-x-3 max-w-[85%] ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              {/* Avatar */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                message.sender === 'user'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'bg-gradient-to-r from-gray-600 to-gray-700 dark:from-gray-500 dark:to-gray-600 text-white'
              }`}>
                {message.sender === 'user' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
              
              {/* Message Bubble */}
              <div className="flex flex-col space-y-1">
                <div
                  className={`px-4 py-3 rounded-2xl shadow-lg backdrop-blur-sm ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-md'
                      : message.fallback
                      ? 'bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/70 dark:to-orange-900/70 text-yellow-800 dark:text-yellow-200 border border-yellow-300/50 dark:border-yellow-700/50 rounded-bl-md'
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200/50 dark:border-gray-700/50 rounded-bl-md'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                </div>
                
                {/* Message Footer */}
                <div className={`flex items-center space-x-2 px-2 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {message.timestamp.toLocaleTimeString('en-US', { 
                      hour12: true, 
                      hour: '2-digit', 
                      minute: '2-digit'
                    })}
                  </p>
                  {message.fallback && (
                    <span className="text-xs bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-2 py-0.5 rounded-full font-medium">⚠️ Fallback</span>
                  )}
                  {message.sender === 'user' && (
                    <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start animate-fadeIn">
            <div className="flex items-start space-x-3 max-w-[85%]">
              {/* Bot Avatar */}
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-gray-600 to-gray-700 dark:from-gray-500 dark:to-gray-600 text-white flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              
              {/* Typing Indicator */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200/50 dark:border-gray-700/50 px-5 py-4 rounded-2xl rounded-bl-md shadow-lg backdrop-blur-sm">
                <div className="flex space-x-1.5">
                  <div className="w-2.5 h-2.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-bounce"></div>
                  <div className="w-2.5 h-2.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                  <div className="w-2.5 h-2.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Form */}
      <div className="border-t border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="p-6">
          <form onSubmit={handleSendMessage} className="space-y-4">
            <div className="flex space-x-4 items-end">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={remainingMessages > 0 ? "Type your message..." : "Daily limit reached. Try again tomorrow!"}
                  className="w-full border border-gray-300/50 dark:border-gray-600/50 rounded-2xl px-6 py-4 bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm backdrop-blur-sm shadow-lg"
                  disabled={isTyping || remainingMessages <= 0}
                  maxLength={1000}
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                  {inputText.length}/1000
                </div>
              </div>
              <button
                type="submit"
                disabled={isTyping || !inputText.trim() || remainingMessages <= 0}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg disabled:hover:scale-100"
              >
                {isTyping ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
            
            {/* Message Counter */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  remainingMessages > 20 ? 'bg-green-500' : 
                  remainingMessages > 5 ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {remainingMessages > 0 
                    ? `${remainingMessages} messages remaining today`
                    : 'Daily limit reached'
                  }
                </p>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Resets at midnight
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}