'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import DemoChatInterface from '@/components/DemoChatInterface'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function DemoPage() {
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0)
  }, [])
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-900/10 dark:to-purple-900/10">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-blue-600/5 dark:from-blue-600/10 dark:via-purple-600/10 dark:to-blue-600/10 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-blue-100 dark:bg-blue-900/30 px-4 py-2 rounded-full text-blue-800 dark:text-blue-200 text-sm font-medium mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Live Demo</span>
            </div>
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
              Experience 
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> AI-Powered</span>
              <br />
              Conversations
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Test our intelligent chatbot technology in real-time. See how Botsistant can transform 
              your customer interactions with natural, context-aware responses.
            </p>
            
            {/* Feature highlights */}
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <div className="flex items-center space-x-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200/50 dark:border-gray-700/50">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Real-time responses</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200/50 dark:border-gray-700/50">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Context-aware</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200/50 dark:border-gray-700/50">
                <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
                </svg>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">24/7 availability</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Demo Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-slideUp">
            <DemoChatInterface />
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-blue-600/10 dark:from-blue-600/20 dark:via-purple-600/20 dark:to-blue-600/20 border-t border-gray-200/50 dark:border-gray-700/50 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to Build Your Own Chatbot?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Join thousands of businesses using Botsistant to automate customer support and boost engagement.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Start Building
            </Link>
            <Link
              href="/"
              className="bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 px-8 py-4 rounded-2xl text-lg font-semibold border border-gray-300/50 dark:border-gray-600/50 hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 backdrop-blur-sm"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  )
}