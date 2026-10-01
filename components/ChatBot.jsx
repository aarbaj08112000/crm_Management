'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, User, Loader2, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      content: 'Good afternoon! Welcome to our AI chatbot. How can I assist you today?',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const messagesEndRef = useRef(null);

  const suggestedQuestions = [
    "What services do you offer?",
    "How can I contact support?",
    "Can you provide information about pricing?",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  const handleSendMessage = async (text = inputMessage) => {
    if (!text.trim()) return;

    const userMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          history: messages,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessages((prev) => [...prev, { role: 'bot', content: data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'bot', content: 'Oops! Something went wrong. ' + (data.error || '') },
        ]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        { role: 'bot', content: 'Failed to communicate with the server.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="w-[380px] max-w-[calc(100vw-32px)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden mb-4 flex flex-col h-[600px] max-h-[calc(100vh-100px)] transition-all transform origin-bottom-right duration-300">
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">AI Support</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">AI Assistant</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={cn(
                  "flex max-w-[85%]",
                  msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <div className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-auto",
                  msg.role === 'user' 
                    ? "ml-3 bg-blue-600 text-white" 
                    : "mr-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                )}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                </div>
                
                <div className={cn(
                  "px-4 py-3 rounded-2xl text-sm shadow-sm overflow-hidden",
                  msg.role === 'user'
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-bl-sm"
                )}>
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  ) : (
                    <div className="markdown-body group relative">
                      <ReactMarkdown
                        components={{
                          p: ({node, ...props}) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc list-outside ml-4 mb-2 space-y-1" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-4 mb-2 space-y-1" {...props} />,
                          li: ({node, ...props}) => <li className="pl-1" {...props} />,
                          h1: ({node, ...props}) => <h1 className="text-lg font-bold mb-2 mt-4 first:mt-0 text-slate-900 dark:text-white" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-base font-bold mb-2 mt-3 first:mt-0 text-slate-900 dark:text-white" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-sm font-semibold mb-2 mt-3 text-slate-900 dark:text-white" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-semibold text-slate-900 dark:text-white" {...props} />,
                          a: ({node, ...props}) => <a className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                      
                      <button
                        onClick={() => handleCopy(msg.content, index)}
                        className="absolute -bottom-1 -right-1 p-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-slate-500 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        title="Copy message"
                      >
                        {copiedIndex === index ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex max-w-[85%] mr-auto">
                <div className="flex-shrink-0 w-8 h-8 mr-3 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mt-auto text-blue-600 dark:text-blue-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="px-4 py-3 rounded-2xl text-sm bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-bl-sm flex items-center space-x-2 shadow-sm">
                   <div className="flex space-x-1">
                      <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                   </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions (only if just one bot message is present) */}
          {messages.length === 1 && !isLoading && (
            <div className="px-4 pb-2 bg-slate-50 dark:bg-slate-900/50 flex flex-col gap-2">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  className="text-left text-sm text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-2 rounded-xl transition-colors shadow-sm"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            <div className="relative flex items-center">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Write a message..."
                className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                disabled={isLoading}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isLoading}
                className="absolute right-2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <div className="text-center mt-2">
              <p className="text-[10px] text-slate-400">Powered by AI ChatBot</p>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl hover:shadow-2xl transition-all duration-300",
          isOpen ? "bg-slate-800 hover:bg-slate-900" : "bg-blue-600 hover:bg-blue-700 hover:scale-105"
        )}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>
    </div>
  );
}
